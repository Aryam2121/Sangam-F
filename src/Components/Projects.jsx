import React, { useState, useEffect, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { FaTasks, FaUser, FaPlus } from "react-icons/fa";
import toast from "react-hot-toast";
import {
  fetchProjects as fetchProjectsApi,
  createProject as createProjectApi,
  deleteProject,
  updateProject,
  fetchTasks,
  fetchDepartments,
  fetchAllUsers,
} from "../services/sangamApi";
import { buildTaskProgressMap, getProjectProgressPercent } from "../utils/projectProgress";
import { useAuth } from "../context/AuthContext";
import { isManagerRole } from "../utils/rolePermissions";
import PageHeader from "./ui/PageHeader";
import {
  EmptyState,
  Field,
  LoadingPanel,
  SectionCard,
  StatCard,
  StatusBadge,
  inputClass,
  selectClass,
} from "./ui/FeatureUi";

const EMPTY_PROJECT = {
  name: "",
  startDate: "",
  endDate: "",
  description: "",
  departments: [],
  projectAdmin: "",
  status: "active",
  resources: "",
  workerIds: [],
  taskIds: [],
  zone: "",
  ward: "",
  district: "",
  budgetAllocated: "",
  lat: "",
  lng: "",
};

const asProjectList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.projects)) return payload.projects;
  return [];
};

const statusTone = (status) => {
  const s = (status || "").toLowerCase();
  if (s === "completed") return "approved";
  if (s === "active") return "in_review";
  return "pending";
};

