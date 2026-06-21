import React, { useCallback, useState } from "react";
import toast from "react-hot-toast";
import { createWebhook, fetchWebhooks, sendIntegrationAlert, testWebhook } from "../services/sangamApi";
import { useStaleResource } from "../hooks/useStaleResource";
import PageHeader from "../Components/ui/PageHeader";
import {
  EmptyState,
  Field,
  SectionCard,
  StatusBadge,
  inputClass,
  selectClass,
} from "../Components/ui/FeatureUi";
import { useI18n } from "../context/I18nContext";

const IntegrationsPage = () => {
  const { t } = useI18n();
  const [webhookForm, setWebhookForm] = useState({ name: "", url: "" });
  const [alertForm, setAlertForm] = useState({ channel: "email", message: "", recipient: "" });

  const fetcher = useCallback(() => fetchWebhooks(), []);
  const { data, loading, refresh } = useStaleResource({
    key: "webhooks",
    fetcher,
    maxAgeMs: 60_000,
    initialValue: { webhooks: [] },
  });

  const webhooks = data?.webhooks || [];

  const handleCreateWebhook = async (e) => {
    e.preventDefault();
    try {
      await createWebhook(webhookForm);
      toast.success("Webhook created");
      setWebhookForm({ name: "", url: "" });
      refresh();
    } catch (err) {
      toast.error(err.message || "Failed");
    }
  };

  const handleTest = async (id) => {
    try {
      const res = await testWebhook(id);
      toast.success(res.simulated ? "Simulated test payload sent" : `Webhook responded ${res.status}`);
      refresh();
    } catch (err) {
      toast.error(err.message || "Test failed");
    }
  };

  const handleAlert = async (e) => {
    e.preventDefault();
    try {
      const res = await sendIntegrationAlert(alertForm);
      toast.success(res.note || "Alert queued (simulated)");
      setAlertForm({ channel: "email", message: "", recipient: "" });
    } catch (err) {
      toast.error(err.message || "Failed");
    }
  };

  return (
    <div className="page pb-10">
      <PageHeader title={t("integrations")} subtitle="Webhooks, email/SMS alerts & external connectors" />

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title="Webhooks" subtitle="Push Sangam events to external systems">
          <form onSubmit={handleCreateWebhook} className="grid gap-3">
            <Field label="Name">
              <input className={inputClass} placeholder="e.g. Slack alerts" value={webhookForm.name} onChange={(e) => setWebhookForm({ ...webhookForm, name: e.target.value })} required />
            </Field>
            <Field label="Endpoint URL">
              <input className={inputClass} placeholder="https://…" value={webhookForm.url} onChange={(e) => setWebhookForm({ ...webhookForm, url: e.target.value })} required />
            </Field>
            <button type="submit" className="btn btn-primary w-fit">
              Add webhook
            </button>
          </form>

          <div className="mt-6">
            {loading && !webhooks.length ? (
              <p className="text-sm text-slate-400">Loading webhooks…</p>
            ) : webhooks.length === 0 ? (
              <EmptyState title="No webhooks" description="Add an endpoint to receive event payloads." />
            ) : (
              <ul className="divide-y divide-white/5">
                {webhooks.map((w) => (
                  <li key={w._id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
                    <div>
                      <p className="font-medium text-white">{w.name}</p>
                      <p className="mt-1 truncate text-xs text-slate-500">{w.url}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={w.lastStatus === "success" ? "approved" : w.lastStatus === "failed" ? "rejected" : "pending"} />
                      <button type="button" className="btn text-xs" onClick={() => handleTest(w._id)}>
                        Test
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </SectionCard>

        <SectionCard title="Send alert" subtitle="Simulated email, SMS & WhatsApp dispatch">
          <form onSubmit={handleAlert} className="grid gap-3">
            <Field label="Channel">
              <select className={selectClass} value={alertForm.channel} onChange={(e) => setAlertForm({ ...alertForm, channel: e.target.value })}>
                <option value="email">Email</option>
                <option value="sms">SMS</option>
                <option value="whatsapp">WhatsApp</option>
              </select>
            </Field>
            <Field label="Recipient">
              <input className={inputClass} placeholder="email or phone" value={alertForm.recipient} onChange={(e) => setAlertForm({ ...alertForm, recipient: e.target.value })} />
            </Field>
            <Field label="Message">
              <textarea className={`${inputClass} min-h-[96px]`} rows={3} placeholder="Alert message" value={alertForm.message} onChange={(e) => setAlertForm({ ...alertForm, message: e.target.value })} required />
            </Field>
            <button type="submit" className="btn btn-primary w-fit">
              Send
            </button>
          </form>
        </SectionCard>
      </div>

      <SectionCard className="mt-6" title="Production setup" subtitle="Configure live connectors">
        <p className="text-sm leading-relaxed text-slate-400">
          GeoJSON import is available on the <strong className="text-white">City Map Hub</strong> (admin only). For production alerts, set SMTP/SMS credentials in the backend environment and verify webhooks against your staging endpoints first.
        </p>
      </SectionCard>
    </div>
  );
};

export default IntegrationsPage;
