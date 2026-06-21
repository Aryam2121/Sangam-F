import React, { useState, useEffect, useMemo, useCallback } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { useNavigate, useParams } from "react-router-dom";
import { FaComments, FaVideo, FaCloudUploadAlt } from "react-icons/fa";
import {
  fetchTasksByProjectId as apiFetchTasksByProjectId,
  fetchProjectResources,
  fetchProjectReport,
  uploadProjectReport,
  fetchProjectById,
} from "../services/sangamApi";

const COLORS = ["#22d3ee", "#818cf8", "#34d399", "#fbbf24", "#f87171", "#fb7185"];

const formatDepartments = (departments = []) =>
  departments
    .map((dept) => (typeof dept === "string" ? dept : dept?.name))
    .filter(Boolean)
    .join(", ") || "—";

const formatRupee = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

const buildTaskChartData = (tasks = []) => {
  if (!tasks.length) return [];

  const counts = { Completed: 0, "In Progress": 0, Pending: 0, Overdue: 0 };
  const now = Date.now();

  tasks.forEach((task) => {
    const status = task.status || "Pending";
    if (status === "Completed") counts.Completed += 1;
    else if (status === "In Progress") counts["In Progress"] += 1;
    else if (task.dueDate && new Date(task.dueDate).getTime() < now) counts.Overdue += 1;
    else counts.Pending += 1;
  });

  return Object.entries(counts)
    .filter(([, value]) => value > 0)
    .map(([name, value]) => ({ name, value }));
};

const assignmentForProject = (resource, projectId) =>
  resource.assignments?.find(
    (a) => String(a.project?._id || a.project) === String(projectId)
  );

const buildResourceChartData = (resources = [], projectId) => {
  if (!resources.length) return [];

  let allocated = 0;
  let available = 0;

  resources.forEach((resource) => {
    const assignment = assignmentForProject(resource, projectId);
    const qty = assignment?.quantity || 0;
    allocated += qty;
    available += Math.max(0, (resource.stockLevel ?? 0) - qty);
  });

  const entries = [
    { name: "Allocated to project", value: allocated },
    { name: "Available stock", value: available },
  ].filter((row) => row.value > 0);

  return entries.length ? entries : [{ name: "No quantities", value: 1 }];
};

