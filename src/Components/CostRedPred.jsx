import React, { useState } from "react";
import { Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import { mlPredict } from "../services/sangamApi";


// Register required components for ChartJS
ChartJS.register(ArcElement, Tooltip, Legend);


const CostReductionPage = () => {
  // Form Data State
  const [formData, setFormData] = useState({
    task_priority: "",
    task_complexity: "",
    resources_allocated: "",
    communication_frequency: "",
    available_resources: "",
    historical_delay: "",
    actual_completion_time: "",
    expected_completion_time: "",
    cost_estimate: "",
    actual_cost: "",
    department: "",
    site_location: "",
  });


  // Response Data, Loading, and Error States
  const [responseData, setResponseData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);


  // Pie chart data
  const pieData = {
    labels: ["Optimization Potential", "Other Factors"],
    datasets: [
      {
        label: "Probability of Cost Optimization",
        data: [30, 70],
        backgroundColor: ["#3b82f6", "#6b7280"], // Blue and Gray
        hoverBackgroundColor: ["#2563eb", "#4b5563"],
        borderWidth: 1,
      },
    ],
  };


  // Handle Form Changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };


  // Handle Form Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);


    try {
      const responseData = await mlPredict('/predict_cost_reduction', {
        ...formData,
        task_priority: Number(formData.task_priority),
        task_complexity: Number(formData.task_complexity),
        resources_allocated: Number(formData.resources_allocated),
        communication_frequency: Number(formData.communication_frequency),
        available_resources: Number(formData.available_resources),
        historical_delay: Number(formData.historical_delay),
        actual_completion_time: Number(formData.actual_completion_time),
        expected_completion_time: Number(formData.expected_completion_time),
        cost_estimate: Number(formData.cost_estimate),
        actual_cost: Number(formData.actual_cost),
      });
      setResponseData(responseData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="page pb-10">
      <div className="page-section mb-6">
        <p className="page-kicker">Prediction</p>
        <h1 className="page-title mt-2">Cost Reduction Dashboard</h1>
        <p className="page-subtitle">Enter project signals to estimate optimization potential.</p>
      </div>

      <div className="mx-auto w-full max-w-7xl">


        {/* Form Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Left Metrics */}
          <div className="space-y-4">
            {[
              { label: "Task Priority", name: "task_priority" },
              { label: "Resources Allocated", name: "resources_allocated" },
              { label: "Available Resources", name: "available_resources" },
              { label: "Actual Completion Time", name: "actual_completion_time" },
              { label: "Cost Estimate", name: "cost_estimate" },
              { label: "Department", name: "department" },
            ].map((item, index) => (
              <div
                key={index}
                  className="glass-card flex items-center justify-between gap-4 px-6 py-4"
              >
                <span className="text-gray-400 text-lg">{item.label}:</span>
                <input
                  type="text"
                  name={item.name}
                  value={formData[item.name]}
                  onChange={handleChange}
                    className="field max-w-[18rem] text-right font-semibold"
                  required
                />
              </div>
            ))}
          </div>


          {/* Right Metrics */}
          <div className="space-y-4">
            {[
              { label: "Task Complexity", name: "task_complexity" },
              { label: "Communication Frequency", name: "communication_frequency" },
              { label: "Historical Delay", name: "historical_delay" },
              { label: "Expected Completion Time", name: "expected_completion_time" },
              { label: "Actual Cost", name: "actual_cost" },
              { label: "Site Location", name: "site_location" },
            ].map((item, index) => (
              <div
                key={index}
                className="glass-card flex items-center justify-between gap-4 px-6 py-4"
              >
                <span className="text-gray-400 text-lg">{item.label}:</span>
                <input
                  type="text"
                  name={item.name}
                  value={formData[item.name]}
                  onChange={handleChange}
                  className="field max-w-[18rem] text-right font-semibold"
                  required
                />
              </div>
            ))}
          </div>
        </div>


        {/* Divider */}
        <div className="h-px bg-gray-700 my-8"></div>


        {/* Form Submit Button */}
        <div className="flex justify-center mb-8">
          <button
            onClick={handleSubmit}
            className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold shadow-md transition-all transform hover:scale-105"
            disabled={loading}
          >
            {loading ? "Submitting..." : "Submit"}
          </button>
        </div>


        {/* Result Section */}
        {error && (
          <div className="text-center text-red-400 mb-8">
            Error: {error}
          </div>
        )}


        {responseData && (
          <div className="text-center text-green-400 mb-8">
            <h3 className="text-xl font-semibold">Prediction Result:</h3>
            <pre className="text-gray-200">{JSON.stringify(responseData, null, 2)}</pre>
          </div>
        )}


        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Budget Status */}
          <div className="glass-panel p-10">
            <h3 className="text-2xl font-bold mb-6 text-center">
              Project Budget Status
            </h3>
            <div className="flex space-x-4">
              <button className="bg-red-600 hover:bg-red-700 text-white py-3 px-5 rounded-lg font-semibold transition duration-300 w-full">
                Overbudget
              </button>
              <button className="bg-green-600 hover:bg-green-700 text-white py-3 px-5 rounded-lg font-semibold transition duration-300 w-full">
                Underbudget
              </button>
            </div>
          </div>


          {/* Cost Optimization Potential */}
          <div className="glass-panel p-10">
            <h3 className="text-2xl font-bold mb-6 text-center">
              Probability of Cost Optimization Potential
            </h3>
            <div className="relative w-full flex justify-center items-center">
              <Pie data={pieData} />
            </div>
            {/* Legend */}
            <div className="flex justify-around mt-6 text-gray-400">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-blue-500 rounded-full mr-2"></div>
                Optimization Potential
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-gray-500 rounded-full mr-2"></div>
                Other Factors
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


export default CostReductionPage;


