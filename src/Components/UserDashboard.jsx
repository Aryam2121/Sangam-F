import React, { useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { fetchWorkerDashboard } from "../services/sangamApi";
import { useStaleResource } from "../hooks/useStaleResource";
import PageHeader from "./ui/PageHeader";
import { LoadingPanel, StatusBadge, SectionCard } from "./ui/FeatureUi";
import {
  DashboardStatGrid,
  QuickActionGrid,
  StatusDonutChart,
  AlertsPanel,
  formatStatusLabel,
  taskStatusTone,
} from "./dashboard/DashboardWidgets";
import { workerStatCards, workerQuickActions } from "../utils/rolePermissions";

const UserDashboard = () => {
  const { userData } = useAuth();
  const navigate = useNavigate();

  const fetcher = useCallback(() => fetchWorkerDashboard(), []);
  const { data, loading, error } = useStaleResource({
    key: `worker-dashboard:${userData?._id || "anon"}`,
    fetcher,
    maxAgeMs: 30_000,
    refreshMs: 60_000,
    initialValue: null,
    enabled: Boolean(userData?._id),
  });

  const taskChart = useMemo(() => {
    const raw = data?.chartData || [];
    return raw.map((row) => ({ name: formatStatusLabel(row.name), count: row.count ?? 0 }));
  }, [data]);

  const taskTotal = useMemo(() => taskChart.reduce((s, r) => s + r.count, 0), [taskChart]);

  if (loading && !data) {
    return <LoadingPanel label="Loading your workspace…" />;
  }

  const displayName = data?.user?.fullName || userData?.fullName || "Worker";

  return (
    <div className="page-stack pb-10">
      <PageHeader
        kicker="Worker"
        title={`Welcome, ${displayName}`}
        subtitle="Your tasks, deadlines, and project updates in one place"
        actions={
          <button type="button" className="btn btn-primary" onClick={() => navigate("/taskManager")}>
            My tasks
          </button>
        }
      />

      {error && (
        <div className="glass-panel border border-rose-400/20 p-4 text-sm text-rose-200">{error}</div>
      )}

      <DashboardStatGrid cards={workerStatCards(data)} />

      <QuickActionGrid actions={workerQuickActions()} />

      <div className="grid gap-6 lg:grid-cols-2">
        <StatusDonutChart
          title="My task status"
          subtitle="Breakdown of assigned work"
          data={taskChart}
          centerLabel={taskTotal || null}
        />
        <AlertsPanel
          alerts={data?.alerts || []}
          title="My deadlines"
          subtitle="Tasks due soon or overdue"
        />
      </div>

      <SectionCard title="My tasks" subtitle="Tap a task to open task manager">
        <div className="space-y-3">
          {(data?.myTasks || []).length === 0 ? (
            <p className="text-sm text-slate-400">No tasks assigned yet.</p>
          ) : (
            data.myTasks.map((task) => (
              <button
                key={task._id}
                type="button"
                onClick={() => navigate("/taskManager")}
                className="flex w-full items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-left transition hover:border-cyan-400/20"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-white">{task.title}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {task.projectName}
                    {task.dueDate && ` · Due ${new Date(task.dueDate).toLocaleDateString()}`}
                  </p>
                </div>
                <StatusBadge status={taskStatusTone(task.status)} />
              </button>
            ))
          )}
        </div>
      </SectionCard>

      <SectionCard title="My projects" subtitle="Sites you're assigned to">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(data?.recentProjects || []).length === 0 ? (
            <p className="text-sm text-slate-400 sm:col-span-2 lg:col-span-3">No projects assigned.</p>
          ) : (
            data.recentProjects.map((p) => (
              <button
                key={p._id}
                type="button"
                onClick={() => navigate(`/project/${p._id}`)}
                className="glass-card rounded-2xl p-4 text-left transition hover:border-cyan-400/20"
              >
                <p className="font-semibold text-white">{p.name}</p>
                <p className="mt-2">
                  <StatusBadge status={p.status === "active" ? "in_review" : p.status || "pending"} />
                </p>
              </button>
            ))
          )}
        </div>
      </SectionCard>
    </div>
  );
};

export default UserDashboard;
