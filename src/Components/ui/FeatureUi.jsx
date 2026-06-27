import React from "react";

export const LoadingPanel = ({ label = "Loading…" }) => (
  <div className="glass-panel flex min-h-[12rem] items-center justify-center p-8">
    <div className="text-center">
      <div className="loading-spinner mx-auto" />
      <p className="mt-4 text-sm text-slate-400">{label}</p>
    </div>
  </div>
);

export const EmptyState = ({ title = "Nothing here yet", description, action }) => (
  <div className="glass-panel flex flex-col items-center justify-center px-6 py-14 text-center">
    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 text-2xl">
      ◌
    </div>
    <h3 className="text-lg font-semibold text-white">{title}</h3>
    {description && <p className="mt-2 max-w-md text-sm text-slate-400">{description}</p>}
    {action && <div className="mt-5">{action}</div>}
  </div>
);

export const StatCard = ({ label, value, meta, tone = "cyan" }) => {
  const tones = {
    cyan: "text-cyan-300",
    emerald: "text-emerald-300",
    amber: "text-amber-300",
    rose: "text-rose-300",
    violet: "text-violet-300",
  };
  return (
    <div className="glass-card group p-5 transition hover:border-cyan-400/20">
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">{label}</p>
      <p className={`mt-3 text-3xl font-bold ${tones[tone] || tones.cyan}`}>{value}</p>
      {meta && <p className="mt-2 text-xs text-slate-500">{meta}</p>}
    </div>
  );
};

export const StatusBadge = ({ status }) => {
  const map = {
    pending: "bg-amber-400/10 text-amber-200 border-amber-400/20",
    in_review: "bg-sky-400/10 text-sky-200 border-sky-400/20",
    approved: "bg-emerald-400/10 text-emerald-200 border-emerald-400/20",
    rejected: "bg-rose-400/10 text-rose-200 border-rose-400/20",
    resolved: "bg-violet-400/10 text-violet-200 border-violet-400/20",
    critical: "bg-rose-500/15 text-rose-100 border-rose-400/30",
    high: "bg-orange-400/10 text-orange-200 border-orange-400/20",
    medium: "bg-cyan-400/10 text-cyan-200 border-cyan-400/20",
    low: "bg-slate-400/10 text-slate-200 border-slate-400/20",
  };
  const cls = map[String(status).toLowerCase()] || "bg-white/5 text-slate-200 border-white/10";
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${cls}`}>
      {status}
    </span>
  );
};

export const Field = ({ label, children, className = "" }) => (
  <label className={`block ${className}`}>
    {label && <span className="mb-2 block text-xs font-medium uppercase tracking-wider text-slate-400">{label}</span>}
    {children}
  </label>
);

export const inputClass =
  "w-full rounded-xl border border-white/10 bg-slate-900/70 px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400/40 focus:outline-none focus:ring-2 focus:ring-cyan-400/20";

export const selectClass = inputClass;

export const FilterBar = ({ children, onApply, applyLabel = "Apply filters" }) => (
  <div className="glass-panel mb-6 p-4">
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{children}</div>
    {onApply && (
      <button type="button" className="btn btn-primary mt-4 w-full sm:w-auto" onClick={onApply}>
        {applyLabel}
      </button>
    )}
  </div>
);

export const SectionCard = ({ title, subtitle, children, className = "" }) => (
  <div className={`glass-panel p-5 ${className}`}>
    {title && <h3 className="text-base font-semibold text-white">{title}</h3>}
    {subtitle && <p className="mt-1 text-sm text-slate-400">{subtitle}</p>}
    <div className={title || subtitle ? "mt-4" : ""}>{children}</div>
  </div>
);
