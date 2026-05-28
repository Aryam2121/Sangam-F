import React, { useEffect, useMemo, useState } from "react";
import { PieChart, Pie, Cell } from "recharts";
import { buildApiUrl } from "../config/api";
import { useAuth } from "../context/AuthContext";

const OfficerTasks = () => {
  const { userData } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const role = localStorage.getItem("userRole");

  const fetchTasks = async () => {
    try {
      setIsLoading(true);
      setError("");

      const url =
        role === "Worker" && userData?._id
          ? buildApiUrl(`/api/getalltasksbyuserid/${userData._id}`)
          : buildApiUrl("/api/getalltasks");

      const response = await fetch(url);
      const data = await response.json();
      const nextTasks = Array.isArray(data) ? data : data?.tasks || [];
      setTasks(nextTasks);
    } catch (err) {
      console.error("Failed to fetch tasks", err);
      setError("Failed to load tasks.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesSearch = task.title
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase());

      if (filter === "All") return matchesSearch;
      if (filter === "Completed") return matchesSearch && task.status === "Completed";
      if (filter === "Pending") return matchesSearch && task.status !== "Completed";
      return matchesSearch;
    });
  }, [tasks, searchTerm, filter]);

  const updateTaskStatus = async (taskId, nextStatus) => {
    try {
      await fetch(buildApiUrl(`/api/project/task/${taskId}`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      fetchTasks();
    } catch (err) {
      console.error("Failed to update task", err);
    }
  };

  return (
    <div className="min-h-screen px-6 pb-10 pt-24 text-slate-100">
      <div className="glass-panel mb-8 flex flex-wrap items-center justify-between gap-4 p-6">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Tasks</p>
          <h2 className="mt-2 text-3xl font-semibold">Officer Task Hub</h2>
          <p className="mt-2 text-sm text-slate-300">Stay ahead of deadlines and deliverables.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            placeholder="Search tasks"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-60"
          />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-40"
          >
            <option value="All">All</option>
            <option value="Completed">Completed</option>
            <option value="Pending">Pending</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="glass-panel p-6 text-center text-slate-300">Loading tasks...</div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredTasks.map((task) => (
            <div key={task._id} className="glass-card p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-white">{task.title}</h3>
                  <p className="mt-2 text-sm text-slate-300">{task.description}</p>
                </div>
                <span className="rounded-full bg-cyan-400/20 px-3 py-1 text-xs text-cyan-200">
                  {task.status}
                </span>
              </div>

              <div className="mt-4 space-y-2 text-sm text-slate-300">
                <p>Assigned to: {task.assignedTo?.fullName || "Unassigned"}</p>
                <p>Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "No date"}</p>
              </div>

              <div className="mt-6 flex items-center gap-3">
                <button
                  onClick={() => updateTaskStatus(task._id, "Completed")}
                  className="rounded-xl bg-emerald-400/20 px-4 py-2 text-xs font-semibold text-emerald-200 hover:bg-emerald-400/30"
                >
                  Mark Completed
                </button>
                <button
                  onClick={() => updateTaskStatus(task._id, "Pending")}
                  className="rounded-xl bg-amber-400/20 px-4 py-2 text-xs font-semibold text-amber-200 hover:bg-amber-400/30"
                >
                  Set Pending
                </button>
              </div>
            </div>
          ))}
          {filteredTasks.length === 0 && (
            <div className="glass-panel p-6 text-center text-slate-300">
              No tasks match your filters.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default OfficerTasks;
