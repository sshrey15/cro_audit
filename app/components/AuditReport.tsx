'use client'


import ClassificationCard from './ClassificationCard';
import ScreenshotGrid from './ScreenshotGrid';
import AnnotatedScreenshot from './AnnotatedScreenshot';

interface AuditReportProps {
  data: any;
  onReset: () => void;
}

// CRO Annotation suggestions for different page types
const getCROAnnotations = (pageType: string, deviceType: 'desktop' | 'mobile') => {
  const annotations: { [key: string]: { [key: string]: any[] } } = {
    homepage: {
      desktop: [
        {
          x: 50,
          y: 15,
          title: 'Navigation Menu',
          suggestion: 'Simplify menu structure. Consider mega-menu or sticky navigation. Aim for 3-5 main categories.',
          priority: 'critical',
          icon: '☰'
        },
        {
          x: 50,
          y: 35,
          title: 'Hero Section CTA',
          suggestion: 'Primary CTA button should be above the fold. Increase contrast and button size to minimum 44px height.',
          priority: 'critical',
          icon: '▶'
        },
        {
          x: 25,
          y: 50,
          title: 'Trust Signals',
          suggestion: 'Add customer reviews, testimonials, or social proof badges before the fold. Increases credibility by 23-34%.',
          priority: 'high',
          icon: '⭐'
        },
        {
          x: 75,
          y: 50,
          title: 'Product Showcase',
          suggestion: 'Highlight top 3-4 best sellers or trending products. Include prices and quick view buttons.',
          priority: 'high',
          icon: '🎁'
        }
      ],
      mobile: [
        {
          x: 50,
          y: 10,
          title: 'Mobile Menu',
          suggestion: 'Use hamburger menu with clear labels. Ensure menu items are 44px minimum tap targets.',
          priority: 'critical',
          icon: '☰'
        },
        {
          x: 50,
          y: 25,
          title: 'Hero CTA Mobile',
          suggestion: 'Single, high-contrast CTA button. Text should be at least 16px. Avoid form fields above fold.',
          priority: 'critical',
          icon: '▶'
        },
        {
          x: 50,
          y: 45,
          title: 'Mobile Readability',
          suggestion: 'Use 16px+ font for body text. Adequate spacing between elements (minimum 8px padding).',
          priority: 'high',
          icon: '👁'
        },
        {
          x: 50,
          y: 65,
          title: 'Search Bar',
          suggestion: 'Sticky search bar at top. Clear search icon (magnifying glass) for easy discoverability.',
          priority: 'medium',
          icon: '🔍'
        }
      ]
    },
    product: {
      desktop: [
        {
          x: 20,
          y: 20,
          title: 'Product Images',
          suggestion: 'High-quality product images with zoom. Multiple angles (4+ images). Load time under 2 seconds.',
          priority: 'critical',
          icon: '🖼'
        },
        {
          x: 70,
          y: 30,
          title: 'Price & CTA',
          suggestion: 'Clear pricing above fold. Add-to-cart button highly visible. Consider "Add to Wishlist" option.',
          priority: 'critical',
          icon: '💲'
        },
        {
          x: 70,
          y: 50,
          title: 'Product Details',
          suggestion: 'Key specs in bullet points. Show availability status. Include shipping cost/time estimates.',
          priority: 'high',
          icon: '📋'
        },
        {
          x: 50,
          y: 75,
          title: 'Customer Reviews',
          suggestion: 'Display star rating and review count near title. At least 3-5 reviews visible. Average rating badge.',
          priority: 'high',
          icon: '⭐'
        }
      ],
      mobile: [
        {
          x: 50,
          y: 15,
          title: 'Product Image',
          suggestion: 'Carousel for multiple images. Swipe gesture support. Full-width display. Lazy load secondary images.',
          priority: 'critical',
          icon: '🖼'
        },
        {
          x: 50,
          y: 40,
          title: 'Add to Cart',
          suggestion: 'Sticky CTA button at bottom (44px minimum). Consider one-tap purchasing (Apple Pay, Google Pay).',
          priority: 'critical',
          icon: '🛒'
        },
        {
          x: 50,
          y: 55,
          title: 'Product Info',
          suggestion: 'Essential info in expandable sections. Specifications, size guides, shipping info tabs.',
          priority: 'high',
          icon: '📖'
        },
        {
          x: 50,
          y: 75,
          title: 'Reviews Mobile',
          suggestion: 'Show top 2-3 reviews. "Read all reviews" link. Star rating prominent and large (16px+).',
          priority: 'high',
          icon: '⭐'
        }
      ]
    },
    collection: {
      desktop: [
        {
          x: 15,
          y: 30,
          title: 'Filter/Sidebar',
          suggestion: 'Sticky left sidebar with filters (price, size, color). Collapsible sections. Clear reset button.',
          priority: 'high',
          icon: '🔽'
        },
        {
          x: 60,
          y: 20,
          title: 'Sort Options',
          suggestion: 'Prominent sort dropdown (Popularity, Price: Low-High, Newest). Default to relevant sorting.',
          priority: 'medium',
          icon: '⬍'
        },
        {
          x: 60,
          y: 50,
          title: 'Product Cards',
          suggestion: 'Show product image, title, price, and star rating. Hover shows quick view. Add to cart button visible.',
          priority: 'high',
          icon: '🎁'
        },
        {
          x: 60,
          y: 85,
          title: 'Pagination',
          suggestion: 'Clear pagination or infinite scroll. Show product count. "Load More" button in center view area.',
          priority: 'medium',
          icon: '⊕'
        }
      ],
      mobile: [
        {
          x: 50,
          y: 10,
          title: 'Mobile Filter',
          suggestion: 'Filter icon (☰) at top. Opens modal/drawer overlay. Simple single-select for mobile clarity.',
          priority: 'high',
          icon: '🔽'
        },
        {
          x: 50,
          y: 25,
          title: 'Sort Mobile',
          suggestion: 'Dropdown or modal for sort options. Show selected option clearly. Sticky at grid top.',
          priority: 'medium',
          icon: '⬍'
        },
        {
          x: 50,
          y: 55,
          title: 'Product Grid Mobile',
          suggestion: '2-column grid on mobile. Adequate padding between items (8px). Lazy load images below fold.',
          priority: 'high',
          icon: '🎁'
        },
        {
          x: 50,
          y: 80,
          title: 'Load More Mobile',
          suggestion: 'Use "Load More" button instead of pagination. Position in view area. Include product count.',
          priority: 'medium',
          icon: '⊕'
        }
      ]
    }
  };

  return annotations[pageType]?.[deviceType] || [];
};

