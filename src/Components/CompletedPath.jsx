import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { fetchCompletedPathById } from '../services/sangamApi';
import useProjectPicker from '../hooks/useProjectPicker';

const DEFAULT_CENTER = [28.6139, 77.209];

const CompletedPath = () => {
  const { projects, selectedProjectId, setSelectedProjectId, loadingProjects } = useProjectPicker();
  const [coordinates, setCoordinates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!selectedProjectId) {
      setCoordinates([]);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await fetchCompletedPathById(selectedProjectId);
        const pathData = data?.completedPath?.[0];
        if (!pathData?.points?.length) {
          setCoordinates([]);
          return;
        }
        setCoordinates(pathData.points.map((point) => [point.lat, point.lng]));
      } catch (fetchError) {
        setError(fetchError.message || 'Failed to load completed path.');
        setCoordinates([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedProjectId]);

  const selectedProject = projects.find((p) => p._id === selectedProjectId);
  const mapCenter = coordinates[0] || DEFAULT_CENTER;

  return (
    <div className="page pb-10">
      <div className="glass-panel mb-6 p-6">
        <p className="page-kicker">Routing</p>
        <h1 className="page-title mt-2">Completed Path</h1>
        <p className="page-subtitle">Executed route segments already finished on site.</p>
        <div className="mt-4 max-w-md">
          <label className="mb-2 block text-xs uppercase tracking-wider text-slate-400">Project</label>
          <select
            className="field w-full"
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            disabled={loadingProjects || projects.length === 0}
          >
            {projects.length === 0 && <option value="">No projects available</option>}
            {projects.map((project) => (
              <option key={project._id} value={project._id}>
                {project.name}
              </option>
            ))}
          </select>
          {selectedProject && (
            <p className="mt-2 text-xs text-slate-500">
              {selectedProject.zone || selectedProject.ward || selectedProject.district || "No zone data"}
            </p>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          {error}
        </div>
      )}

      {loading || loadingProjects ? (
        <div className="glass-panel flex h-96 items-center justify-center">
          <div className="loading-spinner" />
        </div>
      ) : (
        <>
          <div className="glass-panel mb-6 grid max-h-48 grid-cols-1 gap-2 overflow-y-auto p-4 custom-scrollbar sm:grid-cols-2 lg:grid-cols-3">
            {coordinates.length === 0 ? (
              <p className="text-sm text-slate-400">No completed path coordinates for this project.</p>
            ) : (
              coordinates.map(([lat, lng], index) => (
                <div
                  key={`${lat}-${lng}-${index}`}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300"
                >
                  Point {index + 1}: {lat.toFixed(5)}, {lng.toFixed(5)}
                </div>
              ))
            )}
          </div>

          <div className="glass-panel overflow-hidden p-2">
            <div className="h-[28rem] w-full overflow-hidden rounded-2xl">
              <MapContainer center={mapCenter} zoom={13} scrollWheelZoom className="h-full w-full">
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                {coordinates.length > 0 && (
                  <Polyline positions={coordinates} color="#34d399" weight={5} opacity={0.85} />
                )}
              </MapContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CompletedPath;
