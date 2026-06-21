import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchSeminars } from "../services/sangamApi";
import { useAuth } from "../context/AuthContext";
import seminar from "../assets/seminar.jpg";
import meeting from "../assets/meeting.jpg";
import news from "../assets/news.jpg";
import videos from "../assets/videos.jpg";
import PageHeader from "./ui/PageHeader";

const DOCS_STORAGE_KEY = "sangam-training-docs";

const loadStoredDocuments = () => {
  try {
    const raw = localStorage.getItem(DOCS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const TrainingPage = () => {
  const { userData } = useAuth();
  const uploaderName = userData?.fullName || userData?.username || "User";
  const [seminarCount, setSeminarCount] = useState(0);
  const [docSearch, setDocSearch] = useState("");
  const [pdfFile, setPdfFile] = useState(null);
  const [documents, setDocuments] = useState(() => loadStoredDocuments());

  useEffect(() => {
    localStorage.setItem(DOCS_STORAGE_KEY, JSON.stringify(documents));
  }, [documents]);

  const handleFileChange = (event) => {
    setPdfFile(event.target.files[0]);
  };

  const handleFileUpload = () => {
    if (!pdfFile) return alert("Please select a PDF to upload!");
    const fileUrl = URL.createObjectURL(pdfFile);
    setDocuments((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${pdfFile.name}`,
        name: pdfFile.name,
        uploader: uploaderName,
        task: "Training upload",
        date: new Date().toLocaleDateString(),
        fileUrl,
      },
    ]);
    setPdfFile(null);
  };

  const filteredDocuments = useMemo(() => {
    const q = docSearch.trim().toLowerCase();
    if (!q) return documents;
    return documents.filter(
      (doc) =>
        doc.name.toLowerCase().includes(q) ||
        doc.uploader.toLowerCase().includes(q) ||
        doc.task.toLowerCase().includes(q) ||
        doc.date.toLowerCase().includes(q)
    );
  }, [documents, docSearch]);

  const navigate = useNavigate();

  useEffect(() => {
    fetchSeminars()
      .then((list) => setSeminarCount(Array.isArray(list) ? list.length : 0))
      .catch(() => setSeminarCount(0));
  }, []);

  const handleScheduleMeeting = () => {
    navigate("/video-conference");
  };

  return (
    <div className="page pb-10">
      <PageHeader
        kicker="Learning"
        title="Training Center"
        subtitle="Seminars, videos, meetings, and documents for your team."
      />

      <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        {[
          {
            title: "Seminars",
            badge: seminarCount > 0 ? `${seminarCount} live` : null,
            image: seminar,
            description: "Join published seminars and learning links from your team.",
            onClick: () => navigate("/seminar"),
          },
          {
            title: "Videos",
            image: videos,
            description: "Watch seminar links and training videos from your organization.",
            onClick: () => navigate("/videos"),
          },
          {
            title: "Schedule meeting",
            image: meeting,
            description: "Set up a meeting with our specialists for personalized advice.",
            duration: "Flexible Timings",
            onClick: handleScheduleMeeting,
          },
          {
            title: "Latest news",
            image: news,
            description: "Stay updated with city announcements and internal updates.",
            duration: "Updated Daily",
            onClick: () => navigate("/announcements"),
          },
        ].map(({ title, image, description, duration, onClick, badge }, index) => (
          <div key={index} className="glass-card flex flex-col overflow-hidden p-0">
            <img src={image} alt={title} className="h-40 w-full object-cover" />
            <div className="flex flex-1 flex-col p-5">
              {badge && (
                <span className="mb-2 w-fit rounded-full bg-cyan-400/15 px-2 py-0.5 text-[10px] font-semibold uppercase text-cyan-200">
                  {badge}
                </span>
              )}
              <h3 className="text-lg font-semibold text-white">{title}</h3>
              <p className="mt-2 flex-1 text-sm text-slate-400">{description}</p>
              {duration && <p className="mt-2 text-xs text-slate-500">{duration}</p>}
              <button type="button" onClick={onClick} className="btn btn-primary mt-4 w-full">
                {title === "Schedule meeting" ? "Schedule Meeting" : "Learn More"}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="glass-panel p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm text-slate-400">
            {filteredDocuments.length} document{filteredDocuments.length === 1 ? "" : "s"}
            {documents.length === 0 && " — upload PDFs for your team (stored in this browser)"}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" onClick={() => document.getElementById("file-input").click()} className="btn btn-primary">
              Add New Document
            </button>
            <input type="file" id="file-input" accept="application/pdf" onChange={handleFileChange} className="hidden" />
            <button type="button" onClick={handleFileUpload} className="btn btn-primary">
              Upload PDF
            </button>
            <input
              type="search"
              placeholder="Search documents..."
              className="max-w-xs"
              value={docSearch}
              onChange={(e) => setDocSearch(e.target.value)}
            />
          </div>
        </div>

        <table className="w-full text-left text-sm">
          <thead>
            <tr>
              <th className="py-3 px-4">Name</th>
              <th className="py-3 px-4">Uploaded By</th>
              <th className="py-3 px-4">For Task</th>
              <th className="py-3 px-4">Date</th>
            </tr>
          </thead>
          <tbody>
            {filteredDocuments.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-slate-400">
                  {docSearch ? "No documents match your search." : "No documents uploaded yet."}
                </td>
              </tr>
            ) : (
              filteredDocuments.map((doc) => (
                <tr key={doc.id || doc.name}>
                  <td className="py-3 px-4">
                    <a href={doc.fileUrl} download={doc.name} className="text-cyan-300 hover:underline">
                      {doc.name}
                    </a>
                  </td>
                  <td className="py-3 px-4">{doc.uploader}</td>
                  <td className="py-3 px-4">{doc.task}</td>
                  <td className="py-3 px-4">{doc.date}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TrainingPage;
