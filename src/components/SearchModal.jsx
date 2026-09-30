import React, { useState, useEffect, useRef } from 'react';
import { Search, X, FileText, Calendar, CheckCircle2, ArrowRight, Loader2 } from 'lucide-react';
import { api } from '../api/client';

export function SearchModal({ isOpen, onClose, onSelectDocument }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

  useEffect(() => {
    const q = query.trim();
    if (!q || q.length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.get(`/documents/search?q=${encodeURIComponent(q)}`);
        setResults(res.data.data?.results || []);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  // Highlight matching terms
  const highlightMatch = (text, term) => {
    if (!text || !term) return text;
    const parts = text.split(new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === term.toLowerCase() ? (
        <mark key={i} className="bg-brand-500/40 text-brand-200 px-0.5 rounded font-medium">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        {/* Search Input Bar */}
        <div className="p-4 border-b border-slate-800 flex items-center gap-3 bg-slate-950/60">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search documents by keywords, requirements, dates, or titles..."
            className="flex-1 bg-transparent text-sm sm:text-base text-slate-100 placeholder-slate-500 focus:outline-none"
          />
          {loading && <Loader2 className="w-4 h-4 text-brand-400 animate-spin" />}
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {query.trim().length >= 2 && results.length === 0 && !loading && (
            <div className="text-center py-12 text-slate-400 text-sm">
              No matching documents or text sections found for "{query}".
            </div>
          )}

          {query.trim().length < 2 && (
            <div className="text-center py-8 text-slate-500 text-xs">
              Type at least 2 characters to search across titles, requirements, extracted text, and deadlines.
            </div>
          )}

          {results.map((item) => (
            <div
              key={item.id}
              onClick={() => {
                onSelectDocument(item.id);
                onClose();
              }}
              className="p-4 rounded-2xl bg-slate-950/60 hover:bg-slate-950 border border-slate-800 hover:border-brand-500/40 cursor-pointer transition-all space-y-2 group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-brand-400" />
                  <h4 className="text-sm font-semibold text-slate-200 group-hover:text-brand-300 transition-colors">
                    {highlightMatch(item.title, query)}
                  </h4>
                </div>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                  {item.documentType}
                </span>
              </div>

              {/* Snippet */}
              <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                {highlightMatch(item.snippet, query)}
              </p>

              {/* Extra matched requirements or dates */}
              {item.matchingDates && item.matchingDates.length > 0 && (
                <div className="flex items-center gap-1.5 text-xs text-amber-400/90 pt-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>
                    Matched Date: {highlightMatch(item.matchingDates[0].title, query)} ({item.matchingDates[0].date})
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
