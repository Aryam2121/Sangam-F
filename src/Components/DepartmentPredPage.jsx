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

const DepartmentPredPage = () => {
  const [formData, setFormData] = useState({
    department_1: "",
    department_2: "",
    latitude: "",
    longitude: "",
    historical_conflicts: "",
    project_overlap: "",
    distance: "",
    communication_frequency: "",
  });
  const [result, setResult] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const runPrediction = async () => {
    setSubmitting(true);
    try {
      const data = await mlPredict("/predict_department_conflict", formData);
      setResult(data);
      if (data?.chart_values) {
        setChartData({
          labels: data.chart_labels || ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
          datasets: [
            {
              label: "Department conflict index",
              data: data.chart_values,
              borderColor: "#818cf8",
              backgroundColor: "rgba(129, 140, 248, 0.15)",
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
      title="Department Conflict Prediction"
      subtitle="Model cross-department friction from overlap and communication patterns"
      formData={formData}
      setFormData={setFormData}
      onSubmit={runPrediction}
      submitting={submitting}
      result={result}
      showPrefill={false}
      chartSection={
        chartData && (
          <SectionCard title="Conflict trend" className="mt-6">
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

export default DepartmentPredPage;
