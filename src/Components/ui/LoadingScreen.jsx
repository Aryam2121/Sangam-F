import React from 'react';

const LoadingScreen = ({ label = 'Loading workspace...' }) => (
  <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-slate-300">
    <div className="loading-spinner" aria-hidden="true" />
    <p className="text-sm tracking-wide text-slate-400">{label}</p>
  </div>
);

export default LoadingScreen;
