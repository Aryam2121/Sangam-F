import React, { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { fetchAnnouncements, unwrapApiData } from "../services/sangamApi";
import { useStaleResource } from "../hooks/useStaleResource";
import PageHeader from "./ui/PageHeader";
import { EmptyState, Field, LoadingPanel, SectionCard, inputClass } from "./ui/FeatureUi";

const News = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [externalArticles, setExternalArticles] = useState([]);
  const [loadingExternal, setLoadingExternal] = useState(false);

  const fetcher = useCallback(() => fetchAnnouncements(), []);
  const { data, loading } = useStaleResource({
    key: "news-announcements",
    fetcher,
    maxAgeMs: 60_000,
    initialValue: [],
  });

  const announcements = Array.isArray(data)
    ? data
    : data?.announcements || unwrapApiData(data) || [];

  const fetchExternalNews = async (query) => {
    const apiKey = import.meta.env.VITE_NEWS_API_KEY?.trim();
    if (!apiKey) {
      toast.error("News API key not configured — showing city announcements only");
      return;
    }
    setLoadingExternal(true);
    try {
      const response = await fetch(
        `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&language=en&pageSize=12&apiKey=${apiKey}`
      );
      const json = await response.json();
      setExternalArticles(Array.isArray(json.articles) ? json.articles : []);
    } catch {
      toast.error("Failed to fetch external news");
    } finally {
      setLoadingExternal(false);
    }
  };

  useEffect(() => {
    if (import.meta.env.VITE_NEWS_API_KEY) {
      fetchExternalNews("smart city infrastructure");
    }
  }, []);

  const filteredAnnouncements = announcements.filter((a) =>
    (a.title || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="page-stack pb-10">
      <PageHeader
        kicker="Updates"
        title="News & announcements"
        subtitle="City announcements from Sangam plus optional external industry news"
      />

      <SectionCard>
        <div className="flex flex-wrap gap-3">
          <input
            type="search"
            className={`${inputClass} max-w-md flex-1`}
            placeholder="Filter announcements…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button
            type="button"
            className="btn"
            onClick={() => fetchExternalNews(searchQuery || "smart city infrastructure")}
            disabled={loadingExternal}
          >
            {loadingExternal ? "Loading…" : "Search external news"}
          </button>
        </div>
      </SectionCard>

      {loading && <LoadingPanel label="Loading announcements…" />}

      {!loading && (
        <>
          <SectionCard title="City announcements" subtitle={`${filteredAnnouncements.length} items`}>
            {filteredAnnouncements.length === 0 ? (
              <EmptyState title="No announcements" description="Check the Announcements page for city updates." />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredAnnouncements.map((item) => (
                  <article key={item._id} className="glass-card rounded-2xl p-5">
                    <h3 className="font-semibold text-white">{item.title}</h3>
                    <p className="mt-2 line-clamp-3 text-sm text-slate-400">{item.body || item.message}</p>
                    <p className="mt-3 text-xs text-slate-500">
                      {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : ""}
                    </p>
                  </article>
                ))}
              </div>
            )}
          </SectionCard>

          {externalArticles.length > 0 && (
            <SectionCard title="External news" subtitle="From NewsAPI">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {externalArticles.map((article, index) => (
                  <article key={article.url || index} className="glass-card overflow-hidden rounded-2xl">
                    {article.urlToImage && (
                      <img src={article.urlToImage} alt="" className="h-40 w-full object-cover" />
                    )}
                    <div className="p-4">
                      <h3 className="font-semibold text-white line-clamp-2">{article.title}</h3>
                      <p className="mt-2 line-clamp-2 text-sm text-slate-400">{article.description}</p>
                      <a
                        href={article.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-block text-sm text-cyan-300 hover:underline"
                      >
                        Read more
                      </a>
                    </div>
                  </article>
                ))}
              </div>
            </SectionCard>
          )}
        </>
      )}
    </div>
  );
};

export default News;
