'use client'


import GeminiResults from './GeminiResults';

export default function Results({ data, onReset }: { data: any; onReset?: () => void }) {
  // If data is complete with all required fields, show the full report
  if (data?.screenshots && data?.suggestions) {
    return <GeminiResults data={data} onReset={onReset || (() => {})} />;
  }

  // Fallback for incomplete data
  return (
    <div className="mt-8 space-y-8">
      <div className="bg-gradient-to-r from-[#191E77]/5 to-purple-100/30 border-l-4 border-[#191E77] rounded-lg p-6 mb-8">
        <h2 className="text-4xl font-bold bg-gradient-to-r from-[#191E77] to-[#2D3B9C] bg-clip-text text-transparent mb-2">
          🎯 Audit Complete
        </h2>
        <p className="text-slate-700">Processing your results...</p>
      </div>
    </div>
  );
}

