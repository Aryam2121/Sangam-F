import React, { useState, useEffect, useMemo, useCallback } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { useNavigate, useParams } from "react-router-dom";
import { FaComments, FaVideo, FaCloudUploadAlt, FaMapMarkedAlt, FaExclamationTriangle } from "react-icons/fa";
import {
  fetchTasksByProjectId as apiFetchTasksByProjectId,
  fetchProjectResources,
  fetchProjectReport,
  uploadProjectReport,
  fetchProjectById,
  fetchActivityTimeline,
} from "../services/sangamApi";
import PageHeader from "./ui/PageHeader";
import {
  EmptyState,
  LoadingPanel,
  SectionCard,
  StatCard,
  StatusBadge,
} from "./ui/FeatureUi";

const CHART_COLORS = ["#22d3ee", "#818cf8", "#34d399", "#fbbf24", "#f87171", "#fb7185"];

const formatDepartments = (departments = []) =>
  departments
    .map((dept) => (typeof dept === "string" ? dept : dept?.name))
    .filter(Boolean)
    .join(", ") || "—";

const formatRupee = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

const formatDate = (d) => (d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—");

const taskStatusTone = (status) => {
  const s = String(status || "").toLowerCase();
  if (s === "completed") return "approved";
  if (s === "in progress") return "in_review";
  if (s === "overdue") return "critical";
  return "pending";
};

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

  return [
    { name: "Allocated", value: allocated },
    { name: "Available stock", value: available },
  ].filter((row) => row.value > 0);
};

const ChartTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-white/10 bg-slate-950/95 px-3 py-2 text-xs shadow-xl">
      <p className="font-semibold text-white">{payload[0].name}</p>
      <p className="text-cyan-300">{payload[0].value}</p>
    </div>
  );
};

