export const buildTaskProgressMap = (tasks = []) => {
  const map = {};
  tasks.forEach((task) => {
    const projectId = String(task.project?._id || task.project || "");
    if (!projectId) return;
    if (!map[projectId]) map[projectId] = { total: 0, completed: 0 };
    map[projectId].total += 1;
    if (task.status === "Completed") map[projectId].completed += 1;
  });
  return map;
};

export const getProjectProgressPercent = (project, taskProgressMap = {}) => {
  const status = (project?.status || "").toLowerCase();
  if (status === "completed") return 100;

  const stats = taskProgressMap[String(project?._id)];
  if (stats?.total > 0) {
    return Math.round((stats.completed / stats.total) * 100);
  }

  if (status === "pending") return 0;
  if (status === "active") return 0;
  return 0;
};
