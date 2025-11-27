'use client'



export default function ClassificationCard({ classification }: { classification: any }) {
  if (!classification) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-lg">
        <p className="text-slate-500 text-sm">No classification data available</p>
      </div>
    );
  }

  const { isEcommerce, niche, scores } = classification;

  return (
    <div className="bg-gradient-to-br from-white to-blue-50 rounded-2xl border border-[#191E77]/20 p-6 shadow-xl space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-bold bg-gradient-to-r from-[#191E77] to-[#2D3B9C] bg-clip-text text-transparent mb-1">
          🔍 Site Classification
        </h3>
        <p className="text-xs text-slate-500">What we found about your store</p>
      </div>

      {/* Ecommerce Status */}
      <div className="space-y-2">
        <p className="text-xs font-bold uppercase text-slate-600 tracking-wide">Ecommerce Status</p>
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white shadow-lg ${
            isEcommerce 
              ? 'bg-gradient-to-br from-emerald-400 to-emerald-600' 
              : 'bg-gradient-to-br from-amber-400 to-amber-600'
          }`}>
            {isEcommerce ? '✓' : '⚠'}
          </div>
          <span className="text-slate-700 font-semibold">
            {isEcommerce ? 'E-commerce Confirmed' : 'Not an E-commerce Store'}
          </span>
        </div>
      </div>

      {/* Niche */}
      <div className="space-y-2">
        <p className="text-xs font-bold uppercase text-slate-600 tracking-wide">Detected Category</p>
        <div className="bg-gradient-to-r from-[#191E77] to-[#2D3B9C] text-white rounded-xl px-4 py-3">
          <p className="font-bold capitalize text-sm">{niche}</p>
          <p className="text-xs text-blue-100 mt-1">Optimized recommendations incoming</p>
        </div>
      </div>

      {/* Scores */}
      {scores && Object.keys(scores).length > 0 && (
        <div className="space-y-3 pt-4 border-t border-slate-200">
          <p className="text-xs font-bold uppercase text-slate-600 tracking-wide">Category Confidence</p>
          <div className="space-y-2">
            {Object.entries(scores)
              .sort(([, a], [, b]) => (b as number) - (a as number))
              .slice(0, 5)
              .map(([k, v]) => (
                <div key={k} className="flex items-center justify-between gap-3">
                  <span className="text-sm text-slate-600 capitalize">{k}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-[#191E77] to-[#2D3B9C]" 
                        style={{ width: `${Math.min((v as number) * 10, 100)}%` }}
                      ></div>
                    </div>
                    <span className="text-xs font-medium text-slate-500 w-6 text-right">
                      {(v as number).toFixed(1)}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
