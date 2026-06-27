import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Chatbot from "./Chatbot";
import PageHeader from "./ui/PageHeader";
import { fetchDashboardSummary } from "../services/sangamApi";
import { quickActionsForRole, statCardsForRole } from "../utils/rolePermissions";
import { useStaleResource } from "../hooks/useStaleResource";
import { useAuth } from "../context/AuthContext";
import ActivityTimeline from "./ActivityTimeline";
import { LoadingPanel } from "./ui/FeatureUi";
import {
  DashboardStatGrid,
  QuickActionGrid,
  StatusBarChart,
  StatusDonutChart,
  AlertsPanel,
  ProjectsTable,
  ApprovalsBanner,
  formatStatusLabel,
} from "./dashboard/DashboardWidgets";

const OfficerDashboard = () => {
  const navigate = useNavigate();
  const { userData } = useAuth();
  const department = userData?.department || "your department";

  const {
    data: summary,
    loading,
    error,
  } = useStaleResource({
    key: "officer-dashboard",
    fetcher: fetchDashboardSummary,
    maxAgeMs: 45_000,
    refreshMs: 90_000,
    initialValue: null,
  });

  const projectChart = useMemo(() => {
    const raw =
      (Array.isArray(summary?.chartData) && summary.chartData.length > 0
        ? summary.chartData
        : Object.entries(summary?.status?.projects || {}).map(([name, count]) => ({ name, count }))) || [];
    return raw.map((row) => ({ name: formatStatusLabel(row.name), count: row.count ?? 0 }));
  }, [summary]);

  const taskChart = useMemo(() => {
    const raw =
      (Array.isArray(summary?.taskChartData) && summary.taskChartData.length > 0
        ? summary.taskChartData
        : Object.entries(summary?.status?.tasks || {}).map(([name, count]) => ({ name, count }))) || [];
    return raw.map((row) => ({ name: formatStatusLabel(row.name), count: row.count ?? 0 }));
  }, [summary]);

  const taskTotal = useMemo(() => taskChart.reduce((s, r) => s + r.count, 0), [taskChart]);

  if (loading && !summary) {
    return <LoadingPanel label="Loading operations overview…" />;
  }

  const displayName = userData?.fullName || userData?.username || "Officer";

  return (
    <div className="page-stack pb-10">
      <PageHeader
        kicker="Officer workspace"
        title={`Hello, ${displayName}`}
        subtitle={`Operations for ${department} — tasks, projects, and cross-department approvals`}
        actions={
          <button type="button" className="btn btn-primary" onClick={() => navigate("/taskManager")}>
            Open task manager
          </button>
        }
      />

      {error && (
        <div className="glass-panel border border-rose-400/20 p-4 text-sm text-rose-200">{error}</div>
      )}

      <ApprovalsBanner count={summary?.metrics?.pendingApprovals} />

      <DashboardStatGrid cards={statCardsForRole("Officer", summary)} />

      <QuickActionGrid actions={quickActionsForRole("Officer")} />

      <div className="grid gap-6 lg:grid-cols-2">
        <StatusBarChart title="Project status" subtitle={`Scoped to ${department}`} data={projectChart} />
        <StatusDonutChart
          title="Task workload"
          subtitle="Your department tasks"
          data={taskChart}
          centerLabel={taskTotal || null}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <AlertsPanel alerts={summary?.alerts || []} />
        <ProjectsTable projects={(summary?.recentProjects || []).slice(0, 6)} showAdmin={false} />
      </div>

      <ActivityTimeline limit={8} />

      <Chatbot />
    </div>
  );
};

export default OfficerDashboard;
