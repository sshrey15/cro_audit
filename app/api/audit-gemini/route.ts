import { NextResponse } from 'next/server';
import { chromium } from 'playwright';
import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs/promises';
import path from 'path';

interface AuditRequest {
    url: string;
    auditType?: 'site' | 'product';
}

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || '');

const normalizeUrl = (url: string): string => {
    if (!/^https?:\/\//i.test(url)) {
        url = 'https://' + url;
    }
    return url.replace(/\/$/, '');
};

const removePopupsScript = () => {
    const popupSelectors = [
        '[aria-label*="close" i]', '[role="dialog"]', '[role="alertdialog"]', '[role="alert"]',
        '[class*="popup" i]', '[class*="modal" i]', '[id*="popup" i]', '[id*="modal" i]',
        '[class*="newsletter" i]', '[id*="newsletter" i]', '[class*="cookie" i]', '[id*="cookie" i]',
        '[class*="overlay" i]', '[id*="overlay" i]', '[class*="backdrop" i]', '[id*="backdrop" i]',
        '[class*="dialog" i]', '[id*="dialog" i]', '[class*="subscribe" i]', '[id*="subscribe" i]',
        '[class*="consent" i]', '[id*="consent" i]',
        '[class*="captcha" i]', '[id*="captcha" i]', '[class*="recaptcha" i]', '[id*="recaptcha" i]',
        '[class*="verification" i]', '[id*="verification" i]', '[class*="security" i]', '[id*="security" i]',
        '[class*="challenge" i]', '[id*="challenge" i]', '[class*="cloudflare" i]', '[id*="cloudflare" i]',
    ];
    
    popupSelectors.forEach(sel => {
        try {
            document.querySelectorAll(sel).forEach(el => el.remove());
        } catch (e) {}
    });
};

const waitForImagesScript = () => {
    return Promise.all([
        // Wait for all images to load
        ...Array.from(document.querySelectorAll('img')).map(img => {
            return new Promise((resolve) => {
                if (img.complete) {
                    resolve(null);
                } else {
                    img.addEventListener('load', resolve);
                    img.addEventListener('error', resolve);
                    // Timeout after 5 seconds
                    setTimeout(resolve, 5000);
                }
            });
        }),
        // Wait for lazy-loaded images (IntersectionObserver)
        new Promise(resolve => setTimeout(resolve, 3000))
    ]).catch(() => null);
};

interface PageTarget {
    key: string;
    url: string;
    type: 'homepage' | 'collection' | 'product';
}

interface CROSuggestion {
    priority: 'critical' | 'high' | 'medium';
    title: string;
    description: string;
    impact: string;
}

