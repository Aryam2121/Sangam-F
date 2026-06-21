import React, { useCallback, useState } from "react";
import toast from "react-hot-toast";
import { createAnnouncement, deleteAnnouncement, fetchAnnouncements } from "../services/sangamApi";
import { useStaleResource } from "../hooks/useStaleResource";
import PageHeader from "../Components/ui/PageHeader";
import {
  EmptyState,
  Field,
  LoadingPanel,
  SectionCard,
  inputClass,
} from "../Components/ui/FeatureUi";
import { useI18n } from "../context/I18nContext";
import { useAuth } from "../context/AuthContext";
import { isMainAdmin } from "../utils/rolePermissions";

const AnnouncementsPage = () => {
  const { t } = useI18n();
  const { userData } = useAuth();
  const canManage = isMainAdmin(userData?.role) || userData?.role === "Officer";
  const [form, setForm] = useState({ title: "", body: "", department: "", pinned: false });

  const fetcher = useCallback(() => fetchAnnouncements(), []);
  const { data, loading, refresh } = useStaleResource({
    key: "announcements",
    fetcher,
    maxAgeMs: 30_000,
    initialValue: { announcements: [] },
  });

  const announcements = data?.announcements || [];
  const pinned = announcements.filter((a) => a.pinned);
  const regular = announcements.filter((a) => !a.pinned);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await createAnnouncement(form);
      toast.success("Announcement published");
      setForm({ title: "", body: "", department: "", pinned: false });
      refresh();
    } catch (err) {
      toast.error(err.message || "Failed");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this announcement?")) return;
    try {
      await deleteAnnouncement(id);
      toast.success("Deleted");
      refresh();
    } catch (err) {
      toast.error(err.message || "Failed");
    }
  };

  const renderCard = (a) => (
    <article key={a._id} className={`glass-panel p-5 transition hover:border-cyan-400/10 ${a.pinned ? "border-cyan-400/20" : ""}`}>
      <div className="flex justify-between gap-3">
        <div className="min-w-0 flex-1">
          {a.pinned && (
            <span className="mb-2 inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-cyan-200">
              Pinned
            </span>
          )}
          <h3 className="font-semibold text-white">{a.title}</h3>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-300">{a.body}</p>
          <p className="mt-4 text-xs text-slate-500">
            {a.authorName} · {a.department || "City-wide"} · {new Date(a.createdAt).toLocaleDateString()}
          </p>
        </div>
        {isMainAdmin(userData?.role) && (
          <button type="button" className="btn h-fit text-xs text-rose-200" onClick={() => handleDelete(a._id)}>
            Delete
          </button>
        )}
      </div>
    </article>
  );

  return (
    <div className="page pb-10">
      <PageHeader title={t("announcements")} subtitle="Internal city announcements by department" />

      {canManage && (
        <SectionCard title="Publish announcement" subtitle="Share updates with your department or the whole city">
          <form onSubmit={handleCreate} className="grid gap-3">
            <Field label="Title">
              <input className={inputClass} placeholder="Headline" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            </Field>
            <Field label="Body">
              <textarea className={`${inputClass} min-h-[120px]`} rows={4} placeholder="Announcement details" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} required />
            </Field>
            <Field label="Department">
              <input className={inputClass} placeholder="Leave blank for city-wide" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
            </Field>
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input type="checkbox" checked={form.pinned} onChange={(e) => setForm({ ...form, pinned: e.target.checked })} />
              Pin to top
            </label>
            <button type="submit" className="btn btn-primary w-fit">
              {t("submit")}
            </button>
          </form>
        </SectionCard>
      )}

      {loading && !announcements.length && <LoadingPanel label={t("loading")} />}

      {!loading && announcements.length === 0 && (
        <EmptyState title="No announcements" description="Published updates will appear here for all staff." />
      )}

      {pinned.length > 0 && (
        <div className="mt-6 space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-cyan-300">Pinned</h3>
          {pinned.map(renderCard)}
        </div>
      )}

      {regular.length > 0 && (
        <div className={`space-y-3 ${pinned.length ? "mt-8" : "mt-6"}`}>
          {pinned.length > 0 && <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">All announcements</h3>}
          {regular.map(renderCard)}
        </div>
      )}
    </div>
  );
};

export default AnnouncementsPage;
