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
import { mlPredict } from "../services/sangamApi";
import MlPageShell from "./ui/MlPageShell";
import { SectionCard } from "./ui/FeatureUi";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const ConflictPredPage = () => {
  const initialFields = {
    task_priority: "",
    task_complexity: "",
    resources_allocated: "",
    communication_frequency: "",
    resource_utilization: "",
    complexity_to_priority_ratio: "",
    adjusted_frequency: "",
    delay_factor: "",
    site_location: "",
    department: "",
  };

  const [formData, setFormData] = useState(initialFields);
  const [result, setResult] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const runPrediction = async () => {
    setSubmitting(true);
    try {
      const data = await mlPredict("/predict_conflict", formData);
      setResult(data);
      if (data?.chart_values) {
        setChartData({
          labels: data.chart_labels || ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"],
          datasets: [
            {
              label: "Conflict likelihood",
              data: data.chart_values,
              borderColor: "#22d3ee",
              backgroundColor: "rgba(34, 211, 238, 0.15)",
              tension: 0.3,
            },
          ],
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <MlPageShell
      title="Conflict Prediction"
      subtitle="Predict conflict likelihood from task and resource signals"
      formData={formData}
      setFormData={setFormData}
      onSubmit={runPrediction}
      submitting={submitting}
      result={result}
      chartSection={
        chartData && (
          <SectionCard title="Trend chart" className="mt-6">
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
        )
      }
    />
  );
};

export default ConflictPredPage;
