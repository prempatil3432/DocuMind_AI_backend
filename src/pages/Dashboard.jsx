import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  CheckCircle2,
  Clock,
  AlertTriangle,
  UploadCloud,
  Sparkles,
  ArrowRight,
  Bookmark,
  Calendar,
  Layers,
  ChevronRight,
  ShieldCheck,
  CheckSquare,
  Loader2
} from 'lucide-react';
import { api } from '../api/client';
import { MetricCard } from '../components/MetricCard';

export function Dashboard({ onOpenUpload }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingSample, setLoadingSample] = useState(false);
  const navigate = useNavigate();

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/documents');
      setData(res.data.data);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleLoadSample = async () => {
    try {
      setLoadingSample(true);
      const res = await api.post('/documents/demo/sample');
      const loadedDoc = res.data.data;
      navigate(`/document/${loadedDoc.id}`);
    } catch (err) {
      console.error('Failed to load sample document:', err);
      alert(err.message || 'Failed to load sample document');
    } finally {
      setLoadingSample(false);
    }
  };

  const handleToggleDashboardAction = async (docId, actionId, currentStatus) => {
    try {
      const nextStatus = currentStatus === 'completed' ? 'pending' : 'completed';
      await api.patch(`/documents/${docId}/actions/${actionId}`, { status: nextStatus });
      fetchDashboardData();
    } catch (err) {
      console.error('Failed to toggle action item:', err);
    }
  };

  const stats = data?.stats || {
    totalDocuments: 0,
    processedCount: 0,
    pendingActionsCount: 0,
    upcomingDeadlinesCount: 0
  };

  const documents = data?.documents || [];
  const upcomingDeadlines = data?.upcomingDeadlines || [];
  const pendingActions = data?.pendingActions || [];

  return (
    <div className="space-y-8 pb-16">
      {/* Hero / Quick Action Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-brand-950/60 border border-slate-800 p-6 sm:p-8 shadow-2xl">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-brand-500/10 text-brand-300 border border-brand-500/20">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Auditable Intelligent Document Processing (IDP)</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-100 tracking-tight leading-tight">
            Turn complex documents into <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-cyan-300">actionable intelligence</span>
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            Extract executive summaries, auditable source citations, smart deadlines, and track compliance requirements through our interactive Action Center.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            {/* 1-Click Demo Mode Button */}
            <button
              onClick={handleLoadSample}
              disabled={loadingSample}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-cyan-600 hover:from-brand-500 hover:to-cyan-500 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-brand-500/20 transition-all hover:scale-[1.02]"
            >
              {loadingSample ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing Live Pipeline...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-cyan-200" />
                  <span>⚡ Try 1-Click Demo Document</span>
                </>
              )}
            </button>

            {/* Custom Upload Button */}
            <button
              onClick={onOpenUpload}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 text-slate-200 text-xs sm:text-sm font-medium border border-slate-700 transition-all"
            >
              <UploadCloud className="w-4 h-4 text-brand-400" />
              <span>Upload Custom PDF / Doc</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Documents"
          value={stats.totalDocuments}
          subtitle="Total uploaded documents"
          icon={FileText}
          badge="Active"
          color="brand"
        />
        <MetricCard
          title="Processed"
          value={stats.processedCount}
          subtitle="100% intelligence pipeline"
          icon={CheckCircle2}
          badge="Analyzed"
          color="emerald"
        />
        <MetricCard
          title="Pending Actions"
          value={stats.pendingActionsCount}
          subtitle="Action Center directives"
          icon={CheckSquare}
          badge="Actionable"
          color="amber"
        />
        <MetricCard
          title="Upcoming Deadlines"
          value={stats.upcomingDeadlinesCount}
          subtitle="Normalized smart deadlines"
          icon={Clock}
          badge="Monitored"
          color="purple"
        />
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 Cols): Recent Documents & Recent AI Insights */}
        <div className="lg:col-span-2 space-y-8">
          {/* Recent Documents */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-brand-400" />
                  Recent Documents
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Click any document to inspect full intelligence dossier.</p>
              </div>
            </div>

            {loading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400 text-xs">
                <Loader2 className="w-6 h-6 animate-spin text-brand-400" />
                <span>Loading your documents...</span>
              </div>
            ) : documents.length === 0 ? (
              <div className="text-center py-12 bg-slate-950/40 rounded-2xl border border-dashed border-slate-800 space-y-3">
                <FileText className="w-10 h-10 text-slate-600 mx-auto" />
                <div>
                  <p className="text-sm font-semibold text-slate-300">No documents yet</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Click "Try 1-Click Demo Document" above or upload your first PDF.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    onClick={() => navigate(`/document/${doc.id}`)}
                    className="p-4 rounded-2xl bg-slate-950/60 hover:bg-slate-950 border border-slate-800 hover:border-brand-500/40 cursor-pointer transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-200 group-hover:text-brand-300 transition-colors truncate">
                          {doc.title}
                        </h4>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                          {doc.document_type || 'General'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-1">
                        {doc.executive_summary || 'Document analyzed successfully.'}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-400 flex-shrink-0">
                      {doc.confidence !== undefined && (
                        <span className="px-2 py-0.5 rounded-md bg-brand-500/10 text-brand-300 text-[11px] font-medium border border-brand-500/20">
                          {doc.confidence}% AI confidence
                        </span>
                      )}
                      <span className="text-slate-500">{doc.page_count} page{doc.page_count !== 1 ? 's' : ''}</span>
                      <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-brand-400 transition-colors" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent AI Insights */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-brand-400" />
              Recent AI Intelligence Highlights
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {documents.slice(0, 2).map((doc, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-brand-300 truncate">{doc.title}</span>
                    <span className="text-[10px] text-slate-500">Auditable</span>
                  </div>
                  <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">
                    {doc.executive_summary}
                  </p>
                  {doc.key_points && doc.key_points.length > 0 && (
                    <div className="pt-1 text-[11px] text-slate-400 flex items-center gap-1.5">
                      <Bookmark className="w-3.5 h-3.5 text-brand-400" />
                      <span className="truncate">Key Point: {doc.key_points[0].point}</span>
                    </div>
                  )}
                </div>
              ))}
              {documents.length === 0 && (
                <div className="col-span-2 text-center py-6 text-xs text-slate-500">
                  AI insights will appear here once a document is processed.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column (1 Col): Deadlines Timeline & Action Items */}
        <div className="space-y-8">
          {/* Upcoming Deadlines */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                Upcoming Deadlines
              </h3>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Smart Detection
              </span>
            </div>

            {upcomingDeadlines.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">
                No deadline found in the document.
              </p>
            ) : (
              <div className="space-y-3">
                {upcomingDeadlines.map((dl, idx) => (
                  <div
                    key={idx}
                    onClick={() => navigate(`/document/${dl.documentId}`)}
                    className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80 hover:border-slate-700 cursor-pointer transition-all space-y-1"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-200 truncate">{dl.title}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          dl.isOverdue
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                        }`}
                      >
                        {dl.relativeDisplay}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate">{dl.documentTitle}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pending Action Items Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-brand-400" />
                Action Center Highlights
              </h3>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Directives
              </span>
            </div>

            {pendingActions.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">
                All action items completed!
              </p>
            ) : (
              <div className="space-y-2.5">
                {pendingActions.map((act, idx) => (
                  <div
                    key={act.id || idx}
                    className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-start gap-2.5"
                  >
                    <button
                      onClick={() => handleToggleDashboardAction(act.document_id, act.id, act.status)}
                      className="mt-0.5 text-slate-500 hover:text-emerald-400 transition-colors flex-shrink-0"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-slate-200 line-clamp-2">{act.task}</p>
                      {act.deadline && act.deadline !== 'No deadline specified' && (
                        <p className="text-[10px] text-amber-400/90 mt-0.5">
                          Deadline: {act.relative_deadline || act.deadline}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
