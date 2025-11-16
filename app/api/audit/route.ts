import { NextResponse } from 'next/server';
import { chromium } from 'playwright';
import fs from 'fs/promises';
import path from 'path';

interface ScreenshotRequest {
    url: string;
}

interface ScreenshotResult {
    [key: string]: string[];
}

interface PageTarget {
    key: string;
    url: string;
    type: 'homepage' | 'collection' | 'product';
}

const normalizeUrl = (url: string): string => {
    if (!/^https?:\/\//i.test(url)) {
        url = 'https://' + url;
    }
    return url.replace(/\/$/, '');
};

const removePopupsScript = () => {
    // Comprehensive popup and security check removal
    const popupSelectors = [
        // General popups and modals
        '[aria-label*="close" i]', '[role="dialog"]', '[role="alertdialog"]', '[role="alert"]',
        '[class*="popup" i]', '[class*="modal" i]', '[id*="popup" i]', '[id*="modal" i]',
        '[class*="newsletter" i]', '[id*="newsletter" i]', '[class*="cookie" i]', '[id*="cookie" i]',
        '[class*="overlay" i]', '[id*="overlay" i]', '[class*="backdrop" i]', '[id*="backdrop" i]',
        '[class*="dialog" i]', '[id*="dialog" i]', '[class*="subscribe" i]', '[id*="subscribe" i]',
        '[class*="consent" i]', '[id*="consent" i]',
        
        // Security and verification popups
        '[class*="captcha" i]', '[id*="captcha" i]', '[class*="recaptcha" i]', '[id*="recaptcha" i]',
        '[class*="verification" i]', '[id*="verification" i]', '[class*="security" i]', '[id*="security" i]',
        '[class*="challenge" i]', '[id*="challenge" i]', '[class*="cloudflare" i]', '[id*="cloudflare" i]',
        '[class*="bot-check" i]', '[id*="bot-check" i]', '[class*="human" i]', '[id*="human" i]',
        '[class*="verify" i]', '[id*="verify" i]', '[class*="protection" i]', '[id*="protection" i]',
        
        // Age verification and disclaimers
        '[class*="age-gate" i]', '[id*="age-gate" i]', '[class*="disclaimer" i]', '[id*="disclaimer" i]',
        '[class*="warning" i]', '[id*="warning" i]', '[class*="notice" i]', '[id*="notice" i]',
        
        // Email and promotional popups
        '[class*="email" i]', '[id*="email" i]', '[class*="signup" i]', '[id*="signup" i]',
        '[class*="promo" i]', '[id*="promo" i]', '[class*="discount" i]', '[id*="discount" i]',
        '[class*="sale" i]', '[id*="sale" i]', '[class*="offer" i]', '[id*="offer" i]',
        
        // Exit intent and other interruptions
        '[class*="exit" i]', '[id*="exit" i]', '[class*="interstitial" i]', '[id*="interstitial" i]',
        '[class*="lightbox" i]', '[id*="lightbox" i]'
    ];
    
    // Remove matching elements
    popupSelectors.forEach(sel => {
        try {
            document.querySelectorAll(sel).forEach(el => {
                el.remove();
            });
        } catch (e) {
            // Continue if selector fails
        }
    });
    
    // Remove large fixed/sticky elements that could be overlays
    document.querySelectorAll('*').forEach(el => {
        try {
            const style = window.getComputedStyle(el);
            const rect = el.getBoundingClientRect();
            
            // Remove if it's a large overlay covering significant screen area
            if ((style.position === 'fixed' || style.position === 'sticky' || style.position === 'absolute') &&
                (rect.width > window.innerWidth * 0.5 || rect.height > window.innerHeight * 0.5) &&
                style.zIndex && parseInt(style.zIndex) > 100) {
                el.remove();
            }
            
            // Remove elements with high z-index that might be overlays
            if (style.zIndex && parseInt(style.zIndex) > 9999) {
                el.remove();
            }
            
            // Remove elements that cover the full viewport
            if (rect.width >= window.innerWidth * 0.9 && rect.height >= window.innerHeight * 0.9 &&
                (style.position === 'fixed' || style.position === 'absolute')) {
                el.remove();
            }
        } catch (e) {
            // Continue if element check fails
        }
    });
    
    // Remove common iframe-based security checks
    document.querySelectorAll('iframe').forEach(iframe => {
        const src = iframe.src.toLowerCase();
        if (src.includes('captcha') || src.includes('recaptcha') || src.includes('challenge') || 
            src.includes('cloudflare') || src.includes('security')) {
            iframe.remove();
        }
    });
    
    // Hide body overflow to prevent scrolling issues from removed elements
    document.body.style.overflow = 'visible';
};

