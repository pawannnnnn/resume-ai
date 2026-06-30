'use client';

import React, { useState, useRef } from 'react';
import { Upload, FileText, X, AlertTriangle } from 'lucide-react';

interface DragDropUploadProps {
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
  onClear: () => void;
}

export default function DragDropUpload({ onFileSelect, selectedFile, onClear }: DragDropUploadProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): boolean => {
    const validExtensions = ['pdf', 'docx'];
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    
    if (!fileExtension || !validExtensions.includes(fileExtension)) {
      setError('Unsupported file type. Please upload a PDF or DOCX file.');
      return false;
    }
    
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setError('File is too large. Maximum file size is 5MB.');
      return false;
    }
    
    setError(null);
    return true;
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (validateFile(file)) {
        onFileSelect(file);
      }
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (validateFile(file)) {
        onFileSelect(file);
      }
    }
  };

  const onButtonClick = () => {
    fileInputRef.current?.click();
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="w-full">
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept=".pdf,.docx"
        onChange={handleFileInputChange}
      />

      {!selectedFile ? (
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={onButtonClick}
          className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-8 cursor-pointer transition-all duration-300 ${
            isDragActive
              ? 'border-indigo-500 bg-indigo-50/30 dark:bg-indigo-950/20'
              : 'border-slate-300 dark:border-slate-700 hover:border-indigo-400 hover:bg-slate-50/50 dark:hover:bg-slate-900/50'
          }`}
        >
          <div className="p-4 bg-indigo-50 dark:bg-indigo-950/30 rounded-full text-indigo-500 mb-4 transition-transform hover:scale-105">
            <Upload className="w-8 h-8" />
          </div>
          <p className="text-sm font-medium text-slate-800 dark:text-slate-200 text-center mb-1">
            Drag and drop your resume here, or <span className="text-indigo-600 dark:text-indigo-400 font-semibold underline">browse</span>
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
            Supports PDF and DOCX (Max 5MB)
          </p>
        </div>
      ) : (
        <div className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 rounded-xl">
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="p-2.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                {selectedFile.name}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {formatFileSize(selectedFile.size)}
              </p>
            </div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClear();
            }}
            className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-rose-500 rounded-full transition-colors"
            title="Remove file"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="mt-3 flex items-start space-x-2 text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/20 p-3 rounded-lg border border-rose-100 dark:border-rose-950/50">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
