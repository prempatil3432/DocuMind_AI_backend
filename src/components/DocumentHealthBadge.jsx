import React from 'react';
import { ShieldCheck, AlertTriangle, FileText, CheckCircle2, HelpCircle } from 'lucide-react';

export function DocumentHealthBadge({ healthStatus, confidence, confidenceLabel }) {
  if (!healthStatus) return null;

  const isQualityGood = healthStatus.quality === 'Good';
  const isTextAvailable = healthStatus.textStatus?.includes('Available');
  const isAnalysisComplete = healthStatus.analysis === 'Complete';
  const missingCount = healthStatus.missingCount || 0;

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-brand-400" />
          <h4 className="text-sm font-semibold text-slate-200">Document Health & Reliability</h4>
        </div>
        {confidence !== undefined && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-brand-500/10 text-brand-400 border border-brand-500/20">
            <span>{confidence}%</span>
            <span className="text-slate-400 font-normal">({confidenceLabel || 'AI confidence estimate'})</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        {/* Document Quality */}
        <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/60">
          <span className="text-slate-400 block mb-1">Document Quality</span>
          <div className="flex items-center gap-1.5 font-medium">
            {isQualityGood ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-300">Good</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-amber-300">Limited</span>
              </>
            )}
          </div>
        </div>

        {/* Extracted Text */}
        <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/60">
          <span className="text-slate-400 block mb-1">Extracted Text</span>
          <div className="flex items-center gap-1.5 font-medium">
            <FileText className={`w-3.5 h-3.5 ${isTextAvailable ? 'text-emerald-400' : 'text-amber-400'}`} />
            <span className={isTextAvailable ? 'text-emerald-300' : 'text-amber-300'}>
              {healthStatus.textStatus || 'Available'}
            </span>
          </div>
        </div>

        {/* AI Analysis */}
        <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/60">
          <span className="text-slate-400 block mb-1">AI Analysis</span>
          <div className="flex items-center gap-1.5 font-medium">
            {isAnalysisComplete ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-300">Complete</span>
              </>
            ) : (
              <>
                <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-amber-300">Partial</span>
              </>
            )}
          </div>
        </div>

        {/* Missing Information */}
        <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/60">
          <span className="text-slate-400 block mb-1">Missing Information</span>
          <div className="flex items-center gap-1.5 font-medium">
            <span className={missingCount === 0 ? 'text-emerald-300' : 'text-amber-300'}>
              {missingCount} item{missingCount !== 1 ? 's' : ''} detected
            </span>
          </div>
        </div>
      </div>

      {healthStatus.warning && (
        <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-300 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <span>{healthStatus.warning}</span>
        </div>
      )}
    </div>
  );
}