const ProjectCard = ({ project, progressPct, onDelete, onEdit, canManage }) => {
  const navigate = useNavigate();

  return (
    <motion.div
      className="glass-card group relative flex cursor-pointer flex-col overflow-hidden p-5"
      whileHover={{ y: -4, scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={() => navigate(`/project/${project._id}`)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-xl font-semibold text-white">{project.name}</h3>
          <p className="mt-1 text-xs text-slate-400">
            Started {project.startDate ? new Date(project.startDate).toLocaleDateString() : "—"}
          </p>
        </div>
        <StatusBadge status={statusTone(project.status)} />
      </div>

      {(project.zone || project.district) && (
        <p className="mt-2 text-xs text-slate-500">
          {[project.zone, project.ward, project.district].filter(Boolean).join(" · ")}
        </p>
      )}

      <p className="mt-3 line-clamp-3 min-h-[3.75rem] text-sm text-slate-300">
        {project.description || "No description"}
      </p>

      <div className="mt-4">
        <div className="progress-track">
          <div
            className="progress-fill bg-gradient-to-r from-cyan-400 to-blue-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
          <span>Progress</span>
          <span>{progressPct}%</span>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-4 text-sm text-slate-300">
          <span className="inline-flex items-center gap-1.5">
            <FaTasks /> {project.taskIds?.length || 0}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <FaUser /> {project.workerIds?.length || 0}
          </span>
        </div>
        {canManage && (
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="btn btn-primary px-3 py-1.5 text-xs" onClick={() => onEdit(project)}>
              Edit
            </button>
            <button
              type="button"
              className="btn btn-danger px-3 py-1.5 text-xs"
              onClick={() => onDelete(project._id)}
            >
              Delete
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
};

const MultiSelect = ({ options, value, onChange, labelKey = "name", valueKey = "_id" }) => (
  <select
    multiple
    className={`${selectClass} min-h-[7rem]`}
    value={value}
    onChange={(e) => onChange(Array.from(e.target.selectedOptions, (o) => o.value))}
  >
    {options.map((opt) => {
      const optValue = String(opt[valueKey] ?? opt[labelKey] ?? "");
      const optLabel = opt[labelKey] || opt.username || opt.title || optValue;
      return (
        <option key={optValue} value={optValue}>
          {optLabel}
        </option>
      );
    })}
  </select>
);

const ProjectFormModal = ({ title, form, setForm, departments, users, tasks, onClose, onSubmit, submitLabel }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
    <div className="glass-panel max-h-[90vh] w-full max-w-2xl overflow-y-auto p-6">
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <form
        className="mt-5 grid gap-4 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
      >
        <Field label="Project name" className="sm:col-span-2">
          <input
            className={inputClass}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
        </Field>
        <Field label="Description" className="sm:col-span-2">
          <textarea
            className={`${inputClass} min-h-[80px]`}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            required
          />
        </Field>
        <Field label="Resource types" className="sm:col-span-2">
          <input
            className={inputClass}
            placeholder="e.g. Cement, Steel, Labour"
            value={form.resources}
            onChange={(e) => setForm({ ...form, resources: e.target.value })}
            required
          />
        </Field>
        <Field label="Project admin">
          <select
            className={selectClass}
            value={form.projectAdmin}
            onChange={(e) => setForm({ ...form, projectAdmin: e.target.value })}
            required
          >
            <option value="">Select admin</option>
            {users.map((u) => (
              <option key={u._id} value={u.username}>
                {u.fullName || u.username}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Status">
          <select
            className={selectClass}
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
          >
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
          </select>
        </Field>
        <Field label="Departments" className="sm:col-span-2">
          <MultiSelect
            options={departments}
            value={form.departments}
            onChange={(departments) => setForm({ ...form, departments })}
            labelKey="name"
            valueKey="name"
          />
          <p className="mt-1 text-xs text-slate-500">Hold Ctrl/Cmd to select multiple</p>
        </Field>
        <Field label="Workers">
          <MultiSelect
            options={users}
            value={form.workerIds}
            onChange={(workerIds) => setForm({ ...form, workerIds })}
            labelKey="username"
            valueKey="username"
          />
        </Field>
        <Field label="Tasks">
          <MultiSelect
            options={tasks}
            value={form.taskIds}
            onChange={(taskIds) => setForm({ ...form, taskIds })}
            labelKey="title"
            valueKey="_id"
          />
        </Field>
        <Field label="Zone">
          <input className={inputClass} value={form.zone} onChange={(e) => setForm({ ...form, zone: e.target.value })} />
        </Field>
        <Field label="Ward">
          <input className={inputClass} value={form.ward} onChange={(e) => setForm({ ...form, ward: e.target.value })} />
        </Field>
        <Field label="District">
          <input
            className={inputClass}
            value={form.district}
            onChange={(e) => setForm({ ...form, district: e.target.value })}
          />
        </Field>
        <Field label="Budget allocated (₹)">
          <input
            type="number"
            min="0"
            className={inputClass}
            value={form.budgetAllocated}
            onChange={(e) => setForm({ ...form, budgetAllocated: e.target.value })}
          />
        </Field>
        <Field label="Start date">
          <input
            type="date"
            className={inputClass}
            value={form.startDate}
            onChange={(e) => setForm({ ...form, startDate: e.target.value })}
          />
        </Field>
        <Field label="End date">
          <input
            type="date"
            className={inputClass}
            value={form.endDate}
            onChange={(e) => setForm({ ...form, endDate: e.target.value })}
          />
        </Field>
        <Field label="Latitude">
          <input
            type="number"
            step="any"
            className={inputClass}
            value={form.lat}
            onChange={(e) => setForm({ ...form, lat: e.target.value })}
          />
        </Field>
        <Field label="Longitude">
          <input
            type="number"
            step="any"
            className={inputClass}
            value={form.lng}
            onChange={(e) => setForm({ ...form, lng: e.target.value })}
          />
        </Field>
        <div className="flex justify-end gap-2 sm:col-span-2">
          <button type="button" className="btn" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary">
            {submitLabel}
          </button>
        </div>
      </form>
    </div>
  </div>
);

const Projects = () => {
  const { userData } = useAuth();
  const canManage = isManagerRole(userData?.role);

  const [projects, setProjects] = useState([]);
  const [taskProgressMap, setTaskProgressMap] = useState({});
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [newProject, setNewProject] = useState(EMPTY_PROJECT);
  const [editProject, setEditProject] = useState(EMPTY_PROJECT);
  const [editId, setEditId] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [users, setUsers] = useState([]);
  const [tasks, setTasks] = useState([]);

  const loadMeta = useCallback(async () => {
    try {
      const [depts, allUsers, allTasks] = await Promise.all([
        fetchDepartments(),
        fetchAllUsers(),
        fetchTasks(),
      ]);
      setDepartments(Array.isArray(depts) ? depts : []);
      setUsers(Array.isArray(allUsers) ? allUsers : []);
      setTasks(Array.isArray(allTasks) ? allTasks : []);
      setTaskProgressMap(buildTaskProgressMap(Array.isArray(allTasks) ? allTasks : []));
    } catch {
      setDepartments([]);
      setUsers([]);
      setTasks([]);
    }
  }, []);

  const fetchProjects = useCallback(async () => {
    try {
      setProjectsLoading(true);
      const data = await fetchProjectsApi();
      setProjects(asProjectList(data));
    } catch {
      toast.error("Failed to fetch projects");
    } finally {
      setProjectsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
    loadMeta();
  }, [fetchProjects, loadMeta]);

  const filteredProjects = useMemo(() => {
    return asProjectList(projects).filter((project) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        (project?.name || "").toLowerCase().includes(q) ||
        (project?.district || "").toLowerCase().includes(q) ||
        (project?.zone || "").toLowerCase().includes(q);
      const matchesStatus = statusFilter === "all" || project.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [projects, searchQuery, statusFilter]);

  const stats = useMemo(() => {
    const list = asProjectList(projects);
    return {
      total: list.length,
      active: list.filter((p) => p.status === "active").length,
      completed: list.filter((p) => p.status === "completed").length,
    };
  }, [projects]);

  const buildPayload = (form) => {
    const payload = {
      name: form.name,
      description: form.description,
      departments: form.departments,
      resources: form.resources,
      projectAdmin: form.projectAdmin,
      workerIds: form.workerIds,
      taskIds: form.taskIds,
      status: form.status,
    };
    if (form.zone) payload.zone = form.zone;
    if (form.ward) payload.ward = form.ward;
    if (form.district) payload.district = form.district;
    if (form.budgetAllocated !== "") payload.budgetAllocated = Number(form.budgetAllocated);
    if (form.startDate) payload.startDate = form.startDate;
    if (form.endDate) payload.endDate = form.endDate;
    if (form.lat && form.lng) {
      payload.location = { lat: Number(form.lat), lng: Number(form.lng) };
    }
    return payload;
  };

  const handleCreate = async () => {
    try {
      await createProjectApi(buildPayload(newProject));
      toast.success("Project created");
      setShowModal(false);
      setNewProject(EMPTY_PROJECT);
      fetchProjects();
    } catch (err) {
      toast.error(err.message || "Failed to create project");
    }
  };

  const handleUpdate = async () => {
    try {
      const updated = await updateProject(editId, buildPayload(editProject));
      const next = updated?.updatedProject || updated;
      setProjects((prev) => prev.map((p) => (p._id === editId ? { ...p, ...next } : p)));
      toast.success("Project updated");
      setShowEditModal(false);
    } catch (err) {
      toast.error(err.message || "Failed to update project");
    }
  };

  const handleDelete = async (projectId) => {
    try {
      await deleteProject(projectId);
      setProjects((prev) => prev.filter((p) => p._id !== projectId));
      toast.success("Project deleted");
    } catch {
      toast.error("Failed to delete project");
    }
  };

  const openEdit = (project) => {
    const deptNames = (project.departments || []).map((d) =>
      typeof d === "string" ? d : d?.name
    ).filter(Boolean);
    setEditId(project._id);
    setEditProject({
      name: project.name || "",
      description: project.description || "",
      departments: deptNames,
      projectAdmin: project.projectAdmin || "",
      status: project.status || "active",
      resources: project.resources || "",
      workerIds: project.workerIds || [],
      taskIds: (project.taskIds || []).map((t) => String(t._id || t)),
      zone: project.zone || "",
      ward: project.ward || "",
      district: project.district || "",
      budgetAllocated: project.budgetAllocated ?? "",
      startDate: project.startDate ? project.startDate.slice(0, 10) : "",
      endDate: project.endDate ? project.endDate.slice(0, 10) : "",
      lat: project.location?.lat ?? "",
      lng: project.location?.lng ?? "",
    });
    setShowEditModal(true);
  };

  return (
    <div className="page-stack pb-10">
      <PageHeader
        kicker="Projects"
        title="Project Management"
        subtitle="Monitor progress, geography, budget, and team allocation"
        actions={
          canManage ? (
            <button type="button" className="btn btn-primary" onClick={() => setShowModal(true)}>
              <FaPlus /> New project
            </button>
          ) : null
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total projects" value={stats.total} tone="cyan" />
        <StatCard label="Active" value={stats.active} tone="emerald" />
        <StatCard label="Completed" value={stats.completed} tone="violet" />
      </div>

      <SectionCard>
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="search"
            placeholder="Search by name, zone, or district…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`${inputClass} max-w-md flex-1`}
          />
          <div className="flex flex-wrap gap-2">
            {["all", "active", "pending", "completed"].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s)}
                className={`rounded-xl px-3 py-1.5 text-xs font-medium capitalize transition ${
                  statusFilter === s
                    ? "bg-cyan-400/15 text-cyan-200 ring-1 ring-cyan-400/30"
                    : "text-slate-400 hover:bg-white/5"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </SectionCard>

      {projectsLoading ? (
        <LoadingPanel label="Loading projects…" />
      ) : filteredProjects.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project._id}
              project={project}
              progressPct={getProjectProgressPercent(project, taskProgressMap)}
              onDelete={handleDelete}
              onEdit={openEdit}
              canManage={canManage}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No projects found"
          description={canManage ? "Create your first project to get started." : "No projects match your filters."}
          action={
            canManage ? (
              <button type="button" className="btn btn-primary" onClick={() => setShowModal(true)}>
                Create project
              </button>
            ) : null
          }
        />
      )}

      {showModal && (
        <ProjectFormModal
          title="Create new project"
          form={newProject}
          setForm={setNewProject}
          departments={departments}
          users={users}
          tasks={tasks}
          onClose={() => setShowModal(false)}
          onSubmit={handleCreate}
          submitLabel="Create project"
        />
      )}

      {showEditModal && (
        <ProjectFormModal
          title="Edit project"
          form={editProject}
          setForm={setEditProject}
          departments={departments}
          users={users}
          tasks={tasks}
          onClose={() => setShowEditModal(false)}
          onSubmit={handleUpdate}
          submitLabel="Save changes"
        />
      )}
    </div>
  );
};

export default Projects;