const ProgressChart = ({ title, data, emptyLabel, centerLabel }) => (
  <SectionCard title={title}>
    {data.length === 0 ? (
      <p className="text-sm text-slate-400">{emptyLabel}</p>
    ) : (
      <div className="grid items-center gap-4 sm:grid-cols-[1fr_auto]">
        <div className="relative h-52 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={52}
                outerRadius={78}
                paddingAngle={3}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} stroke="transparent" />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltip />} />
              <Legend
                verticalAlign="bottom"
                iconType="circle"
                formatter={(value) => <span className="text-xs text-slate-300">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
          {centerLabel && (
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center pb-8">
              <span className="text-2xl font-bold text-white">{centerLabel}</span>
              <span className="text-[10px] uppercase tracking-wider text-slate-500">total</span>
            </div>
          )}
        </div>
        <div className="flex flex-col gap-2">
          {data.map((item, index) => (
            <div key={item.name} className="flex items-center gap-2 text-sm">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
              />
              <span className="text-slate-400">{item.name}</span>
              <span className="ml-auto font-semibold text-white">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    )}
  </SectionCard>
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
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [activity, setActivity] = useState([]);

  const navigate = useNavigate();
  const { projectId } = useParams();

  const taskData = useMemo(() => buildTaskChartData(tasks), [tasks]);
  const resourceData = useMemo(
    () => buildResourceChartData(resources, projectId),
    [resources, projectId]
  );

  const completedTasks = useMemo(
    () => tasks.filter((t) => t.status === "Completed").length,
    [tasks]
  );
  const taskCompletionPct = tasks.length ? Math.round((completedTasks / tasks.length) * 100) : 0;
  const totalResourceQty = useMemo(
    () => resourceData.reduce((sum, row) => sum + row.value, 0),
    [resourceData]
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

  const loadActivity = useCallback(async () => {
    if (!projectId) return;
    try {
      const rows = await fetchActivityTimeline({ entityType: "project", entityId: projectId, limit: 15 });
      setActivity(Array.isArray(rows) ? rows : []);
    } catch {
      setActivity([]);
    }
  }, [projectId]);

  useEffect(() => {
    loadProject();
    loadTasks();
    loadResources();
    loadReports();
    loadActivity();
  }, [loadProject, loadTasks, loadResources, loadReports, loadActivity]);

  const budgetUtilization =
    project?.budgetAllocated > 0
      ? Math.round((project.budgetSpent / project.budgetAllocated) * 100)
      : 0;

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === "image/png") {
      setFile(selectedFile);
      setMessage("");
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
        setMessage("Report uploaded successfully.");
        setFile(null);
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

  const tabContent = {
    Overview: (
      <div className="space-y-4 text-sm leading-relaxed text-slate-300">
        <p>{project?.description || "No description provided for this project."}</p>
        <dl className="grid gap-3 sm:grid-cols-2">
          {[
            ["Status", <StatusBadge key="s" status={project?.status || "pending"} />],
            ["Project admin", project?.projectAdmin || "—"],
            ["Departments", formatDepartments(project?.departments)],
            ["Workers", project?.workerIds?.length ?? 0],
            ["Resource types", project?.resources || "—"],
            ["Tasks linked", tasks.length],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2">
              <dt className="text-xs uppercase tracking-wider text-slate-500">{label}</dt>
              <dd className="mt-1 font-medium text-white">{value}</dd>
            </div>
          ))}
          {(project?.zone || project?.ward || project?.district) && (
            <div className="rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2 sm:col-span-2">
              <dt className="text-xs uppercase tracking-wider text-slate-500">Location</dt>
              <dd className="mt-1 font-medium text-white">
                {[project.zone, project.ward, project.district].filter(Boolean).join(" · ")}
              </dd>
            </div>
          )}
        </dl>
      </div>
    ),
    Guidelines: (
      <div className="space-y-3 text-sm text-slate-300">
        <p>
          Follow department SOPs, safety protocols, and environmental compliance for{" "}
          <strong className="text-amber-300">{project?.name || "this project"}</strong>.
        </p>
        <ul className="list-inside list-disc space-y-1 text-slate-400">
          <li>Assigned resource types: {project?.resources || "Not specified"}</li>
          <li>Log all task updates before deadline</li>
          <li>Escalate blockers via Workflow for cross-department issues</li>
          <li>Maintain worker safety and public access controls on site</li>
        </ul>
      </div>
    ),
    Timeline: (
      <div className="space-y-4 text-sm text-slate-300">
        <dl className="grid gap-3 sm:grid-cols-3">
          {[
            ["Start", formatDate(project?.startDate)],
            ["End", formatDate(project?.endDate)],
            ["Created", formatDate(project?.createdAt)],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2">
              <dt className="text-xs uppercase tracking-wider text-slate-500">{label}</dt>
              <dd className="mt-1 font-medium text-white">{value}</dd>
            </div>
          ))}
        </dl>
        {tasks.length > 0 ? (
          <div>
            <p className="mb-2 text-xs uppercase tracking-wider text-slate-500">Upcoming deadlines</p>
            <ul className="space-y-2">
              {tasks
                .filter((t) => t.dueDate && t.status !== "Completed")
                .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
                .slice(0, 5)
                .map((t) => (
                  <li
                    key={t._id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2"
                  >
                    <span>{t.title}</span>
                    <span className="text-slate-500">
                      {formatDate(t.dueDate)} · <StatusBadge status={taskStatusTone(t.status)} />
                    </span>
                  </li>
                ))}
            </ul>
          </div>
        ) : (
          <p className="text-slate-500">No upcoming task deadlines.</p>
        )}
      </div>
    ),
    Budget: (
      <div className="space-y-4 text-sm text-slate-300">
        <dl className="grid gap-3 sm:grid-cols-3">
          {[
            ["Allocated", formatRupee(project?.budgetAllocated)],
            ["Spent", formatRupee(project?.budgetSpent)],
            ["Utilization", `${budgetUtilization}%`],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2">
              <dt className="text-xs uppercase tracking-wider text-slate-500">{label}</dt>
              <dd className="mt-1 text-lg font-semibold text-white">{value}</dd>
            </div>
          ))}
        </dl>
        {project?.budgetAllocated > 0 && (
          <div className="h-2 overflow-hidden rounded-full bg-white/5">
            <div
              className={`h-full rounded-full transition-all ${
                budgetUtilization > 100 ? "bg-rose-400" : "bg-cyan-400"
              }`}
              style={{ width: `${Math.min(budgetUtilization, 100)}%` }}
            />
          </div>
        )}
        {project?.budgetAllocated > 0 && project?.budgetSpent > project?.budgetAllocated && (
          <p className="text-rose-300">This project is over its allocated budget.</p>
        )}
      </div>
    ),
  };

  if (loadingProject && !project) {
    return <LoadingPanel label="Loading project details…" />;
  }

  return (
    <div className="page-stack pb-10">
      <PageHeader
        kicker="Project"
        title={project?.name || "Project Details"}
        subtitle={
          project
            ? `${formatDepartments(project.departments)} · Admin: ${project.projectAdmin || "—"}`
            : projectError || "View tasks, resources, budget & reports"
        }
        actions={
          <>
            {project?.status && <StatusBadge status={project.status} />}
            <button type="button" className="btn btn-primary" onClick={() => navigate(`/project/${projectId}/anamoly`)}>
              <FaExclamationTriangle /> Anomaly Detection
            </button>
          </>
        }
      />

      {projectError && (
        <div className="glass-panel border border-rose-400/20 p-4 text-sm text-rose-200">{projectError}</div>
      )}

      {project && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Tasks" value={tasks.length} meta={`${completedTasks} completed`} tone="cyan" />
          <StatCard label="Completion" value={`${taskCompletionPct}%`} meta="Of linked tasks" tone="emerald" />
          <StatCard label="Resources" value={resources.length} meta={`${totalResourceQty} units tracked`} tone="violet" />
          <StatCard
            label="Budget used"
            value={`${budgetUtilization}%`}
            meta={formatRupee(project.budgetSpent)}
            tone={budgetUtilization > 100 ? "rose" : "amber"}
          />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-6">
          <SectionCard>
            <div className="flex flex-wrap gap-2">
              {["Overview", "Guidelines", "Timeline", "Budget"].map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                    activeTab === tab
                      ? "bg-cyan-400/15 text-cyan-200 ring-1 ring-cyan-400/30"
                      : "text-slate-400 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
            <div className="mt-5">
              {project ? tabContent[activeTab] : <p className="text-slate-400">Loading project info…</p>}
            </div>
          </SectionCard>

          <ProgressChart
            title="Task Progress"
            data={taskData}
            emptyLabel="No tasks linked to this project yet."
            centerLabel={tasks.length || null}
          />

          <SectionCard title="Tasks" subtitle={`${tasks.length} linked to this project`}>
            {loadingTasks ? (
              <p className="text-sm text-cyan-300">Loading tasks…</p>
            ) : errortask ? (
              <p className="text-sm text-rose-300">{errortask}</p>
            ) : tasks.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {tasks.map((task) => (
                  <div key={task._id} className="glass-card p-4">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-white">{task.title}</h3>
                      <StatusBadge status={taskStatusTone(task.status)} />
                    </div>
                    {task.description && (
                      <p className="mt-2 line-clamp-2 text-sm text-slate-400">{task.description}</p>
                    )}
                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                      <span>Due {formatDate(task.dueDate)}</span>
                      <span>
                        {task.assignedTo?.fullName || task.assignedTo?.username || "Unassigned"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="No tasks yet" description="Tasks assigned to this project will appear here." />
            )}
          </SectionCard>

          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn" onClick={() => navigate("/conflictprediction")}>
              Conflict Prediction
            </button>
            <button type="button" className="btn" onClick={() => navigate("/departmentprediction")}>
              Department Conflict
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <button
            type="button"
            className="glass-card group flex items-center gap-4 p-5 text-left transition"
            onClick={() => navigate(`/project/${projectId}/gis`)}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-300">
              <FaMapMarkedAlt size={22} />
            </div>
            <div>
              <h2 className="font-semibold text-white group-hover:text-cyan-200">GIS Map</h2>
              <p className="mt-1 text-sm text-slate-400">
                {project?.location?.lat
                  ? `Coordinates saved · ${project.location.lat.toFixed(4)}, ${project.location.lng.toFixed(4)}`
                  : `Open map view for ${project?.name || "this project"}`}
              </p>
            </div>
          </button>

          <ProgressChart
            title="Resource Allocation"
            data={resourceData}
            emptyLabel="No resources assigned to this project yet."
            centerLabel={totalResourceQty || null}
          />

          <SectionCard title="Resources" subtitle={`${resources.length} assigned to this project`}>
            {loadingResources ? (
              <p className="text-sm text-cyan-300">Loading resources…</p>
            ) : errorres ? (
              <p className="text-sm text-rose-300">{errorres}</p>
            ) : resources.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {resources.map((resource) => {
                  const assignment = assignmentForProject(resource, projectId);
                  return (
                    <div key={resource._id} className="glass-card p-4">
                      <h3 className="font-semibold text-white">{resource.name}</h3>
                      {resource.description && (
                        <p className="mt-1 line-clamp-2 text-sm text-slate-400">{resource.description}</p>
                      )}
                      <div className="mt-3 flex justify-between text-xs text-slate-500">
                        <span>Unit: {resource.unit || "—"}</span>
                        <span>
                          Assigned <strong className="text-white">{assignment?.quantity ?? 0}</strong>
                          {" · "}Stock <strong className="text-white">{resource.stockLevel ?? 0}</strong>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyState title="No resources" description="Resources linked to this project will appear here." />
            )}
          </SectionCard>

          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: FaVideo, label: "Meeting", color: "text-amber-300 bg-amber-400/10", to: "/video-conference" },
              { icon: FaComments, label: "Message", color: "text-emerald-300 bg-emerald-400/10", to: "/chat" },
              { icon: FaCloudUploadAlt, label: "Upload", color: "text-sky-300 bg-sky-400/10", action: () => setShowUploadModal(true) },
            ].map(({ icon: Icon, label, color, to, action }) => (
              <button
                key={label}
                type="button"
                className="glass-card flex flex-col items-center gap-2 p-4"
                onClick={() => (action ? action() : navigate(to))}
              >
                <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${color}`}>
                  <Icon size={20} />
                </span>
                <span className="text-xs font-medium text-slate-300">{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <SectionCard title="Activity" subtitle="Recent events for this project">
        {activity.length === 0 ? (
          <p className="text-sm text-slate-400">No activity logged yet.</p>
        ) : (
          <ul className="space-y-2">
            {activity.map((row) => (
              <li
                key={row._id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2 text-sm"
              >
                <div>
                  <p className="font-medium text-white">{row.title}</p>
                  {row.description && <p className="text-xs text-slate-500">{row.description}</p>}
                </div>
                <p className="text-xs text-slate-500">
                  {row.actorName} · {new Date(row.createdAt).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      <SectionCard title="Reports" subtitle={`${reports.length} uploaded`}>
        {reports.length === 0 ? (
          <EmptyState
            title="No reports yet"
            description="Upload a PNG report using the Upload button above."
            action={
              <button type="button" className="btn btn-primary" onClick={() => setShowUploadModal(true)}>
                Upload report
              </button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wider text-slate-500">
                  <th className="py-2 pr-4">Report</th>
                  <th className="py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((reportUrl, index) => (
                  <tr key={reportUrl || index} className="border-b border-white/5">
                    <td className="py-3 pr-4 text-sm text-white">Report {index + 1}</td>
                    <td className="py-3">
                      <a
                        href={reportUrl}
                        className="text-sm text-cyan-300 hover:underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-md p-6">
            <h2 className="text-lg font-semibold text-white">Upload report</h2>
            <p className="mt-1 text-sm text-slate-400">PNG format only</p>
            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <input
                type="file"
                id="report"
                name="report"
                accept=".png"
                onChange={handleFileChange}
                className="block w-full text-sm text-slate-300 file:mr-3 file:rounded-lg file:border-0 file:bg-cyan-400/20 file:px-3 file:py-2 file:text-cyan-200"
              />
              <button type="submit" className="btn btn-primary w-full" disabled={isLoading}>
                {isLoading ? "Uploading…" : "Upload"}
              </button>
            </form>
            {message && (
              <p
                className={`mt-3 text-center text-sm ${
                  message.includes("success") ? "text-emerald-300" : "text-rose-300"
                }`}
              >
                {message}
              </p>
            )}
            <button
              type="button"
              onClick={() => {
                setShowUploadModal(false);
                setMessage("");
              }}
              className="btn mt-3 w-full"
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
