'use client';

import React, { useState, useEffect } from 'react';
import { Link2, Globe, Search, AlertCircle } from 'lucide-react';

interface JobURLInputProps {
  value: string;
  onChange: (val: string) => void;
  onScrape: () => void;
  isLoading: boolean;
}

export default function JobURLInput({ value, onChange, onScrape, isLoading }: JobURLInputProps) {
  const [platform, setPlatform] = useState<string | null>(null);
  const [isValidUrl, setIsValidUrl] = useState<boolean>(true);

  useEffect(() => {
    if (!value) {
      setPlatform(null);
      setIsValidUrl(true);
      return;
    }

    // Basic URL validation
    try {
      new URL(value);
      setIsValidUrl(true);
    } catch (_) {
      setIsValidUrl(false);
    }

    // Realtime platform detection
    const urlLower = value.toLowerCase();
    if (urlLower.includes('greenhouse.io')) {
      setPlatform('Greenhouse');
    } else if (urlLower.includes('lever.co')) {
      setPlatform('Lever');
    } else if (urlLower.includes('ashbyhq.com')) {
      setPlatform('Ashby');
    } else if (urlLower.includes('smartrecruiters.com')) {
      setPlatform('SmartRecruiters');
    } else if (urlLower.includes('myworkdayjobs.com') || urlLower.includes('workday')) {
      setPlatform('Workday');
    } else if (urlLower.includes('oracle') || urlLower.includes('oraclecloud.com') || urlLower.includes('taleo.net')) {
      setPlatform('Oracle Careers');
    } else if (urlLower.includes('successfactors') || urlLower.includes('sfshare')) {
      setPlatform('SAP SuccessFactors');
    } else {
      setPlatform('Generic Webpage');
    }
  }, [value]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && isValidUrl && value && !isLoading) {
      onScrape();
    }
  };

  const getPlatformColor = (plat: string) => {
    switch (plat) {
      case 'Greenhouse': return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
      case 'Lever': return 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20';
      case 'Ashby': return 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20';
      case 'SmartRecruiters': return 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20';
      case 'Workday': return 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20';
      case 'Oracle Careers': return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
      case 'SAP SuccessFactors': return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
      default: return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20';
    }
  };

  return (
    <div className="w-full space-y-2">
      <div className="relative flex items-center">
        <div className="absolute left-3.5 text-slate-400 pointer-events-none">
          <Link2 className="w-5 h-5" />
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Paste job posting URL (e.g. Lever, Greenhouse, Workday...)"
          className={`w-full pl-11 pr-32 py-3 bg-white dark:bg-slate-900 border text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all ${
            !isValidUrl && value
              ? 'border-rose-400 dark:border-rose-900 focus:border-rose-500'
              : 'border-slate-300 dark:border-slate-700 focus:border-indigo-500'
          }`}
          disabled={isLoading}
        />
        <button
          onClick={onScrape}
          disabled={isLoading || !value || !isValidUrl}
          className="absolute right-2 px-4 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-600 text-white cursor-pointer disabled:cursor-not-allowed transition-all shadow-sm"
        >
          {isLoading ? (
            <div className="flex items-center space-x-1.5">
              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Fetching...</span>
            </div>
          ) : (
            <div className="flex items-center space-x-1">
              <Search className="w-3.5 h-3.5" />
              <span>Analyze Job</span>
            </div>
          )}
        </button>
      </div>

      <div className="flex items-center justify-between px-1">
        {value && !isValidUrl && (
          <div className="flex items-center space-x-1.5 text-xs text-rose-500">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Please enter a valid HTTP or HTTPS job link.</span>
          </div>
        )}
        {value && isValidUrl && platform && (
          <div className={`flex items-center space-x-1.5 border text-xs px-2.5 py-0.5 rounded-full font-medium ${getPlatformColor(platform)}`}>
            <Globe className="w-3 h-3" />
            <span>Detected: {platform}</span>
          </div>
        )}
      </div>
    </div>
  );
}
