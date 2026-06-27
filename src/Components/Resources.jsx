import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import {
  BiBox,
  BiSearch,
  BiPlus,
  BiLink,
  BiTrash,
  BiRefresh,
  BiCopy,
  BiLayer,
  BiEdit,
} from "react-icons/bi";
import { isManagerRole } from "../utils/rolePermissions";
import PageHeader from "./ui/PageHeader";
import { StatCard } from "./ui/FeatureUi";
import {
  fetchResources as apiFetchResources,
  createResource as apiCreateResource,
  updateResource as apiUpdateResource,
  deleteResource as apiDeleteResource,
  assignResource as apiAssignResource,
  fetchProjectResources,
  fetchResourceById as apiFetchResourceById,
} from "../services/sangamApi";

const TABS = [
  { id: "all", label: "All Resources" },
  { id: "assigned", label: "Assigned" },
  { id: "available", label: "Available" },
];

const truncateId = (id = "") => (id.length > 10 ? `${id.slice(0, 6)}…${id.slice(-4)}` : id);

const mapResource = (resource) => {
  const assignment = resource.assignments?.[0];
  const allocated = assignment?.quantity || 0;
  const stock = resource.stockLevel ?? 0;
  const capacity = stock > 0 ? stock : Math.max(allocated, 1);

  return {
    id: resource._id,
    name: resource.name,
    description: resource.description,
    unit: resource.unit,
    allocated,
    capacity,
    utilization: Math.min(100, Math.round((allocated / capacity) * 100)),
    assignedTo: assignment?.project?._id || assignment?.project || null,
    projectName: assignment?.project?.name || null,
  };
};

