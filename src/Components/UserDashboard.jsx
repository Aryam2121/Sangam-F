import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useAuth } from "../context/AuthContext";
import { fetchWorkerDashboard } from "../services/sangamApi";
import PageHeader from "./ui/PageHeader";

const UserDashboard = () => {
  const { userData } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      const userId = userData?._id;
      if (!userId) {
        setLoading(false);
        return;
      }
      try {
        setError("");
        const res = await fetchWorkerDashboard(userId);
        setData(res);
      } catch (err) {
        setError(err.message || "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [userData?._id]);

  if (loading) {
    return (
      <div className="page flex min-h-[50vh] items-center justify-center pb-10">
        <div className="loading-spinner" />
      </div>
    );
  }

  const counts = data?.counts || {};
  const stats = [
    { label: "My Tasks", value: counts.myTasks ?? 0, meta: "assigned to you" },
    { label: "Projects", value: counts.projects ?? 0, meta: "in system" },
    { label: "Resources", value: counts.resources ?? 0, meta: "inventory items" },
    { label: "Completed", value: counts.completed ?? 0, meta: "tasks done" },
  ];

  return (
    <div className="page pb-10">
      <PageHeader
        kicker="Worker"
        title={`Welcome, ${data?.user?.fullName || userData?.fullName || "User"}`}
        subtitle="Your tasks, deadlines, and project updates in one place."
      />

      {error && (
        <div className="mb-4 rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          {error}
        </div>
      )}

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((item) => (
          <div key={item.label} className="glass-card p-5">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-400">{item.label}</p>
            <p className="mt-3 text-3xl font-semibold text-white">{item.value}</p>
            <p className="mt-1 text-sm text-slate-400">{item.meta}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="glass-panel p-6 lg:col-span-2">
          <h2 className="text-lg font-semibold text-white">My Task Status</h2>
          <div className="mt-4 h-64">
            {(data?.chartData || []).length === 0 ? (
              <p className="flex h-full items-center justify-center text-sm text-slate-400">No task data yet</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis dataKey="name" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" allowDecimals={false} />
                  <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px" }} />
                  <Bar dataKey="count" fill="#22d3ee" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="glass-panel p-6">
          <h2 className="text-lg font-semibold text-white">Alerts</h2>
          <ul className="mt-4 max-h-64 space-y-3 overflow-y-auto custom-scrollbar">
            {(data?.alerts || []).length === 0 ? (
              <li className="text-sm text-slate-400">No urgent alerts</li>
            ) : (
              data.alerts.map((alert) => (
                <li key={alert._id} className="rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4">
                  <p className="font-semibold text-white">{alert.title}</p>
                  <p className="mt-1 text-xs text-slate-300">{alert.projectName}</p>
                  <span className="mt-2 inline-block rounded-full bg-amber-400/20 px-2 py-0.5 text-xs text-amber-100">
                    {alert.status}
                  </span>
                </li>
              ))
            )}
          </ul>
        </div>

        <div className="glass-panel p-6 lg:col-span-2">
          <h2 className="text-lg font-semibold text-white">My Tasks</h2>
          <div className="mt-4 space-y-3">
            {(data?.myTasks || []).length === 0 ? (
              <p className="text-sm text-slate-400">No tasks assigned yet</p>
            ) : (
              data.myTasks.map((task) => (
                <div key={task._id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div>
                    <p className="font-semibold text-white">{task.title}</p>
                    <p className="text-sm text-slate-400">{task.projectName}</p>
                  </div>
                  <span className="rounded-full bg-cyan-400/15 px-3 py-1 text-xs text-cyan-100">{task.status}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="glass-panel p-6">
          <h2 className="text-lg font-semibold text-white">Recent Projects</h2>
          <ul className="mt-4 space-y-3">
            {(data?.recentProjects || []).map((p) => (
              <li key={p._id} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <p className="font-medium text-white">{p.name}</p>
                <p className="text-xs text-slate-400">{p.status}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
