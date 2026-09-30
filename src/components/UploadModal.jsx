import React, { useState, useRef } from 'react';
import { UploadCloud, CheckCircle2, AlertCircle, RefreshCw, X, FileText, ArrowRight, Loader2 } from 'lucide-react';
import { api } from '../api/client';

const PIPELINE_STEPS = [
  { id: 'uploading', label: 'Uploading document' },
  { id: 'extracting', label: 'Extracting & cleaning text' },
  { id: 'analyzing', label: 'Analyzing structure with AI' },
  { id: 'insights', label: 'Extracting actionable insights' },
  { id: 'saving', label: 'Saving to database' },
  { id: 'completed', label: 'Completed' }
];

export function UploadModal({ isOpen, onClose, onUploadSuccess }) {
  const [file, setFile] = useState(null);
  const [currentStep, setCurrentStep] = useState(null); // null, 'uploading', 'extracting', ...
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      setError(null);
    }
  };

  const executePipeline = async () => {
    if (!file) return;

    setIsProcessing(true);
    setError(null);

    // Step 1: Uploading
    setCurrentStep('uploading');

    const formData = new FormData();
    formData.append('file', file);

    try {
      // Simulate pipeline progression visual steps for smooth UX during fast processing
      const stepTimer1 = setTimeout(() => setCurrentStep('extracting'), 500);
      const stepTimer2 = setTimeout(() => setCurrentStep('analyzing'), 1200);
      const stepTimer3 = setTimeout(() => setCurrentStep('insights'), 2000);
      const stepTimer4 = setTimeout(() => setCurrentStep('saving'), 2800);

      const res = await api.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      clearTimeout(stepTimer3);
      clearTimeout(stepTimer4);

      setCurrentStep('completed');
      setTimeout(() => {
        setIsProcessing(false);
        onUploadSuccess(res.data.data);
        onClose();
      }, 800);
    } catch (err) {
      setIsProcessing(false);
      setError(err.message || 'Processing failed. Please check the document format and try again.');
    }
  };

  const handleRetry = () => {
    setError(null);
    setCurrentStep(null);
    executePipeline();
  };

  const getStepStatus = (stepId) => {
    if (!currentStep) return 'idle';
    const stepOrder = ['uploading', 'extracting', 'analyzing', 'insights', 'saving', 'completed'];
    const curIdx = stepOrder.indexOf(currentStep);
    const targetIdx = stepOrder.indexOf(stepId);

    if (error && curIdx === targetIdx) return 'error';
    if (targetIdx < curIdx || currentStep === 'completed') return 'done';
    if (targetIdx === curIdx) return 'active';
    return 'idle';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-brand-500/10 text-brand-400 rounded-xl border border-brand-500/20">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">Upload & Analyze Document</h3>
              <p className="text-xs text-slate-400">PDF, TXT, or MD documents up to 10MB</p>
            </div>
          </div>
          {!isProcessing && (
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {!isProcessing && !error ? (
            /* Dropzone */
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-700 hover:border-brand-500/60 rounded-2xl p-8 text-center cursor-pointer transition-all bg-slate-950/40 hover:bg-slate-950/80 group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.txt,.md"
                onChange={handleFileChange}
                className="hidden"
              />
              <UploadCloud className="w-12 h-12 text-slate-500 group-hover:text-brand-400 mx-auto mb-3 transition-colors" />
              {file ? (
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-brand-300">{file.name}</p>
                  <p className="text-xs text-slate-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="text-sm font-medium text-slate-200">
                    Click to browse or drag and drop your document
                  </p>
                  <p className="text-xs text-slate-500">
                    Supports smart deadlines, action center extraction, and grounded citations
                  </p>
                </div>
              )}
            </div>
          ) : (
            /* Pipeline Stepper */
            <div className="space-y-4 py-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Processing Pipeline Status
              </h4>
              <div className="space-y-3">
                {PIPELINE_STEPS.map((step) => {
                  const status = getStepStatus(step.id);

                  return (
                    <div
                      key={step.id}
                      className={`flex items-center justify-between p-3 rounded-xl border text-xs font-medium transition-all ${
                        status === 'done'
                          ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-300'
                          : status === 'active'
                          ? 'bg-brand-500/10 border-brand-500/30 text-brand-300 animate-pulse-subtle'
                          : status === 'error'
                          ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                          : 'bg-slate-950/40 border-slate-800 text-slate-500'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        {status === 'done' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                        {status === 'active' && <Loader2 className="w-4 h-4 text-brand-400 animate-spin" />}
                        {status === 'error' && <AlertCircle className="w-4 h-4 text-rose-400" />}
                        {status === 'idle' && <div className="w-4 h-4 rounded-full border border-slate-700" />}
                        <span>{step.label}</span>
                      </div>

                      <span className="text-[11px] capitalize">
                        {status === 'done' ? 'Completed' : status === 'active' ? 'In Progress' : status === 'error' ? 'Failed' : 'Pending'}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Error Message & Retry */}
              {error && (
                <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl space-y-3">
                  <div className="flex items-start gap-2.5">
                    <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h5 className="text-xs font-bold text-rose-300">Processing Failed</h5>
                      <p className="text-xs text-rose-200/80 mt-0.5">{error}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleRetry}
                    className="w-full py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-lg"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Retry Pipeline</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {!isProcessing && !error && (
          <div className="p-6 border-t border-slate-800 bg-slate-950/40 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!file}
              onClick={executePipeline}
              className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-lg shadow-brand-600/20"
            >
              <span>Start Processing</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
