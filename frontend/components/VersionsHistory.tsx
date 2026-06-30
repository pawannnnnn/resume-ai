'use client';

import React, { useState } from 'react';
import { History, Save, Edit3, Trash2, ArrowUpRight, FolderOpen, Calendar, HelpCircle } from 'lucide-react';

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

interface VersionsHistoryProps {
  versions: SavedVersion[];
  onLoadVersion: (version: SavedVersion) => void;
  onSaveVersion: (name: string) => void;
  onDeleteVersion: (id: string) => void;
  onRenameVersion: (id: string, newName: string) => void;
  isSaveDisabled: boolean;
}

export default function VersionsHistory({
  versions,
  onLoadVersion,
  onSaveVersion,
  onDeleteVersion,
  onRenameVersion,
  isSaveDisabled,
}: VersionsHistoryProps) {
  const [newVersionName, setNewVersionName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVersionName.trim()) return;
    onSaveVersion(newVersionName.trim());
    setNewVersionName('');
    setIsSaving(false);
  };

  const startEditing = (version: SavedVersion) => {
    setEditingId(version.id);
    setEditName(version.name);
  };

  const saveEdit = (id: string) => {
    if (!editName.trim()) return;
    onRenameVersion(id, editName.trim());
    setEditingId(null);
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString(undefined, { 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch (_) {
      return dateStr;
    }
  };

  return (
    <div className="w-full border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-950/50 backdrop-blur-md rounded-2xl p-6 space-y-5">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-3">
        <div>
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <History className="w-4.5 h-4.5 text-indigo-500" />
            Resume Optimization History
          </h2>
          <p className="text-xxs text-slate-500 dark:text-slate-400">
            Save and switch between different resume variants
          </p>
        </div>

        {/* Quick Save trigger */}
        {!isSaveDisabled && (
          <button
            onClick={() => setIsSaving(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xxs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition-all cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            Save Current
          </button>
        )}
      </div>

      {/* Save Prompt Form */}
      {isSaving && (
        <form onSubmit={handleSave} className="p-3 border border-indigo-150 dark:border-indigo-950 bg-indigo-50/20 dark:bg-indigo-950/5 rounded-xl space-y-2">
          <label className="text-[10px] font-bold text-slate-600 dark:text-slate-450 uppercase block">Save Variant Name</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={newVersionName}
              onChange={(e) => setNewVersionName(e.target.value)}
              placeholder="e.g. Google - Software Engineer"
              className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
              autoFocus
            />
            <button
              type="submit"
              className="px-3 py-1.5 text-xs font-bold rounded-lg bg-indigo-650 text-white cursor-pointer hover:bg-indigo-600"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => setIsSaving(false)}
              className="px-2 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* History List */}
      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
        {versions.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-400 dark:text-slate-500 italic border border-dashed border-slate-200 dark:border-slate-850 rounded-xl">
            No saved versions yet. Optimize a resume and save it here.
          </div>
        ) : (
          versions.map((ver) => (
            <div
              key={ver.id}
              className="group p-4 border border-slate-150 dark:border-slate-850 bg-slate-50/30 dark:bg-slate-900/10 hover:border-indigo-400 dark:hover:border-indigo-900 rounded-xl transition-all duration-300 space-y-2.5"
            >
              <div className="flex items-start justify-between gap-2">
                {/* Version Title (Editable) */}
                <div className="flex-1 min-w-0">
                  {editingId === ver.id ? (
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onBlur={() => saveEdit(ver.id)}
                      onKeyDown={(e) => e.key === 'Enter' && saveEdit(ver.id)}
                      className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                      autoFocus
                    />
                  ) : (
                    <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate flex items-center gap-1">
                      {ver.name}
                      <button
                        onClick={() => startEditing(ver)}
                        className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded transition-all text-slate-400 dark:text-slate-500"
                        title="Rename"
                      >
                        <Edit3 className="w-3 h-3" />
                      </button>
                    </h3>
                  )}
                  {/* Job/Company details */}
                  <p className="text-[10px] text-slate-500 dark:text-slate-450 truncate mt-0.5">
                    {ver.jobTitle} &bull; {ver.companyName}
                  </p>
                </div>

                {/* Score badge */}
                {ver.analysisData?.ats_score && (
                  <span className="text-[10px] font-black px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                    ATS: {ver.analysisData.ats_score}
                  </span>
                )}
              </div>

              {/* Metadata and Actions */}
              <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-850/50 pt-2 text-[10px]">
                <span className="flex items-center gap-1 text-slate-400 dark:text-slate-500">
                  <Calendar className="w-3 h-3" />
                  {formatDate(ver.timestamp)}
                </span>

                <div className="flex items-center space-x-2">
                  {/* Load action */}
                  <button
                    onClick={() => onLoadVersion(ver)}
                    className="flex items-center gap-1 font-bold text-indigo-650 dark:text-indigo-400 hover:underline cursor-pointer"
                  >
                    <FolderOpen className="w-3.5 h-3.5" />
                    Load
                  </button>

                  {/* Delete action */}
                  <button
                    onClick={() => onDeleteVersion(ver.id)}
                    className="font-bold text-rose-650 dark:text-rose-400 hover:underline cursor-pointer flex items-center gap-0.5"
                    title="Delete"
                  >
                    <Trash2 className="w-3 h-3" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
