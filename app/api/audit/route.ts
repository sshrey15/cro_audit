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
                '--disable-dev-shm-usage',
                '--disable-http2' // Disable HTTP/2 to avoid protocol errors with certain sites
            ]
        });

        const context = await browser.newContext({
            userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            viewport: { width: 1440, height: 900 },
            extraHTTPHeaders: { 
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Encoding': 'gzip, deflate, br',
                'DNT': '1',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1',
                'Referer': 'https://www.google.com/'
            }
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
        
        // Load homepage with retry and fallback strategies for HTTP/2 or network errors
        let homepageLoaded = false;
        try {
            await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
            homepageLoaded = true;
        } catch (err) {
            console.log('Failed with domcontentloaded, trying networkidle...');
            try {
                await page.goto(baseUrl, { waitUntil: 'networkidle', timeout: 15000 });
                homepageLoaded = true;
            } catch (err2) {
                console.log('Failed with networkidle, trying commit...');
                try {
                    await page.goto(baseUrl, { waitUntil: 'commit', timeout: 15000 });
                    homepageLoaded = true;
                } catch (err3) {
                    console.log('All goto strategies failed, attempting reload...');
                    try {
                        // Try a soft reload or just wait and continue
                        await page.evaluate(() => window.location.reload());
                        await page.waitForLoadState('domcontentloaded', { timeout: 10000 }).catch(() => {});
                        homepageLoaded = true;
                    } catch (err4) {
                        console.error(`Unable to load ${baseUrl}:`, (err3 as any).message);
                        return NextResponse.json(
                            { error: `Failed to load website. The site may be blocking automated browser access (detected by robot-blocking middleware). Please try: 1) A different site, 2) Disabling any VPN/proxy, or 3) Using a residential IP. Site: ${baseUrl}` },
                            { status: 400 }
                        );
                    }
                }
            }
        }
        
        if (!homepageLoaded) {
            return NextResponse.json(
                { error: 'Failed to load homepage after retries.' },
                { status: 400 }
            );
        }
        
        await page.waitForTimeout(1500);
        await page.evaluate(removePopupsScript);
        await page.waitForTimeout(500);
        await page.evaluate(removePopupsScript);

        // === Simulate Human-Like Behavior ===
        // Scroll naturally through the page, hover over elements, wait for animations
        await page.evaluate(async () => {
            const randomDelay = (min: number, max: number) => 
                new Promise(r => setTimeout(r, Math.random() * (max - min) + min));

            // Natural scroll down with pauses
            const scrollHeight = document.documentElement.scrollHeight;
            const viewportHeight = window.innerHeight;
            let currentScroll = 0;

            // Scroll in multiple steps
            for (let i = 0; i < 3; i++) {
                currentScroll += viewportHeight * 0.6;
                window.scrollBy(0, viewportHeight * 0.6);
                // Random human-like delay between scrolls
                await randomDelay(300, 800);

                // Hover over visible elements
                const elements = document.elementsFromPoint(
                    window.innerWidth / 2,
                    window.innerHeight / 2
                );
                for (const el of elements.slice(0, 3)) {
                    (el as any).dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
                    await randomDelay(100, 300);
                }
            }

            // Scroll back to top
            window.scrollTo(0, 0);
            await randomDelay(200, 400);

            // Click interactive elements (buttons, dropdowns, filters)
            const interactiveSelectors = [
                'button',
                'a[href*="filter"]',
                'a[href*="category"]',
                '[class*="filter"]',
                '[class*="sort"]',
                '[role="button"]'
            ];

            const clickableElements = Array.from(
                document.querySelectorAll(interactiveSelectors.join(','))
            ).filter(el => {
                const rect = el.getBoundingClientRect();
                const isVisible = rect.width > 0 && rect.height > 0 && rect.top < window.innerHeight;
                const isClickable = (el.tagName === 'BUTTON' || el.tagName === 'A');
                return isVisible && isClickable;
            });

            // Interact with a couple of clickable elements (but don't actually click navigation)
            for (const el of clickableElements.slice(0, 2)) {
                const rect = el.getBoundingClientRect();
                if (rect.top > -100 && rect.top < window.innerHeight) {
                    // Just simulate hover interaction
                    (el as HTMLElement).dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
                    (el as HTMLElement).dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
                    await randomDelay(200, 500);
                }
            }

            // Wait for any animations to complete
            await new Promise(r => setTimeout(r, 500));
        });

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

        // Classify site: detect if it's ecommerce and try to infer a niche
        let classification: { isEcommerce: boolean; niche: string; scores?: Record<string, number> } = { isEcommerce: false, niche: 'unknown' };

        try {
            // Ensure we're on the homepage for site-level analysis
            try { await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 10000 }); } catch (_) { /* ignore */ }

            classification = await page.evaluate(({ productLinks, collectionLinks }) => {
                const textParts: string[] = [];
                const add = (s?: string | null) => { if (s) textParts.push(s.toString().toLowerCase()); };

                add(document.title);
                add(document.querySelector('meta[name="description"]')?.getAttribute('content'));
                add(document.querySelector('meta[property="og:description"]')?.getAttribute('content'));
                add(document.querySelector('meta[name="keywords"]')?.getAttribute('content'));

                Array.from(document.querySelectorAll('h1,h2,h3')).forEach(h => add(h.textContent));
                Array.from(document.querySelectorAll('[class*="breadcrumb" i], [class*="category" i], [class*="tag" i]')).forEach(e => add(e.textContent));

                // Add product & collection names discovered
                (productLinks || []).forEach(p => add(p.name));
                (collectionLinks || []).forEach(c => add(c.name));

                // Include JSON-LD content
                Array.from(document.querySelectorAll('script[type="application/ld+json"]')).forEach(s => add(s.textContent));

                const bodyText = textParts.join(' ');

                // Heuristics for ecommerce detection
                let isEcommerce = false;
                if ((productLinks || []).length > 0) isEcommerce = true;
                if (!isEcommerce) {
                    if (bodyText.match(/\b(add to cart|add to bag|buy now|checkout|shopping cart|add to basket|price|out of stock|sku|product details)\b/)) isEcommerce = true;
                    if (document.querySelector('[class*="add-to-cart" i], [id*="add-to-cart" i], a[href*="/cart"], a[href*="/checkout"]')) isEcommerce = true;
                    if (bodyText.includes('"@type":"product"') || bodyText.includes('"@type":"offer"') || bodyText.includes('"@type":"aggregateoffer"')) isEcommerce = true;
                }

                // Niche inference via keyword mapping
                const nicheMap: Record<string, string[]> = {
                    fashion: ['shirt','dress','jeans','apparel','clothing','shoe','sneaker','hat','bag','jacket','sweater','hoodie','skirt','trouser'],
                    electronics: ['phone','laptop','charger','headphone','camera','tv','speaker','tablet','smartwatch','earbuds','charger','monitor'],
                    beauty: ['makeup','skincare','cream','serum','fragrance','perfume','cosmetic','lipstick','mascara','moisturizer','cleanser'],
                    home: ['furniture','sofa','mattress','kitchen','cookware','bedding','decor','home','lamp','table','chair','cabinet'],
                    food: ['coffee','tea','grocery','snack','organic','food','beverage','chocolate','wine','beer','bakery'],
                    sports: ['bike','bicycle','fitness','gym','yoga','running','sport','ball','treadmill','outdoor','camping','hiking'],
                    kids: ['baby','toddler','stroller','diaper','kids','toy','children','crib','car seat'],
                    pet: ['pet','dog','cat','pet food','leash','collar','aquarium'],
                    jewelry: ['ring','necklace','jewel','bracelet','earring','gemstone'],
                    health: ['supplement','vitamin','wellness','health','thermometer','pill','pharmacy']
                };

                const scores: Record<string, number> = {};
                Object.keys(nicheMap).forEach(k => scores[k] = 0);

                Object.entries(nicheMap).forEach(([niche, keywords]) => {
                    for (const kw of keywords) {
                        const re = new RegExp(`\\b${kw.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i');
                        if (bodyText.match(re)) scores[niche] += 1;
                    }
                });

                // Also check product/collection names
                (productLinks || []).forEach(p => Object.keys(nicheMap).forEach(n => {
                    nicheMap[n].forEach(kw => { if ((p.name||'').toLowerCase().includes(kw)) scores[n] += 2; });
                }));

                // Pick top niche
                const top = Object.entries(scores).sort((a,b) => b[1]-a[1])[0];
                const inferred = top && top[1] > 0 ? top[0] : (bodyText.includes('store') || bodyText.includes('shop') ? 'general-retail' : 'unknown');

                return { isEcommerce, niche: inferred, scores };
            }, { productLinks, collectionLinks });
        } catch (classifyError) {
            console.log('Classification error:', classifyError);
        }

        console.log(`Targets: ${targets.map(t => `${t.key} (${t.type})`).join(', ')}`);

        // === 5. Take Screenshots for Each Target ===
        for (const target of targets) {
            screenshots[target.key] = [];
            const desktopHeight = 900;
            const mobileHeight = 844;

            // --- Desktop ---
            await page.setViewportSize({ width: 1440, height: desktopHeight });
            
            // Try to load target page with retry strategies
            let targetLoaded = false;
            try {
                await page.goto(target.url, { waitUntil: 'domcontentloaded', timeout: 15000 });
                targetLoaded = true;
            } catch (err) {
                try {
                    await page.goto(target.url, { waitUntil: 'networkidle', timeout: 15000 });
                    targetLoaded = true;
                } catch (err2) {
                    try {
                        await page.goto(target.url, { waitUntil: 'commit', timeout: 15000 });
                        targetLoaded = true;
                    } catch (err3) {
                        console.error(`Failed to load target ${target.key} (${target.url}):`, (err3 as any).message);
                        continue; // Skip this target if loading fails
                    }
                }
            }
            
            if (!targetLoaded) continue;
            
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

            // For homepage: take full-page screenshot; for product/collection: take fold-based screenshots
            const isFullPageCapture = target.type === 'homepage';
            const foldCount = isFullPageCapture ? 1 : 2;

            for (let fold = 1; fold <= foldCount; fold++) {
                // Scroll to top before each screenshot for product pages (especially navbar)
                if (target.type === 'product') {
                    await page.evaluate(() => window.scrollTo(0, 0));
                    await page.waitForTimeout(400);
                }
                
                if (fold > 1 && !isFullPageCapture) {
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

                // Simulate human behavior: hover and interact with visible elements in this fold
                await page.evaluate(async () => {
                    const randomDelay = (min: number, max: number) => 
                        new Promise(r => setTimeout(r, Math.random() * (max - min) + min));

                    // Hover over visible product cards or interactive elements
                    const productSelectors = [
                        '[class*="product"]',
                        '[class*="card"]',
                        'button',
                        '[role="button"]'
                    ];

                    const visibleElements = Array.from(
                        document.querySelectorAll(productSelectors.join(','))
                    ).filter(el => {
                        const rect = el.getBoundingClientRect();
                        return rect.width > 0 && rect.height > 0 && 
                               rect.top < window.innerHeight && rect.bottom > 0;
                    });

                    // Interact with 2-3 visible elements
                    for (const el of visibleElements.slice(0, 3)) {
                        (el as HTMLElement).dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
                        (el as HTMLElement).dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
                        await randomDelay(200, 500);
                    }

                    // Wait for hover effects and animations
                    await new Promise(r => setTimeout(r, 300));
                });

                // Ensure images (especially on product pages) are loaded and visible before taking screenshot
                await page.evaluate(async (pageType) => {
                    const wait = (ms: number) => new Promise(res => setTimeout(res, ms));
                    const containerSelectors = pageType === 'product'
                        ? ['.product-main', '.product-container', '.product-details', 'main']
                        : ['main', 'body'];
                    const container = document.querySelector(containerSelectors.find(s => document.querySelector(s)) || 'body') as HTMLElement;
                    const imgs: HTMLImageElement[] = container ? Array.from(container.querySelectorAll('img')) : Array.from(document.images) as any;

                    // Trigger lazy-load attributes
                    imgs.forEach(img => {
                        if (!img.src) {
                            const ds = (img as any).dataset;
                            if (ds && ds.src) img.src = ds.src;
                            if (ds && ds.srcset) img.srcset = ds.srcset;
                        }
                    });

                    for (const img of imgs) {
                        try {
                            // Scroll into view to force loading
                            img.scrollIntoView({ block: 'center', inline: 'nearest' });
                            // Wait for load or error (or already loaded)
                            if (!img.complete || img.naturalWidth === 0) {
                                await new Promise<void>(resolve => {
                                    const onDone = () => { img.removeEventListener('load', onDone); img.removeEventListener('error', onDone); resolve(); };
                                    img.addEventListener('load', onDone);
                                    img.addEventListener('error', onDone);
                                    // safeguard timeout
                                    setTimeout(onDone, 4000);
                                });
                            }
                            await wait(100);
                        } catch (e) {
                            // ignore individual image errors
                        }
                    }
                    await wait(250);
                }, target.type);

                const fileName = `${target.key}-desktop-fold${fold}-${Date.now()}.png`;
                const filePath = path.join(screenshotDir, fileName);
                
                // Take full-page screenshot for homepage, or viewport screenshot for others
                if (isFullPageCapture) {
                    await page.screenshot({ path: filePath, type: 'png', fullPage: true });
                } else {
                    await page.screenshot({ path: filePath, type: 'png' });
                }
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
            
            // Retry for mobile as well
            try {
                await page.goto(target.url, { waitUntil: 'domcontentloaded', timeout: 15000 });
            } catch (err) {
                try {
                    await page.goto(target.url, { waitUntil: 'networkidle', timeout: 15000 });
                } catch (err2) {
                    try {
                        await page.goto(target.url, { waitUntil: 'commit', timeout: 15000 });
                    } catch (err3) {
                        console.error(`Failed to load mobile for ${target.key}:`, (err3 as any).message);
                        continue;
                    }
                }
            }
            
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

                // Simulate human behavior for mobile: hover and interact with visible elements in this fold
                await page.evaluate(async () => {
                    const randomDelay = (min: number, max: number) => 
                        new Promise(r => setTimeout(r, Math.random() * (max - min) + min));

                    // Hover over visible product cards or interactive elements
                    const productSelectors = [
                        '[class*="product"]',
                        '[class*="card"]',
                        'button',
                        '[role="button"]'
                    ];

                    const visibleElements = Array.from(
                        document.querySelectorAll(productSelectors.join(','))
                    ).filter(el => {
                        const rect = el.getBoundingClientRect();
                        return rect.width > 0 && rect.height > 0 && 
                               rect.top < window.innerHeight && rect.bottom > 0;
                    });

                    // Interact with 2-3 visible elements
                    for (const el of visibleElements.slice(0, 3)) {
                        (el as HTMLElement).dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
                        (el as HTMLElement).dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
                        await randomDelay(200, 500);
                    }

                    // Wait for hover effects and animations
                    await new Promise(r => setTimeout(r, 300));
                });

                // Ensure images (especially on product pages) are loaded and visible before taking mobile screenshot
                await page.evaluate(async (pageType) => {
                    const wait = (ms: number) => new Promise(res => setTimeout(res, ms));
                    const containerSelectors = pageType === 'product'
                        ? ['.product-main', '.product-container', '.product-details', 'main']
                        : ['main', 'body'];
                    const container = document.querySelector(containerSelectors.find(s => document.querySelector(s)) || 'body') as HTMLElement;
                    const imgs: HTMLImageElement[] = container ? Array.from(container.querySelectorAll('img')) : Array.from(document.images) as any;

                    // Trigger lazy-load attributes
                    imgs.forEach(img => {
                        if (!img.src) {
                            const ds = (img as any).dataset;
                            if (ds && ds.src) img.src = ds.src;
                            if (ds && ds.srcset) img.srcset = ds.srcset;
                        }
                    });

                    for (const img of imgs) {
                        try {
                            img.scrollIntoView({ block: 'center', inline: 'nearest' });
                            if (!img.complete || img.naturalWidth === 0) {
                                await new Promise<void>(resolve => {
                                    const onDone = () => { img.removeEventListener('load', onDone); img.removeEventListener('error', onDone); resolve(); };
                                    img.addEventListener('load', onDone);
                                    img.addEventListener('error', onDone);
                                    setTimeout(onDone, 4000);
                                });
                            }
                            await wait(100);
                        } catch (e) {
                            // ignore
                        }
                    }
                    await wait(250);
                }, target.type);

                const fileName = `${target.key}-mobile-fold${fold}-${Date.now()}.png`;
                const filePath = path.join(screenshotDir, fileName);
                
                // Take full-page screenshot for homepage, or viewport screenshot for others
                if (isFullPageCapture) {
                    await page.screenshot({ path: filePath, type: 'png', fullPage: true });
                } else {
                    await page.screenshot({ path: filePath, type: 'png' });
                }
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

    return NextResponse.json({ screenshots, classification }, { status: 200 });

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