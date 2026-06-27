import { normalizeRole } from "./authRedirect";
import {
  BiTask,
  BiBookAlt,
  BiStats,
  BiTransfer,
  BiGlobe,
  BiBroadcast,
  BiTrain,
  BiMessageRounded,
  BiMoney,
  BiShield,
  BiCheckCircle,
  BiChat,
} from "react-icons/bi";

/** Routes only Main Admin (and optionally Department Admin) may open */
export const ADMIN_ONLY_ROUTES = [
  "/department",
  "/departmentdetails",
  "/departmentprediction",
  "/costreduction",
  "/reallocate",
  "/conflictprediction",
  "/aryan",
  "/Bidding",
  "/ProjectManagement",
  "/budget",
  "/audit",
  "/integrations",
];

export const isMainAdmin = (role) => normalizeRole(role) === "Main Admin";

export const isAdminRole = (role) => {
  const r = normalizeRole(role);
  return r === "Main Admin" || r === "Department Admin";
};

export const canAccessRoute = (role, path) => {
  const r = normalizeRole(role);
  if (r === "Main Admin") return true;
  if (r === "Department Admin") {
    const superAdminOnly = ["/integrations", "/aryan"];
    if (superAdminOnly.some((p) => path === p || path.startsWith(`${p}/`))) return false;
    return true;
  }
  if (ADMIN_ONLY_ROUTES.some((p) => path === p || path.startsWith(`${p}/`))) {
    return false;
  }
  return true;
};

export const isOfficer = (role) => normalizeRole(role) === "Officer";

export const isWorker = (role) => normalizeRole(role) === "Worker";

/** Main Admin, Department Admin, or Officer — matches backend `managers` middleware */
export const isManagerRole = (role) => {
  const r = normalizeRole(role);
  return r === "Main Admin" || r === "Department Admin" || r === "Officer";
};

/** Sidebar + dashboard quick links per role */
export const quickActionsForRole = (role) => {
  const all = [
    { label: "Tasks", path: "/taskManager", desc: "Assign & update", icon: BiTask },
    { label: "City KPIs", path: "/city-kpi", desc: "Ward & zone metrics", icon: BiStats },
    { label: "Projects", path: "/projects", desc: "View & track", icon: BiBookAlt },
    { label: "Resources", path: "/resources", desc: "Inventory", icon: BiStats },
    { label: "Approvals", path: "/approvals", desc: "Pending reviews", icon: BiCheckCircle },
    { label: "Workflow", path: "/workflow", desc: "Cross-dept requests", icon: BiTransfer },
    { label: "City Map", path: "/city-map", desc: "Unified GIS", icon: BiGlobe },
    { label: "Messages", path: "/chat", desc: "Direct chat", icon: BiChat },
    { label: "Announcements", path: "/announcements", desc: "City updates", icon: BiBroadcast },
    { label: "Training", path: "/training", desc: "Learn", icon: BiTrain },
    { label: "Discussion", path: "/discussion", desc: "Collaborate", icon: BiMessageRounded },
    { label: "Departments", path: "/department", desc: "Teams", adminOnly: true, icon: BiBookAlt },
    { label: "Budget", path: "/budget", desc: "Spend tracking", adminOnly: true, icon: BiMoney },
    { label: "Audit", path: "/audit", desc: "Activity log", adminOnly: true, icon: BiShield },
  ];

  const r = normalizeRole(role);
  return all.filter((item) => !item.adminOnly || isAdminRole(r));
};

export const statCardsForRole = (role, summary) => {
  const r = normalizeRole(role);
  const m = summary?.metrics || {};
  const cards = [
    { label: "Projects", value: summary?.counts?.projects ?? 0, meta: "in scope", tone: "cyan" },
    { label: "Tasks", value: summary?.counts?.tasks ?? 0, meta: "total linked", tone: "violet" },
    { label: "Completed", value: m.completedTasks ?? 0, meta: "tasks done", tone: "emerald" },
    { label: "Overdue", value: m.overdueTasks ?? 0, meta: "past deadline", tone: "rose" },
    { label: "Approvals", value: m.pendingApprovals ?? 0, meta: "awaiting action", tone: "amber" },
    { label: "Resources", value: summary?.counts?.resources ?? 0, meta: "inventory", tone: "cyan" },
  ];
  if (r === "Main Admin") {
    return [
      cards[0],
      cards[1],
      { label: "Users", value: summary?.counts?.users ?? 0, meta: "registered staff", tone: "violet" },
      cards[2],
      cards[3],
      cards[4],
    ];
  }
  return cards;
};

export const workerStatCards = (data) => {
  const c = data?.counts || {};
  return [
    { label: "My tasks", value: c.myTasks ?? 0, meta: "assigned to you", tone: "cyan" },
    { label: "Completion", value: `${c.completionRate ?? 0}%`, meta: "of your tasks", tone: "emerald" },
    { label: "In progress", value: c.inProgress ?? 0, meta: "active now", tone: "violet" },
    { label: "Overdue", value: c.overdue ?? 0, meta: "needs attention", tone: "rose" },
    { label: "Projects", value: c.projects ?? 0, meta: "you're on", tone: "amber" },
    { label: "Pending", value: c.pending ?? 0, meta: "not started", tone: "cyan" },
  ];
};

export const workerQuickActions = () => [
  { label: "My tasks", path: "/taskManager", desc: "Update status", icon: BiTask },
  { label: "Discussion", path: "/discussion", desc: "Team chat", icon: BiMessageRounded },
  { label: "Messages", path: "/chat", desc: "Direct chat", icon: BiChat },
  { label: "Training", path: "/training", desc: "Learn", icon: BiTrain },
  { label: "Projects", path: "/projects", desc: "View sites", icon: BiBookAlt },
  { label: "Announcements", path: "/announcements", desc: "Updates", icon: BiBroadcast },
];
