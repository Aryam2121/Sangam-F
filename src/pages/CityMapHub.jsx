import React, { useCallback, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, GeoJSON, CircleMarker } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { fetchMapHubData, uploadGeoLayer, syncProjectLocations } from "../services/sangamApi";
import { useStaleResource } from "../hooks/useStaleResource";
import PageHeader from "../Components/ui/PageHeader";
import {
  EmptyState,
  Field,
  FilterBar,
  LoadingPanel,
  SectionCard,
  inputClass,
} from "../Components/ui/FeatureUi";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { isAdminRole } from "../utils/rolePermissions";
import toast from "react-hot-toast";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const DEFAULT_CENTER = [28.6139, 77.209];

const LAYER_OPTIONS = [
  { key: "projects", label: "Projects" },
  { key: "hotspots", label: "Conflict hotspots" },
  { key: "geojson", label: "Ward layers" },
];

const CityMapHub = () => {
  const navigate = useNavigate();
  const { userData } = useAuth();
  const isAdmin = isAdminRole(userData?.role);
  const [filters, setFilters] = useState({ zone: "", ward: "", district: "" });
  const [showLayers, setShowLayers] = useState({ projects: true, hotspots: true, geojson: true });
  const [geoJsonText, setGeoJsonText] = useState("");
  const [layerName, setLayerName] = useState("Ward boundary");
  const [syncing, setSyncing] = useState(false);

  const fetcher = useCallback(() => fetchMapHubData(filters), [filters]);
  const { data, loading, refresh } = useStaleResource({
    key: `map-hub:${JSON.stringify(filters)}`,
    fetcher,
    maxAgeMs: 45_000,
    initialValue: { projects: [], layers: [], conflictHotspots: [] },
  });

  const projects = (data?.projects || []).filter((p) => p.location?.lat && p.location?.lng);
  const hotspots = data?.conflictHotspots || [];
  const layers = data?.layers || [];

  const center = useMemo(() => {
    const first = projects[0];
    return first ? [first.location.lat, first.location.lng] : DEFAULT_CENTER;
  }, [projects]);

  const mapKey = `${filters.zone}-${filters.ward}-${filters.district}-${projects.length}`;

  const handleUploadGeoJson = async () => {
    try {
      const geojson = JSON.parse(geoJsonText);
      await uploadGeoLayer({ name: layerName, layerType: "ward_boundary", geojson });
      toast.success("GeoJSON layer uploaded");
      setGeoJsonText("");
      refresh();
    } catch (err) {
      toast.error(err.message || "Invalid GeoJSON");
    }
  };

  const handleSyncLocations = async () => {
    setSyncing(true);
    try {
      const res = await syncProjectLocations();
      toast.success(`Synced ${res.updated ?? 0} project locations`);
      refresh();
    } catch (err) {
      toast.error(err.message || "Sync failed");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="page pb-10">
      <PageHeader
        title="City Map Hub"
        subtitle="Unified GIS — projects, conflict hotspots & ward boundaries"
        actions={
          isAdmin ? (
            <button type="button" className="btn" onClick={handleSyncLocations} disabled={syncing}>
              {syncing ? "Syncing…" : "Sync project locations"}
            </button>
          ) : null
        }
      />

      <FilterBar onApply={refresh} applyLabel="Apply filters">
        {["zone", "ward", "district"].map((key) => (
          <Field key={key} label={key.charAt(0).toUpperCase() + key.slice(1)}>
            <input
              className={inputClass}
              placeholder={`Filter ${key}`}
              value={filters[key]}
              onChange={(e) => setFilters((f) => ({ ...f, [key]: e.target.value }))}
            />
          </Field>
        ))}
      </FilterBar>

      <div className="mb-4 flex flex-wrap gap-2">
        {LAYER_OPTIONS.map(({ key, label }) => {
          const active = showLayers[key];
          return (
            <button
              key={key}
              type="button"
              onClick={() => setShowLayers((s) => ({ ...s, [key]: !s[key] }))}
              className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-wide transition ${
                active
                  ? "border-cyan-400/40 bg-cyan-400/10 text-cyan-100"
                  : "border-white/10 bg-white/5 text-slate-400 hover:border-white/20"
              }`}
            >
              {label}
            </button>
          );
        })}
        <span className="ml-auto self-center text-xs text-slate-500">
          {projects.length} projects · {hotspots.length} hotspots · {layers.length} layers
        </span>
      </div>

      <div className="glass-panel overflow-hidden rounded-2xl" style={{ height: "min(560px, 62vh)" }}>
        {loading && !data?.projects?.length ? (
          <LoadingPanel label="Loading map data…" />
        ) : projects.length === 0 && !showLayers.geojson ? (
          <EmptyState
            title="No mappable projects"
            description="Projects need coordinates. Admins can sync locations from path data or re-seed the database."
            action={
              isAdmin ? (
                <button type="button" className="btn btn-primary" onClick={handleSyncLocations} disabled={syncing}>
                  Sync locations now
                </button>
              ) : null
            }
          />
        ) : (
          <MapContainer key={mapKey} center={center} zoom={11} style={{ height: "100%", width: "100%" }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="© OpenStreetMap" />
            {showLayers.projects &&
              projects.map((p) => (
                <Marker key={p._id} position={[p.location.lat, p.location.lng]}>
                  <Popup>
                    <strong>{p.name}</strong>
                    <br />
                    {p.status} · {p.ward || p.zone || "—"}
                    <br />
                    <button type="button" className="mt-2 text-cyan-600 underline" onClick={() => navigate(`/project/${p._id}`)}>
                      Open project
                    </button>
                  </Popup>
                </Marker>
              ))}
            {showLayers.hotspots &&
              hotspots.map((t) => {
                const loc = t.project?.location;
                if (!loc?.lat) return null;
                return (
                  <CircleMarker key={t._id} center={[loc.lat, loc.lng]} radius={9} pathOptions={{ color: "#f87171", fillColor: "#f87171", fillOpacity: 0.35 }}>
                    <Popup>
                      <strong>{t.title}</strong>
                      <br />
                      Overdue · {t.department || "—"}
                    </Popup>
                  </CircleMarker>
                );
              })}
            {showLayers.geojson && layers.map((layer) => <GeoJSON key={layer._id} data={layer.geojson} />)}
          </MapContainer>
        )}
      </div>

      {isAdmin && (
        <SectionCard className="mt-6" title="Import GeoJSON layer" subtitle="Admin only — ward boundaries and custom overlays">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Layer name">
              <input className={inputClass} value={layerName} onChange={(e) => setLayerName(e.target.value)} placeholder="Layer name" />
            </Field>
            <Field label="GeoJSON payload" className="sm:col-span-2">
              <textarea
                className={`${inputClass} min-h-[120px] font-mono text-xs`}
                rows={5}
                value={geoJsonText}
                onChange={(e) => setGeoJsonText(e.target.value)}
                placeholder='Paste GeoJSON FeatureCollection…'
              />
            </Field>
            <button type="button" className="btn btn-primary sm:col-span-2 sm:w-fit" onClick={handleUploadGeoJson}>
              Upload layer
            </button>
          </div>
        </SectionCard>
      )}
    </div>
  );
};

export default CityMapHub;
