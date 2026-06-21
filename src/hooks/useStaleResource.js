import { useCallback, useEffect, useRef, useState } from "react";

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
    /* ignore */
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

  const runFetch = useCallback(async (showLoading = false) => {
    if (!enabled) return;
    if (showLoading) setLoading(true);
    setError("");
    try {
      const next = await fetcherRef.current();
      if (!mounted.current) return next;
      setData(next);
      setCache(key, next);
      return next;
    } catch (err) {
      if (!mounted.current) return null;
      setError(err?.message || "Failed to fetch data");
      throw err;
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [enabled, key]);

  useEffect(() => {
    runFetch(!getCache(key, maxAgeMs));
    if (!refreshMs) return undefined;
    const timer = setInterval(() => runFetch(false), refreshMs);
    return () => clearInterval(timer);
  }, [enabled, key, maxAgeMs, refreshMs, runFetch]);

  const refresh = useCallback(() => runFetch(true), [runFetch]);

  return { data, setData, loading, error, refresh };
};

export default useStaleResource;
