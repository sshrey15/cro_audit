'use client'


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

export default function GeminiResults({ 
  data, 
  onReset 
}: { 
  data: { screenshots: ScreenshotData[]; suggestions: CROSuggestion[] };
  onReset: () => void;
}) {
  const criticalSuggestions = data.suggestions.filter(s => s.priority === 'critical');
  const highSuggestions = data.suggestions.filter(s => s.priority === 'high');
  const mediumSuggestions = data.suggestions.filter(s => s.priority === 'medium');

  const getPriorityColor = (priority: string) => {
    switch(priority) {
      case 'critical': return 'red';
      case 'high': return 'amber';
      case 'medium': return 'blue';
      default: return 'slate';
    }
  };

  const getPriorityBg = (priority: string) => {
    switch(priority) {
      case 'critical': return 'bg-red-50 border-red-200';
      case 'high': return 'bg-amber-50 border-amber-200';
      case 'medium': return 'bg-blue-50 border-blue-200';
      default: return 'bg-slate-50 border-slate-200';
    }
  };

  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold text-[#191E77] mb-2">🎯 CRO Audit Complete</h2>
        <p className="text-slate-600">AI-Powered Conversion Optimization Analysis</p>
      </div>

      {/* Screenshots Section */}
      <div className="space-y-8">
        <h3 className="text-2xl font-bold text-[#191E77]">📸 Website Pages Analyzed</h3>
        
        {data.screenshots.map((screenshot, idx) => (
          <div key={idx} className="bg-white rounded-xl shadow-lg overflow-hidden border border-slate-200">
            <div className="bg-gradient-to-r from-[#191E77] to-[#2D3B9C] p-4">
              <h4 className="text-white font-bold capitalize">{screenshot.type.replace(/([A-Z])/g, ' $1').trim()} Page</h4>
            </div>
            
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Desktop */}
              <div>
                <p className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  💻 Desktop View
                </p>
                <div className="bg-slate-100 rounded-lg overflow-hidden border border-slate-300">
                  <img 
                    src={screenshot.desktop} 
                    alt={`${screenshot.type} desktop`}
                    className="w-full h-auto"
                  />
                </div>
              </div>
              
              {/* Mobile */}
              <div>
                <p className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  📱 Mobile View
                </p>
                <div className="bg-slate-100 rounded-lg overflow-hidden border border-slate-300 max-w-xs mx-auto">
                  <img 
                    src={screenshot.mobile} 
                    alt={`${screenshot.type} mobile`}
                    className="w-full h-auto"
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Suggestions by Priority */}
      <div className="space-y-8">
        <h3 className="text-2xl font-bold text-[#191E77]">🔍 AI-Generated CRO Recommendations</h3>

        {/* Critical Issues */}
        {criticalSuggestions.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-4">
              <span className="inline-block w-4 h-4 bg-red-500 rounded"></span>
              <h4 className="text-lg font-bold text-red-700">Critical ({criticalSuggestions.length})</h4>
            </div>
            <div className="space-y-3">
              {criticalSuggestions.map((suggestion, idx) => (
                <div key={idx} className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
                  <h5 className="font-bold text-red-900 mb-1">{suggestion.title}</h5>
                  <p className="text-red-800 text-sm mb-2">{suggestion.description}</p>
                  <p className="text-red-700 text-xs font-semibold">💡 Impact: {suggestion.impact}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* High Priority Issues */}
        {highSuggestions.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-4">
              <span className="inline-block w-4 h-4 bg-amber-500 rounded"></span>
              <h4 className="text-lg font-bold text-amber-700">High Priority ({highSuggestions.length})</h4>
            </div>
            <div className="space-y-3">
              {highSuggestions.map((suggestion, idx) => (
                <div key={idx} className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg">
                  <h5 className="font-bold text-amber-900 mb-1">{suggestion.title}</h5>
                  <p className="text-amber-800 text-sm mb-2">{suggestion.description}</p>
                  <p className="text-amber-700 text-xs font-semibold">💡 Impact: {suggestion.impact}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Medium Priority Issues */}
        {mediumSuggestions.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-4">
              <span className="inline-block w-4 h-4 bg-blue-500 rounded"></span>
              <h4 className="text-lg font-bold text-blue-700">Medium Priority ({mediumSuggestions.length})</h4>
            </div>
            <div className="space-y-3">
              {mediumSuggestions.map((suggestion, idx) => (
                <div key={idx} className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
                  <h5 className="font-bold text-blue-900 mb-1">{suggestion.title}</h5>
                  <p className="text-blue-800 text-sm mb-2">{suggestion.description}</p>
                  <p className="text-blue-700 text-xs font-semibold">💡 Impact: {suggestion.impact}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {data.suggestions.length === 0 && (
          <div className="bg-green-50 border-l-4 border-green-500 p-6 rounded-r-lg text-center">
            <p className="text-green-800 font-semibold">✨ Great news! No critical issues found.</p>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4 border border-red-200">
          <div className="text-3xl font-bold text-red-600">{criticalSuggestions.length}</div>
          <p className="text-red-700 text-sm font-semibold mt-1">Critical Issues</p>
        </div>
        <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg p-4 border border-amber-200">
          <div className="text-3xl font-bold text-amber-600">{highSuggestions.length}</div>
          <p className="text-amber-700 text-sm font-semibold mt-1">High Priority</p>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
          <div className="text-3xl font-bold text-blue-600">{mediumSuggestions.length}</div>
          <p className="text-blue-700 text-sm font-semibold mt-1">Medium Priority</p>
        </div>
        <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg p-4 border border-slate-200">
          <div className="text-3xl font-bold text-slate-600">{data.screenshots.length}</div>
          <p className="text-slate-700 text-sm font-semibold mt-1">Pages Scanned</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center gap-4">
        <button
          onClick={onReset}
          className="px-8 py-3 rounded-lg bg-gradient-to-r from-[#191E77] to-[#2D3B9C] text-white font-bold shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 transform"
        >
          🔄 Run Another Audit
        </button>
        <button
          className="px-8 py-3 rounded-lg border-2 border-[#191E77] text-[#191E77] font-bold hover:bg-slate-50 transition-all duration-200"
        >
          📥 Download Report
        </button>
      </div>
    </div>
  );
}
