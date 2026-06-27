import React, { useCallback, useMemo } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import {
  escalateWorkflowRequests,
  fetchWorkflowRequests,
  updateWorkflowRequest,
} from "../services/sangamApi";
import { useStaleResource } from "../hooks/useStaleResource";
import PageHeader from "../Components/ui/PageHeader";
import {
  EmptyState,
  LoadingPanel,
  SectionCard,
  StatCard,
  StatusBadge,
} from "../Components/ui/FeatureUi";
import { useAuth } from "../context/AuthContext";
import { isAdminRole } from "../utils/rolePermissions";

const ApprovalsInboxPage = () => {
  const { userData } = useAuth();
  const navigate = useNavigate();

  const fetcher = useCallback(() => fetchWorkflowRequests({ status: "pending" }), []);
  const reviewFetcher = useCallback(() => fetchWorkflowRequests({ status: "in_review" }), []);

  const { data: pendingData, loading: pendingLoading, refresh: refreshPending } = useStaleResource({
    key: "approvals-pending",
    fetcher,
    maxAgeMs: 15_000,
    refreshMs: 30_000,
    initialValue: { requests: [] },
  });

  const { data: reviewData, loading: reviewLoading, refresh: refreshReview } = useStaleResource({
    key: "approvals-review",
    fetcher: reviewFetcher,
    maxAgeMs: 15_000,
    refreshMs: 30_000,
    initialValue: { requests: [] },
  });

  const pending = pendingData?.requests || [];
  const inReview = reviewData?.requests || [];
  const inbox = useMemo(() => [...pending, ...inReview], [pending, inReview]);
  const criticalCount = inbox.filter((r) => r.priority === "critical" || r.priority === "high").length;
  const escalatedCount = inbox.filter((r) => r.escalated).length;

  const refresh = () => {
    refreshPending();
    refreshReview();
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
      toast.success(`Escalated ${res.escalated || 0} overdue requests`);
      refresh();
    } catch (err) {
      toast.error(err.message || "Escalation failed");
    }
  };

  const loading = (pendingLoading || reviewLoading) && !inbox.length;

  return (
    <div className="page pb-10">
      <PageHeader
        kicker="Workflow"
        title="Approvals Inbox"
        subtitle="Pending cross-department requests that need your action"
        actions={
          <>
            <button type="button" className="btn" onClick={() => navigate("/workflow")}>
              All requests
            </button>
            {isAdminRole(userData?.role) && (
              <button type="button" className="btn btn-primary" onClick={handleEscalate}>
                Run SLA escalation
              </button>
            )}
          </>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Awaiting action" value={inbox.length} meta="Pending + in review" tone="amber" />
        <StatCard label="High priority" value={criticalCount} meta="Critical or high" tone="rose" />
        <StatCard label="Escalated" value={escalatedCount} meta="Past SLA threshold" tone="violet" />
      </div>

      {loading && <LoadingPanel label="Loading inbox…" />}

      {!loading && inbox.length === 0 && (
        <EmptyState
          title="Inbox clear"
          description="No pending approvals right now. New cross-department requests will appear here."
          action={
            <button type="button" className="btn btn-primary" onClick={() => navigate("/workflow")}>
              Create request
            </button>
          }
        />
      )}

      <div className="space-y-3">
        {inbox.map((req) => (
          <SectionCard key={req._id} className="!p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-white">{req.title}</p>
                  <StatusBadge status={req.status} />
                  <StatusBadge status={req.priority} />
                  {req.escalated && <StatusBadge status="critical" />}
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  {req.fromDepartment} → {req.toDepartment}
                  {req.createdAt && ` · ${new Date(req.createdAt).toLocaleString()}`}
                </p>
                {req.description && (
                  <p className="mt-3 text-sm leading-relaxed text-slate-300">{req.description}</p>
                )}
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                className="btn btn-primary text-xs"
                onClick={() => handleAction(req._id, "approve")}
              >
                Approve
              </button>
              <button
                type="button"
                className="btn text-xs"
                onClick={() => handleAction(req._id, "reject")}
              >
                Reject
              </button>
            </div>
          </SectionCard>
        ))}
      </div>
    </div>
  );
};

export default ApprovalsInboxPage;
