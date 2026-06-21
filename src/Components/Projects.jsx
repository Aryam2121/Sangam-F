import React, { useState, useEffect } from "react";
import { PieChart, Pie, Cell } from "recharts";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { motion } from "framer-motion";
import { useParams, useNavigate } from "react-router-dom";
import { FaTasks, FaUser,FaCheckCircle,FaTimesCircle } from "react-icons/fa";
import {
  fetchProjects as fetchProjectsApi,
  createProject as createProjectApi,
  deleteProject,
  updateProject,
  fetchProjectById,
  createProjectMLModel,
  fetchTasks,
} from "../services/sangamApi";
import { buildTaskProgressMap, getProjectProgressPercent } from "../utils/projectProgress";
const COLORS = ["#0088FE", "#00C49F"];
const role = localStorage.getItem('userRole');

const asProjectList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.projects)) return payload.projects;
  if (Array.isArray(payload?.data?.projects)) return payload.data.projects;
  return [];
};


const ProjectCard = ({ id, name, startDate, description, status, tasks = [], workers = [], progressPct = 0, onDelete, onEdit }) => {
  const normalized = (status || "").toString().toLowerCase();
  const getStatusMeta = (s) => {
    if (s === "completed") return { badge: "badge-completed", label: "Completed" };
    if (s === "active") return { badge: "badge-active", label: "Active" };
    if (s === "pending") return { badge: "badge-pending", label: "Pending" };
    return { badge: "badge-active", label: s || "Unknown" };
  };

  const { badge, label } = getStatusMeta(normalized);
  const percent = progressPct;
  const navigate = useNavigate();

  return (
    <motion.div
      className="glass-card group relative flex cursor-pointer flex-col overflow-hidden p-5"
      whileHover={{ y: -4, scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={() => navigate(`/project/${id}`)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-xl font-semibold text-white">{name}</h3>
          <p className="mt-1 text-xs text-slate-400">Start Date: {new Date(startDate).toLocaleDateString()}</p>
        </div>
        <span className={`status-badge ${badge} shrink-0 shadow-sm`}>{label}</span>
      </div>

      <p className="mt-3 text-xs text-slate-500">
        <span className="font-semibold text-slate-400">Project ID:</span> {id}
      </p>

      <p className="mt-3 line-clamp-3 min-h-[3.75rem] text-sm text-slate-300">{description}</p>

      <div className="mt-4">
        <div className="progress-track">
          <div className="progress-fill bg-gradient-to-r from-cyan-400 to-blue-500" style={{ width: `${percent}%` }} />
        </div>
        <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
          <span>Progress</span>
          <span>{percent}%</span>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-4 text-sm text-slate-300">
          <span className="inline-flex items-center gap-1.5"><FaTasks /> {tasks.length} tasks</span>
          <span className="inline-flex items-center gap-1.5"><FaUser /> {workers.length} workers</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(id);
            }}
            className="btn btn-primary px-3 py-1.5 text-xs"
          >
            Edit
          </button>
          {role === "Main Admin" && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toast.success("Project Deleted!");
                onDelete(id);
              }}
              className="btn btn-danger px-3 py-1.5 text-xs"
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};


const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [taskProgressMap, setTaskProgressMap] = useState({});
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);  // State for edit modal
  const [selectedProject, setSelectedProject] = useState(null);
  const [newProject, setNewProject] = useState({
    name: "",
    startDate: "",
    description: "",
    departments:[],
    projectAdmin: "",
    workers: [],
    tasks: [],
    status: "active",
    resources: "",
    workerIds: [],
    taskIds: []
  });
  const [updatedProject, setUpdatedProject] = useState({
    name: "",
    description: "",
    departments: [],
    status: "active",
  });
  // Fetch Projects
  useEffect(() => {
    fetchProjects();
    fetchTasks()
      .then((tasks) => setTaskProgressMap(buildTaskProgressMap(Array.isArray(tasks) ? tasks : [])))
      .catch(() => setTaskProgressMap({}));
  }, []);


  useEffect(() => {
    setFilteredProjects(
      asProjectList(projects).filter((project) =>
        (project?.name || "").toLowerCase().includes(searchQuery.toLowerCase())
      )
    );
  }, [searchQuery, projects]);


  const fetchProjects = async () => {
    try {
      setProjectsLoading(true);
      const data = await fetchProjectsApi();
      setProjects(asProjectList(data));
    } catch (error) {
      toast.error("Failed to fetch projects");
    } finally {
      setProjectsLoading(false);
    }
  };
  const handleDeleteProject = (projectId) => {
    setProjects((prevProjects) =>
      prevProjects.filter((project) => project._id !== projectId)
    );

    deleteProject(projectId)
      .then(() => {
        console.log(`Project with ID ${projectId} deleted successfully`);
      })
      .catch((error) => {
        console.error('Error deleting project:', error);
      });
  };
  const createProject = async () => {
    try {
      await createProjectApi(newProject);
      fetchProjects(); // Refresh project list
      toast.success("Project created successfully");
      setShowModal(false);
      setNewProject({
        name: "",
        startDate: "",
        description: "",
        departments:[],
        projectAdmin: "",
        workers: [],
        tasks: [],
        status: "active",
        resources: "",
        workerIds: [],
        taskIds: []
      });
    } catch (error) {
      toast.error("Failed to create project");
    }
  };
 
 
 
  const [projectId, setProjectId] = useState("");  // Store the input project ID
  const [projectData, setProjectData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const formatDepartments = (departments = []) =>
    departments
      .map((dept) => (typeof dept === "string" ? dept : dept?.name))
      .filter(Boolean)
      .join(", ");


  // Fetch the project details based on the project ID
  const fetchProject = async () => {
    if (!projectId.trim()) return; // Don't make the API call if projectId is empty
    try {
      setLoading(true);
      setError(""); // Reset error before the new fetch
      const data = await fetchProjectById(projectId);
      console.log("Response data:", data);
      setProjectData(data);
    } catch (err) {
      console.error("Error fetching project:", err.message);
      setError(err.message || "Failed to fetch project by ID.");
    } finally {
      setLoading(false);
    }
  };
 
  const handleEditProject = (id) => {
    console.log("Editing project ID:", id); // Debugging line
    const projectToEdit = projects.find((project) => project._id === id);
    if (projectToEdit) {
      setSelectedProject(projectToEdit);
      setUpdatedProject({
        name: projectToEdit.name,
        description: projectToEdit.description,
        departments: projectToEdit.departments,
        status: projectToEdit.status,
      });
      setShowEditModal(true);
    }
  };
 
  const handleUpdateProject = async () => {
    try {
      const updatedData = await updateProject(selectedProject._id, updatedProject);
      const nextProject = updatedData?.updatedProject || updatedData;
      setProjects((prevProjects) =>
        prevProjects.map((project) =>
          project._id === nextProject._id ? nextProject : project
        )
      );
      toast.success("Project updated successfully!");
      setShowEditModal(false);  // Close the modal after successful update
    } catch (error) {
      toast.error("Error updating project");
    }
  };
  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setSelectedProject(null);  // Reset selected project
    setUpdatedProject({});  // Optionally reset updated project state
  };
  const [formData, setFormData] = useState({
    project_id: "",
    projectML_id: "",
    department: "",
    task_priority: 0,
    task_complexity: 0,
    available_resources: 0,
    resources_allocated: 0,
    communication_frequency: 0,
    historical_delay: 0,
    expected_completion_time: 0,
    actual_completion_time: 0,
    cost_estimate: 0,
    actual_cost: 0,
    site_location: "",
    latitude: 0,
    longitude: 0,
    project_start_date: "",
    project_end_date: "",
    conflict_indicator: 0,
    cost_reduction_potential: 0,
    cost_reduction_category: "",
    resource_utilization: 0,
    complexity_to_priority_ratio: 0,
    delay_factor: 0,
    adjusted_frequency: 0,
  });


  const [response, setResponse] = useState(null);
 


  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name.includes("date") || name.includes("latitude") || name.includes("longitude") || !isNaN(Number(value))
        ? Number(value) || value
        : value,
    });
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);


    try {
      const data = await createProjectMLModel(formData);
      setResponse(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
 
  return (
   
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#111827,_#020617_60%)] px-6 py-10 text-white">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur">
        <div>
          <h2 className="text-3xl font-semibold">Project Management</h2>
          <p className="mt-2 text-sm text-slate-300">Monitor progress, resources, and team allocation in real time.</p>
        </div>
      {/* Search Bar for Projects */}
      <div className="flex items-center gap-2 w-full max-w-md">
          <input
            type="text"
            placeholder="Search by Project ID"
            value={projectId}  // Use projectId here
            onChange={(e) => setProjectId(e.target.value)}  // Update projectId on change
            className="w-full rounded-md border border-white/10 bg-slate-900/70 p-2 text-sm text-slate-200 focus:border-cyan-400 focus:outline-none"
          />
          <button
            className="bg-blue-500 text-white p-3 rounded-md hover:bg-blue-600"
            onClick={fetchProject} // Trigger the fetchProject function on click
            disabled={loading}
          >
            {loading ? "Fetching..." : "Search"}
          </button>
        </div>
      </div>
     


      {/* Show the fetched project */}
      {projectData ? (
        <div className="mt-6 p-4 bg-gray-800 rounded-md">
          <h3 className="text-xl font-semibold">Project Details</h3>
          <p><strong>Name:</strong> {projectData.name}</p>
          <p><strong>Description:</strong> {projectData.description}</p>
          <p><strong>Departments:</strong> {formatDepartments(projectData.departments)}</p>
          <p><strong>Status:</strong> {projectData.status}</p>
          <p><strong>Workers:</strong> {projectData.workerIds.join(", ")}</p>
          {/* Render other project details as needed */}
        </div>
      ) : projectId && !loading && !error ? (
        <p className="mt-6 text-red-500">No project found with this ID</p>
      ) : null}


      {/* Button to create a new project */}
      {(role === 'Main Admin') && (
      <motion.button
        onClick={() => setShowModal(true)}
        className="mb-4 rounded-md bg-emerald-500 px-4 py-2 text-white hover:bg-emerald-400 transition"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        Create New Project
      </motion.button>)}


      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projectsLoading ? (
          [1, 2, 3, 4, 5, 6].map((item) => (
            <div key={item} className="glass-card p-5">
              <div className="skeleton h-6 w-2/3" />
              <div className="skeleton mt-2 h-3 w-1/3" />
              <div className="skeleton mt-4 h-4 w-full" />
              <div className="skeleton mt-2 h-4 w-5/6" />
              <div className="skeleton mt-4 h-2 w-full" />
              <div className="skeleton mt-4 h-8 w-28" />
            </div>
          ))
        ) : filteredProjects.length > 0 ? (
          filteredProjects.map((project) => (
            <ProjectCard
              key={project._id}
              id={project._id}
              name={project.name}
              startDate={project.startDate}
              description={project.description}
              departments={project.departments}
              status={project.status}
              tasks={project.taskIds}
              workers={project.workerIds || []}
              progressPct={getProjectProgressPercent(project, taskProgressMap)}
              onDelete={handleDeleteProject}
              onEdit={handleEditProject}
            />
          ))
        ) : (
          <p className="text-slate-300">No projects available</p>
        )}
      </div>


      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-gray-800 p-6 rounded-lg w-full max-w-lg shadow-lg">
            <h3 className="text-xl font-semibold mb-4">Create New Project</h3>
            <input
              type="text"
              placeholder="Project Name"
              value={newProject.name}
              onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
              className="p-2 bg-gray-700 text-white border border-gray-600 rounded-md mb-4 w-full"
            />
            <textarea
              placeholder="Description"
              value={newProject.description}
              onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
              className="p-2 bg-gray-700 text-white border border-gray-600 rounded-md mb-4 w-full"
            />
            <input
              type="text"
              placeholder="Departments (comma-separated)"
              value={newProject.departments.join(", ")}
              onChange={(e) => setNewProject({ ...newProject, departments: e.target.value.split(", ") })}
              className="p-2 bg-gray-700 text-white border border-gray-600 rounded-md mb-4 w-full"
            />
            <input
              type="text"
              placeholder="Resources (comma-separated)"
              value={newProject.resources}
              onChange={(e) => setNewProject({ ...newProject, resources: e.target.value })}
              className="p-2 bg-gray-700 text-white border border-gray-600 rounded-md mb-4 w-full"
            />
            <input
              type="text"
              placeholder="Project Admin"
              value={newProject.projectAdmin}
              onChange={(e) => setNewProject({ ...newProject, projectAdmin: e.target.value })}
              className="p-2 bg-gray-700 text-white border border-gray-600 rounded-md mb-4 w-full"
            />
            <input
              type="text"
              placeholder="Worker usernames (comma-separated)"
              value={newProject.workerIds.join(", ")}
              onChange={(e) => setNewProject({ ...newProject, workerIds: e.target.value.split(",") })}
              className="p-2 bg-gray-700 text-white border border-gray-600 rounded-md mb-4 w-full"
            />
            <input
              type="text"
              placeholder="Task IDs (comma-separated)"
              value={newProject.taskIds.join(", ")}
              onChange={(e) => setNewProject({ ...newProject, taskIds: e.target.value.split(",") })}
              className="p-2 bg-gray-700 text-white border border-gray-600 rounded-md mb-4 w-full"
            />
            <div className="flex justify-end gap-4">
              <motion.button
                onClick={() => setShowModal(false)}
                className="bg-gray-500 text-white px-4 py-2 rounded-md"
                whileHover={{ scale: 1.05 }}
              >
                Cancel
              </motion.button>
              <motion.button
                onClick={createProject}
                className="bg-green-500 text-white px-4 py-2 rounded-md"
                whileHover={{ scale: 1.05 }}
              >
                Create Project
              </motion.button>
             
            </div>
          </div>
        </div>
      )}
       {showEditModal && selectedProject && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
    <div className="bg-gray-800 p-6 rounded-lg w-full max-w-lg shadow-lg">
      <h3 className="text-xl font-semibold mb-4">Edit Project</h3>


      {/* Project Edit Form */}
      <input
        type="text"
        placeholder="Project Name"
        value={updatedProject.name}
        onChange={(e) => setUpdatedProject({ ...updatedProject, name: e.target.value })}
        className="p-2 bg-gray-700 text-white border border-gray-600 rounded-md mb-4 w-full"
      />
      <textarea
        placeholder="Description"
        value={updatedProject.description}
        onChange={(e) => setUpdatedProject({ ...updatedProject, description: e.target.value })}
        className="p-2 bg-gray-700 text-white border border-gray-600 rounded-md mb-4 w-full"
      />
      <input
        type="text"
        placeholder="Departments (comma-separated)"
        value={updatedProject.departments.join(", ")}
        onChange={(e) => setUpdatedProject({ ...updatedProject, departments: e.target.value.split(", ") })}
        className="p-2 bg-gray-700 text-white border border-gray-600 rounded-md mb-4 w-full"
      />
      <select
        value={updatedProject.status}
        onChange={(e) => setUpdatedProject({ ...updatedProject, status: e.target.value })}
        className="p-2 bg-gray-700 text-white border border-gray-600 rounded-md mb-4 w-full"
      >
        <option value="active">Active</option>
        <option value="pending">Pending</option>
        <option value="completed">Completed</option>
       
      </select> 


      {/* Buttons for Cancel and Update */}
      <div className="flex justify-end gap-4">
        <motion.button
          onClick={() => setShowEditModal(false)}
          className="bg-gray-500 text-white px-4 py-2 rounded-md"
          whileHover={{ scale: 1.05 }}
        >
          Cancel
        </motion.button>
        <motion.button
          onClick={handleUpdateProject} // Trigger the update function
          className="bg-blue-500 text-white px-4 py-2 rounded-md"
          whileHover={{ scale: 1.05 }}
        >
          Update Project
        </motion.button>
      </div>
    </div>
  </div>
)}
      <ToastContainer />
    </div>
  );
};




export default Projects;
