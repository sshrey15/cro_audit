'use client'

import React, { useEffect, useState } from 'react';

interface LoadingModalProps {
  url: string;
}

export default function LoadingModal({ url }: LoadingModalProps) {
  const [step, setStep] = useState(0);
  const domain = url.replace(/^https?:\/\//, '').replace(/\/.*$/, '');

  useEffect(() => {
    const timers = [
      setTimeout(() => setStep(1), 2000),  // Loading Content
      setTimeout(() => setStep(2), 5000),  // Identifying Sections
      setTimeout(() => setStep(3), 15000), // Analyzing
      setTimeout(() => setStep(4), 35000), // Prioritizing
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  const steps = [
    { text: `Opening your site (${domain})`, delay: 0 },
    { text: "Loading Content and Evaluating site speed", delay: 2000 },
    { text: "Identifying Sections and Capturing individual screenshots", delay: 5000 },
    { text: "Analyzing for conversion blockers (This step usually takes ~20-35s)", delay: 15000 },
    { text: "Prioritizing your 5 wins", delay: 35000 }
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#191E77] to-[#2D3B9C]"></div>
        
        <div className="text-center mb-8">
          <h3 className="text-2xl font-bold text-[#191E77] mb-2">
            Your 5 conversion wins are in the works 🚀
          </h3>
          <p className="text-slate-600">
            This might take up to 2-3 minutes—good things (and data) take time.
          </p>
        </div>

        <div className="space-y-6 relative">
          {/* Connecting line */}
          <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-slate-100 -z-10"></div>

          {steps.map((s, i) => {
            const isActive = i === step;
            const isCompleted = i < step;
            const isPending = i > step;

            return (
              <div key={i} className={`flex items-start gap-4 transition-all duration-500 ${isPending ? 'opacity-40' : 'opacity-100'}`}>
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2 transition-all duration-500
                  ${isCompleted ? 'bg-green-500 border-green-500 text-white' : ''}
                  ${isActive ? 'bg-white border-[#191E77] text-[#191E77] animate-pulse' : ''}
                  ${isPending ? 'bg-slate-50 border-slate-200 text-slate-300' : ''}
                `}>
                  {isCompleted ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <span className="text-sm font-bold">{i + 1}</span>
                  )}
                </div>
                <div className="pt-1">
                  <p className={`text-sm font-medium transition-colors duration-300 ${isActive ? 'text-[#191E77]' : 'text-slate-700'}`}>
                    {s.text}
                  </p>
                  {isActive && (
                    <div className="mt-2 h-1 w-24 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-[#191E77] animate-progress"></div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
