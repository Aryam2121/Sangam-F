import { useMemo, useState, useEffect } from "react";
import { MapContainer, TileLayer, Polyline, Marker } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { buildApiUrl } from "../config/api";

const Gis = () => {
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [paths, setPaths] = useState([]);
  const [completedPaths, setCompletedPaths] = useState([]);
  const [selectedPathId, setSelectedPathId] = useState("");
  const [totalDistance, setTotalDistance] = useState(0);
  const [completedDistance, setCompletedDistance] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const calculateDistance = (points = []) => {
    if (points.length < 2) return 0;
    let total = 0;
    for (let i = 0; i < points.length - 1; i += 1) {
      const { lat: lat1, lng: lon1 } = points[i];
      const { lat: lat2, lng: lon2 } = points[i + 1];
      const R = 6371;
      const dLat = ((lat2 - lat1) * Math.PI) / 180;
      const dLon = ((lon2 - lon1) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
          Math.cos((lat2 * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      total += R * c;
    }
    return total;
  };

  const selectedPath = useMemo(
    () => paths.find((path) => path._id === selectedPathId) || paths[0],
    [paths, selectedPathId]
  );

  const selectedCompletedPath = useMemo(
    () => completedPaths.find((path) => path._id === selectedPath?._id) || completedPaths[0],
    [completedPaths, selectedPath]
  );

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const response = await fetch(buildApiUrl('/api/getallprojects'));
        const data = await response.json();
        setProjects(Array.isArray(data) ? data : []);
        setSelectedProjectId(data?.[0]?._id || "");
      } catch (err) {
        console.error(err);
        setError("Failed to load projects.");
      }
    };

    loadProjects();
  }, []);

  useEffect(() => {
    if (!selectedProjectId) return;
    const loadPaths = async () => {
      try {
        setIsLoading(true);
        setError("");

        const [totalResponse, completedResponse] = await Promise.all([
          fetch(buildApiUrl(`/api/getpathbyid/${selectedProjectId}`)),
          fetch(buildApiUrl(`/api/getcompletedpathbyid/${selectedProjectId}`)),
        ]);

        const totalData = totalResponse.ok ? await totalResponse.json() : null;
        const completedData = completedResponse.ok ? await completedResponse.json() : null;

        const totalPaths = totalData?.totalpath || [];
        const completed = completedData?.completedPath || [];

        setPaths(totalPaths);
        setCompletedPaths(completed);
        setSelectedPathId(totalPaths?.[0]?._id || "");

        const nextTotalDistance = totalData?.distance || calculateDistance(totalPaths?.[0]?.points || []);
        const nextCompletedDistance = completedData?.distance || calculateDistance(completed?.[0]?.points || []);

        setTotalDistance(nextTotalDistance || 0);
        setCompletedDistance(nextCompletedDistance || 0);
      } catch (err) {
        console.error(err);
        setError("Failed to load path data.");
      } finally {
        setIsLoading(false);
      }
    };

    loadPaths();
  }, [selectedProjectId]);

  useEffect(() => {
    if (!selectedPath) return;
    const nextTotalDistance = calculateDistance(selectedPath.points || []);
    const nextCompletedDistance = calculateDistance(selectedCompletedPath?.points || []);
    setTotalDistance(nextTotalDistance || 0);
    setCompletedDistance(nextCompletedDistance || 0);
  }, [selectedPath, selectedCompletedPath]);

  const progress = totalDistance ? (completedDistance / totalDistance) * 100 : 0;
  const mapCenter = selectedPath?.points?.[0]
    ? [selectedPath.points[0].lat, selectedPath.points[0].lng]
    : [28.6139, 77.209];

  return (
    <div className="page pb-10">
      <div className="glass-panel mb-8 flex flex-wrap items-center justify-between gap-4 p-6">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Geo Tracking</p>
          <h2 className="mt-2 text-3xl font-semibold">Path Monitoring</h2>
          <p className="mt-2 text-sm text-slate-300">Track live project progress by mapped routes.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select
            className="min-w-[220px]"
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
          >
            {projects.map((project) => (
              <option key={project._id} value={project._id}>
                {project.name}
              </option>
            ))}
          </select>
          <select
            className="min-w-[160px]"
            value={selectedPathId}
            onChange={(e) => setSelectedPathId(e.target.value)}
          >
            {paths.map((path, index) => (
              <option key={path._id} value={path._id}>
                Path {index + 1}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <div className="glass-card p-6">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Progress</p>
          <div className="mt-4 flex items-center justify-center">
            <div className="relative h-24 w-24">
              <svg className="h-full w-full" viewBox="0 0 36 36">
                <path
                  className="text-slate-700"
                  strokeWidth="3"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-cyan-400"
                  strokeWidth="3"
                  strokeDasharray={`${(progress * 31.831) / 100}, 31.831`}
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-lg font-semibold">
                {Math.round(progress)}%
              </div>
            </div>
          </div>
        </div>
        <div className="glass-card p-6">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Completed</p>
          <p className="mt-4 text-3xl font-semibold">{completedDistance.toFixed(2)} KM</p>
        </div>
        <div className="glass-card p-6">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Total Path</p>
          <p className="mt-4 text-3xl font-semibold">{totalDistance.toFixed(2)} KM</p>
        </div>
        <div className="glass-card p-6">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Remaining</p>
          <p className="mt-4 text-3xl font-semibold">
            {(totalDistance - completedDistance).toFixed(2)} KM
          </p>
        </div>
      </div>

      <div className="glass-panel mt-8 overflow-hidden">
        <div className="h-[480px]">
          <MapContainer center={mapCenter} zoom={14} scrollWheelZoom className="h-full w-full">
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {selectedPath?.points?.length > 1 && (
              <Polyline
                positions={selectedPath.points.map((point) => [point.lat, point.lng])}
                color="#22d3ee"
                weight={5}
              />
            )}
            {selectedCompletedPath?.points?.length > 1 && (
              <Polyline
                positions={selectedCompletedPath.points.map((point) => [point.lat, point.lng])}
                color="#10b981"
                weight={5}
              />
            )}
            {selectedPath?.points?.[0] && (
              <Marker position={[selectedPath.points[0].lat, selectedPath.points[0].lng]} />
            )}
          </MapContainer>
        </div>
      </div>
    </div>
  );
};

export default Gis;


