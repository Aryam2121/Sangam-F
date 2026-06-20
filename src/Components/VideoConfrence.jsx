import React, { useEffect, useState } from 'react';

const VideoConference = ({ roomID }) => {
  const [error, setError] = useState('');

  useEffect(() => {
    const appID = import.meta.env.VITE_appID;
    if (!appID) {
      setError('Video conference is not configured. Set VITE_appID and configure server-side token generation.');
      return;
    }

    setError(
      'Video conference requires server-side token generation. Do not expose Zego server secrets in the client bundle.'
    );
  }, [roomID]);

  if (error) {
    return (
      <div className="page flex min-h-[40vh] items-center justify-center rounded-3xl border border-amber-400/30 bg-amber-400/10 p-8 text-center text-amber-100">
        <p>{error}</p>
      </div>
    );
  }

  return <div id="video-container" className="min-h-[60vh] w-full rounded-3xl bg-slate-900" />;
};

export default VideoConference;
