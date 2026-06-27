import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import { MapContainer, TileLayer, Polyline, Marker } from "react-leaflet";
import toast from "react-hot-toast";
import { fetchPathById, saveProjectPath } from "../services/sangamApi";
import PageHeader from "./ui/PageHeader";
import { LoadingPanel, SectionCard, StatCard } from "./ui/FeatureUi";

const calculateDistance = (path) => {
  if (path.length < 2) return 0;
  let totalDistance = 0;
  for (let i = 0; i < path.length - 1; i++) {
    const [lat1, lon1] = path[i];
    const [lat2, lon2] = path[i + 1];
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
    totalDistance += R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  }
  return totalDistance;
};

function GisMap() {
  const { projectId } = useParams();
  const watchIdRef = useRef(null);
  const [currentPath, setCurrentPath] = useState([]);
  const [markerPosition, setMarkerPosition] = useState(null);
  const [pathData, setPathData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tracking, setTracking] = useState(false);

  const loadPath = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchPathById(projectId);
      setPathData(data);
    } catch {
      setPathData(null);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadPath();
  }, [loadPath]);

  useEffect(
    () => () => {
      if (watchIdRef.current != null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    },
    []
  );

  const startTracking = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported");
      return;
    }
    if (watchIdRef.current != null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }
    setTracking(true);
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const newLocation = [position.coords.latitude, position.coords.longitude];
        setCurrentPath((prev) => [...prev, newLocation]);
        setMarkerPosition(newLocation);
      },
      () => toast.error("Could not access location"),
      { enableHighAccuracy: true }
    );
  };

  const stopTrackingAndSave = async () => {
    if (watchIdRef.current != null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setTracking(false);
    if (currentPath.length < 2) {
      toast.error("Record at least two GPS points before saving");
      return;
    }
    try {
      await saveProjectPath({
        _id: projectId,
        totalpath: [{ points: currentPath.map(([lat, lng]) => ({ lat, lng })) }],
        timestamp: new Date().toISOString(),
        distance: calculateDistance(currentPath),
      });
      toast.success("Path saved to project");
      setCurrentPath([]);
      loadPath();
    } catch (err) {
      toast.error(err.message || "Failed to save path");
    }
  };

  const savedPoints =
    pathData?.totalpath?.flatMap((p) => p.points?.map((pt) => [pt.lat, pt.lng]) || []) || [];

  return (
    <div className="page-stack pb-10">
      <PageHeader
        kicker="GIS"
        title="Project path tracking"
        subtitle={`Record and save GPS paths for project ${projectId?.slice(-6) || ""}`}
      />

      {loading ? (
        <LoadingPanel label="Loading saved path…" />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Saved paths" value={pathData?.totalpath?.length ?? 0} tone="cyan" />
            <StatCard
              label="Distance"
              value={`${(pathData?.distance ?? 0).toFixed(2)} km`}
              meta="Last saved route"
              tone="emerald"
            />
            <StatCard label="Live points" value={currentPath.length} meta={tracking ? "Recording…" : "Idle"} tone="amber" />
          </div>

          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn btn-primary" onClick={startTracking} disabled={tracking}>
              Start tracking
            </button>
            <button type="button" className="btn" onClick={stopTrackingAndSave}>
              Stop & save
            </button>
          </div>

          <SectionCard title="Map" subtitle="OpenStreetMap · live polyline in cyan">
            <div className="overflow-hidden rounded-2xl border border-white/10">
              <MapContainer
                center={markerPosition || savedPoints[0] || [28.674855, 77.503005]}
                zoom={15}
                style={{ height: "480px", width: "100%" }}
              >
                <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" />
                {currentPath.length > 1 && <Polyline positions={currentPath} color="#22d3ee" weight={4} />}
                {savedPoints.length > 1 && <Polyline positions={savedPoints} color="#818cf8" weight={3} dashArray="6" />}
                {markerPosition && <Marker position={markerPosition} />}
              </MapContainer>
            </div>
          </SectionCard>
        </>
      )}
    </div>
  );
}

export default GisMap;
