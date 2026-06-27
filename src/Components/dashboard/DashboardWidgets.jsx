import React from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { StatCard, StatusBadge, SectionCard, EmptyState } from "../ui/FeatureUi";

const CHART_COLORS = ["#22d3ee", "#818cf8", "#34d399", "#fbbf24", "#f87171", "#fb7185"];

const tooltipStyle = {
  background: "#0f172a",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: "12px",
};

export const formatStatusLabel = (key = "") =>
  key
    .replace(/([A-Z])/g, " $1")
    .replace(/[_-]/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase()) || "Unknown";

export const taskStatusTone = (status) => {
  const s = String(status || "").toLowerCase();
  if (s === "completed") return "approved";
  if (s === "in progress") return "in_review";
  if (s === "overdue") return "critical";
  return "pending";
};

export const projectStatusTone = (status) => {
  const s = String(status || "").toLowerCase();
  if (s === "completed") return "approved";
  if (s === "active") return "in_review";
  return "pending";
};

export const formatRupee = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

export const DashboardStatGrid = ({ cards }) => (
  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
    {cards.map((card) => (
      <StatCard
        key={card.label}
        label={card.label}
        value={card.value}
        meta={card.meta}
        tone={card.tone || "cyan"}
      />
    ))}
  </div>
);

export const QuickActionGrid = ({ actions }) => {
  const navigate = useNavigate();
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {actions.map((action) => (
        <button
          key={action.path}
          type="button"
          onClick={() => navigate(action.path)}
          className="glass-card group flex flex-col gap-2 rounded-2xl p-4 text-left transition hover:border-cyan-400/25"
        >
          {action.icon && (
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-300 transition group-hover:bg-cyan-400/20">
              <action.icon className="text-lg" />
            </span>
          )}
          <p className="text-sm font-semibold text-white">{action.label}</p>
          <p className="text-xs text-slate-500">{action.desc}</p>
        </button>
      ))}
    </div>
  );
};

export const StatusBarChart = ({ title, subtitle, data, emptyLabel = "No data yet" }) => (
  <SectionCard title={title} subtitle={subtitle}>
    <div className="h-64">
      {data.length === 0 ? (
        <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-white/10 text-sm text-slate-400">
          {emptyLabel}
        </div>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
            <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 11 }} />
            <YAxis stroke="#64748b" allowDecimals={false} tick={{ fontSize: 11 }} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="count" name="Count" fill="#22d3ee" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  </SectionCard>
);

