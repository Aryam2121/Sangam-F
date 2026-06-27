import React, { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { createBudgetEntry, fetchBudgetSummary, fetchProjects } from "../services/sangamApi";
import { useStaleResource } from "../hooks/useStaleResource";
import PageHeader from "../Components/ui/PageHeader";
import {
  EmptyState,
  Field,
  LoadingPanel,
  SectionCard,
  StatCard,
  inputClass,
  selectClass,
} from "../Components/ui/FeatureUi";
import { useI18n } from "../context/I18nContext";

const formatRupee = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

const BudgetPage = () => {
  const { t } = useI18n();
  const [projects, setProjects] = useState([]);
  const [entry, setEntry] = useState({ project: "", amount: "", type: "expense", description: "" });

  const fetcher = useCallback(() => fetchBudgetSummary(), []);
  const { data, loading, refresh } = useStaleResource({
    key: "budget-summary",
    fetcher,
    maxAgeMs: 30_000,
    initialValue: null,
  });

  useEffect(() => {
    fetchProjects()
      .then((p) => setProjects(Array.isArray(p) ? p : []))
      .catch(() => {});
  }, []);

  const handleAddEntry = async (e) => {
    e.preventDefault();
    try {
      await createBudgetEntry({ ...entry, amount: Number(entry.amount) });
      toast.success("Budget entry recorded");
      setEntry({ project: "", amount: "", type: "expense", description: "" });
      refresh();
    } catch (err) {
      toast.error(err.message || "Failed");
    }
  };

  return (
    <div className="page pb-10">
      <PageHeader title={t("budget")} subtitle="Budget caps, spend tracking & resource alerts" />

      {loading && !data && <LoadingPanel label={t("loading")} />}

      {data && (
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <StatCard label="Allocated" value={formatRupee(data.totals?.allocated)} tone="emerald" />
          <StatCard label="Spent" value={formatRupee(data.totals?.spent)} meta={`${data.totals?.utilizationRate ?? 0}% utilized`} tone="amber" />
          <StatCard label="Overruns" value={data.overruns?.length ?? 0} meta="Projects over budget cap" tone="rose" />
        </div>
      )}

      <SectionCard title="Record entry" subtitle="Log allocation, expense, or adjustment">
        <form onSubmit={handleAddEntry} className="grid gap-3 sm:grid-cols-2">
          <Field label="Project" className="sm:col-span-2">
            <select className={selectClass} value={entry.project} onChange={(e) => setEntry({ ...entry, project: e.target.value })} required>
              <option value="">Select project</option>
              {projects.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Amount (₹)">
            <input type="number" min="0" className={inputClass} placeholder="0" value={entry.amount} onChange={(e) => setEntry({ ...entry, amount: e.target.value })} required />
          </Field>
          <Field label="Type">
            <select className={selectClass} value={entry.type} onChange={(e) => setEntry({ ...entry, type: e.target.value })}>
              <option value="allocation">Allocation</option>
              <option value="expense">Expense</option>
              <option value="adjustment">Adjustment</option>
            </select>
          </Field>
          <Field label="Description" className="sm:col-span-2">
            <input className={inputClass} placeholder="Optional note" value={entry.description} onChange={(e) => setEntry({ ...entry, description: e.target.value })} />
          </Field>
          <button type="submit" className="btn btn-primary sm:col-span-2 sm:w-fit">
            {t("submit")}
          </button>
        </form>
      </SectionCard>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <SectionCard title="Recent entries" subtitle="Latest budget movements">
          {(data?.entries || []).length === 0 ? (
            <EmptyState title="No entries yet" description="Record your first budget entry above." />
          ) : (
            <ul className="divide-y divide-white/5">
              {(data?.entries || []).slice(0, 12).map((e) => (
                <li key={e._id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                  <div>
                    <p className="font-medium capitalize text-white">{e.type}</p>
                    <p className="text-xs text-slate-500">{e.project?.name || "Project"}</p>
                  </div>
                  <span className="font-semibold text-cyan-200">{formatRupee(e.amount)}</span>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard title="Low stock resources" subtitle="Inventory below minimum levels">
          {(data?.lowStockResources || []).length === 0 ? (
            <EmptyState title="Stock levels healthy" description="No resources are below their minimum threshold." />
          ) : (
            <ul className="divide-y divide-white/5">
              {(data?.lowStockResources || []).map((r) => (
                <li key={r._id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                  <span className="font-medium text-white">{r.name}</span>
                  <span className="text-amber-200">
                    {r.stockLevel}/{r.minStockLevel} {r.unit}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>

      {(data?.overruns?.length > 0) && (
        <SectionCard className="mt-6" title="Budget overruns" subtitle="Projects exceeding allocated budget">
          <ul className="divide-y divide-white/5">
            {data.overruns.map((p) => (
              <li key={p._id || p.name} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                <span className="text-white">{p.name}</span>
                <span className="text-rose-200">
                  {formatRupee(p.budgetSpent)} / {formatRupee(p.budgetAllocated)}
                </span>
              </li>
            ))}
          </ul>
        </SectionCard>
      )}
    </div>
  );
};

export default BudgetPage;
