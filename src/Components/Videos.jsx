import React, { useEffect, useMemo, useState } from "react";
import { fetchSeminars } from "../services/sangamApi";
import PageHeader from "./ui/PageHeader";

const youtubeIdFromUrl = (url = "") => {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
  return match?.[1] || null;
};

const Videos = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchSeminars()
      .then((list) => {
        const mapped = (Array.isArray(list) ? list : [])
          .filter((item) => item.seminarLink)
          .map((item) => {
            const videoId = youtubeIdFromUrl(item.seminarLink);
            return {
              id: item._id,
              title: item.description || item.publisherName || "Training video",
              publisher: item.publisherName,
              url: item.seminarLink,
              thumbnail: videoId
                ? `https://img.youtube.com/vi/${videoId}/0.jpg`
                : "https://via.placeholder.com/640x360?text=Video",
              date: item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "",
            };
          });
        setVideos(mapped);
      })
      .catch((err) => setError(err.message || "Failed to load videos"))
      .finally(() => setLoading(false));
  }, []);

  const externalLinks = useMemo(() => videos.filter((v) => !youtubeIdFromUrl(v.url)), [videos]);

  return (
    <div className="page pb-10">
      <PageHeader
        kicker="Training"
        title="Training Videos"
        subtitle="Published seminar and training links from your organization."
      />

      {loading && <p className="text-slate-400">Loading videos…</p>}
      {error && <p className="text-rose-300">{error}</p>}

      {!loading && videos.length === 0 && (
        <div className="glass-panel p-8 text-center text-slate-400">
          No training videos yet. Admins and officers can add links from the{" "}
          <a href="/seminar" className="text-cyan-300 underline">
            Seminars
          </a>{" "}
          page.
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {videos.map((video) => (
          <article key={video.id} className="glass-card overflow-hidden p-0">
            <img src={video.thumbnail} alt={video.title} className="h-44 w-full object-cover" />
            <div className="p-4">
              <h2 className="text-lg font-semibold text-white">{video.title}</h2>
              {video.publisher && <p className="mt-1 text-xs text-slate-500">By {video.publisher}</p>}
              {video.date && <p className="mt-1 text-xs text-slate-500">{video.date}</p>}
              <a
                href={video.url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary mt-4 inline-block"
              >
                Watch
              </a>
            </div>
          </article>
        ))}
      </div>

      {externalLinks.length > 0 && (
        <p className="mt-6 text-xs text-slate-500">
          Some links open external pages (not YouTube thumbnails).
        </p>
      )}
    </div>
  );
};

export default Videos;