interface ScreenshotData {
    type: 'homepage' | 'collection' | 'product';
    desktop: string;
    mobile: string;
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function POST(req: Request) {
    const { url, auditType = 'site' } = (await req.json()) as AuditRequest;
    
    if (!url) {
        return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    let browser: any = null;
    const baseUrl = normalizeUrl(url);
    const screenshotDir = path.join(process.cwd(), 'public', 'screenshot');

    try {
        // Ensure screenshot directory exists
        await fs.mkdir(screenshotDir, { recursive: true });

        // Launch browser
        browser = await chromium.launch({
            args: [
                '--disable-http2',
                '--disable-blink-features=AutomationControlled',
            ]
        });

        const context = await browser.newContext({
            userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            locale: 'en-US',
            extraHTTPHeaders: {
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'DNT': '1',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1',
                'Referer': 'https://www.google.com/'
            }
        });

        const page = await context.newPage();

        // Block security services
        await page.route('**/*', (route: any) => {
            const url = route.request().url().toLowerCase();
            if (url.includes('recaptcha') || url.includes('captcha') || url.includes('cloudflare')) {
                route.abort();
            } else {
                route.continue();
            }
        });

        const screenshots: ScreenshotData[] = [];

        // === CAPTURE HOMEPAGE ===
        if (auditType === 'site') {
            console.log('Capturing homepage...');
            try {
                await page.setViewportSize({ width: 1440, height: 900 });
                await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(
                    () => page.goto(baseUrl, { waitUntil: 'networkidle', timeout: 15000 }).catch(() => {})
                );

                // Wait for all images to load
                await page.evaluate(waitForImagesScript);
                await page.evaluate(removePopupsScript);
                await sleep(1500);

                // Desktop screenshot
                const desktopFile = `homepage-desktop-${Date.now()}.png`;
                const desktopPath = path.join(screenshotDir, desktopFile);
                await page.screenshot({ path: desktopPath, type: 'png', fullPage: true });

                // Mobile screenshot
                await page.setViewportSize({ width: 390, height: 844 });
                // Wait for images again after viewport change
                await page.evaluate(waitForImagesScript);
                const mobileFile = `homepage-mobile-${Date.now()}.png`;
                const mobilePath = path.join(screenshotDir, mobileFile);
                await page.screenshot({ path: mobilePath, type: 'png', fullPage: true });

                screenshots.push({
                    type: 'homepage',
                    desktop: `/screenshot/${desktopFile}`,
                    mobile: `/screenshot/${mobileFile}`
                });

                console.log('Homepage captured');
            } catch (e) {
                console.error('Error capturing homepage:', e);
            }
        }

        // === FIND COLLECTION PAGE ===
        if (auditType === 'site') {
            console.log('Finding collection page...');
            try {
                await page.setViewportSize({ width: 1440, height: 900 });
                // If we haven't visited the homepage yet (shouldn't happen in 'site' mode but good safety), go there
                if (page.url() === 'about:blank') {
                     await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
                } else {
                    // We are already at homepage from previous step
                }

                const collectionUrl = await page.evaluate(() => {
                    const links = Array.from(document.querySelectorAll('a'));
                    return links.find(a => 
                        /shop|collection|catalog|category|browse|products|all-products|store/i.test(a.href)
                    )?.href;
                });

                if (collectionUrl) {
                    await page.goto(collectionUrl, { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(
                        () => page.goto(collectionUrl, { waitUntil: 'networkidle', timeout: 15000 }).catch(() => {})
                    );
                    // Wait for all images to load
                    await page.evaluate(waitForImagesScript);
                    await page.evaluate(removePopupsScript);
                    await sleep(1500);

                    // Desktop screenshot
                    const desktopFile = `collection-desktop-${Date.now()}.png`;
                    const desktopPath = path.join(screenshotDir, desktopFile);
                    await page.screenshot({ path: desktopPath, type: 'png', fullPage: false });

                    // Mobile screenshot
                    await page.setViewportSize({ width: 390, height: 844 });
                    // Wait for images again after viewport change
                    await page.evaluate(waitForImagesScript);
                    const mobileFile = `collection-mobile-${Date.now()}.png`;
                    const mobilePath = path.join(screenshotDir, mobileFile);
                    await page.screenshot({ path: mobilePath, type: 'png', fullPage: false });

                    screenshots.push({
                        type: 'collection',
                        desktop: `/screenshot/${desktopFile}`,
                        mobile: `/screenshot/${mobileFile}`
                    });

                    console.log('Collection page captured');
                }
            } catch (e) {
                console.error('Error capturing collection page:', e);
            }
        }

        // === CAPTURE PRODUCT PAGE ===
        if (auditType === 'product') {
            console.log('Capturing product page...');
            try {
                await page.setViewportSize({ width: 1440, height: 900 });
                
                // Direct product URL provided
                const productUrl = baseUrl;
                console.log('Using provided URL as product page:', productUrl);

                await page.goto(productUrl, { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(
                    () => page.goto(productUrl, { waitUntil: 'networkidle', timeout: 15000 }).catch(() => {})
                );
                // Wait for all images to load
                await page.evaluate(waitForImagesScript);
                await page.evaluate(removePopupsScript);
                
                // Scroll to load lazy-loaded images
                await page.evaluate(() => {
                    if (document.body) {
                        window.scrollTo(0, document.body.scrollHeight);
                    }
                });
                // Wait for lazy-loaded images
                await page.evaluate(waitForImagesScript);
                await page.evaluate(() => window.scrollTo(0, 0));
                // Wait for images to settle after scroll back
                await page.evaluate(waitForImagesScript);
                await sleep(1500);

                // Desktop screenshot
                const desktopFile = `product-desktop-${Date.now()}.png`;
                const desktopPath = path.join(screenshotDir, desktopFile);
                await page.screenshot({ path: desktopPath, type: 'png', fullPage: false });

                // Mobile screenshot
                await page.setViewportSize({ width: 390, height: 844 });
                // Wait for images again after viewport change
                await page.evaluate(waitForImagesScript);
                const mobileFile = `product-mobile-${Date.now()}.png`;
                const mobilePath = path.join(screenshotDir, mobileFile);
                await page.screenshot({ path: mobilePath, type: 'png', fullPage: false });

                screenshots.push({
                    type: 'product',
                    desktop: `/screenshot/${desktopFile}`,
                    mobile: `/screenshot/${mobileFile}`
                });

                console.log('Product page captured');
            } catch (e) {
                console.error('Error capturing product page:', e);
            }
        }

        // === ANALYZE SCREENSHOTS WITH GEMINI ===
        console.log('Analyzing screenshots with Gemini AI...');
        
        // Try multiple model names in order of preference
        let model: any = null;
        const modelNames = [
            'gemini-2.0-flash',
            'gemini-2.0-flash-exp',
            'gemini-1.5-flash',
            'gemini-1.5-pro',
            'gemini-pro'
        ];
        
        for (const modelName of modelNames) {
            try {
                console.log(`Trying model: ${modelName}`);
                model = genAI.getGenerativeModel({ model: modelName });
                // Test the model with a simple request
                await model.generateContent('test');
                console.log(`✅ Model ${modelName} works!`);
                break;
            } catch (e) {
                console.log(`❌ Model ${modelName} failed, trying next...`);
                continue;
            }
        }
        
        if (!model) {
            console.error('No working Gemini model found');
            return NextResponse.json(
                { error: 'No working Gemini model available. Please check your API key.' },
                { status: 500 }
            );
        }

        const allSuggestions: CROSuggestion[] = [];

        for (const screenshot of screenshots) {
            try {
                // Read both desktop and mobile images
                const desktopImageBuffer = await fs.readFile(
                    path.join(process.cwd(), 'public', screenshot.desktop)
                );
                const mobileImageBuffer = await fs.readFile(
                    path.join(process.cwd(), 'public', screenshot.mobile)
                );

                const desktopBase64 = desktopImageBuffer.toString('base64');
                const mobileBase64 = mobileImageBuffer.toString('base64');

                const prompt = `You are a conversion rate optimization (CRO) expert with 10+ years of ecommerce experience. Analyze these ${screenshot.type} page screenshots (desktop and mobile) to identify conversion barriers and optimization opportunities.

CRITICAL AREAS TO ANALYZE:

1. **Call-to-Action (CTA) Issues**
   - Is the primary CTA button clearly visible above the fold?
   - Button color contrast with background (should be high)
   - CTA text clarity and urgency (e.g., "Add to Cart", "Buy Now", "Get Started")
   - Multiple CTAs competing for attention?
   - Mobile button clickability (at least 44x44px)

2. **Trust & Security Signals**
   - Customer reviews, ratings, testimonials visible?
   - Trust badges, SSL certificates, payment logos?
   - Company information, contact details, return policy?
   - Social proof (number of purchases, customer count)?
   - Money-back guarantee or confidence builder?

3. **Product/Service Information**
   - Is key information above the fold?
   - Product images quality and size?
   - Price clearly displayed?
   - Shipping costs and delivery time transparent?
   - Product features/benefits listed clearly?

4. **Form & Checkout Friction**
   - Number of form fields (each field reduces conversions by 3-5%)
   - Required vs optional fields clearly marked?
   - Form error messages helpful and visible?
   - Guest checkout option available?
   - Progress indicator for multi-step processes?

5. **Mobile-Specific Issues**
   - Navigation menu accessible and functional?
   - Text readable without zooming (16px minimum)?
   - Button spacing adequate (no fat-finger errors)?
   - Page load time indicators?
   - One-handed usability?

6. **Visual Hierarchy & Design**
   - Whitespace appropriate (not cluttered)?
   - Distracting pop-ups or overlays?
   - Colors create urgency or confusion?
   - Typography readable and scannable?
   - Ads or unrelated content causing distraction?

7. **Social Proof & Urgency**
   - Stock availability indicators ("Only 3 left" / "In stock")?
   - Real-time purchase notifications?
   - Recent customer reviews visible?
   - Time-sensitive offers or countdown timers?
   - User count or popularity metrics?

8. **Navigation & Site Structure**
   - Search functionality visible and functional?
   - Breadcrumb navigation for context?
   - Related products/upsell opportunities visible?
   - Easy way to contact support?
   - FAQ or help section prominent?

RESPONSE FORMAT:
Return ONLY a valid JSON array (no markdown, no explanation):
[
  {
    "priority": "critical|high|medium",
    "title": "Short, specific title (5-10 words)",
    "description": "Detailed description of the issue observed in the screenshot",
    "impact": "Expected improvement (e.g., '20-30% conversion increase', '15% bounce rate reduction')"
  }
]

PRIORITY LEVELS:
- critical: Directly blocks conversions or causes immediate friction
- high: Reduces conversion probability but not blocking
- medium: Nice-to-have improvements for optimization

Return 4-7 recommendations per page type. Be specific - reference what you actually see in the images.`;

                const response = await model.generateContent([
                    {
                        inlineData: {
                            mimeType: 'image/png',
                            data: desktopBase64
                        }
                    },
                    {
                        inlineData: {
                            mimeType: 'image/png',
                            data: mobileBase64
                        }
                    },
                    prompt
                ]);

                const responseText = response.response.text();
                console.log('Gemini response:', responseText);

                // Parse JSON from response - try multiple strategies
                let suggestions: CROSuggestion[] = [];
                
                // Strategy 1: Look for JSON array in response
                const jsonMatch = responseText.match(/\[[\s\S]*\]/);
                if (jsonMatch) {
                    try {
                        suggestions = JSON.parse(jsonMatch[0]);
                        // Validate and clean suggestions
                        suggestions = suggestions.filter((s: any) => 
                            s.priority && s.title && s.description && s.impact
                        );
                    } catch (parseErr) {
                        console.error(`Failed to parse JSON for ${screenshot.type}:`, parseErr);
                    }
                }
                
                // Strategy 2: If no valid JSON found, try to extract key points
                if (suggestions.length === 0) {
                    console.warn(`No JSON found for ${screenshot.type} page, attempting text extraction`);
                    // Create a generic suggestion about the page
                    suggestions = [{
                        priority: 'high' as const,
                        title: 'Unable to parse AI response',
                        description: 'The AI analysis could not be formatted properly. Please try again.',
                        impact: 'Manual review recommended'
                    }];
                }
                
                // Add page type context to each suggestion
                suggestions.forEach(s => {
                    s.title = `[${screenshot.type.charAt(0).toUpperCase() + screenshot.type.slice(1)}] ${s.title}`;
                });
                
                allSuggestions.push(...suggestions);
            } catch (e) {
                console.error(`Error analyzing ${screenshot.type} page:`, e);
                // Add error suggestion for this page
                allSuggestions.push({
                    priority: 'high',
                    title: `[${screenshot.type.charAt(0).toUpperCase() + screenshot.type.slice(1)}] Analysis Error`,
                    description: `Failed to analyze ${screenshot.type} page. Error: ${(e as Error).message}`,
                    impact: 'Please try auditing again'
                });
            }
        }

        // Sort suggestions by priority
        allSuggestions.sort((a, b) => {
            const priorityOrder = { critical: 0, high: 1, medium: 2 };
            return (priorityOrder[a.priority as keyof typeof priorityOrder] || 3) - 
                   (priorityOrder[b.priority as keyof typeof priorityOrder] || 3);
        });

        return NextResponse.json({
            screenshots,
            suggestions: allSuggestions,
            status: 'success'
        }, { status: 200 });

    } catch (e: any) {
        console.error('Audit error:', e);
        return NextResponse.json(
            { error: `Audit failed: ${e.message}` },
            { status: 500 }
        );
    } finally {
        if (browser) await browser.close();
    }
}
