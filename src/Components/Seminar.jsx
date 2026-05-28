import React, { useEffect, useState } from "react";
import { BiLinkExternal, BiPlus } from "react-icons/bi";
import toast from "react-hot-toast";
import SeminarImage from "../assets/seminar.jpg";
import PageHeader from "./ui/PageHeader";
import { createSeminar, fetchSeminars } from "../services/sangamApi";
import { useAuth } from "../context/AuthContext";

const formatDate = (value) => {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const Seminar = () => {
  const { userData } = useAuth();
  const [seminars, setSeminars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    publisherName: "",
    seminarLink: "",
    description: "",
  });

  const canCreate = ["Main Admin", "Officer", "Department Admin"].includes(
    userData?.role || localStorage.getItem("userRole") || ""
  );

  const loadSeminars = async () => {
    try {
      setLoading(true);
      const list = await fetchSeminars();
      setSeminars(list);
    } catch {
      toast.error("Failed to load seminars");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSeminars();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.publisherName.trim() || !form.seminarLink.trim()) {
      toast.error("Author and seminar link are required");
      return;
    }
    setSubmitting(true);
    try {
      await createSeminar({
        publisherName: form.publisherName.trim(),
        seminarLink: form.seminarLink.trim(),
        description: form.description.trim(),
      });
      toast.success("Seminar published");
      setForm({ publisherName: "", seminarLink: "", description: "" });
      setShowModal(false);
      loadSeminars();
    } catch (err) {
      toast.error(err.message || "Failed to create seminar");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page pb-10">
      <PageHeader
        kicker="Training"
        title="Seminars"
        subtitle="Published sessions and learning links from your team."
        actions={
          canCreate && (
            <button type="button" onClick={() => setShowModal(true)} className="btn btn-primary">
              <BiPlus />
              Add seminar
            </button>
          )
        }
      />

      {loading ? (
        <div className="glass-panel flex justify-center p-12">
          <div className="loading-spinner" />
        </div>
      ) : seminars.length === 0 ? (
        <div className="glass-panel p-12 text-center text-slate-400">
          No seminars yet. {canCreate ? "Add the first one above." : "Check back later."}
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {seminars.map((seminar) => (
            <article
              key={seminar._id}
              className="glass-card flex overflow-hidden transition hover:border-cyan-400/20"
            >
              <img src={SeminarImage} alt="" className="h-36 w-36 shrink-0 object-cover" />
              <div className="min-w-0 flex-1 p-5">
                <a
                  href={seminar.seminarLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-lg font-semibold text-cyan-200 hover:text-cyan-100"
                >
                  {seminar.seminarLink.replace(/^https?:\/\//, "").slice(0, 48)}
                  {seminar.seminarLink.length > 48 ? "…" : ""}
                  <BiLinkExternal />
                </a>
                <p className="mt-2 line-clamp-3 text-sm text-slate-300">
                  {seminar.description || "No description"}
                </p>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
                  <span>
                    By <span className="text-slate-200">{seminar.publisherName}</span>
                  </span>
                  <span>{formatDate(seminar.createdAt)}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <form onSubmit={handleCreate} className="glass-panel w-full max-w-md p-6">
            <h2 className="text-xl font-semibold text-white">Add seminar</h2>
            <div className="mt-4 space-y-4">
              <div>
                <label className="mb-2 block text-xs uppercase tracking-wider text-slate-400">
                  Author / publisher
                </label>
                <input
                  value={form.publisherName}
                  onChange={(e) => setForm({ ...form, publisherName: e.target.value })}
                  placeholder="Your name"
                  required
                />
              </div>
              <div>
                <label className="mb-2 block text-xs uppercase tracking-wider text-slate-400">
                  Seminar link (URL)
                </label>
                <input
                  type="url"
                  value={form.seminarLink}
                  onChange={(e) => setForm({ ...form, seminarLink: e.target.value })}
                  placeholder="https://..."
                  required
                />
              </div>
              <div>
                <label className="mb-2 block text-xs uppercase tracking-wider text-slate-400">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="What will attendees learn?"
                />
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button type="button" className="btn flex-1" onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button type="submit" disabled={submitting} className="btn btn-primary flex-1">
                {submitting ? "Saving..." : "Publish"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Seminar;
