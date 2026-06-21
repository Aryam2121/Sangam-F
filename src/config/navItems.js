import { BiBookAlt, BiHome, BiStats, BiTask, BiTrain, BiCurrentLocation, BiMessageRounded, BiGlobe, BiTransfer, BiMoney, BiShield, BiBroadcast, BiPlug } from "react-icons/bi";

export const SHARED_NAV = {
  dashboard: { to: "/", icon: BiHome, label: "Dashboard", match: (p) => p === "/" || p === "/dashboard" },
  kpi: { to: "/city-kpi", icon: BiStats, label: "City KPIs", adminOnly: false },
  tasks: { to: "/taskManager", icon: BiTask, label: "Tasks" },
  projects: { to: "/projects", icon: BiBookAlt, label: "Projects" },
  resources: { to: "/resources", icon: BiStats, label: "Resources" },
  training: { to: "/training", icon: BiTrain, label: "Training" },
  discussion: { to: "/discussion", icon: BiMessageRounded, label: "Discussion" },
  cityMap: { to: "/city-map", icon: BiGlobe, label: "City Map" },
  workflow: { to: "/workflow", icon: BiTransfer, label: "Workflow" },
  budget: { to: "/budget", icon: BiMoney, label: "Budget", adminOnly: true },
  announcements: { to: "/announcements", icon: BiBroadcast, label: "Announcements" },
  audit: { to: "/audit", icon: BiShield, label: "Audit Trail", adminOnly: true },
  integrations: { to: "/integrations", icon: BiPlug, label: "Integrations", superAdminOnly: true },
  bidding: { to: "/BidSystem", icon: BiCurrentLocation, label: "Bidding", adminOnly: true },
  departments: { to: "/department", icon: BiCurrentLocation, label: "Departments", adminOnly: true },
  costReduction: { to: "/costreduction", icon: BiCurrentLocation, label: "Cost Reduction", adminOnly: true },
  geoLegacy: { to: "/gisnew", icon: BiCurrentLocation, label: "GeoLocation" },
};

export const navForRole = (role) => {
  const isAdmin = role === "Main Admin" || role === "Department Admin";
  const isWorker = role === "Worker";

  const items = [
    SHARED_NAV.dashboard,
    SHARED_NAV.kpi,
    isWorker ? { ...SHARED_NAV.tasks, to: "/UserDashboard", label: "My Tasks" } : SHARED_NAV.tasks,
    SHARED_NAV.projects,
    SHARED_NAV.resources,
    SHARED_NAV.training,
    SHARED_NAV.discussion,
    SHARED_NAV.cityMap,
    SHARED_NAV.workflow,
    SHARED_NAV.announcements,
  ];

  if (isAdmin) {
    items.push(
      SHARED_NAV.budget,
      SHARED_NAV.audit,
      SHARED_NAV.bidding,
      SHARED_NAV.departments,
      SHARED_NAV.costReduction
    );
    if (role === "Main Admin") {
      items.push(SHARED_NAV.integrations);
    }
  } else if (role === "Officer") {
    items.push({ ...SHARED_NAV.bidding, to: "/BidSystem", adminOnly: false });
  }

  return items.filter((item) => !item.adminOnly || isAdmin);
};
