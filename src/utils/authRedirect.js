/** Normalize role strings from API / localStorage */
export const normalizeRole = (role) => {
  const r = String(role || "").trim();
  if (!r) return "";
  if (r.toLowerCase() === "main admin" || r === "Main Admin") return "Main Admin";
  if (r.toLowerCase() === "officer") return "Officer";
  if (r.toLowerCase() === "worker") return "Worker";
  if (r.toLowerCase() === "department admin") return "Department Admin";
  return r;
};

/** Default home route after login */
export const homePathForRole = (role) => {
  const normalized = normalizeRole(role);
  if (normalized === "Worker") return "/UserDashboard";
  return "/";
};
