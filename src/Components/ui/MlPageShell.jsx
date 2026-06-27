import React from "react";
import toast from "react-hot-toast";
import PageHeader from "./PageHeader";
import { Field, SectionCard, inputClass, selectClass } from "./FeatureUi";
import { useMlPrefill, applyPrefillToForm } from "../../hooks/useMlPrefill";

export const MlResultCard = ({ result, title = "Prediction result" }) => {
  if (!result) return null;
  const summary =
    result.prediction ??
    result.conflict_likelihood ??
    result.recommendation ??
    result.message ??
    null;

  return (
    <SectionCard title={title} className="mt-6">
      {summary && (
        <p className="mb-4 text-lg font-semibold text-cyan-200">{String(summary)}</p>
      )}
      <pre className="max-h-64 overflow-auto rounded-xl border border-white/10 bg-slate-950/60 p-4 text-xs text-slate-300">
        {JSON.stringify(result, null, 2)}
      </pre>
    </SectionCard>
  );
};

const MlPageShell = ({
  kicker = "Prediction",
  title,
  subtitle,
  formData,
  setFormData,
  onSubmit,
  submitting = false,
  result,
  resultTitle,
  children,
  showPrefill = true,
  chartSection,
}) => {
  const { projects, selectedProjectId, setSelectedProjectId, prefill, loading: prefillLoading } =
    useMlPrefill();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await onSubmit();
    } catch (err) {
      toast.error(err.message || "Prediction failed. Is the ML service running?");
    }
  };

  return (
    <div className="page-stack pb-10">
      <PageHeader kicker={kicker} title={title} subtitle={subtitle} />

      {showPrefill && (
        <SectionCard title="Auto-fill" subtitle="Load features from an existing project">
          <div className="flex flex-wrap gap-3">
            <select
              className={`${selectClass} max-w-xs`}
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
            >
              <option value="">Select project…</option>
              {projects.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="btn btn-primary"
              disabled={!prefill || prefillLoading}
              onClick={() => applyPrefillToForm(prefill, setFormData)}
            >
              Apply prefill
            </button>
          </div>
        </SectionCard>
      )}

      <SectionCard title="Input parameters">
        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
          {Object.keys(formData).map((key) => (
            <Field key={key} label={key.replace(/_/g, " ")}>
              <input
                type={
                  key.includes("location") ||
                  key.includes("department") ||
                  key.startsWith("department_")
                    ? "text"
                    : "number"
                }
                step="any"
                name={key}
                value={formData[key]}
                onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                className={inputClass}
                required
              />
            </Field>
          ))}
          {children}
          <button type="submit" className="btn btn-primary sm:col-span-2 sm:w-fit" disabled={submitting}>
            {submitting ? "Running…" : "Run prediction"}
          </button>
        </form>
      </SectionCard>

      <MlResultCard result={result} title={resultTitle} />
      {chartSection}
    </div>
  );
};

export default MlPageShell;
