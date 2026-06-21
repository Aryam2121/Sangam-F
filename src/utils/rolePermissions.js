import { normalizeRole } from "./authRedirect";

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

/** Sidebar + dashboard quick links per role */
export const quickActionsForRole = (role) => {
  const all = [
    { label: "Tasks", path: "/taskManager", desc: "Assign & update" },
    { label: "City KPIs", path: "/city-kpi", desc: "Ward & zone metrics" },
    { label: "Projects", path: "/projects", desc: "View & track" },
    { label: "Resources", path: "/resources", desc: "Inventory" },
    { label: "Workflow", path: "/workflow", desc: "Cross-dept requests" },
    { label: "City Map", path: "/city-map", desc: "Unified GIS" },
    { label: "Announcements", path: "/announcements", desc: "City updates" },
    { label: "Training", path: "/training", desc: "Learn" },
    { label: "Discussion", path: "/discussion", desc: "Collaborate" },
    { label: "Departments", path: "/department", desc: "Teams", adminOnly: true },
    { label: "Budget", path: "/budget", desc: "Spend tracking", adminOnly: true },
    { label: "Audit", path: "/audit", desc: "Activity log", adminOnly: true },
  ];

  const r = normalizeRole(role);
  return all.filter((item) => !item.adminOnly || r === "Main Admin");
};

export const statCardsForRole = (role, summary) => {
  const r = normalizeRole(role);
  const cards = [
    { title: "Projects", value: summary?.counts?.projects ?? 0, meta: "in system" },
    { title: "Tasks", value: summary?.counts?.tasks ?? 0, meta: "total tasks" },
    { title: "Resources", value: summary?.counts?.resources ?? 0, meta: "inventory items" },
  ];
  if (r === "Main Admin") {
    cards.push({ title: "Users", value: summary?.counts?.users ?? 0, meta: "registered staff" });
  }
  return cards;
};
