import React, { useCallback, useMemo, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { fetchCityKpis, exportKpiReport } from "../services/sangamApi";
import { useStaleResource } from "../hooks/useStaleResource";
import PageHeader from "../Components/ui/PageHeader";
import {
  EmptyState,
  Field,
  FilterBar,
  LoadingPanel,
  SectionCard,
  StatCard,
  inputClass,
} from "../Components/ui/FeatureUi";
import { useI18n } from "../context/I18nContext";
import toast from "react-hot-toast";

const COLORS = ["#22d3ee", "#818cf8", "#34d399", "#fbbf24", "#f87171"];

const CityKpiDashboard = () => {
  const { t } = useI18n();
  const [filters, setFilters] = useState({ zone: "", ward: "", district: "", department: "" });

  const fetcher = useCallback(() => fetchCityKpis(filters), [filters]);
  const { data, loading, error, refresh } = useStaleResource({
    key: `city-kpi:${JSON.stringify(filters)}`,
    fetcher,
    maxAgeMs: 30_000,
    refreshMs: 60_000,
    initialValue: null,
  });

  const deptChart = useMemo(() => data?.departmentBreakdown || [], [data]);
  const wardChart = useMemo(() => data?.wardBreakdown || [], [data]);

  const handleExport = async () => {
    try {
      const report = await exportKpiReport(filters);
      const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `sangam-kpi-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("KPI report exported");
    } catch (err) {
      toast.error(err.message || "Export failed");
    }
  };

  const kpis = data?.kpis || {};

  return (
    <div className="page pb-10">
      <PageHeader
        title={t("cityKpis")}
        subtitle="Zone, ward, district & department analytics for smart-city oversight"
        actions={
          <button type="button" className="btn btn-primary" onClick={handleExport} disabled={!data}>
            {t("export")}
          </button>
        }
      />

      <FilterBar onApply={refresh} applyLabel={t("filter")}>
        {["zone", "ward", "district", "department"].map((key) => (
          <Field key={key} label={t(key)}>
            <input
              className={inputClass}
              placeholder={`Filter by ${t(key).toLowerCase()}`}
              value={filters[key]}
              onChange={(e) => setFilters((f) => ({ ...f, [key]: e.target.value }))}
            />
          </Field>
        ))}
      </FilterBar>

      {loading && !data && <LoadingPanel label={t("loading")} />}
      {error && (
        <div className="glass-panel mb-6 border border-rose-400/20 p-4 text-sm text-rose-200">
          {typeof error === "string" ? error : error?.message || "Failed to load KPIs"}
        </div>
      )}

      {data && (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <StatCard label="Project completion" value={`${kpis.projects?.completionRate ?? 0}%`} meta={`${kpis.projects?.completed ?? 0} / ${kpis.projects?.total ?? 0} projects`} tone="cyan" />
            <StatCard label="Task completion" value={`${kpis.tasks?.completionRate ?? 0}%`} meta={`${kpis.tasks?.completed ?? 0} completed`} tone="emerald" />
            <StatCard label="Overdue tasks" value={kpis.tasks?.overdue ?? 0} meta="Needs attention" tone="rose" />
            <StatCard label="Open workflows" value={kpis.interDeptRequests?.open ?? 0} meta="Cross-department" tone="violet" />
            <StatCard label="Budget utilization" value={`${kpis.budget?.utilizationRate ?? 0}%`} meta={`₹${(kpis.budget?.spent ?? 0).toLocaleString()} spent`} tone="amber" />
            <StatCard label="Low stock items" value={kpis.resources?.lowStock ?? 0} meta={`${kpis.resources?.total ?? 0} tracked resources`} tone="rose" />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <SectionCard title="Department performance" subtitle="Completed vs total tasks by department">
              {deptChart.length === 0 ? (
                <EmptyState title="No department data" description="Try clearing filters or seeding more tasks." />
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={deptChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="department" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                    <YAxis tick={{ fill: "#94a3b8" }} />
                    <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 12 }} />
                    <Bar dataKey="completed" fill="#22d3ee" name="Completed" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="total" fill="#475569" name="Total" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </SectionCard>

            <SectionCard title="Ward project distribution" subtitle="Projects grouped by ward">
              {wardChart.length === 0 ? (
                <EmptyState title="No ward data" description="Assign zone/ward on projects to populate this chart." />
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={wardChart} dataKey="projects" nameKey="ward" cx="50%" cy="50%" outerRadius={95} label={({ ward, projects }) => `${ward}: ${projects}`}>
                      {wardChart.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </SectionCard>
          </div>

          {(data.lowStockAlerts?.length > 0) && (
            <SectionCard className="mt-6" title="Low stock alerts" subtitle="Resources below minimum threshold">
              <ul className="divide-y divide-white/5">
                {data.lowStockAlerts.map((r) => (
                  <li key={r._id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                    <span className="font-medium text-white">{r.name}</span>
                    <span className="text-amber-200">
                      {r.stockLevel} {r.unit} <span className="text-slate-500">(min {r.minStockLevel})</span>
                    </span>
                  </li>
                ))}
              </ul>
            </SectionCard>
          )}
        </>
      )}
    </div>
  );
};

export default CityKpiDashboard;
