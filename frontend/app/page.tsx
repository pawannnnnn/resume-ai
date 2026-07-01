'use client';

import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Moon, 
  Sun, 
  FileText, 
  ArrowRight, 
  CheckCircle, 
  AlertTriangle, 
  Trash2, 
  Settings as SettingsIcon,
  HelpCircle,
  FileCheck,
  ChevronRight,
  TrendingUp,
  Download,
  Lock,
  Menu,
  X
} from 'lucide-react';

import DragDropUpload from '../components/DragDropUpload';
import JobURLInput from '../components/JobURLInput';
import AnalysisDashboard from '../components/AnalysisDashboard';
import ComparisonView from '../components/ComparisonView';
import SuggestionsTabs from '../components/SuggestionsTabs';
import SettingsPanel from '../components/SettingsPanel';
import VersionsHistory from '../components/VersionsHistory';
import PricingModal from '../components/PricingModal';

// ----------------------------------------------------
// Interfaces
// ----------------------------------------------------

interface SavedVersion {
  id: string;
  name: string;
  timestamp: string;
  jobTitle: string;
  companyName: string;
  jobUrl: string;
  jobDescription: string;
  originalResumeText: string;
  optimizedResumeText: string;
  analysisData: any;
  suggestionsData: any;
  settings: any;
}

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

// API base URL — reads from environment variable set on Vercel
// Falls back to localhost:8000 for local development
const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace(/\/$/, '');

