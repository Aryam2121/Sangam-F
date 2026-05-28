import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Chatbot from "./Chatbot";
import { GlobalSearchBox } from "./ui/SearchBox";
import { fetchDashboardSummary } from "../services/sangamApi";
import { quickActionsForRole, statCardsForRole } from "../utils/rolePermissions";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const formatStatusLabel = (key = "") =>
  key
    .replace(/([A-Z])/g, " $1")
    .replace(/[_-]/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase()) || "Unknown";

const OfficerDashboard = () => {
  const navigate = useNavigate();
  const { userData } = useAuth();
  const department = userData?.department || "your department";
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setError("");
        const data = await fetchDashboardSummary();
        setSummary(data);
      } catch (err) {
        setError(err.message || "Failed to load dashboard");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const chartData = useMemo(() => {
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

  const statCards = statCardsForRole("Officer", summary);
  const quickActions = quickActionsForRole("Officer");

  if (isLoading) {
    return (
      <div className="page flex min-h-[50vh] items-center justify-center pb-10">
        <div className="loading-spinner" />
      </div>
    );
  }

  return (
    <div className="page pb-10">
      <div className="glass-panel mb-6 flex flex-wrap items-center justify-between gap-4 p-6">
        <div>
          <p className="page-kicker">Officer workspace</p>
          <h1 className="page-title mt-2">Operations overview</h1>
          <p className="page-subtitle">
            Focused view for <span className="text-cyan-200">{department}</span> — tasks, projects,
            and alerts. Admin settings are not available on this account.
          </p>
        </div>
        <button type="button" className="btn btn-primary shrink-0" onClick={() => navigate("/taskManager")}>
          Open task manager
        </button>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          {error}
        </div>
      )}

      <div className="mb-4 rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
        <strong className="text-amber-50">Officer vs Admin:</strong> You can manage tasks and view
        projects/resources. Only <strong>Main Admin</strong> can create/delete projects, manage
        departments, and see all user accounts.
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {statCards.map((item) => (
          <div key={item.title} className="glass-card p-5">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{item.title}</p>
            <p className="mt-4 text-3xl font-semibold text-white">{item.value}</p>
            <p className="mt-2 text-sm text-slate-400">{item.meta}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
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

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="glass-panel p-6">
          <h2 className="text-lg font-semibold">Project status</h2>
          <div className="mt-4 h-64">
            {chartData.length === 0 ? (
              <p className="text-sm text-slate-400">No chart data yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
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
                  <Bar dataKey="count" fill="#22d3ee" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="glass-panel p-6">
          <h2 className="text-lg font-semibold">Urgent tasks</h2>
          <ul className="mt-4 max-h-64 space-y-3 overflow-y-auto custom-scrollbar">
            {(summary?.alerts || []).length === 0 ? (
              <li className="text-sm text-slate-400">No urgent alerts.</li>
            ) : (
              (summary?.alerts || []).map((alert) => (
                <li key={alert._id} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                  <p className="font-medium text-white">{alert.title}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    Due {alert.dueDate ? new Date(alert.dueDate).toLocaleDateString() : "—"} ·{" "}
                    {alert.status}
                  </p>
                </li>
              ))
            )}
          </ul>
          <button type="button" className="btn mt-4 w-full" onClick={() => navigate("/taskManager")}>
            View all tasks
          </button>
        </div>
      </div>

      <div className="glass-panel mt-6 p-6">
        <h2 className="text-lg font-semibold">Recent projects (read-only)</h2>
        <div className="mt-4 overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th className="p-2 text-left">Project</th>
                <th className="p-2 text-left">Status</th>
                <th className="p-2 text-left">Start</th>
              </tr>
            </thead>
            <tbody>
              {(summary?.recentProjects || []).slice(0, 5).map((p) => (
                <tr key={p._id}>
                  <td className="p-2">
                    <button
                      type="button"
                      className="text-cyan-300 hover:underline"
                      onClick={() => navigate(`/project/${p._id}`)}
                    >
                      {p.name}
                    </button>
                  </td>
                  <td className="p-2">{p.status}</td>
                  <td className="p-2">
                    {p.startDate ? new Date(p.startDate).toLocaleDateString() : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Chatbot />
    </div>
  );
};

export default OfficerDashboard;