const ResourceCard = ({ resource, highlighted, onDelete, onAssign, onEdit, canManage = false }) => {
  const isAssigned = Boolean(resource.assignedTo);

  const copyId = async () => {
    try {
      await navigator.clipboard.writeText(resource.id);
      toast.success("Resource ID copied");
    } catch {
      toast.error("Could not copy ID");
    }
  };

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass-card group relative flex flex-col gap-4 p-5 transition ${
        highlighted ? "ring-2 ring-cyan-400/40" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-200">
            <BiBox className="text-xl" />
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-lg font-semibold text-white">{resource.name}</h3>
            <button
              type="button"
              onClick={copyId}
              className="mt-0.5 flex items-center gap-1 text-xs text-slate-400 hover:text-cyan-200"
              title={resource.id}
            >
              <span className="font-mono">{truncateId(resource.id)}</span>
              <BiCopy className="text-sm" />
            </button>
          </div>
        </div>
        <span
          className={`shrink-0 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wider ${
            isAssigned
              ? "bg-emerald-400/15 text-emerald-200"
              : "bg-amber-400/15 text-amber-200"
          }`}
        >
          {isAssigned ? "Assigned" : "Available"}
        </span>
      </div>

      <p className="line-clamp-2 text-sm text-slate-300">{resource.description || "No description"}</p>

      <div className="flex flex-wrap gap-2 text-xs">
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-slate-300">
          Unit: {resource.unit || "—"}
        </span>
        {resource.projectName && (
          <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-cyan-100">
            {resource.projectName}
          </span>
        )}
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
          <span>Utilization</span>
          <span className="font-medium text-slate-200">{resource.utilization}%</span>
        </div>
        <div className="progress-track">
          <div
            className={`progress-fill bg-gradient-to-r ${
              isAssigned ? "from-emerald-400 to-cyan-500" : "from-amber-400 to-orange-500"
            }`}
            style={{ width: `${resource.utilization}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-slate-500">
          {resource.allocated} / {resource.capacity} allocated
        </p>
      </div>

      <div className="mt-auto flex gap-2 border-t border-white/10 pt-4">
        {canManage && !isAssigned && (
          <button type="button" onClick={() => onAssign(resource)} className="btn btn-primary flex-1 text-xs">
            <BiLink className="text-base" />
            Assign
          </button>
        )}
        {canManage && (
          <>
            <button type="button" onClick={() => onEdit(resource)} className="btn px-3 text-xs" aria-label={`Edit ${resource.name}`}>
              <BiEdit className="text-base" />
            </button>
            <button type="button" onClick={() => onDelete(resource.id)} className="btn btn-danger px-3 text-xs" aria-label={`Delete ${resource.name}`}>
              <BiTrash className="text-base" />
            </button>
          </>
        )}
      </div>
    </motion.article>
  );
};

const Modal = ({ open, title, subtitle, onClose, children }) => (
  <AnimatePresence>
    {open && (
      <motion.div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="resource-modal-title"
          className="glass-panel w-full max-w-md p-6 shadow-2xl"
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mb-6">
            <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">{subtitle}</p>
            <h3 id="resource-modal-title" className="mt-1 text-xl font-semibold text-white">
              {title}
            </h3>
          </div>
          {children}
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

const Resources = () => {
  const navigate = useNavigate();
  const canManage = isManagerRole(localStorage.getItem("userRole"));
  const [projectId, setProjectId] = useState("");
  const [resourceId, setResourceId] = useState("");
  const [nameQuery, setNameQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [resources, setResources] = useState([]);
  const [highlightedProjectId, setHighlightedProjectId] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [newResource, setNewResource] = useState({ name: "", description: "", unit: "" });
  const [editResource, setEditResource] = useState({ id: "", name: "", description: "", unit: "" });
  const [assignResource, setAssignResource] = useState({
    resourceId: "",
    projectId: "",
    quantity: 0,
  });

  const fetchResources = async () => {
    try {
      setError("");
      const data = await apiFetchResources();
      setResources(Array.isArray(data) ? data.map(mapResource) : []);
    } catch (fetchError) {
      console.error("Error fetching resources:", fetchError);
      setError("Failed to load resources.");
      toast.error("Failed to load resources");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, []);

  const stats = useMemo(() => {
    const assigned = resources.filter((r) => r.assignedTo).length;
    return {
      total: resources.length,
      assigned,
      available: resources.length - assigned,
    };
  }, [resources]);

  const filteredResources = useMemo(() => {
    let list = resources;

    if (activeTab === "assigned") list = list.filter((r) => r.assignedTo);
    if (activeTab === "available") list = list.filter((r) => !r.assignedTo);

    if (nameQuery.trim()) {
      const q = nameQuery.toLowerCase();
      list = list.filter(
        (r) =>
          r.name?.toLowerCase().includes(q) ||
          r.description?.toLowerCase().includes(q) ||
          r.unit?.toLowerCase().includes(q) ||
          r._id?.toLowerCase().includes(q) ||
          r.id?.toLowerCase().includes(q)
      );
    }

    return list;
  }, [resources, activeTab, nameQuery]);

  const createResource = async (e) => {
    e.preventDefault();
    if (!newResource.name.trim() || !newResource.unit.trim()) {
      toast.error("Name and unit are required");
      return;
    }

    try {
      await apiCreateResource(newResource);
      setNewResource({ name: "", description: "", unit: "" });
      setIsCreateModalOpen(false);
      toast.success("Resource created successfully");
      await fetchResources();
    } catch (createError) {
      toast.error(createError.message || "Failed to create resource");
    }
  };

  const assignResourceToProject = async (e) => {
    e.preventDefault();
    if (!assignResource.resourceId || !assignResource.projectId) {
      toast.error("Resource ID and Project ID are required");
      return;
    }

    try {
      await apiAssignResource(assignResource);
      setHighlightedProjectId(assignResource.projectId);
      setAssignResource({ resourceId: "", projectId: "", quantity: 0 });
      setIsAssignModalOpen(false);
      toast.success("Resource assigned successfully");
      await fetchResources();
    } catch (assignError) {
      toast.error(assignError.message || "Failed to assign resource");
    }
  };

  const deleteResource = async (id) => {
    if (!window.confirm("Delete this resource? This cannot be undone.")) return;

    try {
      await apiDeleteResource(id);
      toast.success("Resource deleted");
      setResources((prev) => prev.filter((r) => r.id !== id));
    } catch (deleteError) {
      toast.error(deleteError.message || "Failed to delete resource");
    }
  };

  const openAssignFor = (resource) => {
    setAssignResource({ resourceId: resource.id, projectId: "", quantity: 10 });
    setIsAssignModalOpen(true);
  };

  const openEditFor = (resource) => {
    setEditResource({
      id: resource.id,
      name: resource.name,
      description: resource.description || "",
      unit: resource.unit || "",
    });
    setIsEditModalOpen(true);
  };

  const saveEditResource = async (e) => {
    e.preventDefault();
    try {
      await apiUpdateResource(editResource.id, {
        name: editResource.name,
        description: editResource.description,
        unit: editResource.unit,
      });
      setIsEditModalOpen(false);
      toast.success("Resource updated");
      await fetchResources();
    } catch (err) {
      toast.error(err.message || "Update failed");
    }
  };

  const fetchResourcesByProjectId = async () => {
    if (!projectId.trim()) {
      toast.error("Enter a project ID");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const list = await fetchProjectResources(projectId);
      setResources(list.map(mapResource));
      setHighlightedProjectId(projectId);
      setActiveTab("assigned");
      if (list.length === 0) {
        toast("No resources assigned to this project.", { icon: "ℹ️" });
      } else {
        toast.success("Project resources loaded");
      }
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchResourceById = async () => {
    if (!resourceId.trim()) {
      toast.error("Enter a resource ID");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const data = await apiFetchResourceById(resourceId);
      setResources([mapResource(data)]);
      setActiveTab("all");
      toast.success("Resource found");
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const resetFilters = () => {
    setProjectId("");
    setResourceId("");
    setNameQuery("");
    setActiveTab("all");
    setHighlightedProjectId("");
    setError("");
    fetchResources();
  };

  return (
    <div className="page-stack pb-12">
      <PageHeader
        kicker="Inventory"
        title="Resources Management"
        subtitle="Manage materials, track allocation, and assign resources to projects"
        actions={
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={resetFilters} className="btn">
              <BiRefresh className="text-lg" />
              Refresh
            </button>
            {canManage && (
              <>
                <button type="button" onClick={() => setIsCreateModalOpen(true)} className="btn btn-primary">
                  <BiPlus className="text-lg" />
                  Create
                </button>
                <button type="button" onClick={() => setIsAssignModalOpen(true)} className="btn">
                  <BiLink className="text-lg" />
                  Assign
                </button>
                <button type="button" onClick={() => navigate("/reallocate")} className="btn">
                  <BiLayer className="text-lg" />
                  Allocator
                </button>
              </>
            )}
          </div>
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total resources" value={stats.total} tone="cyan" />
        <StatCard label="Assigned" value={stats.assigned} tone="emerald" />
        <StatCard label="Available" value={stats.available} tone="amber" />
      </div>

      {/* Search & filters */}
      <div className="glass-panel mb-6 min-w-0 overflow-hidden p-6">
        <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-12 xl:items-end">
          <div className="min-w-0 sm:col-span-2 xl:col-span-4">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400">
              Search by name
            </label>
            <div className="relative">
              <BiSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="PVC pipe, asphalt, units..."
                className="w-full min-w-0 pl-11"
                value={nameQuery}
                onChange={(e) => setNameQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="min-w-0 xl:col-span-3">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400">
              Resource ID
            </label>
              <input
                type="text"
                className="w-full min-w-0"
                placeholder="Paste resource ID"
                value={resourceId}
                onChange={(e) => setResourceId(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchResourceById()}
              />
          </div>

          <div className="min-w-0 xl:col-span-3">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400">
              Project ID
            </label>
            <input
              type="text"
              className="w-full min-w-0"
              placeholder="Paste project ID"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchResourcesByProjectId()}
            />
          </div>

          <div className="flex min-w-0 flex-wrap gap-2 sm:col-span-2 xl:col-span-2">
            <button type="button" onClick={fetchResourceById} className="btn btn-primary flex-1 min-w-[7rem]">
              Find
            </button>
            <button type="button" onClick={fetchResourcesByProjectId} className="btn flex-1 min-w-[7rem]">
              By project
            </button>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2 border-t border-white/10 pt-5">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-2xl px-4 py-2 text-sm font-medium transition ${
                activeTab === tab.id
                  ? "bg-cyan-400/15 text-cyan-100 ring-1 ring-cyan-400/30"
                  : "bg-white/5 text-slate-300 hover:bg-white/10"
              }`}
            >
              {tab.label}
              <span className="ml-2 text-xs opacity-70">
                (
                {tab.id === "all"
                  ? stats.total
                  : tab.id === "assigned"
                    ? stats.assigned
                    : stats.available}
                )
              </span>
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          {error}
        </div>
      )}

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="glass-card p-5">
              <div className="skeleton mb-4 h-10 w-10 rounded-2xl" />
              <div className="skeleton mb-2 h-5 w-3/4" />
              <div className="skeleton mb-4 h-4 w-full" />
              <div className="skeleton h-3 w-full" />
            </div>
          ))}
        </div>
      ) : filteredResources.length === 0 ? (
        <div className="glass-panel flex flex-col items-center justify-center gap-4 p-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl border border-white/10 bg-white/5 text-3xl text-slate-400">
            <BiBox />
          </div>
          <h3 className="text-lg font-semibold text-white">No resources found</h3>
          <p className="max-w-md text-sm text-slate-400">
            {nameQuery || projectId || resourceId
              ? "Try adjusting your search or filters."
              : "Create your first resource to get started."}
          </p>
          {canManage && (
            <button type="button" onClick={() => setIsCreateModalOpen(true)} className="btn btn-primary">
              <BiPlus />
              Create Resource
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredResources.map((resource) => (
            <ResourceCard
              key={resource.id}
              resource={resource}
              highlighted={resource.assignedTo === highlightedProjectId}
              canManage={canManage}
              onDelete={deleteResource}
              onAssign={openAssignFor}
              onEdit={openEditFor}
            />
          ))}
        </div>
      )}

      {/* Edit modal */}
      <Modal open={isEditModalOpen} title="Edit Resource" subtitle="Inventory" onClose={() => setIsEditModalOpen(false)}>
        <form onSubmit={saveEditResource} className="space-y-4">
          <div>
            <label className="mb-2 block text-xs font-semibold text-slate-400">Name</label>
            <input type="text" value={editResource.name} onChange={(e) => setEditResource({ ...editResource, name: e.target.value })} required />
          </div>
          <div>
            <label className="mb-2 block text-xs font-semibold text-slate-400">Description</label>
            <textarea rows={3} value={editResource.description} onChange={(e) => setEditResource({ ...editResource, description: e.target.value })} />
          </div>
          <div>
            <label className="mb-2 block text-xs font-semibold text-slate-400">Unit</label>
            <input type="text" value={editResource.unit} onChange={(e) => setEditResource({ ...editResource, unit: e.target.value })} required />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn btn-primary flex-1">Save Changes</button>
            <button type="button" onClick={() => setIsEditModalOpen(false)} className="btn flex-1">Cancel</button>
          </div>
        </form>
      </Modal>

      {/* Create modal */}
      <Modal
        open={isCreateModalOpen}
        title="Create New Resource"
        subtitle="Inventory"
        onClose={() => setIsCreateModalOpen(false)}
      >
        <form onSubmit={createResource} className="space-y-4">
          <div>
            <label className="mb-2 block text-xs font-semibold text-slate-400">Name</label>
            <input
              type="text"
              placeholder="e.g. PVC Pipe"
              value={newResource.name}
              onChange={(e) => setNewResource({ ...newResource, name: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="mb-2 block text-xs font-semibold text-slate-400">Description</label>
            <textarea
              rows={3}
              placeholder="Brief description"
              value={newResource.description}
              onChange={(e) => setNewResource({ ...newResource, description: e.target.value })}
            />
          </div>
          <div>
            <label className="mb-2 block text-xs font-semibold text-slate-400">Unit</label>
            <input
              type="text"
              placeholder="e.g. meters, tons, units"
              value={newResource.unit}
              onChange={(e) => setNewResource({ ...newResource, unit: e.target.value })}
              required
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn btn-primary flex-1">
              Create Resource
            </button>
            <button type="button" onClick={() => setIsCreateModalOpen(false)} className="btn flex-1">
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      {/* Assign modal */}
      <Modal
        open={isAssignModalOpen}
        title="Assign to Project"
        subtitle="Allocation"
        onClose={() => setIsAssignModalOpen(false)}
      >
        <form onSubmit={assignResourceToProject} className="space-y-4">
          <div>
            <label className="mb-2 block text-xs font-semibold text-slate-400">Resource ID</label>
            <input
              type="text"
              placeholder="Resource ID"
              value={assignResource.resourceId}
              onChange={(e) =>
                setAssignResource({ ...assignResource, resourceId: e.target.value })
              }
              required
            />
          </div>
          <div>
            <label className="mb-2 block text-xs font-semibold text-slate-400">Project ID</label>
            <input
              type="text"
              placeholder="Project ID"
              value={assignResource.projectId}
              onChange={(e) =>
                setAssignResource({ ...assignResource, projectId: e.target.value })
              }
              required
            />
          </div>
          <div>
            <label className="mb-2 block text-xs font-semibold text-slate-400">Quantity</label>
            <input
              type="number"
              min={1}
              placeholder="Quantity"
              value={assignResource.quantity || ""}
              onChange={(e) =>
                setAssignResource({
                  ...assignResource,
                  quantity: Number(e.target.value),
                })
              }
              required
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn btn-primary flex-1">
              Assign Resource
            </button>
            <button type="button" onClick={() => setIsAssignModalOpen(false)} className="btn flex-1">
              Cancel
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Resources;
