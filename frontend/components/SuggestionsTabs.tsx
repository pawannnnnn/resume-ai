'use client';

import React, { useState } from 'react';
import { Mail, FileSignature, HelpCircle, Copy, Check, ChevronDown, ChevronUp } from 'lucide-react';

interface InterviewQuestion {
  question: string;
  suggested_answer: string;
}

interface SuggestionsData {
  cover_letter: string;
  recruiter_email: string;
  linkedin_summary: string;
  professional_headline: string;
  interview_prep: InterviewQuestion[];
  suggested_title: string;
}

interface SuggestionsTabsProps {
  data: SuggestionsData | null;
}

export default function SuggestionsTabs({ data }: SuggestionsTabsProps) {
  const [activeTab, setActiveTab] = useState<'cover-letter' | 'recruiter-email' | 'linkedin' | 'interview-prep'>('cover-letter');
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(null);

  if (!data) return null;

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(label);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const toggleQuestion = (index: number) => {
    setExpandedQuestion(expandedQuestion === index ? null : index);
  };

  const renderCopyButton = (textToCopy: string, identifier: string) => {
    const isCopied = copiedSection === identifier;
    return (
      <button
        onClick={() => handleCopy(textToCopy, identifier)}
        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
          isCopied
            ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/50'
            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-350 dark:border-slate-800 dark:hover:bg-slate-850'
        }`}
      >
        {isCopied ? (
          <>
            <Check className="w-3.5 h-3.5" />
            <span>Copied!</span>
          </>
        ) : (
          <>
            <Copy className="w-3.5 h-3.5" />
            <span>Copy Clipboard</span>
          </>
        )}
      </button>
    );
  };

  return (
    <div className="w-full space-y-6">
      {/* Tab Selectors */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('cover-letter')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
            activeTab === 'cover-letter'
              ? 'bg-indigo-650 border-indigo-600 text-white shadow-md shadow-indigo-500/10'
              : 'bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900'
          }`}
        >
          <FileSignature className="w-4 h-4" />
          Cover Letter
        </button>

        <button
          onClick={() => setActiveTab('recruiter-email')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
            activeTab === 'recruiter-email'
              ? 'bg-indigo-650 border-indigo-600 text-white shadow-md shadow-indigo-500/10'
              : 'bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900'
          }`}
        >
          <Mail className="w-4 h-4" />
          Recruiter Email
        </button>

        <button
          onClick={() => setActiveTab('linkedin')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
            activeTab === 'linkedin'
              ? 'bg-indigo-650 border-indigo-600 text-white shadow-md shadow-indigo-500/10'
              : 'bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900'
          }`}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
            <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
            <rect x="2" y="9" width="4" height="12"></rect>
            <circle cx="4" cy="4" r="2"></circle>
          </svg>
          LinkedIn Optimization
        </button>

        <button
          onClick={() => setActiveTab('interview-prep')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
            activeTab === 'interview-prep'
              ? 'bg-indigo-650 border-indigo-600 text-white shadow-md shadow-indigo-500/10'
              : 'bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900'
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          Interview Prep
        </button>
      </div>

      {/* Tab Panels */}
      <div className="w-full">
        {/* Cover Letter Panel */}
        {activeTab === 'cover-letter' && (
          <div className="border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-950/30 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Customized Cover Letter</h3>
              {renderCopyButton(data.cover_letter, 'cover-letter')}
            </div>
            <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-150 dark:border-slate-850 text-xs font-mono text-slate-800 dark:text-slate-300 leading-relaxed whitespace-pre-wrap max-h-[500px] overflow-y-auto">
              {data.cover_letter}
            </div>
          </div>
        )}

        {/* Recruiter Email Panel */}
        {activeTab === 'recruiter-email' && (
          <div className="border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-950/30 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Recruiter Outreach Email</h3>
              {renderCopyButton(data.recruiter_email, 'recruiter-email')}
            </div>
            <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-150 dark:border-slate-850 text-xs font-mono text-slate-800 dark:text-slate-300 leading-relaxed whitespace-pre-wrap max-h-[500px] overflow-y-auto">
              {data.recruiter_email}
            </div>
          </div>
        )}

        {/* LinkedIn Panel */}
        {activeTab === 'linkedin' && (
          <div className="grid grid-cols-1 gap-6">
            {/* LinkedIn Headline */}
            <div className="border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-950/30 rounded-2xl p-6 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Suggested Headline</h3>
                {renderCopyButton(data.professional_headline, 'headline')}
              </div>
              <div className="p-3.5 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/10 border border-indigo-100 dark:border-indigo-950/30 text-xs font-semibold text-indigo-900 dark:text-indigo-300">
                {data.professional_headline}
              </div>
            </div>

            {/* LinkedIn Summary */}
            <div className="border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-950/30 rounded-2xl p-6 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">LinkedIn 'About' Profile Summary</h3>
                {renderCopyButton(data.linkedin_summary, 'summary')}
              </div>
              <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-150 dark:border-slate-850 text-xs font-mono text-slate-800 dark:text-slate-350 leading-relaxed whitespace-pre-wrap">
                {data.linkedin_summary}
              </div>
            </div>
          </div>
        )}

        {/* Interview Prep Panel */}
        {activeTab === 'interview-prep' && (
          <div className="border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-950/30 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-850 pb-2">
              Behavioral & Technical Preparation
            </h3>
            
            <div className="space-y-3.5 max-h-[500px] overflow-y-auto pr-1">
              {data.interview_prep.map((prep, i) => (
                <div 
                  key={i}
                  className="border border-slate-150 dark:border-slate-850 rounded-xl overflow-hidden shadow-sm"
                >
                  {/* Collapsible header */}
                  <button
                    onClick={() => toggleQuestion(i)}
                    className="w-full flex items-center justify-between p-4 bg-slate-50/50 dark:bg-slate-900/50 hover:bg-slate-100/50 dark:hover:bg-slate-900 text-left font-medium text-xs text-slate-800 dark:text-slate-200 transition-colors"
                  >
                    <div className="flex items-start space-x-2">
                      <span className="font-bold text-indigo-600 dark:text-indigo-400 shrink-0">Q{i + 1}.</span>
                      <span>{prep.question}</span>
                    </div>
                    {expandedQuestion === i ? (
                      <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                  </button>

                  {/* Collapsible content */}
                  {expandedQuestion === i && (
                    <div className="p-4 bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-850 space-y-2">
                      <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-wider text-emerald-650 dark:text-emerald-400">
                        <span>Suggested Strategy (STAR Model)</span>
                        <button
                          onClick={() => handleCopy(prep.suggested_answer, `prep-${i}`)}
                          className="flex items-center gap-1.5 p-1 border hover:bg-slate-50 dark:hover:bg-slate-900 border-slate-100 dark:border-slate-850 rounded text-slate-500 dark:text-slate-400 text-[10px] font-semibold uppercase"
                        >
                          {copiedSection === `prep-${i}` ? 'Copied!' : 'Copy Answer'}
                        </button>
                      </div>
                      <p className="text-xs text-slate-650 dark:text-slate-350 leading-relaxed whitespace-pre-wrap bg-slate-50/50 dark:bg-slate-900/10 p-3 rounded-lg border border-slate-100 dark:border-slate-850">
                        {prep.suggested_answer}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
