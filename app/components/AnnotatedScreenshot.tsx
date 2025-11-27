'use client'

import { useState } from 'react';
import Image from 'next/image';

interface AnnotationPoint {
  x: number; // percentage (0-100)
  y: number; // percentage (0-100)
  title: string;
  suggestion: string;
  priority: 'critical' | 'high' | 'medium';
  icon: string;
}

interface AnnotatedScreenshotProps {
  imageUrl: string;
  title: string;
  deviceType: 'desktop' | 'mobile';
  annotations: AnnotationPoint[];
}

const priorityColors = {
  critical: 'bg-red-500',
  high: 'bg-amber-500',
  medium: 'bg-blue-500'
};

const priorityBorders = {
  critical: 'border-red-500',
  high: 'border-amber-500',
  medium: 'border-blue-500'
};

const priorityBg = {
  critical: 'bg-red-50',
  high: 'bg-amber-50',
  medium: 'bg-blue-50'
};

export default function AnnotatedScreenshot({
  imageUrl,
  title,
  deviceType,
  annotations
}: AnnotatedScreenshotProps) {
  const [activeAnnotation, setActiveAnnotation] = useState<number | null>(null);

  return (
    <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-100 to-slate-50 px-6 py-4 border-b border-slate-200">
        <p className="text-sm font-bold text-slate-700 uppercase tracking-wide">{title}</p>
        <p className="text-xs text-slate-500 mt-1">
          {deviceType === 'desktop' ? '💻 Desktop View' : '📱 Mobile View'}
        </p>
      </div>

      {/* Screenshot Container with Annotations */}
      <div className="relative bg-slate-900 p-4">
        {/* Screenshot Image */}
        <div className={`relative ${deviceType === 'desktop' ? 'max-w-full' : 'max-w-md mx-auto'}`}>
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-auto rounded-lg border-4 border-slate-800 shadow-2xl"
          />

          {/* Annotation Points */}
          {annotations.map((annotation, index) => (
            <div
              key={index}
              className="absolute"
              style={{
                left: `${annotation.x}%`,
                top: `${annotation.y}%`,
                transform: 'translate(-50%, -50%)'
              }}
            >
              {/* Pin Circle */}
              <button
                onClick={() => setActiveAnnotation(activeAnnotation === index ? null : index)}
                className={`w-10 h-10 rounded-full ${priorityColors[annotation.priority]} text-white font-bold shadow-lg hover:scale-125 transition-transform duration-200 flex items-center justify-center border-2 border-white cursor-pointer relative z-20`}
              >
                {index + 1}
              </button>

              {/* Pulse effect */}
              <div
                className={`absolute inset-0 rounded-full ${priorityColors[annotation.priority]} opacity-20 animate-pulse`}
                style={{
                  animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                }}
              ></div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap gap-3 justify-center">
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span>Critical</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <div className="w-3 h-3 rounded-full bg-amber-500"></div>
            <span>High</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span>Medium</span>
          </div>
        </div>
      </div>

      {/* Annotations List */}
      <div className="p-6 bg-gradient-to-b from-white to-slate-50 space-y-3">
        {annotations.length === 0 ? (
          <p className="text-slate-500 text-sm italic">No CRO suggestions for this section</p>
        ) : (
          annotations.map((annotation, index) => (
            <div
              key={index}
              className={`rounded-lg border-l-4 p-4 cursor-pointer transition-all duration-200 ${priorityBg[annotation.priority]} ${priorityBorders[annotation.priority]} ${
                activeAnnotation === index ? 'ring-2 ring-offset-1 ring-slate-300' : ''
              }`}
              onClick={() => setActiveAnnotation(activeAnnotation === index ? null : index)}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-8 h-8 rounded-full ${priorityColors[annotation.priority]} text-white font-bold flex items-center justify-center flex-shrink-0 text-sm`}
                >
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-900 text-sm">{annotation.title}</p>
                  {activeAnnotation === index && (
                    <p className="text-slate-700 text-sm mt-2 leading-relaxed">
                      {annotation.suggestion}
                    </p>
                  )}
                </div>
                <span className="text-xs font-semibold px-2 py-1 rounded-full bg-white border border-slate-300 flex-shrink-0">
                  {annotation.priority.charAt(0).toUpperCase() + annotation.priority.slice(1)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
