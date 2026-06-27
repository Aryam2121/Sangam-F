import React, { useEffect, useMemo, useState } from "react";
import Modal from "react-modal";
import { BiPlus, BiSearch, BiRefresh } from "react-icons/bi";
import toast from "react-hot-toast";
import PageHeader from "./ui/PageHeader";
import {
  EmptyState,
  Field,
  inputClass,
  selectClass,
} from "./ui/FeatureUi";
import {
  deleteTask as apiDeleteTask,
  fetchTasks,
  fetchAllUsers,
  fetchProjects,
  fetchTaskById as apiFetchTaskById,
  fetchTasksByProjectId as apiFetchTasksByProjectId,
  fetchTaskReport,
  createTask as apiCreateTask,
  updateTask,
  uploadTaskReport,
} from "../services/sangamApi";
import { isManagerRole } from "../utils/rolePermissions";

const customModalStyles = {
  content: {
    top: "50%",
    left: "50%",
    right: "auto",
    bottom: "auto",
    marginRight: "-50%",
    transform: "translate(-50%, -50%)",
    width: "90%",
    maxWidth: "520px",
    background: "rgba(15, 23, 42, 0.98)",
    color: "#e2e8f0",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "16px",
    padding: "24px",
  },
  overlay: {
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    zIndex: 10000,
    backdropFilter: "blur(4px)",
  },
};

