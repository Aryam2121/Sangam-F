import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Chatbot from "./Chatbot";
import { GlobalSearchBox } from "./ui/SearchBox";
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
  AnnouncementsPanel,
  BudgetPanel,
  ProjectsTable,
  TasksSpotlight,
  ApprovalsBanner,
  formatStatusLabel,
} from "./dashboard/DashboardWidgets";

const DashboardPage = () => {
  const navigate = useNavigate();
  const { userData } = useAuth();
  const role = userData?.role || localStorage.getItem("userRole");

  const {
    data: summary,
    loading,
    error,
  } = useStaleResource({
    key: "dashboard-summary",
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
    return <LoadingPanel label="Loading dashboard…" />;
  }

  const displayName = userData?.fullName || userData?.username || "Admin";

  return (
    <div className="page-stack pb-10">
      <PageHeader
        kicker="Control center"
        title={`Welcome back, ${displayName}`}
        subtitle="City infrastructure overview — projects, tasks, budget, and live activity"
        actions={
          <>
            <GlobalSearchBox className="w-full max-w-xs" />
            <button type="button" className="btn btn-primary" onClick={() => navigate("/city-kpi")}>
              City KPIs
            </button>
          </>
        }
      />

      {error && (
        <div className="glass-panel border border-rose-400/20 p-4 text-sm text-rose-200">{error}</div>
      )}

      <ApprovalsBanner count={summary?.metrics?.pendingApprovals} />

      <DashboardStatGrid cards={statCardsForRole(role, summary)} />

      <QuickActionGrid actions={quickActionsForRole(role)} />

      <div className="grid gap-6 lg:grid-cols-2">
        <StatusBarChart
          title="Projects by status"
          subtitle="Distribution across your portfolio"
          data={projectChart}
        />
        <StatusDonutChart
          title="Tasks by status"
          subtitle="Workload breakdown"
          data={taskChart}
          centerLabel={taskTotal || null}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <AlertsPanel alerts={summary?.alerts || []} />
        <AnnouncementsPanel announcements={summary?.announcements || []} />
        <BudgetPanel
          budget={summary?.budget}
          utilization={summary?.metrics?.budgetUtilization}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ProjectsTable projects={summary?.recentProjects || []} />
        </div>
        <TasksSpotlight tasks={summary?.recentTasks || []} />
      </div>

      <ActivityTimeline />

      <Chatbot />
    </div>
  );
};

export default DashboardPage;
