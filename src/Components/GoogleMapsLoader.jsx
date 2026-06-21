import { useEffect } from "react";

const SCRIPT_ID = "sangam-google-maps";

const GoogleMapsLoader = () => {
  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY?.trim();
    if (!apiKey) return undefined;

    if (window.google?.maps) return undefined;
    if (document.getElementById(SCRIPT_ID)) return undefined;

    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&loading=async`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    return undefined;
  }, []);

  return null;
};

export default GoogleMapsLoader;
