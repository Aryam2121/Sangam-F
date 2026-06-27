import React, { useCallback, useState } from "react";
import { fetchAuditTrail, fetchAuditStats } from "../services/sangamApi";
import { useStaleResource } from "../hooks/useStaleResource";
import PageHeader from "../Components/ui/PageHeader";
import {
  EmptyState,
  Field,
  FilterBar,
  LoadingPanel,
  SectionCard,
  StatCard,
  selectClass,
  inputClass,
} from "../Components/ui/FeatureUi";
import { useI18n } from "../context/I18nContext";

const AuditTrailPage = () => {
  const { t } = useI18n();
  const [filters, setFilters] = useState({ entityType: "", action: "", limit: "50" });

  const trailFetcher = useCallback(
    () => fetchAuditTrail({ ...filters, limit: filters.limit || 50 }),
    [filters]
  );
  const statsFetcher = useCallback(() => fetchAuditStats(), []);

  const { data: trailData, loading, refresh } = useStaleResource({
    key: `audit:${JSON.stringify(filters)}`,
    fetcher: trailFetcher,
    maxAgeMs: 30_000,
    initialValue: { audit: [] },
  });

  const { data: stats } = useStaleResource({
    key: "audit-stats",
    fetcher: statsFetcher,
    maxAgeMs: 60_000,
    initialValue: null,
  });

  const audit = trailData?.audit || [];

  return (
    <div className="page pb-10">
      <PageHeader title={t("audit")} subtitle="Immutable activity log for accountability & compliance" />

      {stats && (
        <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {Object.entries(stats.byEntity || {})
            .slice(0, 6)
            .map(([key, count]) => (
              <StatCard key={key} label={key} value={count} tone="cyan" />
            ))}
        </div>
      )}

      <FilterBar onApply={refresh} applyLabel="Refresh trail">
        <Field label="Entity type">
          <select className={selectClass} value={filters.entityType} onChange={(e) => setFilters({ ...filters, entityType: e.target.value })}>
            <option value="">All entities</option>
            {["task", "project", "resource", "bid", "workflow", "budget", "announcement"].map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Action">
          <select className={selectClass} value={filters.action} onChange={(e) => setFilters({ ...filters, action: e.target.value })}>
            <option value="">All actions</option>
            {["created", "updated", "approved", "rejected", "escalated", "budget_updated"].map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Limit">
          <input type="number" min="10" max="200" className={inputClass} value={filters.limit} onChange={(e) => setFilters({ ...filters, limit: e.target.value })} />
        </Field>
      </FilterBar>

      {loading && !audit.length && <LoadingPanel label={t("loading")} />}

      {!loading && audit.length === 0 ? (
        <EmptyState title="No audit events" description="Activity will appear here as users work across the platform." />
      ) : (
        <div className="space-y-2">
          {audit.map((row) => (
            <div key={row._id} className="glass-panel flex flex-wrap items-center justify-between gap-3 p-4 text-sm transition hover:border-cyan-400/10">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-white">{row.title}</p>
                {row.description && <p className="mt-1 text-xs text-slate-400">{row.description}</p>}
              </div>
              <div className="text-right text-xs text-slate-500">
                <p className="capitalize">
                  {row.entityType} · {row.action}
                </p>
                <p className="mt-1">
                  {row.actorName} · {new Date(row.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {stats?.topActors?.length > 0 && (
        <SectionCard className="mt-6" title="Top contributors" subtitle="Most active users in the audit log">
          <ul className="grid gap-2 sm:grid-cols-2">
            {stats.topActors.map((item) => (
              <li key={item.name} className="rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2 text-sm text-slate-300">
                {item.name} · {item.count} events
              </li>
            ))}
          </ul>
        </SectionCard>
      )}
    </div>
  );
};

export default AuditTrailPage;