const ProgressChart = ({ title, data, emptyLabel }) => (
  <div className="bg-gray-800 p-4 shadow-lg rounded-lg">
    <h2 className="text-lg font-semibold mb-2">{title}</h2>
    {data.length === 0 ? (
      <p className="text-sm text-gray-400">{emptyLabel}</p>
    ) : (
      <div className="grid grid-cols-2 gap-4">
        <ResponsiveContainer width="100%" height={150}>
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" outerRadius={60} label dataKey="value">
              {data.map((entry, index) => (
                <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="flex flex-col justify-center gap-1">
          {data.map((item) => (
            <p key={item.name} className="text-gray-300 text-sm font-medium">
              {item.name}: {item.value}
            </p>
          ))}
        </div>
      </div>
    )}
  </div>
);

const ProjectDetails = () => {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [project, setProject] = useState(null);
  const [projectError, setProjectError] = useState("");
  const [reports, setReports] = useState([]);
  const [activeTab, setActiveTab] = useState("Overview");
  const [resources, setResources] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [loadingResources, setLoadingResources] = useState(false);
  const [loadingProject, setLoadingProject] = useState(false);
  const [errortask, setTaskError] = useState("");
  const [errorres, setResError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTag, setFilterTag] = useState("All");
  const [showUploadModal, setShowUploadModal] = useState(false);

  const navigate = useNavigate();
  const { projectId } = useParams();

  const taskData = useMemo(() => buildTaskChartData(tasks), [tasks]);
  const resourceData = useMemo(
    () => buildResourceChartData(resources, projectId),
    [resources, projectId]
  );

  const loadProject = useCallback(async () => {
    if (!projectId) return;
    try {
      setLoadingProject(true);
      setProjectError("");
      const data = await fetchProjectById(projectId);
      setProject(data || null);
    } catch (err) {
      setProjectError(err.message || "Failed to load project.");
      setProject(null);
    } finally {
      setLoadingProject(false);
    }
  }, [projectId]);

  const loadTasks = useCallback(async () => {
    if (!projectId) return;
    try {
      setLoadingTasks(true);
      setTaskError("");
      const data = await apiFetchTasksByProjectId(projectId);
      setTasks(Array.isArray(data) ? data : []);
    } catch (err) {
      setTaskError(err.message || "Failed to fetch tasks.");
    } finally {
      setLoadingTasks(false);
    }
  }, [projectId]);

  const loadResources = useCallback(async () => {
    if (!projectId) return;
    try {
      setLoadingResources(true);
      setResError("");
      const data = await fetchProjectResources(projectId);
      setResources(Array.isArray(data) ? data : []);
    } catch (err) {
      setResError(err.message || "Failed to fetch resources.");
    } finally {
      setLoadingResources(false);
    }
  }, [projectId]);

  const loadReports = useCallback(async () => {
    if (!projectId) return;
    try {
      const data = await fetchProjectReport(projectId);
      if (Array.isArray(data?.reports)) setReports(data.reports);
      else if (Array.isArray(data?.reportUrls)) setReports(data.reportUrls);
      else if (data?.reportUrl) setReports([data.reportUrl]);
      else setReports([]);
    } catch {
      setReports([]);
    }
  }, [projectId]);

  useEffect(() => {
    loadProject();
    loadTasks();
    loadResources();
    loadReports();
  }, [loadProject, loadTasks, loadResources, loadReports]);

  const handleNavigateToAnamolyDet = () => {
    if (projectId) navigate(`/project/${projectId}/anamoly`);
  };

  const handleNavigateToGisMap = () => {
    if (projectId) navigate(`/project/${projectId}/gis`);
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === "image/png") {
      setFile(selectedFile);
    } else {
      setMessage("Please upload a PNG file.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setMessage("Please select a PNG file to upload.");
      return;
    }

    setIsLoading(true);
    setMessage("");

    const formData = new FormData();
    formData.append("report", file);

    try {
      const data = await uploadProjectReport(projectId, formData);
      if (data.success) {
        setMessage(`File uploaded successfully! Report URL: ${data.reportUrl}`);
        loadReports();
      } else {
        setMessage(`Error: ${data.message}`);
      }
    } catch (error) {
      setMessage(`Error uploading file: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const budgetUtilization =
    project?.budgetAllocated > 0
      ? Math.round((project.budgetSpent / project.budgetAllocated) * 100)
      : 0;

  const tabContent = {
    Overview: (
      <div className="space-y-3 text-sm leading-relaxed text-gray-300">
        <p>{project?.description || "No description provided for this project."}</p>
        <div className="grid gap-2 sm:grid-cols-2">
          <p><span className="text-gray-500">Status:</span> <span className="capitalize">{project?.status || "—"}</span></p>
          <p><span className="text-gray-500">Project admin:</span> {project?.projectAdmin || "—"}</p>
          <p><span className="text-gray-500">Departments:</span> {formatDepartments(project?.departments)}</p>
          <p><span className="text-gray-500">Workers:</span> {project?.workerIds?.length ?? 0}</p>
          <p><span className="text-gray-500">Tasks:</span> {tasks.length}</p>
          <p><span className="text-gray-500">Resources:</span> {project?.resources || "—"}</p>
          {(project?.zone || project?.ward || project?.district) && (
            <p className="sm:col-span-2">
              <span className="text-gray-500">Location:</span>{" "}
              {[project.zone, project.ward, project.district].filter(Boolean).join(" · ")}
            </p>
          )}
        </div>
      </div>
    ),
    Guidelines: (
      <div className="space-y-3 text-sm text-gray-300">
        <p>
          Follow department SOPs, safety protocols, and environmental compliance for{" "}
          <strong className="text-yellow-500">{project?.name || "this project"}</strong>.
        </p>
        <p>Assigned resource types: {project?.resources || "Not specified"}.</p>
        <p>
          All task updates must be logged before deadline. Escalate blockers via Workflow for cross-department issues.
        </p>
      </div>
    ),
    Timeline: (
      <div className="space-y-3 text-sm text-gray-300">
        <p>
          <span className="text-gray-500">Start:</span>{" "}
          {project?.startDate ? new Date(project.startDate).toLocaleDateString() : "—"}
        </p>
        <p>
          <span className="text-gray-500">End:</span>{" "}
          {project?.endDate ? new Date(project.endDate).toLocaleDateString() : "—"}
        </p>
        <p>
          <span className="text-gray-500">Created:</span>{" "}
          {project?.createdAt ? new Date(project.createdAt).toLocaleDateString() : "—"}
        </p>
        {tasks.length > 0 && (
          <div>
            <p className="mb-2 text-gray-500">Upcoming task deadlines</p>
            <ul className="space-y-1">
              {tasks
                .filter((t) => t.dueDate && t.status !== "Completed")
                .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
                .slice(0, 5)
                .map((t) => (
                  <li key={t._id}>
                    {t.title} — {new Date(t.dueDate).toLocaleDateString()} ({t.status})
                  </li>
                ))}
            </ul>
          </div>
        )}
      </div>
    ),
    Budget: (
      <div className="space-y-3 text-sm text-gray-300">
        <p><span className="text-gray-500">Allocated:</span> {formatRupee(project?.budgetAllocated)}</p>
        <p><span className="text-gray-500">Spent:</span> {formatRupee(project?.budgetSpent)}</p>
        <p><span className="text-gray-500">Utilization:</span> {budgetUtilization}%</p>
        {project?.budgetAllocated > 0 && project?.budgetSpent > project?.budgetAllocated && (
          <p className="text-rose-300">This project is over its allocated budget.</p>
        )}
      </div>
    ),
  };

  return (
    <div className="h-screen bg-[#101114] text-gray-200 flex flex-col overflow-y-auto">
      <div className="p-6 bg-gray-800 shadow-md relative">
        <p className="text-xs uppercase tracking-wider text-gray-500">Project</p>
        <h1 className="text-3xl font-bold text-yellow-500">
          {loadingProject ? "Loading…" : project?.name || "Project Details"}
        </h1>
        {projectError && <p className="mt-2 text-sm text-red-400">{projectError}</p>}
        <button
          className="bg-gradient-to-r from-green-400 to-blue-500 text-white py-3 px-6 rounded-full shadow-lg hover:scale-105 transition-transform duration-300 absolute top-6 right-6"
          onClick={handleNavigateToAnamolyDet}
        >
          Go to Anomaly Detection
        </button>
      </div>

      <div className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
        <div className="flex flex-col space-y-6">
          <div className="bg-gray-800 p-4 shadow-lg rounded-lg">
            <div className="flex flex-wrap gap-2 mb-4">
              {["Overview", "Guidelines", "Timeline", "Budget"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-2 px-4 rounded text-sm ${
                    activeTab === tab ? "bg-gray-700 text-yellow-500" : "bg-gray-800 text-gray-400"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
            <div>{project ? tabContent[activeTab] : <p className="text-gray-400">Loading project info…</p>}</div>
          </div>

          <ProgressChart title="Task Progress" data={taskData} emptyLabel="No tasks linked to this project yet." />

          <div className="bg-gray-800 p-4 shadow-lg rounded-lg">
            <h2 className="text-lg font-semibold mb-2">Tasks</h2>
            {loadingTasks ? (
              <p className="text-yellow-400">Loading tasks...</p>
            ) : errortask ? (
              <p className="text-red-400">{errortask}</p>
            ) : tasks.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tasks.map((task) => (
                  <div key={task._id} className="bg-gray-700 p-4 rounded shadow-md">
                    <h3 className="text-lg font-semibold text-yellow-500">{task.title}</h3>
                    <p className="text-sm text-gray-300">{task.description}</p>
                    <p className="text-sm text-gray-400">Status: {task.status}</p>
                    <p className="text-sm text-gray-400">
                      Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "—"}
                    </p>
                    <p className="text-sm text-gray-400">
                      Assigned to: {task.assignedTo?.fullName || task.assignedTo?.username || "Unassigned"}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400">No tasks available for this project.</p>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            <button className="bg-yellow-500 p-2 shadow-lg rounded-lg" onClick={() => navigate("/conflictprediction")}>
              Conflict Prediction
            </button>
            <button className="bg-red-500 p-2 shadow-lg rounded-lg" onClick={() => navigate("/departmentprediction")}>
              Department Conflict Prediction
            </button>
          </div>
        </div>

        <div className="flex flex-col space-y-6">
          <div
            className="bg-gray-800 p-6 rounded-lg shadow-lg cursor-pointer hover:bg-gray-700 transition"
            onClick={handleNavigateToGisMap}
          >
            <h2 className="text-xl font-semibold text-yellow-500">Navigate to GIS Map</h2>
            <p className="mt-2 text-sm text-gray-400">
              Open the GIS view for {project?.name || "this project"}
              {project?.location?.lat ? " with saved coordinates." : "."}
            </p>
          </div>

          <ProgressChart
            title="Resource Progress"
            data={resourceData}
            emptyLabel="No resources assigned to this project yet."
          />

          <div className="bg-gray-800 p-4 shadow-lg rounded-lg">
            <h2 className="text-lg font-semibold mb-2">Resources</h2>
            {loadingResources ? (
              <p className="text-yellow-400">Loading resources...</p>
            ) : errorres ? (
              <p className="text-red-400">{errorres}</p>
            ) : resources.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {resources.map((resource) => {
                  const assignment = assignmentForProject(resource, projectId);
                  return (
                    <div key={resource._id} className="bg-gray-700 p-4 rounded shadow-md">
                      <h3 className="text-lg font-semibold text-yellow-500">{resource.name}</h3>
                      <p className="text-sm text-gray-300">{resource.description}</p>
                      <p className="text-sm text-gray-400">Unit: {resource.unit}</p>
                      <p className="text-sm text-gray-400">
                        Assigned: {assignment?.quantity ?? 0} · Stock: {resource.stockLevel ?? 0}
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-400">No resources available for this project.</p>
            )}
          </div>

          <div className="grid grid-cols-3 gap-4">
            <button
              className="bg-yellow-500 p-4 rounded-lg flex flex-col items-center shadow-lg hover:bg-yellow-400 transition"
              onClick={() => navigate("/video-conference")}
            >
              <FaVideo className="text-white mb-2" size={28} />
              <span className="text-white text-sm font-medium">Start Meeting</span>
            </button>
            <button
              className="bg-green-500 p-4 rounded-lg flex flex-col items-center shadow-lg hover:bg-green-400 transition"
              onClick={() => navigate("/chat")}
            >
              <FaComments className="text-white mb-2" size={28} />
              <span className="text-white text-sm font-medium">Start Message</span>
            </button>
            <button
              className="bg-blue-500 p-4 rounded-lg flex flex-col items-center shadow-lg hover:bg-blue-400 transition"
              onClick={() => setShowUploadModal(true)}
            >
              <FaCloudUploadAlt className="text-white mb-2" size={28} />
              <span className="text-white text-sm font-medium">Upload File</span>
            </button>
          </div>
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg p-6 m-6 shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <input
            type="text"
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-gray-700 text-white rounded-lg p-2"
          />
          <select
            className="bg-gray-700 text-white rounded-lg p-2"
            value={filterTag}
            onChange={(e) => setFilterTag(e.target.value)}
          >
            <option>All</option>
            <option>Marketing</option>
            <option>Design</option>
            <option>Policy</option>
          </select>
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg p-6 m-6 shadow-lg mb-6">
        <h2 className="text-2xl text-white mb-4">Reports</h2>
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="py-2 px-4">Report Name</th>
              <th className="py-2 px-4">Date</th>
            </tr>
          </thead>
          <tbody>
            {reports.length === 0 ? (
              <tr>
                <td colSpan="2" className="py-4 text-center text-gray-400">
                  No reports available
                </td>
              </tr>
            ) : (
              reports.map((reportUrl, index) => (
                <tr key={index}>
                  <td className="py-2 px-4">
                    <a href={reportUrl} className="text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">
                      View Report {index + 1}
                    </a>
                  </td>
                  <td className="py-2 px-4">{new Date().toLocaleDateString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-96 shadow-lg">
            <h2 className="text-lg font-semibold mb-4">Upload New Document</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label htmlFor="report" className="block text-sm font-medium text-gray-300">
                  Choose PNG Report File
                </label>
                <input
                  type="file"
                  id="report"
                  name="report"
                  accept=".png"
                  onChange={handleFileChange}
                  className="mt-1 block w-full text-sm text-gray-200"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 disabled:bg-gray-400"
                disabled={isLoading}
              >
                {isLoading ? "Uploading..." : "Upload"}
              </button>
            </form>
            {message && (
              <div className={`mt-4 p-2 rounded-md text-center text-sm ${message.includes("success") ? "text-green-300" : "text-red-300"}`}>
                {message}
              </div>
            )}
            <button
              onClick={() => setShowUploadModal(false)}
              className="mt-4 text-white bg-red-600 rounded-lg px-4 py-2 w-full"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetails;
