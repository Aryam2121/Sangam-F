import React, { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  createWorkflowRequest,
  escalateWorkflowRequests,
  fetchDepartments,
  fetchWorkflowRequests,
  updateWorkflowRequest,
} from "../services/sangamApi";
import { useStaleResource } from "../hooks/useStaleResource";
import PageHeader from "../Components/ui/PageHeader";
import {
  EmptyState,
  Field,
  LoadingPanel,
  SectionCard,
  StatusBadge,
  inputClass,
  selectClass,
} from "../Components/ui/FeatureUi";
import { useAuth } from "../context/AuthContext";
import { useI18n } from "../context/I18nContext";
import { isMainAdmin } from "../utils/rolePermissions";

const WorkflowPage = () => {
  const { userData } = useAuth();
  const { t } = useI18n();
  const [departments, setDepartments] = useState([]);
  const [form, setForm] = useState({
    title: "",
    description: "",
    toDepartment: "",
    priority: "medium",
  });

  useEffect(() => {
    fetchDepartments()
      .then((rows) => setDepartments(Array.isArray(rows) ? rows : []))
      .catch(() => setDepartments([]));
  }, []);

  const fetcher = useCallback(() => fetchWorkflowRequests(), []);
  const { data, loading, refresh } = useStaleResource({
    key: "workflow-requests",
    fetcher,
    maxAgeMs: 20_000,
    refreshMs: 45_000,
    initialValue: { requests: [] },
  });

  const requests = data?.requests || [];

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await createWorkflowRequest(form);
      toast.success("Request submitted");
      setForm({ title: "", description: "", toDepartment: "", priority: "medium" });
      refresh();
    } catch (err) {
      toast.error(err.message || "Failed to create request");
    }
  };

  const handleAction = async (id, action) => {
    try {
      await updateWorkflowRequest(id, { action });
      toast.success(action === "approve" ? "Approved" : "Rejected");
      refresh();
    } catch (err) {
      toast.error(err.message || "Action failed");
    }
  };

  const handleEscalate = async () => {
    try {
      const res = await escalateWorkflowRequests();
      toast.success(`Escalated ${res.escalated || 0} requests`);
      refresh();
    } catch (err) {
      toast.error(err.message || "Escalation failed");
    }
  };

  return (
    <div className="page pb-10">
      <PageHeader
        title={t("workflow")}
        subtitle="Cross-department requests, approvals & SLA escalation"
        actions={
          isMainAdmin(userData?.role) ? (
            <button type="button" className="btn" onClick={handleEscalate}>
              Run SLA escalation
            </button>
          ) : null
        }
      />

      <SectionCard title="New request" subtitle="Route work to another department">
        <form onSubmit={handleCreate} className="grid gap-3 sm:grid-cols-2">
          <Field label="Title" className="sm:col-span-2">
            <input className={inputClass} placeholder="Request title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          </Field>
          <Field label="Target department">
            <select className={selectClass} value={form.toDepartment} onChange={(e) => setForm({ ...form, toDepartment: e.target.value })} required>
              <option value="">Select department</option>
              {departments.map((d) => (
                <option key={d._id || d.name} value={d.name}>
                  {d.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Priority">
            <select className={selectClass} value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </Field>
          <Field label="Description" className="sm:col-span-2">
            <textarea className={`${inputClass} min-h-[96px]`} rows={3} placeholder="Describe the request" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </Field>
          <button type="submit" className="btn btn-primary sm:col-span-2 sm:w-fit">
            {t("submit")}
          </button>
        </form>
      </SectionCard>

      {loading && !requests.length && <LoadingPanel label={t("loading")} />}

      <div className="mt-6 space-y-3">
        {!loading && requests.length === 0 && (
          <EmptyState title={t("noData")} description="Submit a cross-department request to start the workflow." />
        )}
        {requests.map((req) => (
          <div key={req._id} className="glass-panel p-5 transition hover:border-cyan-400/15">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-white">{req.title}</p>
                  <StatusBadge status={req.status} />
                  <StatusBadge status={req.priority} />
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  {req.fromDepartment} → {req.toDepartment}
                </p>
                {req.description && <p className="mt-3 text-sm leading-relaxed text-slate-300">{req.description}</p>}
              </div>
              <p className="text-xs text-slate-500">{req.escalated ? "Escalated" : "On track"}</p>
            </div>
            {["pending", "in_review"].includes(req.status) && (
              <div className="mt-4 flex gap-2">
                <button type="button" className="btn btn-primary text-xs" onClick={() => handleAction(req._id, "approve")}>
                  {t("approve")}
                </button>
                <button type="button" className="btn text-xs" onClick={() => handleAction(req._id, "reject")}>
                  {t("reject")}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default WorkflowPage;
