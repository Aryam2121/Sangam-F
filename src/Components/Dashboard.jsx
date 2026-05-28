import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { normalizeRole } from "../utils/authRedirect";
import Chatbot from "./Chatbot";
import { GlobalSearchBox } from "./ui/SearchBox";
import { fetchDashboardSummary } from "../services/sangamApi";
import { quickActionsForRole, statCardsForRole } from "../utils/rolePermissions";
import { useStaleResource } from "../hooks/useStaleResource";
import ActivityTimeline from "./ActivityTimeline";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const formatStatusLabel = (key = "") =>
  key
    .replace(/([A-Z])/g, " $1")
    .replace(/[_-]/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase()) || "Unknown";

const DashboardPage = () => {
  const navigate = useNavigate();
  const role = normalizeRole(localStorage.getItem("userRole"));
  const {
    data: summary,
    loading: isLoading,
    error,
  } = useStaleResource({
    key: "dashboard-summary",
    fetcher: fetchDashboardSummary,
    maxAgeMs: 45_000,
    refreshMs: 90_000,
    initialValue: null,
  });

  const projectProgressData = useMemo(() => {
    if (Array.isArray(summary?.chartData) && summary.chartData.length > 0) {
      return summary.chartData.map((row) => ({
        name: formatStatusLabel(row.name),
        count: row.count ?? 0,
      }));
    }

    const projects = summary?.status?.projects || {};
    return Object.entries(projects).map(([key, value]) => ({
      name: formatStatusLabel(key),
      count: value,
    }));
  }, [summary]);

  const statCards = statCardsForRole(role, summary);
  const quickActions = quickActionsForRole(role);

  if (isLoading) {
    return (
      <div className="page pb-10">
        <div className="glass-panel mb-8 p-6">
          <div className="skeleton mb-3 h-3 w-24" />
          <div className="skeleton h-8 w-72 max-w-full" />
          <div className="skeleton mt-3 h-4 w-96 max-w-full" />
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="glass-card p-5">
              <div className="skeleton h-3 w-20" />
              <div className="skeleton mt-6 h-9 w-16" />
              <div className="skeleton mt-3 h-4 w-28" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="page pb-10">
      <div className="glass-panel mb-8 flex flex-wrap items-center justify-between gap-4 p-6">
        <div>
          <p className="page-kicker">Admin overview</p>
          <h1 className="page-title mt-2">City Infrastructure Dashboard</h1>
          <p className="page-subtitle">Full system control — projects, users, departments, and resources.</p>
        </div>
        <GlobalSearchBox className="w-full max-w-md" />
      </div>

      {error && (
        <div className="mb-6 rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
        {statCards.map((item) => (
          <div key={item.title} className="glass-card p-5">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{item.title}</p>
            <p className="mt-4 text-3xl font-semibold text-white">{item.value}</p>
            <p className="mt-2 text-sm text-slate-400">{item.meta}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {quickActions.map((action) => (
          <button
            key={action.path}
            type="button"
            onClick={() => navigate(action.path)}
            className="glass-card rounded-2xl p-4 text-left transition hover:border-cyan-400/30 hover:bg-white/10"
          >
            <p className="text-sm font-semibold text-white">{action.label}</p>
            <p className="mt-1 text-xs text-slate-400">{action.desc}</p>
          </button>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="glass-panel p-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Progress of Projects</h2>
            <span className="text-xs uppercase tracking-[0.3em] text-slate-400">By status</span>
          </div>
          <div className="mt-4 h-72">
            {projectProgressData.length === 0 ? (
              <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-white/10 text-sm text-slate-400">
                No project status data yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={projectProgressData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis dataKey="name" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      background: "#0f172a",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "12px",
                    }}
                  />
                  <Legend />
                  <Bar dataKey="count" name="Projects" fill="#22d3ee" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="glass-panel p-6">
          <h2 className="text-lg font-semibold">Conflict Alerts</h2>
          <ul className="mt-4 max-h-80 space-y-4 overflow-y-auto custom-scrollbar">
            {(summary?.alerts || []).length === 0 && (
              <li className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
                No urgent alerts right now.
              </li>
            )}
            {(summary?.alerts || []).map((alert) => (
              <li key={alert._id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <h3 className="font-semibold">{alert.title}</h3>
                <p className="mt-2 text-sm text-slate-300">
                  Due: {alert.dueDate ? new Date(alert.dueDate).toLocaleDateString() : "No due date"}
                </p>
                <span className="mt-3 inline-block rounded-full bg-amber-400/20 px-3 py-1 text-xs text-amber-200">
                  {alert.status}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="glass-panel p-6 lg:col-span-2">
          <h2 className="text-lg font-semibold">Projects Overview</h2>
          <div className="mt-4 overflow-x-auto custom-scrollbar">
            <table>
              <thead>
                <tr>
                  <th className="p-2 text-left">Project</th>
                  <th className="p-2 text-left">Project Officer</th>
                  <th className="p-2 text-left">Start Date</th>
                  <th className="p-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {(summary?.recentProjects || []).map((row) => (
                  <tr key={row._id} className="rounded-xl">
                    <td className="p-2 font-medium">{row.name}</td>
                    <td className="p-2">{row.projectAdmin || "-"}</td>
                    <td className="p-2">
                      {row.startDate ? new Date(row.startDate).toLocaleDateString() : "-"}
                    </td>
                    <td className="p-2">
                      <span className="rounded-full bg-cyan-400/15 px-3 py-1 text-xs text-cyan-100">
                        {row.status || "Unknown"}
                      </span>
                    </td>
                  </tr>
                ))}
                {(summary?.recentProjects || []).length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-4 text-center text-sm text-slate-400">
                      No projects found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <ActivityTimeline />

        <div className="glass-panel p-6">
          <h2 className="text-lg font-semibold">Task Spotlight</h2>
          <ul className="mt-4 max-h-80 space-y-4 overflow-y-auto custom-scrollbar">
            {(summary?.recentTasks || []).map((task) => (
              <li key={task._id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="font-semibold">{task.title}</p>
                <p className="mt-1 text-sm text-slate-300">
                  Assigned to: {task.assignedTo?.fullName || "Unassigned"}
                </p>
                <span className="mt-3 inline-block rounded-full bg-cyan-400/20 px-3 py-1 text-xs text-cyan-200">
                  {task.status}
                </span>
              </li>
            ))}
            {(summary?.recentTasks || []).length === 0 && (
              <li className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
                No recent tasks.
              </li>
            )}
          </ul>
        </div>
      </div>

      <div className="mt-8">
        <Chatbot />
      </div>
    </div>
  );
};

export default DashboardPage;
