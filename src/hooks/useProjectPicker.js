import { useEffect, useState } from "react";
import { fetchProjects } from "../services/sangamApi";

export const useProjectPicker = () => {
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [loadingProjects, setLoadingProjects] = useState(true);

  useEffect(() => {
    fetchProjects()
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setProjects(list);
        setSelectedProjectId(list[0]?._id || "");
      })
      .catch(() => setProjects([]))
      .finally(() => setLoadingProjects(false));
  }, []);

  return { projects, selectedProjectId, setSelectedProjectId, loadingProjects };
};

export default useProjectPicker;
