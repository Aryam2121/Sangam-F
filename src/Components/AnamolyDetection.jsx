import React, { useState } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import toast from "react-hot-toast";
import { mlPredict } from "../services/sangamApi";
import PageHeader from "./ui/PageHeader";
import { Field, SectionCard, inputClass } from "./ui/FeatureUi";
import { MlResultCard } from "./ui/MlPageShell";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const fields = [
  "task_priority",
  "task_complexity",
  "communication_frequency",
  "historical_delay",
  "time_difference",
  "resource_allocation_ratio",
  "site_location_encoded",
  "department_encoded",
];

const AnomalyDetectionPage = () => {
  const [formData, setFormData] = useState(
    Object.fromEntries(fields.map((f) => [f, f.includes("ratio") ? "0.75" : "1"]))
  );
  const [predictionResult, setPredictionResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const runPrediction = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = Object.fromEntries(
        Object.entries(formData).map(([k, v]) => [k, Number(v)])
      );
      const result = await mlPredict("/predict_anomaly", payload);
      setPredictionResult(result);
      toast.success("Anomaly analysis complete");
    } catch (err) {
      toast.error(err.message || "ML service unavailable");
    } finally {
      setSubmitting(false);
    }
  };

  const chartData = {
    labels: predictionResult?.details ? Object.keys(predictionResult.details) : [],
    datasets: [
      {
        label: "Signal breakdown",
        data: predictionResult?.details ? Object.values(predictionResult.details) : [],
        borderColor: "#22d3ee",
        backgroundColor: "rgba(34, 211, 238, 0.15)",
        fill: true,
        tension: 0.4,
      },
    ],
  };

  return (
    <div className="page-stack pb-10">
      <PageHeader
        kicker="Prediction"
        title="Anomaly Detection"
        subtitle="Detect unusual patterns in task execution and resource signals"
      />

      <SectionCard title="Parameters">
        <form onSubmit={runPrediction} className="grid gap-4 sm:grid-cols-2">
          {fields.map((key) => (
            <Field key={key} label={key.replace(/_/g, " ")}>
              <input
                type="number"
                step="any"
                className={inputClass}
                value={formData[key]}
                onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                required
              />
            </Field>
          ))}
          <button type="submit" className="btn btn-primary sm:col-span-2 sm:w-fit" disabled={submitting}>
            {submitting ? "Analyzing…" : "Run detection"}
          </button>
        </form>
      </SectionCard>

      <MlResultCard result={predictionResult} title="Detection result" />

      {predictionResult?.details && (
        <SectionCard title="Signal chart" className="mt-6">
          <div className="rounded-xl border border-white/10 bg-slate-950/40 p-4">
            <Line
              data={chartData}
              options={{
                responsive: true,
                plugins: { legend: { labels: { color: "#94a3b8" } } },
                scales: {
                  x: { ticks: { color: "#64748b" }, grid: { color: "#1e293b" } },
                  y: { ticks: { color: "#64748b" }, grid: { color: "#1e293b" } },
                },
              }}
            />
          </div>
        </SectionCard>
      )}
    </div>
  );
};

export default AnomalyDetectionPage;
