import { apiFetch, buildApiUrl, fetchJson, ML_API_BASE_URL, unwrapApiData } from "../config/api";

const asList = (payload) => {
  const data = unwrapApiData(payload);
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.tasks)) return data.tasks;
  if (Array.isArray(data?.projects)) return data.projects;
  if (Array.isArray(data?.resources)) return data.resources;
  if (Array.isArray(data?.departments)) return data.departments;
  if (Array.isArray(data?.bids)) return data.bids;
  if (Array.isArray(data?.timeline)) return data.timeline;
  if (Array.isArray(data?.users)) return data.users;
  return [];
};

export const fetchDashboardSummary = () => apiFetch("/api/dashboard/summary");

export const fetchNotifications = async () => unwrapApiData(await apiFetch("/api/notifications"));

export const globalSearch = async (query) =>
  unwrapApiData(await apiFetch(`/api/search?q=${encodeURIComponent(query)}`));

export const fetchWorkerDashboard = () => apiFetch("/api/worker/dashboard");

export const fetchDepartments = async () => asList(await apiFetch("/api/getalldep"));

export const createDepartment = (body) =>
  apiFetch("/api/createDepartment", { method: "POST", body: JSON.stringify(body) });

export const updateDepartment = (id, body) =>
  apiFetch(`/api/department/${id}`, { method: "PATCH", body: JSON.stringify(body) });

export const deleteDepartment = (id) =>
  apiFetch(`/api/department/${id}`, { method: "DELETE" });

export const fetchResources = async () => asList(await apiFetch("/api/getallresources"));

export const fetchResourceById = async (resourceId) => {
  const payload = await apiFetch(`/api/resource/${resourceId}`);
  return unwrapApiData(payload) || payload;
};

export const createResource = (body) =>
  apiFetch("/api/resource", { method: "POST", body: JSON.stringify(body) });

export const updateResource = (id, body) =>
  apiFetch(`/api/resource/update/${id}`, { method: "PATCH", body: JSON.stringify(body) });

export const deleteResource = (id) =>
  apiFetch(`/api/deleteresource/${id}`, { method: "DELETE" });

export const assignResource = (body) =>
  apiFetch("/api/resource/assign", { method: "POST", body: JSON.stringify(body) });

export const fetchProjects = async () => asList(await apiFetch("/api/getallprojects"));

export const fetchProjectById = async (projectId) => {
  const payload = await apiFetch(`/api/getprojectbyid/${projectId}`);
  return payload?.project || unwrapApiData(payload);
};

export const createProject = (body) =>
  apiFetch("/api/project", { method: "POST", body: JSON.stringify(body) });

export const updateProject = (projectId, body) =>
  apiFetch(`/api/updateproject/${projectId}`, { method: "PATCH", body: JSON.stringify(body) });

export const deleteProject = (projectId) =>
  apiFetch(`/api/project/${projectId}`, { method: "DELETE" });

export const fetchProjectResources = async (projectId) => {
  const payload = await apiFetch(`/api/project/${projectId}/resources`);
  return asList(payload);
};

export const fetchProjectReport = async (projectId) => {
  const payload = await apiFetch(`/api/getReportByProjectId/${projectId}`);
  return payload?.report || unwrapApiData(payload);
};

export const deleteTask = (taskId) =>
  apiFetch(`/api/project/task/${taskId}`, { method: "DELETE" });

export const fetchTasksByUser = (userId) =>
  apiFetch(`/api/getalltasksbyuserid/${userId}`);

export const fetchTasks = (params = {}) => {
  const query = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== "")
  ).toString();
  return apiFetch(`/api/getalltasks${query ? `?${query}` : ""}`);
};

export const fetchTasksByProjectId = async (projectId) => {
  const payload = await apiFetch(`/api/project/${projectId}/tasks`);
  return asList(payload);
};

export const fetchTaskById = async (taskId) => {
  const payload = await apiFetch(`/api/project/getTaskById/${taskId}`);
  return payload?.task || unwrapApiData(payload);
};

export const createTask = (body) =>
  apiFetch("/api/project/task", { method: "POST", body: JSON.stringify(body) });

