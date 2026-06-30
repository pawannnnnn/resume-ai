'use client';

import React from 'react';
import { Type, Palette, Layout, Settings, FileText, ToggleLeft, Lock } from 'lucide-react';

interface SettingsData {
  font: string;
  color: string;
  layout: string;
  mode: string;
  length: string;
  pdfEngine: string;
}

interface SettingsPanelProps {
  settings: SettingsData;
  onSettingsChange: (newSettings: SettingsData) => void;
  isPro?: boolean;
  onUpgradeClick?: () => void;
}

export default function SettingsPanel({ settings, onSettingsChange, isPro = false, onUpgradeClick }: SettingsPanelProps) {
  const fonts = [
    { name: 'Modern Sans (Helvetica/Arial)', value: 'Helvetica' },
    { name: 'Classic Serif (Times New Roman)', value: 'Times-Roman' },
    { name: 'Technical Mono (Courier)', value: 'Courier' },
  ];

  const colors = [
    { name: 'Indigo', value: '#4F46E5' },
    { name: 'Royal Blue', value: '#2563EB' },
    { name: 'Emerald', value: '#10B981' },
    { name: 'Slate Gray', value: '#0F172A' },
    { name: 'Crimson Red', value: '#DC2626' },
  ];

  const layouts = [
    { name: 'Professional (Standard spacing)', value: 'Professional' },
    { name: 'Minimalist (Wide margins)', value: 'Minimalist' },
    { name: 'Compact (Fit details on page)', value: 'Compact' },
  ];

  const modes = [
    { name: 'ATS Focus (Keyword-dense, structured)', value: 'ATS Mode' },
    { name: 'Creative Focus (Narrative-driven, punchy)', value: 'Creative Mode' },
  ];

  const lengths = [
    { name: 'Keep Original Structure', value: 'Keep Original' },
    { name: 'Strictly One-page', value: 'One-page' },
    { name: 'Strictly Two-pages', value: 'Two-page' },
  ];

  const updateSetting = (key: keyof SettingsData, val: string) => {
    if (key === 'pdfEngine' && val === 'latex' && !isPro) {
      if (onUpgradeClick) onUpgradeClick();
      return;
    }
    onSettingsChange({
      ...settings,
      [key]: val,
    });
  };

  return (
    <div className="w-full border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-950/50 backdrop-blur-md rounded-2xl p-6 space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-850 dark:text-slate-100 flex items-center gap-2">
          <Settings className="w-5 h-5 text-indigo-500" />
          Resume Style & AI Optimization Settings
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Tailor formatting parameters and optimization constraints
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-slate-100 dark:border-slate-850 pt-5">
        
        {/* Left Column: AI Mode settings */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <ToggleLeft className="w-4 h-4 text-indigo-500" />
            AI Processing Options
          </h3>

          {/* AI Optimization Mode */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-350">Optimization Persona</label>
            <select
              value={settings.mode}
              onChange={(e) => updateSetting('mode', e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              {modes.map((m) => (
                <option key={m.value} value={m.value}>{m.name}</option>
              ))}
            </select>
          </div>

          {/* Page Length */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-350">Length Constraint</label>
            <select
              value={settings.length}
              onChange={(e) => updateSetting('length', e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              {lengths.map((l) => (
                <option key={l.value} value={l.value}>{l.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Right Column: Style & PDF layout settings */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Layout className="w-4 h-4 text-emerald-500" />
            Export Document Styling
          </h3>

          {/* Font selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-350">Typography Font Family</label>
            <div className="relative">
              <select
                value={settings.font}
                onChange={(e) => updateSetting('font', e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                {fonts.map((f) => (
                  <option key={f.value} value={f.value}>{f.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Accent Color picker */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-350">Accent Brand Color</label>
            <div className="flex flex-wrap gap-2.5">
              {colors.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => updateSetting('color', c.value)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                    settings.color === c.value
                      ? 'border-slate-800 dark:border-slate-200 bg-slate-100 dark:bg-slate-900'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900'
                  }`}
                >
                  <span
                    className="w-3.5 h-3.5 rounded-full"
                    style={{ backgroundColor: c.value }}
                  />
                  <span>{c.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Spacing Layout theme */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-350">Spacing Density</label>
            <select
              value={settings.layout}
              onChange={(e) => updateSetting('layout', e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              {layouts.map((l) => (
                <option key={l.value} value={l.value}>{l.name}</option>
              ))}
            </select>
          </div>

          {/* PDF Compiler Engine Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-350 flex items-center gap-1.5">
              <span>PDF Compiler Engine</span>
              {!isPro && <Lock className="w-3 h-3 text-indigo-500" />}
            </label>
            <select
              value={settings.pdfEngine || 'reportlab'}
              onChange={(e) => updateSetting('pdfEngine', e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="reportlab">ReportLab Engine (Standard fallback)</option>
              <option value="latex">
                {isPro ? 'LaTeX Engine (Premium formatting)' : 'LaTeX Engine (PRO Feature)'}
              </option>
            </select>
          </div>

        </div>

      </div>
    </div>
  );
}