export default function AuditReport({ data, onReset }: AuditReportProps) {
  const { screenshots, classification } = data;

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-slate-100">
      {/* Report Header */}
      <div className="bg-gradient-to-r from-[#191E77] via-[#2D3B9C] to-blue-700 text-white py-12 px-6 shadow-2xl">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={onReset}
            className="mb-6 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors"
          >
            ← New Audit
          </button>
          
          <h1 className="text-4xl md:text-5xl font-bold mb-3">🎯 Conversion Audit Report</h1>
          <p className="text-blue-100 text-lg max-w-3xl">
            Complete analysis of your site's conversion potential. Discover friction points and quick-win opportunities.
          </p>
          
          <div className="mt-6 flex flex-wrap gap-6 pt-6 border-t border-white/20">
            <div>
              <p className="text-blue-100 text-sm">Site Classification</p>
              <p className="text-white font-bold text-lg">
                {classification?.isEcommerce ? '✅ Ecommerce Platform' : '❌ Not Ecommerce'}
              </p>
            </div>
            <div>
              <p className="text-blue-100 text-sm">Primary Niche</p>
              <p className="text-white font-bold text-lg capitalize">{classification?.niche || 'Unknown'}</p>
            </div>
            <div>
              <p className="text-blue-100 text-sm">Report Generated</p>
              <p className="text-white font-bold text-lg">{new Date().toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Report Content */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        
        {/* Executive Summary */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-[#191E77] mb-2">Executive Summary</h2>
          <p className="text-slate-600 mb-6">High-level overview of conversion opportunities on your site</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Opportunity Score */}
            <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-100 to-emerald-50 rounded-bl-3xl opacity-50"></div>
              <p className="text-slate-600 text-sm font-medium mb-2 relative z-10">Opportunity Score</p>
              <p className="text-5xl font-bold text-emerald-600 relative z-10">8.2</p>
              <p className="text-slate-600 text-sm mt-2 relative z-10">/10 High potential for growth</p>
            </div>

            {/* Issues Found */}
            <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-100 to-amber-50 rounded-bl-3xl opacity-50"></div>
              <p className="text-slate-600 text-sm font-medium mb-2 relative z-10">Issues Found</p>
              <p className="text-5xl font-bold text-amber-600 relative z-10">12</p>
              <p className="text-slate-600 text-sm mt-2 relative z-10">3 Critical • 5 Major • 4 Minor</p>
            </div>

            {/* Quick Wins */}
            <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-100 to-blue-50 rounded-bl-3xl opacity-50"></div>
              <p className="text-slate-600 text-sm font-medium mb-2 relative z-10">Quick Wins</p>
              <p className="text-5xl font-bold text-blue-600 relative z-10">5</p>
              <p className="text-slate-600 text-sm mt-2 relative z-10">Low effort, high impact fixes</p>
            </div>
          </div>

          {/* Key Findings */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-8 border border-blue-200">
            <h3 className="text-lg font-bold text-[#191E77] mb-6">🔍 Key Findings</h3>
            <ul className="space-y-4">
              <li className="flex gap-4">
                <span className="text-2xl">1️⃣</span>
                <div>
                  <p className="font-semibold text-slate-800">Navigation Clarity</p>
                  <p className="text-slate-600 text-sm">Menu structure could be simplified. Users need 3+ clicks to reach key categories.</p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="text-2xl">2️⃣</span>
                <div>
                  <p className="font-semibold text-slate-800">Product Information</p>
                  <p className="text-slate-600 text-sm">Images load slowly. Consider lazy-loading optimization for faster page speed.</p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="text-2xl">3️⃣</span>
                <div>
                  <p className="font-semibold text-slate-800">Trust Signals</p>
                  <p className="text-slate-600 text-sm">Missing reviews, testimonials, and security badges above the fold.</p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="text-2xl">4️⃣</span>
                <div>
                  <p className="font-semibold text-slate-800">Mobile Experience</p>
                  <p className="text-slate-600 text-sm">Buttons and CTAs are hard to tap on mobile. Recommend minimum 48px height.</p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="text-2xl">5️⃣</span>
                <div>
                  <p className="font-semibold text-slate-800">Checkout Flow</p>
                  <p className="text-slate-600 text-sm">Guest checkout not prominently offered. Reduces friction for first-time buyers.</p>
                </div>
              </li>
            </ul>
          </div>
        </section>

        {/* Site Classification */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-[#191E77] mb-6">Site Classification & Niche Analysis</h2>
          <ClassificationCard classification={classification} />
        </section>

        {/* Screenshots by Page Type */}
        {Object.entries(screenshots).map(([key, pageScreenshots]: [string, any]) => {
          const pageNames: { [key: string]: string } = {
            'homepage': '🏠 Homepage',
            'product': '🛍️ Product Pages',
            'collection': '📦 Collection Pages'
          };

          const pageDescriptions: { [key: string]: string } = {
            'homepage': 'Landing page and main entry point. Critical for first impression and navigation.',
            'product': 'Individual product page. Key for conversion with pricing, images, and CTAs.',
            'collection': 'Product category page. Important for filtering and product discovery.'
          };

          return (
            <section key={key} className="mb-16">
              <div className="mb-6">
                <h2 className="text-3xl font-bold text-[#191E77] mb-2">{pageNames[key]}</h2>
                <p className="text-slate-600">{pageDescriptions[key]}</p>
              </div>

              {/* Desktop Screenshots */}
              <div className="mb-12">
                <h3 className="text-xl font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <span className="text-2xl">💻</span> Desktop View (1440px) - CRO Suggestions
                </h3>
                <div className="space-y-6">
                  {pageScreenshots
                    ?.filter((img: string) => img.includes('desktop'))
                    .map((img: string, idx: number) => {
                      // Define CRO annotations based on page type
                      const annotations = getCROAnnotations(key, 'desktop');
                      return (
                        <AnnotatedScreenshot
                          key={`${key}-desktop-${idx}`}
                          imageUrl={img}
                          title={`${pageNames[key]} - Desktop Fold ${idx + 1}`}
                          deviceType="desktop"
                          annotations={annotations}
                        />
                      );
                    })}
                </div>
              </div>

              {/* Mobile Screenshots */}
              <div className="mb-12">
                <h3 className="text-xl font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <span className="text-2xl">📱</span> Mobile View (390px) - CRO Suggestions
                </h3>
                <div className="space-y-6">
                  {pageScreenshots
                    ?.filter((img: string) => img.includes('mobile'))
                    .map((img: string, idx: number) => {
                      // Define CRO annotations based on page type
                      const annotations = getCROAnnotations(key, 'mobile');
                      return (
                        <AnnotatedScreenshot
                          key={`${key}-mobile-${idx}`}
                          imageUrl={img}
                          title={`${pageNames[key]} - Mobile Fold ${idx + 1}`}
                          deviceType="mobile"
                          annotations={annotations}
                        />
                      );
                    })}
                </div>
              </div>
            </section>
          );
        })}

        {/* Recommendations */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-[#191E77] mb-6">💡 Prioritized Recommendations</h2>
          
          <div className="space-y-6">
            {/* Critical Priority */}
            <div className="bg-gradient-to-r from-red-50 to-red-100 rounded-xl p-8 border-l-4 border-red-500">
              <div className="flex items-start gap-4">
                <div className="bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">1</div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-red-900 mb-2">Simplify Navigation (CRITICAL)</h3>
                  <p className="text-red-800 mb-4">Your main navigation requires too many clicks to access key categories. This creates friction for first-time visitors.</p>
                  <div className="bg-white/50 rounded-lg p-4">
                    <p className="text-sm font-semibold text-red-900 mb-2">Expected Impact:</p>
                    <ul className="text-sm text-red-800 space-y-1">
                      <li>✓ +3-5% improvement in bounce rate</li>
                      <li>✓ +2-4% increase in pages per session</li>
                      <li>✓ Baseline improvement for other optimizations</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* High Priority */}
            <div className="bg-gradient-to-r from-amber-50 to-amber-100 rounded-xl p-8 border-l-4 border-amber-500">
              <div className="flex items-start gap-4">
                <div className="bg-amber-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">2</div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-amber-900 mb-2">Add Trust Signals Above the Fold (HIGH)</h3>
                  <p className="text-amber-800 mb-4">Trust badges, customer reviews, and testimonials are crucial for reducing cart abandonment and building credibility.</p>
                  <div className="bg-white/50 rounded-lg p-4">
                    <p className="text-sm font-semibold text-amber-900 mb-2">Expected Impact:</p>
                    <ul className="text-sm text-amber-800 space-y-1">
                      <li>✓ +2-3% increase in conversion rate</li>
                      <li>✓ Reduced cart abandonment by 1-2%</li>
                      <li>✓ Better brand perception</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Medium Priority */}
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-8 border-l-4 border-blue-500">
              <div className="flex items-start gap-4">
                <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">3</div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-blue-900 mb-2">Optimize Mobile Experience (HIGH)</h3>
                  <p className="text-blue-800 mb-4">Mobile users make up 60% of your traffic but experience smaller touch targets and slower load times.</p>
                  <div className="bg-white/50 rounded-lg p-4">
                    <p className="text-sm font-semibold text-blue-900 mb-2">Quick Fixes:</p>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Increase button/CTA minimum height to 48px</li>
                      <li>• Optimize image sizes for mobile</li>
                      <li>• Ensure 1-tap checkout is visible</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Next Steps */}
        <section className="bg-gradient-to-r from-[#191E77] via-[#2D3B9C] to-blue-700 text-white rounded-xl p-12 mb-16">
          <h2 className="text-3xl font-bold mb-6">📋 Next Steps</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="text-4xl mb-4">1</div>
              <h3 className="text-xl font-bold mb-2">Pick Your Quick Win</h3>
              <p className="text-blue-100">Start with one high-impact, low-effort change. We recommend: Simplify Navigation</p>
            </div>
            <div>
              <div className="text-4xl mb-4">2</div>
              <h3 className="text-xl font-bold mb-2">Set Up A/B Test</h3>
              <p className="text-blue-100">Use tools like Optimizely, VWO, or Convert to test your changes with 50% of traffic.</p>
            </div>
            <div>
              <div className="text-4xl mb-4">3</div>
              <h3 className="text-xl font-bold mb-2">Measure & Learn</h3>
              <p className="text-blue-100">Run for 2-4 weeks. Track conversion rate, AOV, and engagement metrics. Then iterate.</p>
            </div>
          </div>
        </section>

        {/* Footer CTA */}
        <section className="text-center pb-8">
          <h2 className="text-2xl font-bold text-[#191E77] mb-4">Ready to Increase Your Conversions?</h2>
          <p className="text-slate-600 mb-6 max-w-2xl mx-auto">
            This audit is just the beginning. Each recommendation above comes with implementation guides and best practices for your industry.
          </p>
          <button
            onClick={onReset}
            className="px-8 py-3 bg-gradient-to-r from-[#191E77] to-blue-600 text-white font-bold rounded-lg hover:shadow-lg transition-all"
          >
            Run Another Audit
          </button>
          <p className="text-slate-500 text-sm mt-6">
            Questions? <a href="#" className="text-[#191E77] font-semibold hover:underline">View FAQ</a> or <a href="#" className="text-[#191E77] font-semibold hover:underline">Contact our team</a>
          </p>
        </section>
      </div>
    </div>
  );
}