export const StatusDonutChart = ({ title, subtitle, data, centerLabel }) => (
  <SectionCard title={title} subtitle={subtitle}>
    <div className="relative h-64">
      {data.length === 0 ? (
        <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-white/10 text-sm text-slate-400">
          No data yet
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={58}
                outerRadius={82}
                paddingAngle={3}
                dataKey="count"
              >
                {data.map((entry, index) => (
                  <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} stroke="transparent" />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
          {centerLabel != null && (
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-white">{centerLabel}</span>
              <span className="text-[10px] uppercase tracking-wider text-slate-500">total</span>
            </div>
          )}
        </>
      )}
    </div>
    {data.length > 0 && (
      <div className="mt-3 flex flex-wrap gap-3">
        {data.map((row, index) => (
          <div key={row.name} className="flex items-center gap-1.5 text-xs text-slate-400">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
            />
            {row.name}: <span className="font-medium text-white">{row.count}</span>
          </div>
        ))}
      </div>
    )}
  </SectionCard>
);

export const AlertsPanel = ({ alerts, title = "Urgent alerts", subtitle = "Due within 3 days" }) => {
  const navigate = useNavigate();
  return (
    <SectionCard title={title} subtitle={subtitle}>
      <ul className="max-h-72 space-y-3 overflow-y-auto custom-scrollbar">
        {alerts.length === 0 ? (
          <li className="rounded-2xl border border-emerald-400/20 bg-emerald-400/5 p-4 text-sm text-emerald-200">
            All clear — no urgent deadlines.
          </li>
        ) : (
          alerts.map((alert) => (
            <li
              key={alert._id}
              className="rounded-2xl border border-amber-400/20 bg-amber-400/5 p-4 transition hover:border-amber-400/35"
            >
              <p className="font-semibold text-white">{alert.title}</p>
              <p className="mt-1 text-xs text-slate-400">
                Due {alert.dueDate ? new Date(alert.dueDate).toLocaleDateString() : "—"}
                {alert.department && ` · ${alert.department}`}
                {alert.projectName && ` · ${alert.projectName}`}
              </p>
              <div className="mt-2">
                <StatusBadge status={taskStatusTone(alert.status)} />
              </div>
            </li>
          ))
        )}
      </ul>
      <button type="button" className="btn mt-4 w-full" onClick={() => navigate("/taskManager")}>
        View all tasks
      </button>
    </SectionCard>
  );
};

export const AnnouncementsPanel = ({ announcements }) => {
  const navigate = useNavigate();
  return (
    <SectionCard title="Latest announcements" subtitle="City-wide updates">
      {announcements.length === 0 ? (
        <EmptyState title="No announcements" description="City updates will appear here." />
      ) : (
        <ul className="space-y-2">
          {announcements.map((item) => (
            <li
              key={item._id}
              className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2.5"
            >
              <p className="truncate text-sm font-medium text-white">{item.title}</p>
              <span className="shrink-0 text-[10px] text-slate-500">
                {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : ""}
              </span>
            </li>
          ))}
        </ul>
      )}
      <button type="button" className="btn mt-4 w-full" onClick={() => navigate("/announcements")}>
        All announcements
      </button>
    </SectionCard>
  );
};

export const BudgetPanel = ({ budget, utilization }) => (
  <SectionCard title="Budget overview" subtitle="Allocated vs spent across projects">
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
        <p className="text-xs uppercase tracking-wider text-slate-500">Allocated</p>
        <p className="mt-1 text-xl font-semibold text-emerald-300">{formatRupee(budget?.allocated)}</p>
      </div>
      <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
        <p className="text-xs uppercase tracking-wider text-slate-500">Spent</p>
        <p className="mt-1 text-xl font-semibold text-amber-300">{formatRupee(budget?.spent)}</p>
      </div>
    </div>
    <div className="mt-4">
      <div className="mb-2 flex justify-between text-xs text-slate-400">
        <span>Utilization</span>
        <span>{utilization ?? 0}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/5">
        <div
          className={`h-full rounded-full transition-all ${
            (utilization ?? 0) > 100 ? "bg-rose-400" : "bg-cyan-400"
          }`}
          style={{ width: `${Math.min(utilization ?? 0, 100)}%` }}
        />
      </div>
    </div>
  </SectionCard>
);

export const ProjectsTable = ({ projects, showAdmin = true }) => {
  const navigate = useNavigate();
  return (
    <SectionCard title="Recent projects" subtitle="Click a row to open details">
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wider text-slate-500">
              <th className="py-2 pr-4">Project</th>
              {showAdmin && <th className="py-2 pr-4">Officer</th>}
              <th className="py-2 pr-4">Location</th>
              <th className="py-2 pr-4">Start</th>
              <th className="py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {projects.length === 0 ? (
              <tr>
                <td colSpan={showAdmin ? 5 : 4} className="py-6 text-center text-sm text-slate-400">
                  No projects found.
                </td>
              </tr>
            ) : (
              projects.map((row) => (
                <tr
                  key={row._id}
                  className="cursor-pointer border-b border-white/5 transition hover:bg-white/[0.03]"
                  onClick={() => navigate(`/project/${row._id}`)}
                >
                  <td className="py-3 pr-4 font-medium text-cyan-200">{row.name}</td>
                  {showAdmin && <td className="py-3 pr-4 text-slate-300">{row.projectAdmin || "—"}</td>}
                  <td className="py-3 pr-4 text-sm text-slate-400">
                    {[row.zone, row.ward].filter(Boolean).join(" · ") || "—"}
                  </td>
                  <td className="py-3 pr-4 text-sm text-slate-400">
                    {row.startDate ? new Date(row.startDate).toLocaleDateString() : "—"}
                  </td>
                  <td className="py-3">
                    <StatusBadge status={projectStatusTone(row.status)} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <button type="button" className="btn mt-4" onClick={() => navigate("/projects")}>
        View all projects
      </button>
    </SectionCard>
  );
};

export const TasksSpotlight = ({ tasks }) => {
  const navigate = useNavigate();
  return (
    <SectionCard title="Task spotlight" subtitle="Latest task activity">
      <ul className="max-h-80 space-y-3 overflow-y-auto custom-scrollbar">
        {tasks.length === 0 ? (
          <li className="text-sm text-slate-400">No recent tasks.</li>
        ) : (
          tasks.map((task) => (
            <li
              key={task._id}
              className="flex cursor-pointer items-start justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:border-cyan-400/20"
              onClick={() => navigate("/taskManager")}
            >
              <div className="min-w-0">
                <p className="font-semibold text-white">{task.title}</p>
                <p className="mt-1 text-xs text-slate-400">
                  {task.assignedTo?.fullName || "Unassigned"}
                  {task.dueDate && ` · Due ${new Date(task.dueDate).toLocaleDateString()}`}
                </p>
              </div>
              <StatusBadge status={taskStatusTone(task.status)} />
            </li>
          ))
        )}
      </ul>
    </SectionCard>
  );
};

export const ApprovalsBanner = ({ count }) => {
  const navigate = useNavigate();
  if (!count) return null;
  return (
    <button
      type="button"
      onClick={() => navigate("/approvals")}
      className="mb-6 flex w-full items-center justify-between gap-4 rounded-2xl border border-amber-400/25 bg-gradient-to-r from-amber-400/10 to-orange-400/5 px-5 py-4 text-left transition hover:border-amber-400/40"
    >
      <div>
        <p className="font-semibold text-amber-100">{count} approval{count !== 1 ? "s" : ""} waiting</p>
        <p className="mt-1 text-sm text-amber-200/70">Cross-department requests need your review</p>
      </div>
      <span className="btn btn-primary shrink-0 text-xs">Open inbox</span>
    </button>
  );
};
