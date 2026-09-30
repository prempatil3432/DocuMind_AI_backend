import React from 'react';

export function MetricCard({ title, value, subtitle, icon: Icon, badge, color = 'brand' }) {
  const colorStyles = {
    brand: {
      iconBg: 'bg-brand-500/10 text-brand-400 border-brand-500/20',
      badge: 'bg-brand-500/10 text-brand-300 border-brand-500/20'
    },
    amber: {
      iconBg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      badge: 'bg-amber-500/10 text-amber-300 border-amber-500/20'
    },
    emerald: {
      iconBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      badge: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
    },
    purple: {
      iconBg: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      badge: 'bg-purple-500/10 text-purple-300 border-purple-500/20'
    }
  }[color] || {
    iconBg: 'bg-brand-500/10 text-brand-400 border-brand-500/20',
    badge: 'bg-brand-500/10 text-brand-300 border-brand-500/20'
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3 glass-card-hover">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{title}</span>
        {Icon && (
          <div className={`p-2 rounded-xl border ${colorStyles.iconBg}`}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="flex items-baseline justify-between">
        <h3 className="text-2xl font-extrabold text-slate-100">{value}</h3>
        {badge && (
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${colorStyles.badge}`}>
            {badge}
          </span>
        )}
      </div>

      {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
    </div>
  );
}