const TaskManager = () => {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [searchTaskId, setSearchTaskId] = useState("");
  const [filterText, setFilterText] = useState("");
  const [projectId, setProjectId] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [assigneeFilter, setAssigneeFilter] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [dueFromFilter, setDueFromFilter] = useState("");
  const [dueToFilter, setDueToFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [newStatus, setNewStatus] = useState("Pending");
  const [taskReports, setTaskReports] = useState({});
  const [data, setData] = useState([]);
  const [names, setNames] = useState([]);

  const role = localStorage.getItem("userRole");
  const canManageTasks = isManagerRole(role);

  const [newTask, setNewTask] = useState({
    taskId: "",
    title: "",
    description: "",
    assignedTo: "",
    project: "",
    status: "Pending",
    dueDate: "",
  });

  const fetchData = async () => {
    try {
      const users = await fetchAllUsers();
      setData(Array.isArray(users) ? users : []);
    } catch (fetchError) {
      console.error("Error fetching users:", fetchError);
    }
  };

  const fetchNames = async () => {
    try {
      const jsonData = await fetchProjects();
      setNames(Array.isArray(jsonData) ? jsonData : []);
    } catch (fetchError) {
      console.error("Error fetching projects:", fetchError);
    }
  };

  const fetchAllTasks = async () => {
    try {
      setLoading(true);
      setError("");
      const list = await fetchTasks({
        status: statusFilter,
        assignee: assigneeFilter,
        department: departmentFilter,
        dueFrom: dueFromFilter,
        dueTo: dueToFilter,
      });
      setTasks(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error("Error fetching all tasks:", err.message);
      setError(err.message || "Failed to fetch all tasks.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    fetchNames();
    fetchAllTasks();
  }, []);

  useEffect(() => {
    fetchAllTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, assigneeFilter, departmentFilter, dueFromFilter, dueToFilter]);

  const displayedTasks = useMemo(() => {
    const q = filterText.trim().toLowerCase();
    if (!q) return tasks;
    return tasks.filter((t) => {
      const title = (t.title || "").toLowerCase();
      const desc = (t.description || "").toLowerCase();
      const id = (t._id || "").toLowerCase();
      const status = (t.status || "").toLowerCase();
      return title.includes(q) || desc.includes(q) || id.includes(q) || status.includes(q);
    });
  }, [tasks, filterText]);

  const fetchTaskById = async () => {
    if (!searchTaskId.trim()) {
      toast.error("Enter a task ID");
      return;
    }
    try {
      setLoading(true);
      setError("");
      const task = await apiFetchTaskById(searchTaskId);
      setTasks(task ? [task] : []);
    } catch (err) {
      console.error("Error fetching task:", err.message);
      setError(err.message || "Failed to fetch task by ID.");
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchTasksByProjectId = async () => {
    if (!projectId.trim()) {
      toast.error("Enter a project ID");
      return;
    }
    try {
      setLoading(true);
      setError("");
      const list = await apiFetchTasksByProjectId(projectId);
      setTasks(Array.isArray(list) ? list : []);
      if (!list?.length) {
        toast("No tasks found for this project.");
      }
    } catch (err) {
      console.error("Error fetching tasks by project:", err.message);
      setError(err.message || "Failed to fetch tasks by project ID.");
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchReportByTaskId = async (taskId) => {
    try {
      const reportData = await fetchTaskReport(taskId);
      const reportUrls = reportData?.reportUrls;
      if (Array.isArray(reportUrls)) {
        setTaskReports((prevReports) => ({
          ...prevReports,
          [taskId]: reportUrls,
        }));
      } else {
        setTaskReports((prevReports) => ({
          ...prevReports,
          [taskId]: [],
        }));
      }
    } catch (fetchError) {
      console.error("Failed to fetch report:", fetchError);
      setMessage("Failed to fetch reports.");
    }
  };

  const createTask = async () => {
    try {
      setLoading(true);
      setError("");
      await apiCreateTask({
        ...newTask,
        taskId: Number(newTask.taskId),
      });

      setNewTask({
        taskId: "",
        title: "",
        description: "",
        assignedTo: "",
        project: "",
        status: "Pending",
        dueDate: "",
      });

      setIsModalOpen(false);
      fetchAllTasks();
    } catch (err) {
      console.error("Error creating task:", err.message);
      setError(err.message || "Failed to create a new task.");
    } finally {
      setLoading(false);
    }
  };

  const updateTaskStatus = async () => {
    if (!selectedTask) return;
    try {
      await updateTask(selectedTask._id, {
        ...selectedTask,
        status: newStatus,
      });
      setIsStatusModalOpen(false);
      fetchAllTasks();
    } catch (err) {
      console.error("Error updating task:", err.message);
      setError(err.message || "Failed to update task.");
    }
  };

  const handleFileUpload = async (e, taskId) => {
    e.preventDefault();

    if (!file || file.type !== "image/png") {
      setMessage("Please upload a valid PNG file.");
      return;
    }

    setIsUploading(true);
    setMessage("");

    const formData = new FormData();
    formData.append("report", file);

    try {
      const response = await uploadTaskReport(taskId, formData);

      if (response?.report) {
        toast.success("Report uploaded successfully!");

        await updateTask(taskId, {
          status: "Submitted",
        });

        setMessage("Report uploaded successfully and status updated!");
        fetchAllTasks();
      } else {
        setMessage("Error uploading report.");
      }
    } catch (uploadError) {
      setMessage(`Error uploading file: ${uploadError.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm("Delete this task permanently?")) return;
    try {
      await apiDeleteTask(taskId);
      toast.success("Task deleted");
      setTasks((prev) => prev.filter((t) => t._id !== taskId));
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to delete task");
    }
  };

  const getStatusStyles = (status) => {
    switch (status) {
      case "Completed":
        return {
          pill: "bg-emerald-400/15 text-emerald-200 border-emerald-400/20",
          bar: "bg-emerald-400",
          label: "Completed",
          width: "100%",
        };
      case "In Progress":
        return {
          pill: "bg-amber-400/15 text-amber-200 border-amber-400/20",
          bar: "bg-amber-400",
          label: "In Progress",
          width: "62%",
        };
      case "Submitted":
        return {
          pill: "bg-cyan-400/15 text-cyan-200 border-cyan-400/20",
          bar: "bg-cyan-400",
          label: "Submitted",
          width: "82%",
        };
      default:
        return {
          pill: "bg-rose-400/15 text-rose-200 border-rose-400/20",
          bar: "bg-rose-400",
          label: status || "Pending",
          width: "28%",
        };
    }
  };

  return (
    <div className="page pb-10">
      <PageHeader
        kicker="Operations"
        title="Task Manager"
        subtitle="Track tasks, update statuses, and upload reports in one place."
        actions={
          canManageTasks && (
            <button type="button" onClick={() => setIsModalOpen(true)} className="btn btn-primary">
              <BiPlus className="text-lg" />
              Add Task
            </button>
          )
        }
      />

      {(error || message) && (
        <div className="mb-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
          {error || message}
        </div>
      )}

      <div className="glass-panel mb-6 min-w-0 overflow-hidden p-4">
        <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-12 xl:items-end">
          <div className="min-w-0 sm:col-span-2 xl:col-span-4">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400">
              Filter tasks
            </label>
            <input
              type="search"
              className="w-full min-w-0"
              placeholder="Title, status, or ID..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
            />
          </div>
          <div className="min-w-0 xl:col-span-3">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400">
              Task ID lookup
            </label>
            <input
              type="text"
              className="w-full min-w-0"
              placeholder="Exact task ID"
              value={searchTaskId}
              onChange={(e) => setSearchTaskId(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchTaskById()}
            />
          </div>
          <div className="min-w-0 xl:col-span-3">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400">
              Project ID
            </label>
            <input
              type="text"
              className="w-full min-w-0"
              placeholder="Tasks for project"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchTasksByProjectId()}
            />
          </div>
          <div className="min-w-0 xl:col-span-2">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400">Status</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full min-w-0">
              <option value="">All statuses</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Submitted">Submitted</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
          <div className="min-w-0 xl:col-span-2">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400">Assignee</label>
            <select value={assigneeFilter} onChange={(e) => setAssigneeFilter(e.target.value)} className="w-full min-w-0">
              <option value="">All assignees</option>
              {(Array.isArray(data) ? data : []).map((item) => (
                <option key={item._id} value={item._id}>
                  {item.fullName || item.username}
                </option>
              ))}
            </select>
          </div>
          <div className="min-w-0 xl:col-span-2">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400">Department</label>
            <input
              type="text"
              className="w-full min-w-0"
              placeholder="e.g. Water"
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
            />
          </div>
          <div className="min-w-0 xl:col-span-2">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400">Due from</label>
            <input type="date" className="w-full min-w-0" value={dueFromFilter} onChange={(e) => setDueFromFilter(e.target.value)} />
          </div>
          <div className="min-w-0 xl:col-span-2">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400">Due to</label>
            <input type="date" className="w-full min-w-0" value={dueToFilter} onChange={(e) => setDueToFilter(e.target.value)} />
          </div>
          <div className="flex min-w-0 flex-wrap gap-2 sm:col-span-2 xl:col-span-2">
            <button type="button" onClick={fetchTaskById} className="btn btn-primary min-w-[5.5rem] flex-1 sm:flex-none">
              <BiSearch />
              Find
            </button>
            <button
              type="button"
              onClick={() => {
                setFilterText("");
                setSearchTaskId("");
                setProjectId("");
                setStatusFilter("");
                setAssigneeFilter("");
                setDepartmentFilter("");
                setDueFromFilter("");
                setDueToFilter("");
                fetchAllTasks();
              }}
              className="btn min-w-[5.5rem] flex-1 sm:flex-none"
            >
              <BiRefresh />
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <>
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass-card p-6">
                <div className="skeleton h-6 w-1/2" />
                <div className="skeleton mt-3 h-4 w-3/4" />
                <div className="skeleton mt-6 h-16 w-full" />
              </div>
            ))}
          </>
        ) : displayedTasks.length > 0 ? (
          displayedTasks.map((task) => {
            const status = getStatusStyles(task.status);
            return (
              <div
                key={task._id}
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg"
              >
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-cyan-400 via-sky-500 to-fuchsia-500 opacity-80" />

                <div className="relative z-10 flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-xs uppercase tracking-[0.32em] text-slate-400">Task</p>
                    <h3 className="mt-2 text-2xl font-semibold leading-tight text-white">{task.title}</h3>
                  </div>
                  <span
                    className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${status.pill}`}
                  >
                    {status.label}
                  </span>
                </div>

                <p className="relative z-10 mt-4 line-clamp-3 text-sm leading-6 text-slate-300">
                  {task.description}
                </p>

                <div className="relative z-10 mt-5 grid grid-cols-1 gap-3 rounded-3xl border border-white/10 bg-white/5 p-4 sm:grid-cols-2">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">Due</p>
                    <p className="mt-1 text-sm font-medium text-slate-100">
                      {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "-"}
                    </p>
                  </div>
                  <div className="sm:text-right">
                    <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">Task ID</p>
                    <p className="mt-1 truncate text-sm font-medium text-slate-100">{task._id}</p>
                  </div>
                </div>

                <div className="relative z-10 mt-5">
                  <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-[0.25em] text-slate-500">
                    <span>Progress</span>
                    <span>{status.label}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/10">
                    <div
                      className={`h-full rounded-full ${status.bar} shadow-[0_0_16px_rgba(34,211,238,0.35)]`}
                      style={{ width: status.width }}
                    />
                  </div>
                </div>

                {Array.isArray(taskReports[task._id]) && taskReports[task._id].length > 0 && (
                  <div className="relative z-10 mt-5 rounded-3xl border border-white/10 bg-white/5 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-white">Reports</h4>
                      <span className="text-xs text-slate-400">{taskReports[task._id].length} files</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {taskReports[task._id].map((url, index) => (
                        <a
                          key={url || index}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1.5 text-xs font-medium text-cyan-100 transition hover:bg-cyan-400/20"
                        >
                          Report {index + 1}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-4 flex flex-wrap gap-3">
                  {role === "Worker" && (
                    <>
                      <input
                        type="file"
                        accept=".png"
                        onChange={(e) => setFile(e.target.files[0])}
                        className="block w-full rounded-xl border border-white/10 bg-slate-900/70 p-2 text-sm text-slate-200"
                      />
                      <button
                        onClick={(e) => handleFileUpload(e, task._id)}
                        disabled={isUploading}
                        className="btn btn-primary"
                      >
                        {isUploading ? "Uploading..." : "Upload"}
                      </button>
                    </>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTask(task);
                      setNewStatus(task.status || "Pending");
                      setIsStatusModalOpen(true);
                    }}
                    className="btn"
                  >
                    Update Status
                  </button>

                  <button type="button" onClick={() => fetchReportByTaskId(task._id)} className="btn">
                    View Reports
                  </button>

                  {canManageTasks && (
                    <button
                      type="button"
                      onClick={() => handleDeleteTask(task._id)}
                      className="btn btn-danger"
                    >
                      <BiTrash /> Delete
                    </button>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <EmptyState
            title="No tasks"
            description={
              filterText || searchTaskId || projectId
                ? "No tasks match your filters."
                : "Create a task or adjust filters to see work items."
            }
          />
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onRequestClose={() => setIsModalOpen(false)}
        style={customModalStyles}
        appElement={document.getElementById("root")}
      >
        <h3 className="mb-4 text-xl font-bold">Add New Task</h3>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createTask();
          }}
        >
          <input
            type="text"
            placeholder="Task ID"
            value={newTask.taskId}
            onChange={(e) => setNewTask({ ...newTask, taskId: e.target.value })}
            required
            className={`${inputClass} mb-4`}
          />
          <input
            type="text"
            placeholder="Title"
            value={newTask.title}
            onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
            required
            className={`${inputClass} mb-4`}
          />
          <textarea
            placeholder="Description"
            value={newTask.description}
            onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
            required
            className={`${inputClass} mb-4`}
          />

          <select
            id="username"
            value={newTask.assignedTo}
            onChange={(e) => {
              const selectedValue = e.target.value;
              setNewTask((prevTask) => ({ ...prevTask, assignedTo: selectedValue }));
            }}
            className={`${selectClass} mb-4`}
          >
            <option value="">{data.length === 0 ? "Loading..." : "Assigned To (User ID)"}</option>
            {(Array.isArray(data) ? data : []).map((item) => (
              <option className="text-white" key={item._id} value={item._id}>
                {item.username}
              </option>
            ))}
          </select>

          <select
            id="project"
            value={newTask.project}
            onChange={(e) => {
              const selectedValue = e.target.value;
              setNewTask((prevTask) => ({ ...prevTask, project: selectedValue }));
            }}
            className={`${selectClass} mb-4`}
          >
            <option value="">{names.length === 0 ? "Loading..." : "Project ID"}</option>
            {(Array.isArray(names) ? names : []).map((item) => (
              <option className="text-white" key={item._id} value={item._id}>
                {item.name}
              </option>
            ))}
          </select>

          <select
            value={newTask.status}
            onChange={(e) => setNewTask({ ...newTask, status: e.target.value })}
            className={`${inputClass} mb-4`}
          >
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Submitted">Submitted</option>
            <option value="Completed">Completed</option>
          </select>

          <input
            type="date"
            value={newTask.dueDate}
            onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
            required
            className={`${inputClass} mb-4`}
          />

          <button type="submit" className="btn btn-primary w-full">
            Add Task
          </button>
        </form>
      </Modal>

      <Modal
        isOpen={isStatusModalOpen}
        onRequestClose={() => setIsStatusModalOpen(false)}
        style={customModalStyles}
        appElement={document.getElementById("root")}
      >
        <h3 className="mb-4 text-xl font-bold">Update Task Status</h3>
        {selectedTask && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              updateTaskStatus();
            }}
          >
            <h4 className="mb-2 text-lg">Task: {selectedTask.title}</h4>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className={`${inputClass} mb-4`}
            >
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Submitted">Submitted</option>
              <option value="Completed">Completed</option>
            </select>
            <button type="submit" className="btn btn-primary">
              Update
            </button>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default TaskManager;
