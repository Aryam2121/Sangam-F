import { useEffect, useState } from "react";
import { fetchMlPrefill, fetchProjects } from "../services/sangamApi";

export const useMlPrefill = (projectIdParam) => {
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(projectIdParam || "");
  const [prefill, setPrefill] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchProjects()
      .then((data) => setProjects(Array.isArray(data) ? data : []))
      .catch(() => setProjects([]));
  }, []);

  useEffect(() => {
    if (!selectedProjectId) return;
    setLoading(true);
    fetchMlPrefill({ projectId: selectedProjectId })
      .then((data) => setPrefill(data?.prefill || data))
      .catch(() => setPrefill(null))
      .finally(() => setLoading(false));
  }, [selectedProjectId]);

  return { projects, selectedProjectId, setSelectedProjectId, prefill, loading };
};

export const applyPrefillToForm = (prefill, setFormData) => {
  if (!prefill) return;
  setFormData((prev) => {
    const next = { ...prev };
    Object.keys(prev).forEach((key) => {
      if (prefill[key] !== undefined && prefill[key] !== null) {
        next[key] = String(prefill[key]);
      }
    });
    return next;
  });
};
