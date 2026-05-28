// // import { useState } from "react";
// // import DepartmentForm from "../Components/DepartmentForm";
// // import DepartmentList from "../Components/DepartmentList";

// // const DepartmentPage = () => {
// //   const [departments, setDepartments] = useState([]);
// //   const [search, setSearch] = useState("");

// //   const addDepartment = async (name) => {
// //     try {
// //       // API call to add a department
// //       const response = await fetch(
// //         "https://backend-code-4-nnid.onrender.com/api/createDepartment",
// //         {
// //           method: "POST",
// //           headers: {
// //             "Content-Type": "application/json",
// //           },
// //           body: JSON.stringify({ name }),
// //         }
// //       );

// //       if (!response.ok) {
// //         const errorData = await response.json();
// //         throw new Error(errorData.message || "Failed to create department.");
// //       }

// //       const newDepartment = await response.json();

// //       // Update the departments state with the new department
// //       setDepartments([...departments, newDepartment.name]);
// //     } catch (error) {
// //       console.error("Error adding department:", error.message);
// //       alert(error.message); // Notify user about the error
// //     }
// //   };

// //   const editDepartment = (index, newName) => {
// //     const updatedDepartments = departments.map((dept, i) =>
// //       i === index ? newName : dept
// //     );
// //     setDepartments(updatedDepartments);
// //   };

// //   const deleteDepartment = (index) => {
// //     const updatedDepartments = departments.filter((_, i) => i !== index);
// //     setDepartments(updatedDepartments);
// //   };

// //   const filteredDepartments = departments.filter((department) =>
// //     department.toLowerCase().includes(search.toLowerCase())
// //   );

// //   return (
// //     <div className="min-h-screen bg-[#101114]  flex flex-col items-center">
// //       {/* Search Bar in Top Right Corner */}
// //       <div className="absolute top-6 right-6 w-full max-w-md">
// //         <input
// //           type="text"
// //           value={search}
// //           onChange={(e) => setSearch(e.target.value)}
// //           placeholder="Search departments..."
// //           className="w-full p-3 border border-[#101114]-400 rounded-md"
// //         />
// //       </div>

// //       {/* Single Add New Department Form */}
// //       <div className="w-full max-w-4xl p-8 bg-[#101114] shadow-lg rounded-xl  mt-16">
    

// //         <DepartmentForm onAddDepartment={addDepartment} />
// //       </div>

// //       {/* Department List */}
// //       <DepartmentList
// //         departments={filteredDepartments}
// //         onEditDepartment={editDepartment}
// //         onDeleteDepartment={deleteDepartment}
// //       />
// //     </div>
// //   );
// // };

// // export default DepartmentPage;


// import React, { useState, useEffect } from "react";
// import { ToastContainer, toast } from "react-toastify";
// import "react-toastify/dist/ReactToastify.css";
// import { motion } from "framer-motion";

// const COLORS = ["#0088FE", "#00C49F"];

// const ProjectCard = ({ id, name, startDate, description, status, tasks = [], workers, onDelete }) => {
//   const completed = 50; // Example completion percentage, replace with real data if available
//   const data = [
//     { name: "Completed", value: completed },
//     { name: "Pending", value: 100 - completed },
//   ];

//   return (
//     <motion.div
//       className="bg-gray-800 p-4 rounded-lg shadow-lg flex flex-col gap-4 group"
//       whileHover={{ scale: 1.05 }}
//       whileTap={{ scale: 0.95 }}
//       transition={{ type: "spring", stiffness: 300 }}
//     >
//       <div className="flex justify-between items-center">
//         <h3 className="font-semibold text-lg text-white">Deparment Name</h3>
//         <span
//           className={`px-3 py-1 rounded-full text-xs font-bold ${
//             status === "active" ? "bg-green-500" : "bg-red-500"
//           } text-white`}
//         >
//           {status}
//         </span>
//       </div>
//       {/* <p className="text-gray-400 text-sm">{`Start Date: ${new Date(startDate).toLocaleDateString()}`}</p> */}
//       <p className="text-gray-400 text-sm">Department Description</p>
//       {/* <p className="text-gray-400 text-sm">{`${tasks.length} tasks allocated`}</p> */}
//       <div className="flex justify-between items-center">
//         {/* <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
//           <PieChart width={80} height={80}>
//             <Pie data={data} dataKey="value" cx="50%" cy="50%" outerRadius={35} fill="#8884d8">
//               {data.map((entry, index) => (
//                 <Cell key={`cell-${index}`} fill={COLORS[index]} />
//               ))}
//             </Pie>
//           </PieChart>
//         </motion.div> */}
//         <motion.button
//           onClick={() => {
//             toast.success("Project Deleted!");
//             onDelete(id);
//           }}
//           className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-700 transition"
//           whileHover={{ scale: 1.1 }}
//           whileTap={{ scale: 0.95 }}
//         >
//           Delete
//         </motion.button>
//       </div>
//     </motion.div>
//   );
// };

