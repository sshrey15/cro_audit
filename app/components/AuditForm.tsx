'use client'

import React, { useState } from 'react';

export default function AuditForm({ 
  onStart, 
  onComplete, 
  onError,
  onLoadingStatusChange 
}: { 
  onStart: () => void; 
  onComplete: (res: any) => void; 
  onError: (msg: string) => void;
  onLoadingStatusChange?: (status: string) => void;
}) {
  const [url, setUrl] = useState('');
  const [running, setRunning] = useState(false);
  const [auditType, setAuditType] = useState<'site' | 'product'>('site');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return onError('Please provide a URL to audit');

    try {
      onStart();
      setRunning(true);
      const resp = await fetch('/api/audit-gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, auditType })
      });
      const data = await resp.json();
      if (!resp.ok) {
        onError(data?.error || 'Audit failed');
      } else {
        onComplete(data);
      }
    } catch (err: any) {
      console.error(err);
      onError(err?.message || String(err));
    } finally {
      setRunning(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      {/* Audit Type Toggle */}
      <div className="flex justify-center">
        <div className="bg-slate-100 p-1 rounded-lg inline-flex">
          <button
            type="button"
            onClick={() => setAuditType('site')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
              auditType === 'site' 
                ? 'bg-white text-[#191E77] shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Site Audit (Home + Collection)
          </button>
          <button
            type="button"
            onClick={() => setAuditType('product')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
              auditType === 'product' 
                ? 'bg-white text-[#191E77] shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Product Page Audit
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <input
          aria-label="site-url"
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder={auditType === 'site' ? "https://yourstore.com" : "https://yourstore.com/products/awesome-item"}
          className="flex-1 px-4 py-3 rounded-lg border border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#191E77] focus:border-transparent transition-all duration-200"
        />
        <button
          type="submit"
          disabled={running}
          className="px-8 py-3 rounded-lg bg-gradient-to-r from-[#191E77] to-[#2D3B9C] text-white font-bold shadow-lg hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-200 whitespace-nowrap hover:scale-105 transform"
        >
          {running ? (
            <span className="flex items-center gap-2">
              <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              Analyzing…
            </span>
          ) : (
            'Analyze Now'
          )}
        </button>
      </div>
      <p className="text-xs text-slate-500 text-center">
        No installation needed • No data stored • Results in 30 seconds
      </p>
    </form>
  );
}
