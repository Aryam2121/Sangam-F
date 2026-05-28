import React, { useCallback } from "react";
import { fetchActivityTimeline } from "../services/sangamApi";
import { useStaleResource } from "../hooks/useStaleResource";

const typeBadge = {
  task: "bg-cyan-400/15 text-cyan-200",
  project: "bg-violet-400/15 text-violet-200",
  resource: "bg-amber-400/15 text-amber-200",
  bid: "bg-emerald-400/15 text-emerald-200",
};

const formatTime = (value) => {
  if (!value) return "Recently";
  const date = new Date(value);
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
};

const ActivityTimeline = ({ limit = 12 }) => {
  const { data: timeline = [], loading } = useStaleResource({
    key: `timeline:${limit}`,
    fetcher: useCallback(() => fetchActivityTimeline({ limit }), [limit]),
    maxAgeMs: 45_000,
    refreshMs: 60_000,
    initialValue: [],
  });

  return (
    <div className="glass-panel p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Activity Timeline</h2>
        <span className="text-xs uppercase tracking-[0.28em] text-slate-400">Live feed</span>
      </div>

      <div className="mt-4 max-h-96 space-y-3 overflow-y-auto custom-scrollbar pr-1">
        {loading &&
          [1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="skeleton h-4 w-2/3" />
              <div className="skeleton mt-2 h-3 w-1/2" />
            </div>
          ))}

        {!loading &&
          timeline.map((item) => (
            <div key={item._id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">{item.title}</p>
                  <p className="mt-1 text-xs text-slate-400">{item.description || "Workspace update"}</p>
                </div>
                <span className={`rounded-full px-2 py-1 text-[10px] uppercase ${typeBadge[item.entityType] || "bg-white/10 text-slate-200"}`}>
                  {item.entityType}
                </span>
              </div>
              <p className="mt-3 text-[11px] text-slate-500">
                {item.actorName || "System"} · {formatTime(item.createdAt)}
              </p>
            </div>
          ))}

        {!loading && timeline.length === 0 && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-400">
            No recent activity yet.
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityTimeline;
