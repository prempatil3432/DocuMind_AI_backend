import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FileText,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Bookmark,
  Shield,
  Trash2,
  ArrowLeft,
  Search,
  MessageSquare,
  CheckSquare,
  Sparkles,
  Layers,
  HelpCircle,
  Loader2
} from 'lucide-react';
import { api } from '../api/client';
import { DocumentHealthBadge } from '../components/DocumentHealthBadge';
import { ActionCenter } from '../components/ActionCenter';
import { GroundedChat } from '../components/GroundedChat';

export function DocumentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('actions'); // 'actions', 'insights', 'chat', 'chunks'
  const [chunkSearch, setChunkSearch] = useState('');
  const [deleting, setDeleting] = useState(false);

  const fetchDocument = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/documents/${id}`);
      setDoc(res.data.data);
    } catch (err) {
      console.error('Failed to load document:', err);
      alert(err.message || 'Document not found.');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchDocument();
    }
  }, [id]);

  const handleToggleAction = async (actionId, newStatus) => {
    const res = await api.patch(`/documents/${id}/actions/${actionId}`, { status: newStatus });
    if (res.data.data) {
      setDoc(prev => ({
        ...prev,
        action_items: prev.action_items.map(a => a.id === actionId ? res.data.data : a)
      }));
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete "${doc.title}"?`)) return;
    try {
      setDeleting(true);
      await api.delete(`/documents/${id}`);
      navigate('/');
    } catch (err) {
      alert(err.message || 'Failed to delete document');
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400 text-sm">
        <Loader2 className="w-8 h-8 animate-spin text-brand-400" />
        <span>Loading document intelligence dossier...</span>
      </div>
    );
  }

  if (!doc) return null;

  const keyPoints = doc.key_points || [];
  const importantDates = doc.important_dates || [];
  const requirements = doc.requirements || [];
  const entities = doc.entities || [];
  const risks = doc.risks || [];
  const missingInfo = doc.missing_information || [];
  const decisions = doc.decisions || [];

  return (
    <div className="space-y-6 pb-20">
      {/* Top Navigation & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-medium border border-rose-500/20 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{deleting ? 'Deleting...' : 'Delete Document'}</span>
          </button>
        </div>
      </div>

      {/* Document Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          <div className="space-y-3 flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-brand-500/10 text-brand-300 border border-brand-500/20">
                {doc.document_type || 'General Document'}
              </span>
              <span className="text-xs text-slate-500">
                {doc.page_count} page{doc.page_count !== 1 ? 's' : ''} • {doc.word_count || 0} words
              </span>
              <span className="text-xs text-slate-500">
                Uploaded: {new Date(doc.created_at).toLocaleDateString()}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight">
              {doc.title}
            </h1>

            {/* Executive Summary */}
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-brand-400">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Executive Summary</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {doc.executive_summary}
              </p>
            </div>
          </div>

          {/* Health & Reliability Card */}
          <div className="w-full lg:w-96 flex-shrink-0">
            <DocumentHealthBadge
              healthStatus={doc.health_status}
              confidence={doc.confidence}
              confidenceLabel={doc.confidence_label}
            />
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex overflow-x-auto gap-2 border-t border-slate-800/80 pt-5 text-xs font-medium">
          <button
            onClick={() => setActiveTab('actions')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all flex-shrink-0 ${
              activeTab === 'actions'
                ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/20 font-semibold'
                : 'bg-slate-950/60 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <CheckSquare className="w-4 h-4" />
            <span>Action Center ({doc.action_items?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('insights')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all flex-shrink-0 ${
              activeTab === 'insights'
                ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/20 font-semibold'
                : 'bg-slate-950/60 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Document Intelligence Dossier</span>
          </button>

          <button
            onClick={() => setActiveTab('chat')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all flex-shrink-0 ${
              activeTab === 'chat'
                ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/20 font-semibold'
                : 'bg-slate-950/60 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Grounded AI Chat & Citations</span>
          </button>

          <button
            onClick={() => setActiveTab('chunks')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all flex-shrink-0 ${
              activeTab === 'chunks'
                ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/20 font-semibold'
                : 'bg-slate-950/60 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Raw Text & In-Doc Search</span>
          </button>
        </div>
      </div>

      {/* Tab Panels */}
      {activeTab === 'actions' && (
        <ActionCenter
          documentId={doc.id}
          actionItems={doc.action_items || []}
          onToggleAction={handleToggleAction}
        />
      )}

      {activeTab === 'insights' && (
        <div className="space-y-6">
          {/* Key Dates & Deadlines */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-amber-400" />
              Smart Deadlines & Milestones
            </h3>
            {importantDates.length === 0 ? (
              <p className="text-xs text-slate-500">No deadline found in the document.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {importantDates.map((d, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-200 truncate">{d.title}</span>
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                        {d.type || 'Date'}
                      </span>
                    </div>
                    <p className="text-sm font-bold text-amber-400">{d.date}</p>
                    {d.source && (
                      <p className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Bookmark className="w-3 h-3 text-brand-400" />
                        <span>Source: {d.source}</span>
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Key Points & Requirements */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Key Points */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Bookmark className="w-5 h-5 text-brand-400" />
                Key Points
              </h3>
              <div className="space-y-3">
                {keyPoints.map((kp, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-1">
                    <p className="text-xs sm:text-sm text-slate-200">{kp.point || kp}</p>
                    {kp.source && (
                      <p className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Bookmark className="w-3 h-3 text-brand-400" />
                        <span>Source: {kp.source}</span>
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Mandatory Requirements */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                Mandatory Requirements
              </h3>
              <div className="space-y-3">
                {requirements.map((req, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs sm:text-sm text-slate-200">{req.requirement || req}</p>
                      {req.mandatory && (
                        <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 flex-shrink-0">
                          Mandatory
                        </span>
                      )}
                    </div>
                    {req.source && (
                      <p className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Bookmark className="w-3 h-3 text-brand-400" />
                        <span>Source: {req.source}</span>
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Risks & Missing Information */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Risks */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
                Identified Compliance & Execution Risks
              </h3>
              <div className="space-y-3">
                {risks.map((r, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-xs sm:text-sm text-slate-200">{r.risk || r}</p>
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
                        {r.severity || 'Medium'} Severity
                      </span>
                    </div>
                    {r.source && (
                      <p className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Bookmark className="w-3 h-3 text-brand-400" />
                        <span>Source: {r.source}</span>
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Missing Information & Entities */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2 mb-3">
                  <HelpCircle className="w-5 h-5 text-amber-400" />
                  Missing Information & Gaps
                </h3>
                {missingInfo.length === 0 ? (
                  <p className="text-xs text-emerald-400/90 bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl">
                    No obvious omissions or missing critical details identified.
                  </p>
                ) : (
                  <ul className="space-y-2 text-xs text-slate-300">
                    {missingInfo.map((item, idx) => (
                      <li key={idx} className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Extracted Entities */}
              {entities.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Key Entities & Monetary Values
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {entities.map((e, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 flex items-center gap-1.5"
                      >
                        <span className="font-semibold text-brand-300">{e.name}</span>
                        <span className="text-[10px] text-slate-500">({e.category})</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'chat' && (
        <GroundedChat documentId={doc.id} documentTitle={doc.title} />
      )}

      {activeTab === 'chunks' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Layers className="w-5 h-5 text-brand-400" />
                Raw Extracted Text & In-Document Search
              </h3>
              <p className="text-xs text-slate-400">Search and audit raw text extracted from the document.</p>
            </div>
            <div className="relative max-w-xs w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={chunkSearch}
                onChange={(e) => setChunkSearch(e.target.value)}
                placeholder="Search raw text..."
                className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          <div className="bg-slate-950/80 rounded-xl p-4 border border-slate-800 font-mono text-xs text-slate-300 whitespace-pre-wrap max-h-[600px] overflow-y-auto leading-relaxed">
            {chunkSearch.trim() ? (
              doc.text_content
                .split('\n')
                .filter(l => l.toLowerCase().includes(chunkSearch.toLowerCase()))
                .join('\n') || 'No lines match your search query.'
            ) : (
              doc.text_content
            )}
          </div>
        </div>
      )}
    </div>
  );
}