export async function GET() {
    return NextResponse.json({ message: 'Use POST to submit a URL for audit.' }, { status: 200 });
}

export async function POST(request: Request) {
    let browser = null;
    const mainSectionSelector = 'main';

    try {
        const { url }: ScreenshotRequest = await request.json();

        if (!url) {
            return NextResponse.json({ error: 'Missing "url" in request body.' }, { status: 400 });
        }

        const screenshots: ScreenshotResult = {};
        const baseUrl = normalizeUrl(url);

        const screenshotDir = path.join(process.cwd(), 'public', 'screenshot');
        await fs.mkdir(screenshotDir, { recursive: true });

        browser = await chromium.launch({ 
            headless: true,
            args: [
                '--disable-blink-features=AutomationControlled',
                '--disable-features=VizDisplayCompositor',
                '--disable-web-security',
                '--disable-features=site-per-process',
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage'
            ]
        });

        const context = await browser.newContext({
            userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            viewport: { width: 1440, height: 900 },
            extraHTTPHeaders: { 'Accept-Language': 'en-US,en;q=0.9' }
        });

        const page = await context.newPage();

        // Block CAPTCHA / security services
        await page.route('**/*', route => {
            const url = route.request().url().toLowerCase();
            if (url.includes('recaptcha') || url.includes('captcha') || 
                url.includes('challenge') || url.includes('cloudflare') ||
                url.includes('hcaptcha') || url.includes('funcaptcha')) {
                route.abort();
            } else {
                route.continue();
            }
        });

        // === 1. Load Homepage ===
        await page.setViewportSize({ width: 1440, height: 900 });
        await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
        await page.waitForTimeout(1500);
        await page.evaluate(removePopupsScript);
        await page.waitForTimeout(500);
        await page.evaluate(removePopupsScript);

        // Trigger lazy loading
        await page.evaluate(async () => {
            window.scrollTo(0, 500);
            await new Promise(r => setTimeout(r, 300));
            window.scrollTo(0, 1000);
            await new Promise(r => setTimeout(r, 300));
            window.scrollTo(0, 0);
            await new Promise(r => setTimeout(r, 200));
        });

        // === 2. Discover Collection & Product Links (Static) ===
        const { collectionLinks, productLinks: staticProductLinks } = await page.evaluate(() => {
            const collectionLinks: { name: string; url: string }[] = [];
            const productLinks: { name: string; url: string }[] = [];
            const baseUrl = window.location.origin;

            const allLinks = Array.from(document.querySelectorAll('a[href]')).map(link => ({
                href: (link as HTMLAnchorElement).href,
                text: link.textContent?.trim() || '',
                element: link
            }));

            allLinks.forEach(({ href, text, element }) => {
                if (!href.startsWith(baseUrl) || href === window.location.href) return;

                const path = href.replace(baseUrl, '').toLowerCase();
                const cleanText = text.substring(0, 30).replace(/[^a-zA-Z0-9\s]/g, '').trim();

                if (path.match(/\/(collections?|categories?|category|shop|store|catalog|browse)\//)) {
                    if (!collectionLinks.some(c => c.url === href)) {
                        collectionLinks.push({ 
                            name: cleanText || path.split('/').pop() || 'collection', 
                            url: href 
                        });
                    }
                }
                else if (path.match(/\/(products?|product|items?|item)\//) || 
                         element.closest('[class*="product" i]') ||
                         text.match(/\$\d+|\£\d+|€\d+|buy|add to/i)) {
                    if (!productLinks.some(p => p.url === href)) {
                        productLinks.push({ 
                            name: cleanText || 'product', 
                            url: href 
                        });
                    }
                }
            });

            return { collectionLinks: collectionLinks.slice(0, 1), productLinks: productLinks.slice(0, 1) };
        });

        // === 3. Interactive Product Discovery via Click (Fallback) ===
        let productLinks = staticProductLinks;

        if (productLinks.length === 0) {
            console.log('No static product links found. Attempting interactive click...');

            const clickedProduct = await page.evaluateHandle(async (origin) => {
                const selectors = [
                    '[class*="product-card"] a[href], [class*="product-item"] a[href]',
                    '.product-grid a[href], .product-list a[href]',
                    'a[href]:has(img):has([class*="price"])'
                ];

                for (const sel of selectors) {
                    const els = Array.from(document.querySelectorAll(sel));
                    for (const el of els) {
                        const a = el as HTMLAnchorElement;
                        const rect = a.getBoundingClientRect();
                        if (
                            a.href?.startsWith(origin) &&
                            rect.width > 60 && rect.height > 60 &&
                            rect.top >= 0 && rect.bottom <= window.innerHeight
                        ) {
                            const img = a.querySelector('img');
                            const title = a.querySelector('[class*="title"], [class*="name"]');
                            const name = (
                                (img?.getAttribute('alt') ?? '') ||
                                (title?.textContent ?? '') ||
                                a.href.split('/').pop() ||
                                'product'
                            ).substring(0, 30);

                            return { href: a.href, name, x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
                        }
                    }
                }
                return null;
            }, baseUrl);

            const clickable = await clickedProduct.jsonValue();

            if (clickable) {
                await page.mouse.click(clickable.x, clickable.y);
                await page.waitForLoadState('domcontentloaded', { timeout: 10000 });

                const newUrl = page.url();
                if (newUrl.startsWith(baseUrl) && newUrl !== baseUrl) {
                    console.log(`Successfully navigated to product: ${newUrl}`);
                    productLinks = [{ name: clickable.name, url: newUrl }];
                } else {
                    console.log('Click did not lead to valid product page. Reverting...');
                    await page.goto(baseUrl);
                }
            }
        }

        // === 4. Build Targets ===
        const targets: PageTarget[] = [
            { key: 'homepage', url: baseUrl, type: 'homepage' }
        ];

        if (collectionLinks.length > 0) {
            const col = collectionLinks[0];
            targets.push({
                key: `collection_${col.name.toLowerCase().replace(/\s+/g, '_').substring(0, 20)}`,
                url: col.url,
                type: 'collection'
            });
        }

        if (productLinks.length > 0) {
            const prod = productLinks[0];
            targets.push({
                key: `product_${prod.name.toLowerCase().replace(/\s+/g, '_').substring(0, 20)}`,
                url: prod.url,
                type: 'product'
            });
        }

        console.log(`Targets: ${targets.map(t => `${t.key} (${t.type})`).join(', ')}`);

        // === 5. Take Screenshots for Each Target ===
        for (const target of targets) {
            screenshots[target.key] = [];
            const desktopHeight = 900;
            const mobileHeight = 844;

            // --- Desktop ---
            await page.setViewportSize({ width: 1440, height: desktopHeight });
            await page.goto(target.url, { waitUntil: 'domcontentloaded', timeout: 15000 });
            await page.waitForTimeout(1500);
            await page.evaluate(removePopupsScript);
            await page.waitForTimeout(500);
            await page.evaluate(removePopupsScript);

            await page.evaluate(async () => {
                window.scrollTo(0, 400); await new Promise(r => setTimeout(r, 200));
                window.scrollTo(0, 800); await new Promise(r => setTimeout(r, 200));
                window.scrollTo(0, 0);   await new Promise(r => setTimeout(r, 300));
                document.querySelectorAll('img[data-src]').forEach(img => {
                    const el = img as HTMLImageElement;
                    if (!el.src && el.dataset.src) el.src = el.dataset.src;
                });
            });

            await page.waitForTimeout(1000);
            await page.evaluate(removePopupsScript);

            // Highlight main content
            await page.evaluate((type) => {
                const selectors = type === 'product'
                    ? ['.product-main', '.product-container', '.product-details', 'main']
                    : type === 'collection'
                    ? ['.products-grid', '.product-list', '.collection-products', 'main']
                    : ['main'];
                const el = document.querySelector(selectors.find(s => document.querySelector(s)) || 'main') as HTMLElement;
                if (el) {
                    el.setAttribute('data-cro-highlight', '1');
                    el.style.boxShadow = '0 0 0 4px #1e90ff, 0 0 20px 4px #1e90ff55';
                    el.style.borderRadius = '18px';
                    el.style.position = 'relative';
                    el.style.zIndex = '9999';
                }
            }, target.type);

            const foldCount = target.type === 'homepage' ? 3 : 2;

            for (let fold = 1; fold <= foldCount; fold++) {
                if (fold > 1) {
                    await page.evaluate(({ h, f }: { h: number; f: number }) => window.scrollTo(0, h * (f - 1)), { h: desktopHeight, f: fold });
                    await page.waitForTimeout(500);
                    await page.evaluate(removePopupsScript);
                    // Re-highlight
                    await page.evaluate((type) => {
                        const selectors = type === 'product'
                            ? ['.product-main', '.product-container', '.product-details', 'main']
                            : type === 'collection'
                            ? ['.products-grid', '.product-list', '.collection-products', 'main']
                            : ['main'];
                        const el = document.querySelector(selectors.find(s => document.querySelector(s)) || 'main') as HTMLElement;
                        if (el) {
                            el.setAttribute('data-cro-highlight', '1');
                            el.style.boxShadow = '0 0 0 4px #1e90ff, 0 0 20px 4px #1e90ff55';
                            el.style.borderRadius = '18px';
                            el.style.position = 'relative';
                            el.style.zIndex = '9999';
                        }
                    }, target.type);
                }

                const fileName = `${target.key}-desktop-fold${fold}-${Date.now()}.png`;
                const filePath = path.join(screenshotDir, fileName);
                await page.screenshot({ path: filePath, type: 'png' });
                screenshots[target.key].push(`/screenshot/${fileName}`);

                // Remove highlight
                await page.evaluate(() => {
                    const el = document.querySelector('[data-cro-highlight="1"]') as HTMLElement;
                    if (el) {
                        el.style.cssText = '';
                        el.removeAttribute('data-cro-highlight');
                    }
                });
            }

            // --- Mobile ---
            await page.setViewportSize({ width: 390, height: mobileHeight });
            await page.goto(target.url, { waitUntil: 'domcontentloaded', timeout: 15000 });
            await page.waitForTimeout(1500);
            await page.evaluate(removePopupsScript);
            await page.waitForTimeout(500);
            await page.evaluate(removePopupsScript);

            await page.evaluate(async () => {
                window.scrollTo(0, 300); await new Promise(r => setTimeout(r, 200));
                window.scrollTo(0, 600); await new Promise(r => setTimeout(r, 200));
                window.scrollTo(0, 0);   await new Promise(r => setTimeout(r, 300));
                document.querySelectorAll('img[data-src]').forEach(img => {
                    const el = img as HTMLImageElement;
                    if (!el.src && el.dataset.src) el.src = el.dataset.src;
                });
            });

            await page.waitForTimeout(1000);
            await page.evaluate(removePopupsScript);

            await page.evaluate((type) => {
                const selectors = type === 'product'
                    ? ['.product-main', '.product-container', '.product-details', 'main']
                    : type === 'collection'
                    ? ['.products-grid', '.product-list', '.collection-products', 'main']
                    : ['main'];
                const el = document.querySelector(selectors.find(s => document.querySelector(s)) || 'main') as HTMLElement;
                if (el) {
                    el.setAttribute('data-cro-highlight', '1');
                    el.style.boxShadow = '0 0 0 4px #1e90ff, 0 0 20px 4px #1e90ff55';
                    el.style.borderRadius = '18px';
                    el.style.position = 'relative';
                    el.style.zIndex = '9999';
                }
            }, target.type);

            for (let fold = 1; fold <= foldCount; fold++) {
                if (fold > 1) {
                    await page.evaluate(({ h, f }: { h: number; f: number }) => window.scrollTo(0, h * (f - 1)), { h: mobileHeight, f: fold });
                    await page.waitForTimeout(500);
                    await page.evaluate(removePopupsScript);
                    await page.evaluate((type) => {
                        const selectors = type === 'product'
                            ? ['.product-main', '.product-container', '.product-details', 'main']
                            : type === 'collection'
                            ? ['.products-grid', '.product-list', '.collection-products', 'main']
                            : ['main'];
                        const el = document.querySelector(selectors.find(s => document.querySelector(s)) || 'main') as HTMLElement;
                        if (el) {
                            el.setAttribute('data-cro-highlight', '1');
                            el.style.boxShadow = '0 0 0 4px #1e90ff, 0 0 20px 4px #1e90ff55';
                            el.style.borderRadius = '18px';
                            el.style.position = 'relative';
                            el.style.zIndex = '9999';
                        }
                    }, target.type);
                }

                const fileName = `${target.key}-mobile-fold${fold}-${Date.now()}.png`;
                const filePath = path.join(screenshotDir, fileName);
                await page.screenshot({ path: filePath, type: 'png' });
                screenshots[target.key].push(`/screenshot/${fileName}`);

                await page.evaluate(() => {
                    const el = document.querySelector('[data-cro-highlight="1"]') as HTMLElement;
                    if (el) {
                        el.style.cssText = '';
                        el.removeAttribute('data-cro-highlight');
                    }
                });
            }
        }

        return NextResponse.json(screenshots, { status: 200 });

    } catch (e: any) {
        console.error('Screenshot error:', e);
        return NextResponse.json(
            { error: `Failed to capture screenshots: ${e.message}` },
            { status: 500 }
        );
    } finally {
        if (browser) await browser.close();
    }
}