import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { fetchPathById } from '../services/sangamApi';

const DEFAULT_CENTER = [28.6139, 77.209];
const DEMO_PROJECT_ID = '6749b789545dcca89c35d67a';

const TotalPath = () => {
  const [coordinates, setCoordinates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setError('');
        const data = await fetchPathById(DEMO_PROJECT_ID);
        const pathData = data?.totalpath?.[0];
        if (!pathData?.points?.length) {
          setCoordinates([]);
          return;
        }
        setCoordinates(pathData.points.map((point) => [point.lat, point.lng]));
      } catch (fetchError) {
        console.error('Error fetching total path:', fetchError);
        setError(fetchError.message || 'Failed to load total path.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const mapCenter = coordinates[0] || DEFAULT_CENTER;

  return (
    <div className="page pb-10">
      <div className="glass-panel mb-6 p-6">
        <p className="page-kicker">Routing</p>
        <h1 className="page-title mt-2">Total Path</h1>
        <p className="page-subtitle">Full planned route for the selected infrastructure project.</p>
      </div>

      {error && (
        <div className="mb-4 rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          {error}
        </div>
      )}

      {loading ? (
        <div className="glass-panel flex h-96 items-center justify-center">
          <div className="loading-spinner" />
        </div>
      ) : (
        <>
          <div className="glass-panel mb-6 grid max-h-48 grid-cols-1 gap-2 overflow-y-auto p-4 custom-scrollbar sm:grid-cols-2 lg:grid-cols-3">
            {coordinates.length === 0 ? (
              <p className="text-sm text-slate-400">No path coordinates available.</p>
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
                  <Polyline positions={coordinates} color="#22d3ee" weight={5} opacity={0.85} />
                )}
              </MapContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default TotalPath;
