import { useEffect, useRef, useState } from "react";

const getCache = (key, maxAgeMs) => {
  try {
    const raw = localStorage.getItem(`cache:${key}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.value || !parsed?.ts) return null;
    if (Date.now() - parsed.ts > maxAgeMs) return null;
    return parsed.value;
  } catch {
    return null;
  }
};

const setCache = (key, value) => {
  try {
    localStorage.setItem(`cache:${key}`, JSON.stringify({ value, ts: Date.now() }));
  } catch {
    // ignore cache write failures
  }
};

export const useStaleResource = ({
  key,
  fetcher,
  enabled = true,
  maxAgeMs = 60_000,
  refreshMs = 0,
  initialValue = null,
}) => {
  const [data, setData] = useState(() => getCache(key, maxAgeMs) ?? initialValue);
  const [loading, setLoading] = useState(!getCache(key, maxAgeMs) && enabled);
  const [error, setError] = useState("");
  const mounted = useRef(true);
  const fetcherRef = useRef(fetcher);

  useEffect(() => {
    fetcherRef.current = fetcher;
  }, [fetcher]);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (!enabled) return undefined;

    const run = async () => {
      setLoading((prev) => (data ? prev : true));
      setError("");
      try {
        const next = await fetcherRef.current();
        if (!mounted.current) return;
        setData(next);
        setCache(key, next);
      } catch (err) {
        if (!mounted.current) return;
        setError(err?.message || "Failed to fetch data");
      } finally {
        if (mounted.current) setLoading(false);
      }
    };

    run();

    if (!refreshMs) return undefined;
    const timer = setInterval(run, refreshMs);
    return () => clearInterval(timer);
  }, [enabled, key, maxAgeMs, refreshMs]); // Avoid fetch loop on changing function identities

  return { data, setData, loading, error };
};

export default useStaleResource;