export const updateTask = (taskId, body) =>
  apiFetch(`/api/project/task/${taskId}`, { method: "PATCH", body: JSON.stringify(body) });

export const fetchTaskReport = async (taskId) => {
  const payload = await apiFetch(`/api/getreportbytaskid/${taskId}`);
  return payload?.report || unwrapApiData(payload);
};

export const uploadTaskReport = (taskId, formData) =>
  apiFetch(`/api/uploadtaskreport/${taskId}`, {
    method: "POST",
    body: formData,
    parseJson: true,
    headers: {},
  });

export const uploadProjectReport = (projectId, formData) =>
  apiFetch(`/api/uploadProjectReport/${projectId}`, {
    method: "POST",
    body: formData,
    parseJson: true,
    headers: {},
  });

export const fetchPathById = async (pathId) => {
  const payload = await apiFetch(`/api/getpathbyid/${pathId}`);
  return unwrapApiData(payload) || payload;
};

export const fetchCompletedPathById = async (pathId) => {
  const payload = await apiFetch(`/api/getcompletedpathbyid/${pathId}`);
  return unwrapApiData(payload) || payload;
};

export const fetchNewPathById = async (pathId) => {
  const payload = await apiFetch(`/api/getnewpath/${pathId}`);
  return unwrapApiData(payload) || payload;
};

export const fetchSeminars = async () => asList(await apiFetch("/api/getallseminars"));

export const createSeminar = (body) =>
  apiFetch("/api/createseminar", { method: "POST", body: JSON.stringify(body) });

export const changePassword = (body) =>
  apiFetch("/admin/change-password", { method: "POST", body: JSON.stringify(body) });

export const registerUser = (body) =>
  apiFetch("/admin/register", { method: "POST", body: JSON.stringify(body), auth: false });

export const fetchAllUsers = async () => {
  const payload = await apiFetch("/admin/getalluser");
  return asList(payload);
};

export const googleLogin = async (body) => {
  const { response, data } = await fetchJson("/admin/google-login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });

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
  });

export const logoutSession = () =>
  apiFetch("/admin/logout", { method: "POST" });

export const fetchDiscussionHistory = async (department) =>
  asList(await apiFetch(`/api/discussion/history/${encodeURIComponent(department)}`));

export const sendDiscussionMessage = (body) =>
  apiFetch("/api/discussion/send", { method: "POST", body: JSON.stringify(body) });

export const fetchChatContacts = async () => asList(await apiFetch("/api/chat/contacts"));

export const fetchChatHistory = (contact) =>
  apiFetch(`/api/chat/history/${encodeURIComponent(contact)}`);

export const sendChatMessage = (body) =>
  apiFetch("/api/chat/send", { method: "POST", body: JSON.stringify(body) });

export const assistantChat = (body) =>
  apiFetch("/api/assistant/chat", { method: "POST", body: JSON.stringify(body) });

export const createProjectMLModel = (body) =>
  apiFetch("/api/projectMLModel", { method: "POST", body: JSON.stringify(body) });

export const fetchBids = async () => asList(await apiFetch("/api/bids"));

export const createBid = (body) =>
  apiFetch("/api/bids", { method: "POST", body: JSON.stringify(body) });

export const updateBid = (bidId, body) =>
  apiFetch(`/api/bids/${bidId}`, { method: "PATCH", body: JSON.stringify(body) });

export const deleteBid = (bidId) =>
  apiFetch(`/api/bids/${bidId}`, { method: "DELETE" });

export const fetchActivityTimeline = async (params = {}) => {
  const query = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== "")
  ).toString();
  const payload = await apiFetch(`/api/activity/timeline${query ? `?${query}` : ""}`);
  return unwrapApiData(payload)?.timeline || payload?.timeline || [];
};

export const mlPredict = (path, body) =>
  apiFetch(path, {
    baseUrl: ML_API_BASE_URL,
    method: "POST",
    body: JSON.stringify(body),
    auth: false,
  });

export { buildApiUrl, fetchJson, unwrapApiData };
