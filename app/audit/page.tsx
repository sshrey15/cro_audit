'use client'

import React, { useState } from 'react';
import AuditForm from '../components/AuditForm';
import Results from '../components/Results';
import LoadingModal from '../components/LoadingModal';

export default function AuditPage() {
  const [result, setResult] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUrl, setCurrentUrl] = useState('');

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-slate-100 relative">
      {/* Grid Background */}
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.03] pointer-events-none" 
        style={{
          backgroundImage: `linear-gradient(90deg, rgba(0,0,0,0.05) 1px, transparent 1px), linear-gradient(rgba(0,0,0,0.05) 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }}>
      </div>

      {/* Header with Logo */}
      <div className="bg-white border-b border-slate-200 py-4 px-6 shadow-sm relative z-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <img 
              src="/logo.png" 
              alt="CRO Audit Tool" 
              className="h-8 w-auto"
            />
          </div>
          {/* Optional: Tagline or nav */}
          <div className="text-right text-sm text-slate-600">
            Conversion Rate Optimization Tool
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-16 relative z-20">
        {!result ? (
          <>
            {/* Hero Section */}
            <div className="text-center mb-16">
              <div className="inline-block px-4 py-2 bg-gradient-to-r from-[#191E77]/10 to-purple-100 rounded-full border border-[#191E77]/30 mb-6">
                <span className="text-[#191E77] text-xs font-bold">ANALYZE IN SECONDS</span>
              </div>
              
              <h2 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-[#191E77] via-[#2D3B9C] to-blue-700 bg-clip-text text-transparent mb-4">
                Your Website Deserves Better
              </h2>
              
              <h3 className="text-2xl text-slate-700 font-semibold mb-6">See What's Blocking Your Conversions</h3>
              
              <p className="text-sm text-slate-600 max-w-2xl mx-auto mb-8 leading-relaxed">
                Unlock conversion barriers instantly. We crawl your entire site, identify friction points, and surface actionable opportunities tailored to your industry. No guesswork. Just results.
              </p>

              <div className="flex flex-wrap justify-center gap-6 mb-12">
                <div className="flex items-center gap-2 text-white">
                  <span className="text-sm bg-[#191E77] p-4 rounded-full text-sm font-medium">Works instantly</span>
                </div>
                <div className="flex items-center gap-2 text-white">
                  <span className="text-sm bg-[#191E77] p-4 rounded-full text-sm font-medium">No data collection</span>
                </div>
                <div className="flex items-center gap-2 text-white">
                  <span className="text-sm bg-[#191E77] p-4 rounded-full text-sm font-medium">Ready to implement</span>
                </div>
              </div>
            </div>

            {/* Audit Form */}
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 mb-8 max-w-2xl mx-auto">
              <h3 className="text-xl font-bold text-[#191E77] mb-2 text-center">Start Your Free Analysis</h3>
              <p className="text-sm text-slate-600 text-center mb-6">Paste your store URL and we'll show you the opportunities</p>
              <AuditForm
                onStart={() => { setLoading(true); setError(null); setResult(null); }}
                onComplete={(res: any) => { setLoading(false); setResult(res); }}
                onError={(msg: string) => { setLoading(false); setError(msg); }}
              />
            </div>

            {/* View Sample Report Link */}
            <div className="text-center mb-12">
              <p className="text-slate-600 text-sm mb-3">Want to see what the full audit report looks like?</p>
              <a
                href="/sample-report"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-slate-100 to-slate-200 hover:from-slate-200 hover:to-slate-300 text-[#191E77] font-bold rounded-lg border border-slate-300 transition-all duration-200 hover:shadow-md"
              >
                <span>👀</span>
                <span>View Sample Report</span>
              </a>
            </div>

            {/* Loading Modal */}
            {loading && <LoadingModal url={currentUrl || 'your site'} />}

            {/* Error State */}
            {error && (
              <div className="max-w-2xl mx-auto bg-red-50 border border-red-200 rounded-xl p-6">
                <p className="text-red-700 font-semibold mb-2">⚠️ Audit Failed</p>
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {/* Trust Indicators */}
            <div className="mt-20 pt-12 border-t border-slate-200">
              <p className="text-center text-slate-600 text-sm font-semibold mb-8">
                Trusted by conversion leaders worldwide
              </p>
              <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
                {['Sunrun', 'PayNearMe', 'Swiss', 'Mifold', 'Lufthansa'].map((brand) => (
                  <div key={brand} className="text-slate-500 text-sm font-medium">
                    {brand}
                  </div>
                ))}
              </div>
              <p className="text-center text-slate-500 text-xs mt-8">
                Built by conversion experts. Analyzed 50,000+ ecommerce sites. All in real-time.
              </p>
            </div>
          </>
        ) : (
          <Results 
            data={result}
            onReset={() => {
              setResult(null);
              setError(null);
              setLoading(false);
            }}
          />
        )}
      </div>
    </div>
  );
}
