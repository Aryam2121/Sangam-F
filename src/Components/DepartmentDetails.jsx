import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaSpinner } from "react-icons/fa";
import { fetchAllUsers, fetchProjects } from "../services/sangamApi";

const DepartmentDetails = () => {
  const location = useLocation();
  const departmentName = location.state?.name || "Department";

  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const projectsData = await fetchProjects();
        const usersPayload = await fetchAllUsers();
        const usersData = usersPayload;

        const filteredProjects = (projectsData || []).filter((project) => {
          const departments = project.departments || [];
          return departments.some((dept) =>
            (typeof dept === 'string' ? dept : dept?.name)
              ?.toLowerCase()
              .includes(departmentName.toLowerCase())
          );
        });

        const rawUsers = Array.isArray(usersData?.data) ? usersData.data : usersData;
        const filteredUsers = (rawUsers || []).filter((user) =>
          user.department?.toLowerCase() === departmentName.toLowerCase()
        );

        // Limit to 5 projects and users
        setProjects(filteredProjects.slice(0, 6));
        setUsers(filteredUsers.slice(0, 6));
      } catch (err) {
        setError(err.message);
        toast.error("Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="page pb-10">
      <ToastContainer />
      <div className="mx-auto max-w-6xl">
        <div className="glass-panel mb-8 p-6">
          <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Department</p>
          <h2 className="mt-3 text-4xl font-semibold text-white">{departmentName}</h2>
          <p className="mt-2 text-sm text-slate-300">Projects and people aligned to this division.</p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-[50vh]">
            <FaSpinner className="animate-spin text-white text-6xl" />
          </div>
        ) : error ? (
          <div className="text-center text-white">
            <h3 className="text-2xl">Error: {error}</h3>
            <p className="mt-4">Please try again later.</p>
          </div>
        ) : (
          <>
            {/* Projects Section */}
            <div className="mb-12">
              <h3 className="text-2xl font-semibold text-white mb-6">Projects</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.length > 0 ? (
                  projects.map((project) => (
                    <div
                      key={project._id}
                      className="glass-card p-6 transition-transform hover:-translate-y-1"
                    >
                      <h4 className="text-xl font-semibold text-white mb-2">
                        {project.name}
                      </h4>
                      <p className="text-slate-300 text-sm">{project.description}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-400">No projects available.</p>
                )}
              </div>
            </div>

            {/* Users Section */}
            <div>
              <h3 className="text-2xl font-semibold text-white mb-6">Users</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {users.length > 0 ? (
                  users.map((user) => (
                    <div
                      key={user._id}
                      className="glass-card p-6 transition-transform hover:-translate-y-1"
                    >
                      <h4 className="text-xl font-semibold text-white mb-2">
                        {user.username || user.name} {/* Use 'username' if available, otherwise fallback to 'name' */}
                      </h4>
                      <p className="text-slate-300 text-sm">{user.email}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-400">No users available.</p>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DepartmentDetails;
