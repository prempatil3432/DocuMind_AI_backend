import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Bookmark, Loader2, Sparkles, Copy, Check } from 'lucide-react';
import { api } from '../api/client';

export function GroundedChat({ documentId, documentTitle }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState(null);
  const chatEndRef = useRef(null);

  const suggestedQuestions = [
    'What are the mandatory eligibility criteria?',
    'What are the critical deadlines and submission dates?',
    'What documents and affidavits must be uploaded?',
    'Are there any penalties or disqualification risks?'
  ];

  useEffect(() => {
    if (documentId) {
      api.get(`/documents/${documentId}/chat`)
        .then(res => {
          if (Array.isArray(res.data.data)) {
            setMessages(res.data.data);
          }
        })
        .catch(err => console.error('Failed to load chat history:', err));
    }
  }, [documentId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (questionText) => {
    const q = (questionText || input).trim();
    if (!q || loading) return;

    setInput('');
    // Optimistic user message
    const tempUserMsg = {
      id: `temp_${Date.now()}`,
      role: 'user',
      content: q,
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempUserMsg]);
    setLoading(true);

    try {
      const res = await api.post(`/documents/${documentId}/chat`, { question: q });
      if (res.data.data) {
        setMessages(prev => [...prev.filter(m => m.id !== tempUserMsg.id), tempUserMsg, res.data.data]);
      }
    } catch (err) {
      const errorMsg = {
        id: `err_${Date.now()}`,
        role: 'assistant',
        content: err.message || "I couldn't find this information in the uploaded document.",
        isError: true,
        created_at: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl flex flex-col h-[650px] shadow-xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-brand-500/10 text-brand-400 border border-brand-500/20">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              Document-Grounded AI Assistant
              <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Auditable Grounding
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Answers are strictly limited to the content of "{documentTitle}".
            </p>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
            <div className="p-4 rounded-2xl bg-brand-500/5 border border-brand-500/10 text-brand-400">
              <Sparkles className="w-8 h-8" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-200">Grounded Intelligence Active</h4>
              <p className="text-xs text-slate-400 max-w-sm mt-1">
                Ask specific questions about dates, eligibility criteria, required documents, or obligations. Answers include verified source citations.
              </p>
            </div>

            {/* Quick Prompts */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-lg w-full text-left pt-2">
              {suggestedQuestions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(q)}
                  className="p-2.5 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 hover:text-brand-300 text-left transition-all line-clamp-2"
                >
                  "{q}"
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isUser = msg.role === 'user';
            const citations = msg.source_references || msg.sourceReferences || [];

            return (
              <div
                key={msg.id || idx}
                className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed space-y-2 ${
                    isUser
                      ? 'bg-brand-600 text-white rounded-tr-none'
                      : 'bg-slate-950/90 text-slate-200 border border-slate-800 rounded-tl-none'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>

                  {/* Citations block */}
                  {!isUser && citations.length > 0 && (
                    <div className="pt-2 border-t border-slate-800/80 space-y-1">
                      <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                        <Bookmark className="w-3 h-3 text-brand-400" />
                        Verified Sources:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {citations.map((c, cIdx) => (
                          <span
                            key={cIdx}
                            className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-[11px] text-brand-300"
                          >
                            {c.sourceText || `Page ${c.page || 1} • ${c.section || 'Document'}`}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {!isUser && (
                    <div className="flex justify-end pt-1">
                      <button
                        onClick={() => copyToClipboard(msg.content, idx)}
                        className="text-slate-400 hover:text-slate-200 transition-colors p-1"
                        title="Copy answer"
                      >
                        {copiedIdx === idx ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  )}
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })
        )}

        {loading && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-400 flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-slate-950/90 border border-slate-800 rounded-2xl rounded-tl-none p-4 flex items-center gap-2 text-xs text-slate-400">
              <Loader2 className="w-4 h-4 animate-spin text-brand-400" />
              <span>Analyzing document context and verifying citations...</span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input Box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="p-3 border-t border-slate-800 bg-slate-950/80 flex items-center gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a grounded question about this document..."
          disabled={loading}
          className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-colors"
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-50 disabled:hover:bg-brand-600 text-white text-xs sm:text-sm font-medium flex items-center gap-1.5 transition-all shadow-lg shadow-brand-600/20"
        >
          <span>Send</span>
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
}