// const DepartmentPage = () => {
//   const [projects, setProjects] = useState([]);
//   const [showModal, setShowModal] = useState(false);
//   const [newProject, setNewProject] = useState({
//     name: "",
//     startDate: "",
//     description: "",
//     projectAdmin: "",
//     workers: [],
//     tasks: [],
//     status: "active",
//   });

//   // Fetch Projects
//   useEffect(() => {
//     fetchProjects();
//   }, []);

//   const fetchProjects = async () => {
//     try {
//       const response = await fetch("https://sangam-c2fm.onrender.com/api/getallprojects");
//       const data = await response.json();
//       setProjects(data);
//     } catch (error) {
//       toast.error("Failed to fetch projects");
//     }
//   };

//   const createProject = async () => {
//     try {
//       const response = await fetch("https://sangam-c2fm.onrender.com/api/project", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(newProject),
//       });
//       if (response.ok) {
//         fetchProjects(); // Refresh project list
//         toast.success("Project created successfully");
//         setShowModal(false);
//         setNewProject({
//           name: "",
//           startDate: "",
//           description: "",
//           projectAdmin: "",
//           workers: [],
//           tasks: [],
//           status: "active",
//         });
//       } else {
//         toast.error("Failed to create project");
//       }
//     } catch (error) {
//       toast.error("Failed to create project");
//     }
//   };

//   const handleDeleteProject = (id) => {
//     setProjects(projects.filter((project) => project._id !== id));
//   };

//   return (
//   <div className="p-6 bg-[#101114] min-h-screen text-white">

//       <div className="flex justify-between items-center mb-6">
//         <h2 className="text-3xl font-semibold">All Department</h2>
//         <motion.button
//           onClick={() => setShowModal(true)}
//           className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition"
//           whileHover={{ scale: 1.1 }}
//           whileTap={{ scale: 0.95 }}
//         >
//           Add New Department
//         </motion.button>
//       </div>

//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//         {projects.length > 0 ? (
//           projects.map((project) => (
//             <ProjectCard
//               key={project._id}
//               id={project._id}
//               name={project.name}
//               startDate={project.startDate}
//               description={project.description}
//               status={project.status}
//               tasks={project.taskIds}
//               workers={project.workers}
//               onDelete={handleDeleteProject}
//             />
//           ))
//         ) : (
//           <p>No projects available</p>
//         )}
//       </div>

//       {showModal && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
//           <div className="bg-gray-800 p-6 rounded-lg w-full max-w-lg shadow-lg">
//             <h3 className="text-xl font-semibold mb-4">Add New Department</h3>
//             <input
//               type="text"
//               placeholder="Department Name"
//               value={newProject.name}
//               onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
//               className="p-2 bg-gray-700 text-white border border-gray-600 rounded-md mb-4 w-full"
//             />
//             <textarea
//               placeholder="Description"
//               value={newProject.description}
//               onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
//               className="p-2 bg-gray-700 text-white border border-gray-600 rounded-md mb-4 w-full"
//             />
            
//             <div className="flex justify-end gap-4 mt-4">
//               <motion.button
//                 onClick={() => setShowModal(false)}
//                 className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-700 transition"
//                 whileHover={{ scale: 1.1 }}
//                 whileTap={{ scale: 0.95 }}
//               >
//                 Cancel
//               </motion.button>
//               <motion.button
//                 onClick={createProject}
//                 className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition"
//                 whileHover={{ scale: 1.1 }}
//                 whileTap={{ scale: 0.95 }}
//               >
//                 Create Department
//               </motion.button>
//             </div>
//           </div>
//         </div>
//       )}


//       <ToastContainer />
//     </div>
//   );
// };

// export default DepartmentPage;


import React, { useState, useEffect } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { motion } from "framer-motion";
import axios from "axios";
import { FaSearch } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { buildApiUrl } from "../config/api";
import PageHeader from "../Components/ui/PageHeader";
import {
  fetchDepartments as apiFetchDepartments,
  createDepartment as apiCreateDepartment,
  updateDepartment as apiUpdateDepartment,
  deleteDepartment as apiDeleteDepartment,
} from "../services/sangamApi";
import { BiEdit, BiTrash } from "react-icons/bi";


  

  const DepartmentCard = ({ id, name, description, onEdit, onDelete }) => {
  const navigate = useNavigate();

  return (
    <motion.div
      className="glass-card group relative flex flex-col gap-4 overflow-hidden p-6"
      whileHover={{ scale: 1.02 }}
    >
      <button
        type="button"
        onClick={() => navigate("/departmentdetails", { state: { name, id } })}
        className="flex flex-1 flex-col gap-3 text-left"
      >
        <h3 className="text-xl font-semibold text-white">{name}</h3>
        <p className="text-sm text-slate-300 line-clamp-3">{description}</p>
      </button>
      <div className="flex gap-2 border-t border-white/10 pt-3">
        <button type="button" onClick={() => onEdit({ _id: id, name, description })} className="btn flex-1 text-xs">
          <BiEdit /> Edit
        </button>
        <button type="button" onClick={() => onDelete(id)} className="btn btn-danger px-3 text-xs">
          <BiTrash />
        </button>
      </div>
    </motion.div>
  );
};

