import { apiFetch, buildApiUrl, unwrapApiData } from "../config/api";

const asList = (payload) => {
  const data = unwrapApiData(payload);
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.tasks)) return data.tasks;
  if (Array.isArray(data?.projects)) return data.projects;
  if (Array.isArray(data?.resources)) return data.resources;
  if (Array.isArray(data?.departments)) return data.departments;
  if (Array.isArray(data?.bids)) return data.bids;
  if (Array.isArray(data?.timeline)) return data.timeline;
  return [];
};

export const fetchDashboardSummary = () => apiFetch("/api/dashboard/summary", { auth: false });

export const fetchNotifications = async () => {
  const payload = await apiFetch("/api/notifications", { auth: false });
  return unwrapApiData(payload);
};

export const globalSearch = async (query) => {
  const payload = await apiFetch(`/api/search?q=${encodeURIComponent(query)}`, { auth: false });
  return unwrapApiData(payload);
};

export const fetchWorkerDashboard = (userId) =>
  apiFetch(`/api/worker/dashboard?userId=${encodeURIComponent(userId)}`, { auth: false });

export const fetchDepartments = async () => asList(await apiFetch("/api/getalldep", { auth: false }));

export const createDepartment = (body) =>
  apiFetch("/api/createDepartment", { method: "POST", body: JSON.stringify(body), auth: false });

export const updateDepartment = (id, body) =>
  apiFetch(`/api/department/${id}`, { method: "PATCH", body: JSON.stringify(body), auth: false });

export const deleteDepartment = (id) =>
  apiFetch(`/api/department/${id}`, { method: "DELETE", auth: false });

export const fetchResources = async () => asList(await apiFetch("/api/getallresources", { auth: false }));

export const createResource = (body) =>
  apiFetch("/api/resource", { method: "POST", body: JSON.stringify(body), auth: false });

export const updateResource = (id, body) =>
  apiFetch(`/api/resource/update/${id}`, { method: "PATCH", body: JSON.stringify(body), auth: false });

export const deleteResource = (id) =>
  apiFetch(`/api/deleteresource/${id}`, { method: "DELETE", auth: false });

export const assignResource = (body) =>
  apiFetch("/api/resource/assign", { method: "POST", body: JSON.stringify(body), auth: false });

export const fetchProjects = async () => asList(await apiFetch("/api/getallprojects", { auth: false }));

export const deleteTask = (taskId) =>
  apiFetch(`/api/project/task/${taskId}`, { method: "DELETE", auth: false });

export const fetchTasksByUser = (userId) =>
  apiFetch(`/api/getalltasksbyuserid/${userId}`, { auth: false });

export const fetchTasks = (params = {}) => {
  const query = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== "")
  ).toString();
  return apiFetch(`/api/getalltasks${query ? `?${query}` : ""}`, { auth: false });
};

export const fetchSeminars = async () => asList(await apiFetch("/api/getallseminars", { auth: false }));

export const createSeminar = (body) =>
  apiFetch("/api/createseminar", {
    method: "POST",
    body: JSON.stringify(body),
    auth: false,
  });

export const changePassword = (body) =>
  apiFetch("/admin/change-password", {
    method: "POST",
    body: JSON.stringify(body),
    auth: true,
  });

export const googleLogin = async (body) => {
  const response = await fetch(buildApiUrl("/admin/google-login"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => null);

  if (response.status === 404 && data?.data?.needsRegistration) {
    return data.data;
  }

  if (!response.ok) {
    throw new Error(data?.message || "Google sign-in failed");
  }

  return data?.data ?? data;
};

export const googleRegister = async (body) => {
  const payload = await apiFetch("/admin/google-register", {
    method: "POST",
    body: JSON.stringify(body),
    auth: false,
  });
  return unwrapApiData(payload);
};

export const saveFcmToken = (fcmToken) =>
  apiFetch("/admin/fcm-token", {
    method: "PATCH",
    body: JSON.stringify({ fcmToken }),
    auth: true,
  });

export const fetchDiscussionHistory = async (department) => {
  const payload = await apiFetch(
    `/api/discussion/history/${encodeURIComponent(department)}`,
    { auth: false }
  );
  return asList(payload);
};

export const sendDiscussionMessage = (body) =>
  apiFetch("/api/discussion/send", {
    method: "POST",
    body: JSON.stringify(body),
    auth: false,
  });

export const fetchBids = async () => {
  const payload = await apiFetch("/api/bids", { auth: false });
  return asList(payload);
};

export const createBid = (body) =>
  apiFetch("/api/bids", {
    method: "POST",
    body: JSON.stringify(body),
    auth: false,
  });

export const updateBid = (bidId, body) =>
  apiFetch(`/api/bids/${bidId}`, {
    method: "PATCH",
    body: JSON.stringify(body),
    auth: false,
  });

export const deleteBid = (bidId) =>
  apiFetch(`/api/bids/${bidId}`, {
    method: "DELETE",
    auth: false,
  });

export const fetchActivityTimeline = async (params = {}) => {
  const query = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== "")
  ).toString();
  const payload = await apiFetch(`/api/activity/timeline${query ? `?${query}` : ""}`, { auth: false });
  return unwrapApiData(payload)?.timeline || payload?.timeline || [];
};
