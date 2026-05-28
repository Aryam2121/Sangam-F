import { useState } from "react";
import { useParams } from "react-router-dom";
import { MapContainer, TileLayer, Polyline, Marker } from "react-leaflet";
import { Button, Container, Typography, Box, Card, CardContent } from "@mui/material";
import { useEffect } from "react";
import { buildApiUrl } from "../config/api";
const postPathToBackend = async (projectId, path, timestamp, distance) => {
  const apiUrl = buildApiUrl('/api/path');
  const requestBody = {
    _id: projectId,
    totalpath: [
      {
        points: path.map(([lat, lng]) => ({ lat, lng })),
      },
    ],
    timestamp,
    distance,
  };
  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });
    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    alert("Path saved successfully!");
    return data;
  } catch (error) {
    console.error("Failed to save path to backend:", error);
    alert("Failed to save path. Please try again.");
    return null;
  }
};
function GisMap() {
  const { projectId } = useParams(); // Get projectId from URL
  const [currentPath, setCurrentPath] = useState([]);
  const [markerPosition, setMarkerPosition] = useState(null);
  const [pathData, setPathData] = useState(null);
 // Fetch project path data from the API
 useEffect(() => {
  const fetchProjectPath = async () => {
    const apiUrl = buildApiUrl(`/api/getpathbyid/${projectId}`);
    try {
      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      const data = await response.json();
      setPathData(data); // Set the fetched data
    } catch (error) {
      console.error("Failed to fetch project path:", error);
    }
  };
fetchProjectPath();
}, [projectId])
  const startTracking = () => {
    navigator.geolocation.watchPosition(
      (position) => {
        const newLocation = [position.coords.latitude, position.coords.longitude];
        setCurrentPath((prevPath) => [...prevPath, newLocation]);
        setMarkerPosition(newLocation);
      },
      (error) => {
        console.error("Error getting location:", error);
      },
      { enableHighAccuracy: true, distanceFilter: 1 }
    );
  };
  const stopTrackingAndSave = async () => {
    const timestamp = new Date().toISOString();
    const distance = calculateDistance(currentPath);
    const savedData = await postPathToBackend(projectId, currentPath, timestamp, distance);
  if (savedData) {
      alert("Path saved successfully to project!");
      setCurrentPath([]);
    }
  };
const calculateDistance = (path) => {
    if (path.length < 2) return 0;
    let totalDistance = 0;
    for (let i = 0; i < path.length - 1; i++) {
      const [lat1, lon1] = path[i];
      const [lat2, lon2] = path[i + 1];
      const R = 6371; // Radius of Earth in km
      const dLat = ((lat2 - lat1) * Math.PI) / 180;
      const dLon = ((lon2 - lon1) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
          Math.cos((lat2 * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      totalDistance += R * c;
    }
    return totalDistance;
  };
return (
    <Container>
      <Typography variant="h4" className="my-8" align="center" marginTop="20px" gutterBottom>
        GIS Map for Project: {projectId}
      </Typography>
      {pathData && (
        <Card sx={{ marginBottom: 4 }}>
          <CardContent>
            <Typography variant="h5">Project Path</Typography>
            <Typography variant="body1" color="textSecondary" paragraph>
              {pathData.totalpath?.length || 0} saved paths
            </Typography>
            <Typography variant="body2">
              <strong>Distance:</strong> {pathData.distance?.toFixed?.(2) || 0} KM
            </Typography>
          </CardContent>
        </Card>
      )}
     <Box display="flex" justifyContent="center" gap={2} marginBottom={2}>
        <Button variant="contained" color="primary" onClick={startTracking}>
          Start Tracking
        </Button>
        <Button variant="contained" color="secondary" onClick={stopTrackingAndSave}>
          Stop and Save
        </Button>
      </Box>
      <MapContainer center={[28.674855, 77.503005]} zoom={15} style={{ height: "500px", width: "100%" }}>
        <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {currentPath.length > 1 && <Polyline positions={currentPath} color="blue" />}
        {markerPosition && <Marker position={markerPosition} />}
      </MapContainer>
    </Container>
  );
}
export default GisMap;