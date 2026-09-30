import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FileText, Search, UploadCloud, LogOut, Sparkles, Shield, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function Navbar({ onOpenUpload, onOpenSearch }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-brand-400 flex items-center justify-center shadow-lg shadow-brand-500/25 group-hover:scale-105 transition-transform">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-base font-extrabold tracking-tight text-slate-100 flex items-center gap-1.5">
              DocuMind <span className="text-brand-400">AI</span>
            </span>
            <span className="hidden sm:block text-[10px] text-slate-400 font-medium -mt-1 tracking-wide">
              Document Intelligence Platform
            </span>
          </div>
        </Link>

        {/* Global Search Bar Trigger */}
        <button
          onClick={onOpenSearch}
          className="flex-1 max-w-md hidden md:flex items-center justify-between px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs text-slate-400 transition-all shadow-inner"
        >
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-slate-400" />
            <span>Search documents, requirements, dates...</span>
          </div>
          <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] text-slate-400 font-mono">
            ⌘K
          </kbd>
        </button>

        {/* Actions & User Profile */}
        <div className="flex items-center gap-3">
          {/* Mobile search trigger */}
          <button
            onClick={onOpenSearch}
            className="md:hidden p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Upload Button */}
          <button
            onClick={onOpenUpload}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-lg shadow-brand-600/20 transition-all hover:scale-[1.02]"
          >
            <UploadCloud className="w-4 h-4" />
            <span className="hidden sm:inline">Upload Document</span>
          </button>

          {/* User info */}
          {user && (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
              <div className="hidden lg:block text-right">
                <p className="text-xs font-semibold text-slate-200">{user.name}</p>
                <p className="text-[10px] text-slate-400">{user.email}</p>
              </div>

              {user.isDemo && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Demo Active
                </span>
              )}

              <button
                onClick={handleLogout}
                title="Sign out"
                className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
