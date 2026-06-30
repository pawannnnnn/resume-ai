'use client';

import React from 'react';
import { Award, Briefcase, GraduationCap, Percent, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';

interface AnalysisData {
  ats_score: number;
  match_percentage: number;
  missing_skills: string[];
  matching_skills: string[];
  suggested_keywords: string[];
  experience_strength: number;
  education_match: string;
  skills_coverage: number;
  suggested_title: string;
}

interface AnalysisDashboardProps {
  data: AnalysisData | null;
}

export default function AnalysisDashboard({ data }: AnalysisDashboardProps) {
  if (!data) return null;

  // Helpers for SVG gauge calculations
  const calculateStrokeDash = (percentage: number, radius: number) => {
    const circumference = 2 * Math.PI * radius;
    return `${(percentage / 100) * circumference} ${circumference}`;
  };

  // Get score grade colors
  const getScoreColorClass = (score: number) => {
    if (score >= 80) return 'text-emerald-500 stroke-emerald-500';
    if (score >= 60) return 'text-amber-500 stroke-amber-500';
    return 'text-rose-500 stroke-rose-500';
  };

  const getScoreBgClass = (score: number) => {
    if (score >= 80) return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';
    if (score >= 60) return 'bg-amber-500/10 text-amber-600 dark:text-amber-400';
    return 'bg-rose-500/10 text-rose-600 dark:text-rose-400';
  };

  return (
    <div className="w-full space-y-6">
      {/* Top Title Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between p-5 border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-950/50 backdrop-blur-md rounded-2xl gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Award className="w-5 h-5 text-indigo-500" />
            AI Resume Analysis
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Realtime scoring based on job description alignment
          </p>
        </div>
        <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          Suggested Title: <span className="text-indigo-600 dark:text-indigo-400">{data.suggested_title}</span>
        </div>
      </div>

      {/* Main Gauges Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* ATS Score Gauge Card */}
        <div className="flex flex-col items-center justify-center p-6 border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-950/50 backdrop-blur-md rounded-2xl">
          <span className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-4">ATS Suitability Score</span>
          <div className="relative flex items-center justify-center">
            <svg className="w-36 h-36 transform -rotate-90">
              <circle
                cx="72"
                cy="72"
                r="62"
                className="stroke-slate-100 dark:stroke-slate-900"
                strokeWidth="10"
                fill="transparent"
              />
              <circle
                cx="72"
                cy="72"
                r="62"
                className={`transition-all duration-1000 ${getScoreColorClass(data.ats_score)}`}
                strokeWidth="10"
                fill="transparent"
                strokeDasharray={calculateStrokeDash(data.ats_score, 62)}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-3xl font-black text-slate-800 dark:text-slate-100">{data.ats_score}</span>
              <span className="text-xxs font-semibold uppercase text-slate-400 dark:text-slate-500">out of 100</span>
            </div>
          </div>
          <div className={`mt-4 px-3 py-1 rounded-full text-xs font-semibold ${getScoreBgClass(data.ats_score)}`}>
            {data.ats_score >= 80 ? 'Highly Optimized' : data.ats_score >= 60 ? 'Needs Tweaks' : 'Critical Alignment Gaps'}
          </div>
        </div>

        {/* Resume Match % Card */}
        <div className="flex flex-col items-center justify-center p-6 border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-950/50 backdrop-blur-md rounded-2xl">
          <span className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-4">Keyword Match Rate</span>
          <div className="relative flex items-center justify-center">
            <svg className="w-36 h-36 transform -rotate-90">
              <circle
                cx="72"
                cy="72"
                r="62"
                className="stroke-slate-100 dark:stroke-slate-900"
                strokeWidth="10"
                fill="transparent"
              />
              <circle
                cx="72"
                cy="72"
                r="62"
                className="stroke-indigo-500 dark:stroke-indigo-400 transition-all duration-1000"
                strokeWidth="10"
                fill="transparent"
                strokeDasharray={calculateStrokeDash(data.match_percentage, 62)}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-3xl font-black text-slate-800 dark:text-slate-100 flex items-center">
                {data.match_percentage}
                <span className="text-lg text-slate-400 dark:text-slate-500">%</span>
              </span>
              <span className="text-xxs font-semibold uppercase text-slate-400 dark:text-slate-500">semantic match</span>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full">
            <Percent className="w-3.5 h-3.5" />
            <span>Keyword Coverage</span>
          </div>
        </div>

        {/* Categorized Alignment Summary */}
        <div className="p-6 border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-950/50 backdrop-blur-md rounded-2xl space-y-4">
          <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Metrics Overview</h3>
          
          <div className="space-y-3.5">
            {/* Experience Strength */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-medium text-slate-700 dark:text-slate-300">
                <span className="flex items-center gap-1">
                  <Briefcase className="w-3.5 h-3.5 text-indigo-500" />
                  Experience Alignment
                </span>
                <span>{data.experience_strength}%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-850 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-indigo-500 transition-all duration-1000" 
                  style={{ width: `${data.experience_strength}%` }}
                />
              </div>
            </div>

            {/* Skills Coverage */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-medium text-slate-700 dark:text-slate-300">
                <span className="flex items-center gap-1">
                  <Percent className="w-3.5 h-3.5 text-emerald-500" />
                  Skills Coverage
                </span>
                <span>{data.skills_coverage}%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-850 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 transition-all duration-1000" 
                  style={{ width: `${data.skills_coverage}%` }}
                />
              </div>
            </div>

            {/* Education Match */}
            <div className="flex items-center justify-between p-2.5 rounded-xl border border-slate-150 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-xs">
              <span className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                <GraduationCap className="w-4 h-4 text-violet-500" />
                Education Match
              </span>
              <span className={`font-bold px-2 py-0.5 rounded-md ${
                data.education_match === 'High Match' 
                  ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10'
                  : 'text-amber-600 dark:text-amber-400 bg-amber-500/10'
              }`}>
                {data.education_match}
              </span>
            </div>

          </div>
        </div>

      </div>

      {/* Skills Analysis Block */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Matching Skills */}
        <div className="p-6 border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-950/50 backdrop-blur-md rounded-2xl flex flex-col h-[320px]">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            Matching Skills ({data.matching_skills.length})
          </h3>
          <div className="flex-1 overflow-y-auto pr-1 space-y-1">
            {data.matching_skills.length === 0 ? (
              <p className="text-xs text-slate-400 dark:text-slate-500 italic p-2">No matching skills found.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5 p-1">
                {data.matching_skills.map((skill, i) => (
                  <span
                    key={i}
                    className="text-xs px-2.5 py-1 bg-emerald-500/10 dark:bg-emerald-500/5 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 rounded-md font-medium"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Missing Skills */}
        <div className="p-6 border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-950/50 backdrop-blur-md rounded-2xl flex flex-col h-[320px]">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-rose-500" />
            Missing Skills ({data.missing_skills.length})
          </h3>
          <div className="flex-1 overflow-y-auto pr-1 space-y-1">
            {data.missing_skills.length === 0 ? (
              <p className="text-xs text-slate-400 dark:text-slate-500 italic p-2">No missing skills detected! Excellent coverage.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5 p-1">
                {data.missing_skills.map((skill, i) => (
                  <span
                    key={i}
                    className="text-xs px-2.5 py-1 bg-rose-500/10 dark:bg-rose-500/5 border border-rose-500/20 text-rose-700 dark:text-rose-400 rounded-md font-medium"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Suggested Keywords Card */}
      <div className="p-6 border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-950/50 backdrop-blur-md rounded-2xl">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-3.5 flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-indigo-500" />
          Recommended Keywords
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
          Incorporate these industry-standard keywords into your resume descriptors to improve semantic scanning rates:
        </p>
        <div className="flex flex-wrap gap-2">
          {data.suggested_keywords.map((kw, i) => (
            <span
              key={i}
              className="text-xs px-3 py-1 bg-indigo-500/10 dark:bg-indigo-500/5 border border-indigo-500/20 text-indigo-700 dark:text-indigo-400 rounded-lg font-medium"
            >
              {kw}
            </span>
          ))}
        </div>
      </div>

    </div>
  );
}
