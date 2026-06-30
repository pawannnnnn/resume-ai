'use client';

import React, { useState } from 'react';
import { Sparkles, FileText, Activity, Check, GitCompare } from 'lucide-react';

interface ChangeItem {
  section: string;
  description: string;
  original: string;
  optimized: string;
}

interface ComparisonViewProps {
  originalText: string;
  optimizedText: string;
  changes: ChangeItem[];
}

export default function ComparisonView({ originalText, optimizedText, changes }: ComparisonViewProps) {
  const [activeTab, setActiveTab] = useState<'side-by-side' | 'changelog'>('side-by-side');

  return (
    <div className="w-full space-y-6">
      {/* Selector Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex space-x-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl">
          <button
            onClick={() => setActiveTab('side-by-side')}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'side-by-side'
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-250'
            }`}
          >
            <GitCompare className="w-4 h-4" />
            Side-by-Side View
          </button>
          <button
            onClick={() => setActiveTab('changelog')}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'changelog'
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-250'
            }`}
          >
            <Activity className="w-4 h-4" />
            AI Changes Changelog ({changes.length})
          </button>
        </div>
        <div className="text-xs font-medium text-slate-500 dark:text-slate-400 italic">
          Toggle view modes to inspect optimization quality
        </div>
      </div>

      {/* Side-by-Side Panel */}
      {activeTab === 'side-by-side' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Column 1: Original Resume */}
          <div className="flex flex-col h-[600px] border border-slate-200 dark:border-slate-855 bg-white/50 dark:bg-slate-950/20 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3.5 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-250 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-350 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-slate-400" />
                Original Resume Text
              </span>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wide">Read Only</span>
            </div>
            <textarea
              readOnly
              value={originalText}
              className="flex-1 p-5 text-xs text-slate-600 dark:text-slate-400 bg-transparent font-mono focus:outline-none resize-none overflow-y-auto leading-relaxed"
              placeholder="Original resume text will display here..."
            />
          </div>

          {/* Column 2: Optimized Resume */}
          <div className="flex flex-col h-[600px] border border-indigo-200 dark:border-indigo-950/50 bg-white/70 dark:bg-slate-950/40 rounded-2xl overflow-hidden shadow-lg shadow-indigo-500/5">
            <div className="flex items-center justify-between px-4 py-3.5 bg-indigo-50/50 dark:bg-indigo-950/10 border-b border-indigo-100 dark:border-indigo-950/50">
              <span className="text-xs font-bold text-indigo-700 dark:text-indigo-400 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" />
                Optimized Resume Markdown
              </span>
              <span className="text-[10px] uppercase font-bold text-indigo-500 dark:text-indigo-400 tracking-wide">Enhanced</span>
            </div>
            <textarea
              readOnly
              value={optimizedText}
              className="flex-1 p-5 text-xs text-slate-800 dark:text-slate-200 bg-transparent font-mono focus:outline-none resize-none overflow-y-auto leading-relaxed"
              placeholder="Optimized resume text in markdown will display here..."
            />
          </div>
        </div>
      )}

      {/* Changelog Panel */}
      {activeTab === 'changelog' && (
        <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
          {changes.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-center">
              <Check className="w-8 h-8 text-emerald-500 mb-2" />
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">No modifications logged</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">The resume was optimized with zero discrete alterations or is fully aligned already.</p>
            </div>
          ) : (
            changes.map((change, i) => (
              <div 
                key={i} 
                className="border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-950/30 rounded-xl p-5 space-y-3.5 shadow-sm hover:border-indigo-400 dark:hover:border-indigo-900 transition-all duration-300"
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-2 gap-1.5">
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded bg-indigo-500/10 self-start">
                    Section: {change.section}
                  </span>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Reason: {change.description}
                  </span>
                </div>

                {/* Body: Side-by-Side snippets */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Original snippet */}
                  <div className="space-y-1.5">
                    <div className="text-[10px] uppercase font-bold text-rose-500 tracking-wider">Before Change</div>
                    <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/10 border border-rose-100 dark:border-rose-950/30 text-xs font-mono text-rose-800 dark:text-rose-400 whitespace-pre-wrap leading-relaxed">
                      {change.original || '[Empty / Created new section]'}
                    </div>
                  </div>

                  {/* Optimized snippet */}
                  <div className="space-y-1.5">
                    <div className="text-[10px] uppercase font-bold text-emerald-500 tracking-wider">After Optimization</div>
                    <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-950/30 text-xs font-mono text-emerald-800 dark:text-emerald-400 whitespace-pre-wrap leading-relaxed">
                      {change.optimized}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
