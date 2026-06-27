import React, { useState } from "react";
import toast from "react-hot-toast";
import VideoConference from "../Components/VideoConfrence";
import PageHeader from "../Components/ui/PageHeader";
import { Field, SectionCard, inputClass } from "../Components/ui/FeatureUi";
import { createAnnouncement } from "../services/sangamApi";

const VideoConferencePage = () => {
  const roomID =
    new URLSearchParams(window.location.search).get("roomID") ||
    String(Math.floor(Math.random() * 10000) + 1);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", message: "" });
  const [saving, setSaving] = useState(false);

  const handleNotify = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error("Title is required");
      return;
    }
    setSaving(true);
    try {
      await createAnnouncement({
        title: form.title,
        body: form.message || `Meeting room ${roomID}`,
        priority: "medium",
      });
      toast.success("Team notified via announcements");
      setForm({ title: "", message: "" });
      setShowForm(false);
    } catch (err) {
      toast.error(err.message || "Could not send notification");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-stack pb-10">
      <PageHeader
        kicker="Collaboration"
        title="Video conference"
        subtitle={`Room ${roomID} — schedule and notify your team`}
        actions={
          <button type="button" className="btn btn-primary" onClick={() => setShowForm(true)}>
            Notify team
          </button>
        }
      />

      <SectionCard title="Meeting room">
        <VideoConference roomID={roomID} />
      </SectionCard>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-md p-6">
            <h2 className="text-lg font-semibold text-white">Notify team</h2>
            <p className="mt-1 text-sm text-slate-400">Creates a city announcement for this meeting</p>
            <form onSubmit={handleNotify} className="mt-5 space-y-4">
              <Field label="Title">
                <input
                  className={inputClass}
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Site standup — Room 42"
                  required
                />
              </Field>
              <Field label="Message">
                <textarea
                  className={`${inputClass} min-h-[96px]`}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="Join the video room from Training hub"
                />
              </Field>
              <div className="flex justify-end gap-2">
                <button type="button" className="btn" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? "Sending…" : "Send"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoConferencePage;