export default function Home() {
  // Theme state
  const [darkMode, setDarkMode] = useState(false);

  // Mobile sidebar toggle
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // SaaS subscription & credit states
  const [isPro, setIsPro] = useState(false);
  const [credits, setCredits] = useState(1);
  const [isPricingOpen, setIsPricingOpen] = useState(false);

  // Input states
  const [jobUrl, setJobUrl] = useState('');
  const [jobTitle, setJobTitle] = useState('Generic Position');
  const [companyName, setCompanyName] = useState('Generic Company');
  const [jobDescription, setJobDescription] = useState('');
  const [originalResumeText, setOriginalResumeText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Async states
  const [isScraping, setIsScraping] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processStep, setProcessStep] = useState('');
  const [processPercent, setProcessPercent] = useState(0);

  // Result states
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [optimizedResumeText, setOptimizedResumeText] = useState('');
  const [changes, setChanges] = useState<any[]>([]);
  const [suggestionsData, setSuggestionsData] = useState<any>(null);

  // Preferences & Styles
  const [settings, setSettings] = useState({
    font: 'Helvetica',
    color: '#2563EB',
    layout: 'Professional',
    mode: 'ATS Mode',
    length: 'Keep Original',
    pdfEngine: 'reportlab',
  });


  // History state
  const [versions, setVersions] = useState<SavedVersion[]>([]);
  
  // Custom toast list
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Active workspace page tab
  const [activeTab, setActiveTab] = useState<'metrics' | 'comparison' | 'collateral' | 'export'>('metrics');

  // Load initial settings and history from LocalStorage
  useEffect(() => {
    // Read local darkmode preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setDarkMode(true);
    }
    
    // Read saved subscription status
    const savedProStatus = localStorage.getItem('resume_ai_pro_user');
    if (savedProStatus === 'true') {
      setIsPro(true);
    }
    
    // Read saved credits count
    const savedCredits = localStorage.getItem('resume_ai_credits');
    if (savedCredits !== null) {
      setCredits(parseInt(savedCredits, 10));
    } else {
      setCredits(1);
    }
    
    // Read saved versions
    try {
      const savedVersions = localStorage.getItem('resume_versions');
      if (savedVersions) {
        setVersions(JSON.parse(savedVersions));
      }
    } catch (e) {
      console.error('Failed to parse saved resume versions:', e);
    }
  }, []);

  // Sync darkmode class to html element
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  // Toast dispatch helpers
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  // ----------------------------------------------------
  // Backend Operations
  // ----------------------------------------------------

  // Step 1: Scrape job URL
  const handleScrape = async () => {
    if (!jobUrl) return;
    setIsScraping(true);
    showToast('Connecting to ATS board...', 'info');

    try {
      const res = await fetch(`${API_BASE}/api/scrape`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: jobUrl }),
      });

      if (!res.ok) {
        const errorDetail = await res.json();
        throw new Error(errorDetail.detail || 'Failed to extract job posting.');
      }

      const data = await res.json();
      setJobDescription(data.description);
      setJobTitle(data.title);
      setCompanyName(data.company);
      showToast(`Scraped job listing: "${data.title}" at ${data.company}`, 'success');
    } catch (e: any) {
      showToast(e.message || 'Scraper failed. Check your network or try another URL.', 'error');
    } finally {
      setIsScraping(false);
    }
  };

  // Step 2: Parse Uploaded File
  const handleFileSelect = async (file: File) => {
    setSelectedFile(file);
    setIsParsing(true);
    showToast('Extracting resume content...', 'info');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`${API_BASE}/api/parse`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errorDetail = await res.json();
        throw new Error(errorDetail.detail || 'Parsing failed.');
      }

      const data = await res.json();
      setOriginalResumeText(data.text);
      showToast('Resume parsed successfully!', 'success');
    } catch (e: any) {
      showToast(e.message || 'Failed to parse resume document.', 'error');
      setSelectedFile(null);
    } finally {
      setIsParsing(false);
    }
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    setOriginalResumeText('');
  };

  // Step 3: Run AI Analysis & Optimization
  const handleOptimizeResume = async () => {
    if (!originalResumeText || !jobDescription) {
      showToast('Please upload a resume and fetch a job description first.', 'error');
      return;
    }

    if (!isPro && credits <= 0) {
      setIsPricingOpen(true);
      showToast('Optimization credit limit reached. Please upgrade to Pro to optimize more resumes.', 'info');
      return;
    }

    setIsProcessing(true);
    setProcessStep('Connecting to Gemini AI Engine...');
    setProcessPercent(15);

    try {
      // 1. Analyze Resume Match Metrics
      setProcessStep('Analyzing keyword alignment and ATS match...');
      setProcessPercent(40);
      const resAnalyze = await fetch(`${API_BASE}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resume_text: originalResumeText,
          job_description: jobDescription,
        }),
      });
      if (!resAnalyze.ok) {
        let errMsg = 'AI Analysis service encountered an error.';
        try {
          const errData = await resAnalyze.json();
          errMsg = errData.detail || errMsg;
        } catch (_) {}
        throw new Error(errMsg);
      }
      const dataAnalyze = await resAnalyze.json();
      setAnalysisData(dataAnalyze);

      // 2. Optimize Resume Text
      setProcessStep('Optimizing experience syntax & bullet layouts...');
      setProcessPercent(70);
      const resOptimize = await fetch(`${API_BASE}/api/optimize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resume_text: originalResumeText,
          job_description: jobDescription,
          settings: settings,
        }),
      });
      if (!resOptimize.ok) {
        let errMsg = 'AI Optimization service encountered an error.';
        try {
          const errData = await resOptimize.json();
          errMsg = errData.detail || errMsg;
        } catch (_) {}
        throw new Error(errMsg);
      }
      const dataOptimize = await resOptimize.json();
      setOptimizedResumeText(dataOptimize.optimized_resume_markdown);
      setChanges(dataOptimize.changes);

      // 3. Generate cover letters & extra files
      setProcessStep('Drafting Cover Letter, LinkedIn bio, & interview preparation prep...');
      setProcessPercent(90);
      const resSuggest = await fetch(`${API_BASE}/api/suggestions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resume_text: dataOptimize.optimized_resume_markdown,
          job_description: jobDescription,
        }),
      });
      if (!resSuggest.ok) {
        let errMsg = 'AI suggestions collateral generation encountered an error.';
        try {
          const errData = await resSuggest.json();
          errMsg = errData.detail || errMsg;
        } catch (_) {}
        throw new Error(errMsg);
      }
      const dataSuggest = await resSuggest.json();
      setSuggestionsData(dataSuggest);

      setProcessPercent(100);
      setProcessStep('Analysis complete!');
      
      if (!isPro) {
        const nextCredits = Math.max(0, credits - 1);
        setCredits(nextCredits);
        localStorage.setItem('resume_ai_credits', nextCredits.toString());
      }
      
      showToast('Resume optimized successfully!', 'success');
      setActiveTab('metrics');
    } catch (e: any) {
      showToast(e.message || 'AI processing encountered an error.', 'error');
    } finally {
      setTimeout(() => setIsProcessing(false), 800);
    }
  };

  const handleUpgrade = (planName: string) => {
    setIsPro(true);
    localStorage.setItem('resume_ai_pro_user', 'true');
    showToast(`Successfully upgraded to ${planName}!`, 'success');
  };

  // Step 4: Export PDF/DOCX/LaTeX
  const handleExport = async (format: 'pdf' | 'docx' | 'tex') => {
    if (!optimizedResumeText) return;

    // Pro check for LaTeX features
    if (!isPro && (format === 'tex' || (format === 'pdf' && settings.pdfEngine === 'latex'))) {
      setIsPricingOpen(true);
      showToast(`Exporting as ${format === 'tex' ? 'LaTeX source' : 'LaTeX PDF'} is a Pro feature. Please upgrade to Pro to unlock!`, 'info');
      return;
    }

    showToast(`Compiling ${format.toUpperCase()} document...`, 'info');


    try {
      const res = await fetch(`${API_BASE}/api/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          markdown_text: optimizedResumeText,
          format: format,
          settings: settings,
        }),
      });

      if (!res.ok) {
        let errMsg = `Export failed (HTTP ${res.status})`;
        try {
          const errData = await res.json();
          errMsg = errData.detail || errMsg;
        } catch (_) {}
        throw new Error(errMsg);
      }

      const blob = await res.blob();
      if (blob.size === 0) {
        throw new Error('Server returned an empty file. The export engine may have failed silently.');
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const safeJobTitle = jobTitle.replace(/[^a-zA-Z0-9\s\-_]/g, '').trim().replace(/\s+/g, '_');
      a.download = `${safeJobTitle || 'Job'}_Resume_Optimized.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 150);
      showToast(`${format.toUpperCase()} downloaded successfully!`, 'success');
    } catch (e: any) {
      showToast(`Failed to export as ${format.toUpperCase()}: ${e.message}`, 'error');
    }
  };

  // ----------------------------------------------------
  // Versioning & History Systems
  // ----------------------------------------------------

  const handleSaveVersion = (name: string) => {
    const newVersion: SavedVersion = {
      id: Date.now().toString(),
      name,
      timestamp: new Date().toISOString(),
      jobTitle,
      companyName,
      jobUrl,
      jobDescription,
      originalResumeText,
      optimizedResumeText,
      analysisData,
      suggestionsData,
      settings,
    };

    const updated = [newVersion, ...versions];
    setVersions(updated);
    localStorage.setItem('resume_versions', JSON.stringify(updated));
    showToast(`Resume variant "${name}" saved to history.`, 'success');
  };

  const handleLoadVersion = (version: SavedVersion) => {
    setJobUrl(version.jobUrl);
    setJobTitle(version.jobTitle);
    setCompanyName(version.companyName);
    setJobDescription(version.jobDescription);
    setOriginalResumeText(version.originalResumeText);
    setOptimizedResumeText(version.optimizedResumeText);
    setAnalysisData(version.analysisData);
    setSuggestionsData(version.suggestionsData);
    setSettings(version.settings);
    setSelectedFile(new File([], 'resume_loaded_from_history.pdf'));
    showToast(`Loaded variant: "${version.name}"`, 'info');
    setActiveTab('metrics');
  };

  const handleDeleteVersion = (id: string) => {
    const updated = versions.filter((v) => v.id !== id);
    setVersions(updated);
    localStorage.setItem('resume_versions', JSON.stringify(updated));
    showToast('Version deleted.', 'info');
  };

  const handleRenameVersion = (id: string, newName: string) => {
    const updated = versions.map((v) => (v.id === id ? { ...v, name: newName } : v));
    setVersions(updated);
    localStorage.setItem('resume_versions', JSON.stringify(updated));
    showToast('Version renamed.', 'success');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 transition-colors duration-300">
      
      {/* Toast Notification Container */}
      <div className="fixed top-5 right-3 sm:right-5 z-50 space-y-2 pointer-events-none w-[calc(100vw-1.5rem)] sm:w-auto">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`flex items-center space-x-2.5 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl border shadow-lg text-[11px] sm:text-xs font-semibold max-w-sm pointer-events-auto animate-in slide-in-from-right-5 duration-200 ${
              t.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-250 dark:bg-emerald-950/20 dark:text-emerald-350 dark:border-emerald-900'
                : t.type === 'error'
                ? 'bg-rose-50 text-rose-800 border-rose-250 dark:bg-rose-950/20 dark:text-rose-350 dark:border-rose-900'
                : 'bg-indigo-50 text-indigo-800 border-indigo-250 dark:bg-indigo-950/20 dark:text-indigo-350 dark:border-indigo-900'
            }`}
          >
            {t.type === 'success' && <CheckCircle className="w-4.5 h-4.5 text-emerald-500 shrink-0" />}
            {t.type === 'error' && <AlertTriangle className="w-4.5 h-4.5 text-rose-500 shrink-0" />}
            {t.type === 'info' && <Sparkles className="w-4.5 h-4.5 text-indigo-500 shrink-0" />}
            <span>{t.message}</span>
          </div>
        ))}
      </div>

      {/* Main Grid Page Wrapper */}
      <div className="flex flex-col h-screen">
        
        {/* Sleek Top Header Navigation */}
        <header className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/50 backdrop-blur-md px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5">
            {/* Mobile hamburger */}
            <button
              onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
              className="lg:hidden p-1.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-500 dark:text-slate-400 rounded-lg transition-all cursor-pointer"
              title="Toggle Sidebar"
            >
              {isMobileSidebarOpen ? <X className="w-4.5 h-4.5" /> : <Menu className="w-4.5 h-4.5" />}
            </button>

            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-indigo-650 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 animate-pulse" />
            </div>
            <div>
              <h1 className="text-xs sm:text-sm font-black tracking-tight text-slate-850 dark:text-slate-50 uppercase">ResumeAI</h1>
              <p className="text-[9px] sm:text-[10px] font-semibold text-slate-400 uppercase tracking-widest leading-none hidden sm:block">SaaS Optimizer</p>
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Credits Counter / Plan Badge */}
            <div className="flex items-center space-x-1.5 sm:space-x-2">
              {isPro ? (
                <span className="px-2 sm:px-2.5 py-1 text-[8px] sm:text-[9px] font-black text-indigo-700 dark:text-indigo-350 bg-indigo-500/10 rounded-lg uppercase tracking-wider flex items-center gap-1 animate-pulse">
                  <Sparkles className="w-3 h-3 fill-current" />
                  <span className="hidden sm:inline">Pro Plan</span>
                  <span className="sm:hidden">Pro</span>
                </span>
              ) : (
                <div className="flex items-center space-x-1.5 sm:space-x-2">
                  <span className="text-[9px] sm:text-[10px] font-semibold text-slate-400 uppercase tracking-wider hidden sm:inline">
                    Credits: <strong className="text-slate-600 dark:text-slate-350">{credits}/1 Free</strong>
                  </span>
                  <button
                    onClick={() => setIsPricingOpen(true)}
                    className="px-2 sm:px-2.5 py-1 text-[8px] sm:text-[9px] font-black text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg uppercase tracking-wider cursor-pointer transition-colors shadow-sm"
                  >
                    Upgrade
                  </button>
                </div>
              )}
            </div>

            <span className="h-4 w-px bg-slate-200 dark:bg-slate-850 hidden sm:block" />

            {/* Dark Mode Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-1.5 sm:p-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-500 dark:text-slate-400 rounded-xl transition-all cursor-pointer"
              title="Toggle Theme"
            >
              {darkMode ? <Sun className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-amber-500" /> : <Moon className="w-4 h-4 sm:w-4.5 sm:h-4.5" />}
            </button>
            <span className="h-4 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />
            <div className="hidden sm:flex items-center space-x-1.5 text-xxs font-bold uppercase tracking-wider text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>Production API Active</span>
            </div>
          </div>
        </header>

        {/* Global Progress Bar for AI Processing */}
        {isProcessing && (
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1 shrink-0 overflow-hidden">
            <div 
              className="bg-indigo-600 h-full transition-all duration-500 ease-out" 
              style={{ width: `${processPercent}%` }}
            />
          </div>
        )}

        {/* Body Workspace Grid */}
        <div className="flex-1 flex overflow-hidden relative">
          
          {/* Mobile Sidebar Overlay */}
          {isMobileSidebarOpen && (
            <div
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
              onClick={() => setIsMobileSidebarOpen(false)}
            />
          )}

          {/* Left Sidebar - Configurations & Versions */}
          <aside className={`
            fixed lg:relative inset-y-0 left-0 z-50 lg:z-auto
            w-72 sm:w-80 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 lg:bg-white/50 lg:dark:bg-slate-950/20
            flex flex-col shrink-0 overflow-y-auto p-4 sm:p-5 space-y-6
            transform transition-transform duration-300 ease-in-out
            ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          `}>
            {/* Mobile close button inside sidebar */}
            <div className="flex items-center justify-between lg:hidden mb-2">
              <span className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider">Settings & History</span>
              <button
                onClick={() => setIsMobileSidebarOpen(false)}
                className="p-1.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-500 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Version History Widget */}
            <VersionsHistory
              versions={versions}
              onLoadVersion={(v) => { handleLoadVersion(v); setIsMobileSidebarOpen(false); }}
              onSaveVersion={handleSaveVersion}
              onDeleteVersion={handleDeleteVersion}
              onRenameVersion={handleRenameVersion}
              isSaveDisabled={!optimizedResumeText}
            />

            {/* Dynamic style settings controls */}
            <SettingsPanel
              settings={settings}
              onSettingsChange={setSettings}
              isPro={isPro}
              onUpgradeClick={() => setIsPricingOpen(true)}
            />
          </aside>

          {/* Main content workspace */}
          <main className="flex-1 flex flex-col overflow-y-auto p-3 sm:p-6 md:p-8 space-y-4 sm:space-y-6">
            
            {/* Global step-by-step progress line */}
            <div className="w-full max-w-4xl mx-auto flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 sm:p-4 border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-950/20 backdrop-blur-md rounded-2xl">
              <div className="flex items-center space-x-2 sm:space-x-3 text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 overflow-x-auto scrollbar-hide">
                <span className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center border text-[9px] sm:text-[10px] shrink-0 ${
                  jobDescription && originalResumeText 
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600'
                    : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-600 animate-pulse'
                }`}>
                  1
                </span>
                <span className="whitespace-nowrap">Enter Materials</span>
                <ChevronRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-300 dark:text-slate-700 shrink-0" />
                <span className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center border text-[9px] sm:text-[10px] shrink-0 ${
                  analysisData 
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600'
                    : 'bg-slate-100 dark:bg-slate-850 border-slate-200 dark:border-slate-800'
                }`}>
                  2
                </span>
                <span className="whitespace-nowrap">AI Scorecard</span>
                <ChevronRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-300 dark:text-slate-700 shrink-0" />
                <span className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center border text-[9px] sm:text-[10px] shrink-0 ${
                  optimizedResumeText 
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600'
                    : 'bg-slate-100 dark:bg-slate-850 border-slate-200 dark:border-slate-800'
                }`}>
                  3
                </span>
                <span className="whitespace-nowrap">Diff Comparison</span>
              </div>

              {/* Large central CTA to optimize */}
              <button
                disabled={!jobDescription || !originalResumeText || isProcessing}
                onClick={handleOptimizeResume}
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 sm:py-2 text-xs font-black rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-600 cursor-pointer disabled:cursor-not-allowed shadow-md shadow-indigo-500/10 transition-all w-full sm:w-auto shrink-0"
              >
                <Sparkles className="w-4 h-4 animate-spin-slow" />
                <span>Optimize Resume</span>
              </button>
            </div>

            {/* AI Loading Modal Overlay */}
            {isProcessing && (
              <div className="w-full max-w-4xl mx-auto p-8 border border-indigo-150 dark:border-indigo-950 bg-indigo-500/5 backdrop-blur-sm rounded-2xl text-center space-y-4 animate-pulse">
                <div className="w-12 h-12 rounded-full border-4 border-indigo-200 dark:border-indigo-950 border-t-indigo-600 animate-spin mx-auto" />
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-indigo-700 dark:text-indigo-400">{processStep}</h3>
                  <p className="text-xxs text-slate-500 dark:text-slate-400">Gemini is aligning formatting structure & scoring keyword density.</p>
                </div>
              </div>
            )}

            {/* STEP 1 INPUT PANELS: Render if not yet processed */}
            {!optimizedResumeText && !isProcessing && (
              <div className="w-full max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
                
                {/* SaaS Hero Section */}
                <div className="text-center py-4 sm:py-6 md:py-8 space-y-3">
                  <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900 text-[10px] font-black text-indigo-650 dark:text-indigo-400 uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5 fill-current" />
                    <span>Next-Gen AI Resume ATS Optimizer</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl md:text-3.5xl font-black tracking-tight leading-tight text-slate-850 dark:text-slate-50 max-w-2xl mx-auto px-2">
                    Optimize Your Resume. <br className="hidden sm:inline" />
                    <span className="bg-gradient-to-r from-indigo-600 to-indigo-400 bg-clip-text text-transparent">Beat the ATS. Land the Interview.</span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-lg mx-auto leading-relaxed">
                    Upload your resume, paste a target job description, and let our provider-independent AI engine format, score, and align your experience for maximum suitability.
                  </p>
                  
                  {/* Trust Badge logo strip */}
                  <div className="pt-2.5 flex flex-col items-center space-y-2">
                    <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400">
                      Trusted by candidates at leading companies:
                    </span>
                    <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xxs font-black text-slate-400/80 dark:text-slate-500/80 select-none">
                      <span>GOOGLE</span>
                      <span>STRIPE</span>
                      <span>AIRBNB</span>
                      <span>META</span>
                      <span>MICROSOFT</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Column 1: Job Description Materials */}
                  <div className="border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-950/50 backdrop-blur-md rounded-2xl p-6 space-y-4">
                    <div>
                      <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                        <TrendingUp className="w-4.5 h-4.5 text-indigo-500" />
                        1. Target Job Posting
                      </h3>
                      <p className="text-xxs text-slate-500 dark:text-slate-400">
                        Scrape details automatically or paste manually below
                      </p>
                    </div>

                    <JobURLInput
                      value={jobUrl}
                      onChange={setJobUrl}
                      onScrape={handleScrape}
                      isLoading={isScraping}
                    />

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Job description text</label>
                      <textarea
                        value={jobDescription}
                        onChange={(e) => setJobDescription(e.target.value)}
                        placeholder="Scraped job descriptions or pasted text will appear here..."
                        className="w-full h-48 sm:h-64 p-3 sm:p-4 bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-xs rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none leading-relaxed"
                      />
                    </div>
                  </div>

                  {/* Column 2: Resume File Materials */}
                  <div className="border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-950/50 backdrop-blur-md rounded-2xl p-6 space-y-4">
                    <div>
                      <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                        <FileCheck className="w-4.5 h-4.5 text-emerald-500" />
                        2. Upload Original Resume
                      </h3>
                      <p className="text-xxs text-slate-500 dark:text-slate-400">
                        Drag and drop your PDF or DOCX file to extract contents
                      </p>
                    </div>

                    <DragDropUpload
                      onFileSelect={handleFileSelect}
                      selectedFile={selectedFile}
                      onClear={handleClearFile}
                    />

                    {isParsing && (
                      <div className="flex items-center justify-center space-x-2 py-4 text-xs text-indigo-650">
                        <div className="w-4 h-4 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                        <span>Parsing Document file...</span>
                      </div>
                    )}

                    {originalResumeText && !isParsing && (
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase">
                          <span>Extracted Resume Text preview</span>
                          <span className="text-emerald-600 dark:text-emerald-400">Ready</span>
                        </div>
                        <textarea
                          readOnly
                          value={originalResumeText}
                          className="w-full h-48 sm:h-64 p-3 sm:p-4 bg-slate-55/30 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 text-[10px] font-mono rounded-xl focus:outline-none resize-none leading-relaxed"
                        />
                      </div>
                    )}
                  </div>
                </div>

              </div>
            )}

            {/* RESULTS VIEW PANELS: Render tabs if optimization results exist */}
            {optimizedResumeText && !isProcessing && (
              <div className="w-full max-w-4xl mx-auto space-y-6">
                
                {/* Secondary horizontal panel navigation */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-200 dark:border-slate-850 pb-1.5 gap-2">
                  <div className="flex space-x-3 sm:space-x-4 overflow-x-auto scrollbar-hide w-full sm:w-auto pb-1 sm:pb-0">
                    <button
                      onClick={() => setActiveTab('metrics')}
                      className={`text-[11px] sm:text-xs font-bold pb-2.5 transition-all relative cursor-pointer whitespace-nowrap ${
                        activeTab === 'metrics'
                          ? 'text-indigo-650 dark:text-indigo-400'
                          : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                      }`}
                    >
                      Score & Alignment
                      {activeTab === 'metrics' && (
                        <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400" />
                      )}
                    </button>
                    <button
                      onClick={() => setActiveTab('comparison')}
                      className={`text-[11px] sm:text-xs font-bold pb-2.5 transition-all relative cursor-pointer whitespace-nowrap ${
                        activeTab === 'comparison'
                          ? 'text-indigo-650 dark:text-indigo-400'
                          : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                      }`}
                    >
                      Compare
                      {activeTab === 'comparison' && (
                        <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400" />
                      )}
                    </button>
                    <button
                      onClick={() => setActiveTab('collateral')}
                      className={`text-[11px] sm:text-xs font-bold pb-2.5 transition-all relative cursor-pointer whitespace-nowrap ${
                        activeTab === 'collateral'
                          ? 'text-indigo-650 dark:text-indigo-400'
                          : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                      }`}
                    >
                      Collateral
                      {activeTab === 'collateral' && (
                        <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400" />
                      )}
                    </button>
                    <button
                      onClick={() => setActiveTab('export')}
                      className={`text-[11px] sm:text-xs font-bold pb-2.5 transition-all relative cursor-pointer whitespace-nowrap ${
                        activeTab === 'export'
                          ? 'text-indigo-650 dark:text-indigo-400'
                          : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                      }`}
                    >
                      Export
                      {activeTab === 'export' && (
                        <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400" />
                      )}
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      setOptimizedResumeText('');
                      setAnalysisData(null);
                      setSuggestionsData(null);
                    }}
                    className="text-[11px] sm:text-xs font-semibold text-slate-500 hover:text-rose-500 cursor-pointer shrink-0"
                  >
                    Start New Run
                  </button>
                </div>

                {/* Tab 1: Analysis Scorecard */}
                {activeTab === 'metrics' && (
                  <AnalysisDashboard data={analysisData} />
                )}

                {/* Tab 2: Comparison Side-by-Side Diff */}
                {activeTab === 'comparison' && (
                  <ComparisonView
                    originalText={originalResumeText}
                    optimizedText={optimizedResumeText}
                    changes={changes}
                  />
                )}

                {/* Tab 3: Collateral suggestions (Cover Letter, LinkedIn bio, Recruiter email, Interview Prep) */}
                {activeTab === 'collateral' && (
                  isPro ? (
                    <SuggestionsTabs data={suggestionsData} />
                  ) : (
                    <div className="relative border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-950/50 backdrop-blur-md rounded-2xl p-8 overflow-hidden min-h-[400px] flex flex-col items-center justify-center text-center">
                      {/* Blurred backdrop preview */}
                      <div className="absolute inset-0 filter blur-[6px] opacity-[0.15] select-none pointer-events-none p-6">
                        <div className="text-left space-y-4">
                          <div className="h-4 bg-slate-350 dark:bg-slate-700 w-1/3 rounded" />
                          <div className="h-3 bg-slate-300 dark:bg-slate-800 w-3/4 rounded" />
                          <div className="h-3 bg-slate-300 dark:bg-slate-800 w-5/6 rounded" />
                          <div className="h-3 bg-slate-300 dark:bg-slate-800 w-2/3 rounded" />
                          <div className="h-4 bg-slate-350 dark:bg-slate-700 w-1/4 rounded mt-8" />
                          <div className="h-3 bg-slate-300 dark:bg-slate-800 w-4/5 rounded" />
                        </div>
                      </div>
                      
                      {/* Overlay lock card */}
                      <div className="relative z-10 max-w-sm p-6 bg-white dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-2xl shadow-xl space-y-4">
                        <div className="w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center mx-auto text-indigo-500">
                          <Lock className="w-6 h-6" />
                        </div>
                        <div className="space-y-1">
                          <h3 className="text-sm font-bold text-slate-850 dark:text-slate-200">Unlock Premium Collateral</h3>
                          <p className="text-xxs text-slate-500 dark:text-slate-405 leading-relaxed">
                            Upgrade to Pro to unlock AI-generated Cover Letters, LinkedIn Summaries, Recruiter Outreach templates, and Interview Prep guides tailored to this job.
                          </p>
                        </div>
                        <button
                          onClick={() => setIsPricingOpen(true)}
                          className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition-colors"
                        >
                          Upgrade to Pro & Unlock
                        </button>
                      </div>
                    </div>
                  )
                )}

                {/* Tab 4: Export Panel */}
                {activeTab === 'export' && (
                  <div className="border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-950/50 backdrop-blur-md rounded-2xl p-6 space-y-6">
                    <div>
                      <h3 className="text-sm font-bold text-slate-850 dark:text-slate-100 flex items-center gap-1.5">
                        <Download className="w-4.5 h-4.5 text-indigo-500" />
                        Compile and Export Document
                      </h3>
                      <p className="text-xxs text-slate-500 dark:text-slate-400">
                        Select your preferred export layout parameters and download the completed file
                      </p>
                    </div>

                    {/* Exporter triggers */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 border-t border-slate-100 dark:border-slate-850 pt-5">
                      <button
                        onClick={() => handleExport('pdf')}
                        className="relative flex flex-col items-center justify-center p-6 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-900 hover:bg-slate-50/50 dark:hover:bg-slate-900/50 rounded-xl transition-all cursor-pointer space-y-2 text-center"
                      >
                        {!isPro && settings.pdfEngine === 'latex' && (
                          <span className="absolute top-2.5 right-2.5 flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-650 dark:text-indigo-450 text-[8px] font-black uppercase">
                            <Lock className="w-2.5 h-2.5" />
                            <span>PRO</span>
                          </span>
                        )}
                        <FileText className="w-8 h-8 text-rose-500" />
                        <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                          Download as PDF {!isPro && settings.pdfEngine === 'latex' && '(LaTeX)'}
                        </span>
                        <span className="text-xxs text-slate-500 dark:text-slate-400">
                          {settings.pdfEngine === 'latex' 
                            ? 'Polished typography format compiled using LaTeX engine' 
                            : 'Standard PDF format compiled using ReportLab engine'}
                        </span>
                      </button>

                      <button
                        onClick={() => handleExport('docx')}
                        className="flex flex-col items-center justify-center p-6 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-900 hover:bg-slate-50/50 dark:hover:bg-slate-900/50 rounded-xl transition-all cursor-pointer space-y-2 text-center"
                      >
                        <FileText className="w-8 h-8 text-blue-500" />
                        <span className="text-sm font-bold text-slate-800 dark:text-slate-200">Download as DOCX (MS Word)</span>
                        <span className="text-xxs text-slate-500 dark:text-slate-400">Editable Microsoft Word template, highly customizable margins</span>
                      </button>

                      <button
                        onClick={() => handleExport('tex')}
                        className="relative flex flex-col items-center justify-center p-6 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-900 hover:bg-slate-50/50 dark:hover:bg-slate-900/50 rounded-xl transition-all cursor-pointer space-y-2 text-center"
                      >
                        {!isPro && (
                          <span className="absolute top-2.5 right-2.5 flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-650 dark:text-indigo-455 text-[8px] font-black uppercase">
                            <Lock className="w-2.5 h-2.5" />
                            <span>PRO</span>
                          </span>
                        )}
                        <FileText className="w-8 h-8 text-orange-500" />
                        <span className="text-sm font-bold text-slate-800 dark:text-slate-200">Download LaTeX Code (.tex)</span>
                        <span className="text-xxs text-slate-500 dark:text-slate-400">Download compilable LaTeX source code to use on Overleaf</span>
                      </button>
                    </div>


                    {/* Small layout warning warning */}
                    <div className="p-3 border border-indigo-100 dark:border-indigo-950 bg-indigo-50/20 dark:bg-indigo-950/5 rounded-xl text-xxs text-slate-550 dark:text-slate-400">
                      <strong>Note:</strong> Spacing formatting options (such as compact margins, fonts, and accents colors) are dynamically applied to your PDF output based on the selections made in the styles panel.
                    </div>
                  </div>
                )}

              </div>
            )}
          </main>

        </div>
      </div>

      {/* Pricing Modal */}
      <PricingModal
        isOpen={isPricingOpen}
        onClose={() => setIsPricingOpen(false)}
        onUpgrade={handleUpgrade}
      />
    </div>
  );
}
