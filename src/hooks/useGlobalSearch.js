import { useEffect, useState } from 'react';
import { globalSearch } from '../services/sangamApi';

export const useGlobalSearch = (query, debounceMs = 300) => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setError('');
      setLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      setError('');
      try {
        const data = await globalSearch(trimmed);
        setResults(data?.results || []);
      } catch (err) {
        setResults([]);
        setError(err.message || 'Search failed');
      } finally {
        setLoading(false);
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [query, debounceMs]);

  return { results, loading, error };
};
