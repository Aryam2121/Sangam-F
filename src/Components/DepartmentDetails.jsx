import React, { useEffect, useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { fetchAllUsers, fetchProjects } from "../services/sangamApi";
import PageHeader from "./ui/PageHeader";
import { EmptyState, LoadingPanel, SectionCard, StatusBadge } from "./ui/FeatureUi";

const DepartmentDetails = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const departmentName = location.state?.name || "Department";

  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [projectsData, usersPayload] = await Promise.all([fetchProjects(), fetchAllUsers()]);
      const rawUsers = Array.isArray(usersPayload?.data) ? usersPayload.data : usersPayload;

      const filteredProjects = (projectsData || []).filter((project) =>
        (project.departments || []).some((dept) =>
          (typeof dept === "string" ? dept : dept?.name)
            ?.toLowerCase()
            .includes(departmentName.toLowerCase())
        )
      );

      const filteredUsers = (rawUsers || []).filter(
        (user) => user.department?.toLowerCase() === departmentName.toLowerCase()
      );

      setProjects(filteredProjects);
      setUsers(filteredUsers);
    } catch (err) {
      toast.error(err.message || "Failed to load department data");
    } finally {
      setLoading(false);
    }
  }, [departmentName]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <LoadingPanel label="Loading department…" />;

  return (
    <div className="page-stack pb-10">
      <PageHeader
        kicker="Department"
        title={departmentName}
        subtitle="Projects and people aligned to this division"
        actions={
          <button type="button" className="btn" onClick={() => navigate("/department")}>
            All departments
          </button>
        }
      />

      <SectionCard title="Projects" subtitle={`${projects.length} linked`}>
        {projects.length === 0 ? (
          <EmptyState title="No projects" description="No projects are assigned to this department yet." />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <button
                key={project._id}
                type="button"
                onClick={() => navigate(`/project/${project._id}`)}
                className="glass-card rounded-2xl p-5 text-left transition hover:border-cyan-400/20"
              >
                <p className="font-semibold text-white">{project.name}</p>
                <p className="mt-2 line-clamp-2 text-sm text-slate-400">{project.description}</p>
                <div className="mt-3">
                  <StatusBadge status={project.status === "active" ? "in_review" : project.status || "pending"} />
                </div>
              </button>
            ))}
          </div>
        )}
      </SectionCard>

      <SectionCard title="Team members" subtitle={`${users.length} in this department`}>
        {users.length === 0 ? (
          <EmptyState title="No users" description="No users are registered under this department." />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {users.map((user) => (
              <div key={user._id} className="glass-card rounded-2xl p-5">
                <p className="font-semibold text-white">{user.fullName || user.username}</p>
                <p className="mt-1 text-sm text-slate-400">{user.email || user.role}</p>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
};

export default DepartmentDetails;
