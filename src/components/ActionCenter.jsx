import React, { useState } from 'react';
import { CheckCircle2, Circle, Clock, AlertCircle, Bookmark, CheckSquare } from 'lucide-react';

export function ActionCenter({ documentId, actionItems = [], onToggleAction }) {
  const [filter, setFilter] = useState('all'); // all, pending, completed
  const [togglingId, setTogglingId] = useState(null);

  const handleToggle = async (actionId, currentStatus) => {
    try {
      setTogglingId(actionId);
      const nextStatus = currentStatus === 'completed' ? 'pending' : 'completed';
      await onToggleAction(actionId, nextStatus);
    } catch (err) {
      console.error('Failed to toggle action item:', err);
    } finally {
      setTogglingId(null);
    }
  };

  const filteredItems = actionItems.filter(item => {
    if (filter === 'pending') return item.status === 'pending';
    if (filter === 'completed') return item.status === 'completed';
    return true;
  });

  const pendingCount = actionItems.filter(i => i.status === 'pending').length;
  const completedCount = actionItems.filter(i => i.status === 'completed').length;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-brand-500/10 text-brand-400 rounded-xl border border-brand-500/20">
              <CheckSquare className="w-5 h-5" />
            </span>
            <h3 className="text-lg font-bold text-slate-100">Action Center</h3>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-500/20 text-brand-300">
              {pendingCount} Pending
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Turn extracted document intelligence into trackable, auditable execution tasks.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg transition-all ${filter === 'all' ? 'bg-slate-800 text-slate-100 font-medium' : 'text-slate-400 hover:text-slate-200'}`}
          >
            All ({actionItems.length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-3 py-1.5 rounded-lg transition-all ${filter === 'pending' ? 'bg-amber-500/20 text-amber-300 font-medium' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Pending ({pendingCount})
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-3 py-1.5 rounded-lg transition-all ${filter === 'completed' ? 'bg-emerald-500/20 text-emerald-300 font-medium' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Completed ({completedCount})
          </button>
        </div>
      </div>

      {/* Action Items List */}
      <div className="space-y-3">
        {filteredItems.length === 0 ? (
          <div className="text-center py-10 bg-slate-950/40 rounded-xl border border-dashed border-slate-800">
            <CheckCircle2 className="w-10 h-10 text-emerald-500/40 mx-auto mb-2" />
            <p className="text-sm text-slate-400">No action items in this filter.</p>
          </div>
        ) : (
          filteredItems.map((action, idx) => {
            const isCompleted = action.status === 'completed';
            const isToggling = togglingId === action.id;

            return (
              <div
                key={action.id || idx}
                className={`group p-4 rounded-xl border transition-all flex items-start gap-3.5 ${
                  isCompleted
                    ? 'bg-slate-950/40 border-slate-800/60 opacity-70'
                    : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Interactive Checkbox */}
                <button
                  type="button"
                  disabled={isToggling}
                  onClick={() => handleToggle(action.id, action.status)}
                  className="mt-0.5 text-slate-400 hover:text-brand-400 transition-colors focus:outline-none flex-shrink-0"
                  title={isCompleted ? 'Mark Pending' : 'Mark Completed'}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 fill-emerald-500/20" />
                  ) : (
                    <Circle className="w-5 h-5 text-slate-500 hover:text-brand-400" />
                  )}
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className={`text-sm font-medium ${isCompleted ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                      {action.task}
                    </p>

                    {/* Priority Badge */}
                    {action.priority && (
                      <span
                        className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${
                          action.priority === 'high'
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            : action.priority === 'medium'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-slate-700/30 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {action.priority}
                      </span>
                    )}
                  </div>

                  {/* Metadata: Deadline & Source Citation */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                    {action.deadline && action.deadline !== 'No deadline specified' && (
                      <span className="flex items-center gap-1 text-amber-400/90 font-medium">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Deadline: {action.relative_deadline || action.deadline}</span>
                      </span>
                    )}

                    {action.source_reference && (
                      <span className="flex items-center gap-1 text-slate-400">
                        <Bookmark className="w-3.5 h-3.5 text-brand-400" />
                        <span>Source: {action.source_reference}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