const DepartmentPage = () => {
  const [departments, setDepartments] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredDepartments, setFilteredDepartments] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [newDepartment, setNewDepartment] = useState({ name: "", description: "" });
  const [editDepartment, setEditDepartment] = useState({ _id: "", name: "", description: "" });

  // Fetch Departments
  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    const q = searchQuery.trim().toLowerCase();
    setFilteredDepartments(
      departments.filter((department) => {
        if (!q) return true;
        const name = (department.name || "").toLowerCase();
        const desc = (department.description || "").toLowerCase();
        return name.includes(q) || desc.includes(q);
      })
    );
  }, [searchQuery, departments]);

  const fetchDepartments = async () => {
    try {
      const data = await apiFetchDepartments();
      setDepartments(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Failed to fetch departments");
    }
  };

  const createDepartment = async () => {
    if (!newDepartment.name.trim() || !newDepartment.description.trim()) {
      toast.error("Please fill in all fields.", {
        position: "top-right",
        autoClose: 3000,
        theme: "dark",
      });
      return;
    }
    try {
      await apiCreateDepartment(newDepartment);
      fetchDepartments();
      toast.success("Department created successfully!");
      setShowModal(false);
      setNewDepartment({ name: "", description: "" });
    } catch {
      toast.error("Failed to create department.");
    }
  };

  const handleEditDepartment = (dept) => {
    setEditDepartment({ _id: dept._id, name: dept.name, description: dept.description });
    setShowEditModal(true);
  };

  const saveEditDepartment = async () => {
    if (!editDepartment.name.trim()) {
      toast.error("Name is required");
      return;
    }
    try {
      await apiUpdateDepartment(editDepartment._id, {
        name: editDepartment.name,
        description: editDepartment.description,
      });
      fetchDepartments();
      toast.success("Department updated");
      setShowEditModal(false);
    } catch {
      toast.error("Failed to update department");
    }
  };

  const handleDeleteDepartment = async (id) => {
    if (!window.confirm("Delete this department?")) return;
    try {
      await apiDeleteDepartment(id);
      fetchDepartments();
      toast.success("Department deleted");
    } catch {
      toast.error("Failed to delete department");
    }
  };
  return (
    <div className="page pb-10 text-white">
      <ToastContainer />
      <PageHeader
        kicker="Departments"
        title="Department Management"
        subtitle="Track teams, scopes, and active initiatives."
        actions={
          <motion.button
            type="button"
            onClick={() => setShowModal(true)}
            className="btn btn-primary"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Create Department
          </motion.button>
        }
      />

      {/* Search Bar */}
      <div className="relative mb-6">
        <input
          type="text"
          placeholder="Search Departments"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-2xl border border-white/10 bg-slate-900/70 p-3 pl-10 text-white"
        />
        <FaSearch className="absolute top-1/2 left-3 transform -translate-y-1/2 text-gray-500" />
      </div>

      {/* Department Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDepartments.length > 0 ? (
          filteredDepartments.map((department) => (
            <DepartmentCard
              key={department._id}
              id={department._id}
              name={department.name}
              description={department.description}
              onEdit={handleEditDepartment}
              onDelete={handleDeleteDepartment}
            />
          ))
        ) : (
          <div className="glass-panel col-span-full p-12 text-center text-slate-400">
            No departments available. Create one to get started.
          </div>
        )}
      </div>

      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-lg p-6">
            <h3 className="text-xl font-semibold mb-4">Edit Department</h3>
            <input
              type="text"
              placeholder="Department Name"
              value={editDepartment.name}
              onChange={(e) => setEditDepartment({ ...editDepartment, name: e.target.value })}
              className="w-full mb-4"
            />
            <textarea
              placeholder="Description"
              value={editDepartment.description}
              onChange={(e) => setEditDepartment({ ...editDepartment, description: e.target.value })}
              className="w-full mb-4"
              rows={3}
            />
            <div className="flex justify-end gap-3">
              <button type="button" onClick={saveEditDepartment} className="btn btn-primary">Save</button>
              <button type="button" onClick={() => setShowEditModal(false)} className="btn">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="glass-panel p-6 w-full max-w-lg shadow-2xl">
            <h3 className="text-xl font-semibold mb-4">Create New Department</h3>
            <input
              type="text"
              placeholder="Department Name"
              value={newDepartment.name}
              onChange={(e) =>
                setNewDepartment({ ...newDepartment, name: e.target.value })
              }
              className="w-full rounded-2xl border border-white/10 bg-slate-900/70 p-3 text-white mb-4"
            />
            <textarea
              placeholder="Description"
              value={newDepartment.description}
              onChange={(e) =>
                setNewDepartment({
                  ...newDepartment,
                  description: e.target.value,
                })
              }
              className="w-full rounded-2xl border border-white/10 bg-slate-900/70 p-3 text-white mb-4"
            />
            <div className="flex justify-end gap-4">
              <button type="button" onClick={createDepartment} className="btn btn-primary">
                Create
              </button>
              <button type="button" onClick={() => setShowModal(false)} className="btn">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DepartmentPage;
