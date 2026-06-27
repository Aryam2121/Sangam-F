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

const ResourceAllocationPage = () => {
  const [formData, setFormData] = useState({
    department: "",
    site_location: "",
    historical_conflicts: "",
    project_overlap: "",
    communication_frequency: "",
  });
  const [result, setResult] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const runPrediction = async () => {
    setSubmitting(true);
    try {
      const data = await mlPredict("/predict_resource_allocation", formData);
      setResult(data);
      if (data?.chart_values) {
        setChartData({
          labels: data.chart_labels || ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"],
          datasets: [
            {
              label: "Resource allocation forecast",
              data: data.chart_values,
              borderColor: "#34d399",
              backgroundColor: "rgba(52, 211, 153, 0.15)",
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
      title="Resource Reallocation"
      subtitle="ML-assisted resource allocation across departments and sites"
      formData={formData}
      setFormData={setFormData}
      onSubmit={runPrediction}
      submitting={submitting}
      result={result}
      chartSection={
        chartData && (
          <SectionCard title="Allocation forecast" className="mt-6">
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

export default ResourceAllocationPage;
