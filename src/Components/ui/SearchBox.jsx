import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BiSearch } from 'react-icons/bi';
import { useGlobalSearch } from '../../hooks/useGlobalSearch';

const typeLabels = {
  project: 'Project',
  task: 'Task',
  resource: 'Resource',
  department: 'Department',
};

/**
 * Global search with dropdown results (navbar, dashboard, etc.)
 */
export const GlobalSearchBox = ({ className = '', inputClassName = '' }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const { results, loading, error } = useGlobalSearch(query);

  useEffect(() => {
    setOpen(query.trim().length >= 2);
  }, [query, results, loading]);

  useEffect(() => {
    const handleClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSelect = (item) => {
    navigate(item.path);
    setQuery('');
    setOpen(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && results.length > 0) {
      e.preventDefault();
      handleSelect(results[0]);
    }
    if (e.key === 'Escape') setOpen(false);
  };

  return (
    <div ref={wrapRef} className={`relative ${className}`}>
      <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-2 shadow-inner">
        <BiSearch className="shrink-0 text-slate-400" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.trim().length >= 2 && setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search projects, tasks, resources..."
          className={`w-full min-w-0 border-none bg-transparent p-0 text-sm text-slate-100 placeholder-slate-500 focus:ring-0 ${inputClassName}`}
          aria-label="Global search"
          autoComplete="off"
        />
        {loading && <span className="loading-spinner !h-4 !w-4 !border-2 shrink-0" />}
      </div>

      {open && (
        <div className="absolute left-0 right-0 top-full z-[60] mt-2 max-h-80 overflow-y-auto rounded-2xl border border-white/10 bg-slate-950/95 p-2 shadow-2xl custom-scrollbar">
          {error && (
            <p className="px-3 py-2 text-xs text-rose-300">{error}</p>
          )}
          {!loading && !error && results.length === 0 && (
            <p className="px-4 py-3 text-sm text-slate-400">No results found</p>
          )}
          {results.map((item) => (
            <button
              key={`${item.type}-${item.id}`}
              type="button"
              onClick={() => handleSelect(item)}
              className="flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-white/10"
            >
              <span className="mt-0.5 shrink-0 rounded-full bg-cyan-400/15 px-2 py-0.5 text-[10px] font-semibold uppercase text-cyan-200">
                {typeLabels[item.type] || item.type}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white">{item.title}</p>
                <p className="truncate text-xs text-slate-400">{item.subtitle}</p>
              </div>
            </button>
          ))}
          {query.trim().length >= 2 && (
            <p className="border-t border-white/10 px-3 py-2 text-[10px] text-slate-500">
              Press Enter to open first result · Esc to close
            </p>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Local filter search (filters lists on the same page)
 */
export const LocalSearchInput = ({
  value,
  onChange,
  placeholder = 'Search...',
  className = '',
  onSubmit,
}) => (
  <div className={`relative ${className}`}>
    <BiSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
    <input
      type="search"
      value={value}
      onChange={onChange}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && onSubmit) {
          e.preventDefault();
          onSubmit();
        }
      }}
      placeholder={placeholder}
      className="w-full pl-11"
      autoComplete="off"
    />
  </div>
);

export default GlobalSearchBox;
