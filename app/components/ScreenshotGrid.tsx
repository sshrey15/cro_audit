'use client'

import React, { useState } from 'react';

export default function ScreenshotGrid({ images }: { images: string[] }) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  if (!images || images.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
        <p className="text-sm">No screenshots available</p>
      </div>
    );
  }

  return (
    <>
      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {images.map((src, i) => (
          <div 
            key={i} 
            onClick={() => setSelectedImage(src)}
            className="group relative rounded-xl overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 border border-slate-200 shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer"
          >
            <div className="aspect-[9/16] overflow-hidden bg-white flex items-center justify-center">
              <img 
                src={src} 
                alt={`screenshot-${i}`} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            {/* Hover Overlay */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 flex items-center justify-center">
              <div className="text-white font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                Click to expand
              </div>
            </div>
            {/* Label */}
            <div className="absolute top-2 right-2 bg-[#191E77]/90 text-white text-xs font-semibold px-3 py-1 rounded-lg">
              Screenshot {i + 1}
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div 
            className="relative bg-white rounded-2xl shadow-2xl max-w-4xl max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 z-10 bg-white/90 hover:bg-white rounded-lg p-2 shadow-lg transition-all duration-200"
            >
              <svg className="w-6 h-6 text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Image */}
            <img 
              src={selectedImage} 
              alt="expanded-screenshot" 
              className="w-full h-auto"
            />
          </div>
        </div>
      )}
    </>
  );
}
