import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchSeminars } from "../services/sangamApi";
import seminar from "../assets/seminar.jpg";
import meeting from "../assets/meeting.jpg";
import news from "../assets/news.jpg";
import videos from "../assets/videos.jpg";
import PageHeader from "./ui/PageHeader";
const TrainingPage = () => {
  const [seminarCount, setSeminarCount] = useState(0);
  const [docSearch, setDocSearch] = useState("");
  const [pdfFile, setPdfFile] = useState(null);
  const [documents, setDocuments] = useState([
    {
      name: "PDF product page presentation",
      uploader: "Dobria Steph",
      task: "Copywriting for all pages",
      date: "Nov 04, 2022",
      fileUrl: "/path/to/sample.pdf", // Replace with actual file path if needed
    },
    {
      name: "Latest menu icons + instances",
      uploader: "Dobria Steph",
      task: "Copywriting for all pages",
      date: "Nov 04, 2022",
      fileUrl: "/path/to/sample2.pdf",
    },
    {
      name: "Terms and Conditions + Privacy Policy",
      uploader: "Julian Bildea",
      task: "Implement online payment",
      date: "Nov 01, 2022",
      fileUrl: "/path/to/sample3.pdf",
    },
  ]);

  const handleFileChange = (event) => {
    setPdfFile(event.target.files[0]);
  };

  const handleFileUpload = () => {
    if (!pdfFile) return alert("Please select a PDF to upload!");

    const fileUrl = URL.createObjectURL(pdfFile); // Creating a temporary URL for the file
    setDocuments([
      ...documents,
      {
        name: pdfFile.name,
        uploader: "Current User",
        task: "New Task",
        date: new Date().toLocaleDateString(),
        fileUrl, // Assigning the temporary URL for download
      },
    ]);
    setPdfFile(null); // Reset the file input after upload
  };
  const filteredDocuments = useMemo(() => {
    const q = docSearch.trim().toLowerCase();
    if (!q) return documents;
    return documents.filter(
      (doc) =>
        doc.name.toLowerCase().includes(q) ||
        doc.uploader.toLowerCase().includes(q) ||
        doc.task.toLowerCase().includes(q) ||
        doc.date.toLowerCase().includes(q)
    );
  }, [documents, docSearch]);

  const navigate = useNavigate();

  useEffect(() => {
    fetchSeminars()
      .then((list) => setSeminarCount(list.length))
      .catch(() => setSeminarCount(0));
  }, []);

  const handleScheduleMeeting = () => {
    navigate("/video-conference"); // Navigate to the VideoConferencing page
  };
  return (
    <div className="page pb-10">
      <PageHeader
        kicker="Learning"
        title="Training Center"
        subtitle="Seminars, videos, meetings, and documents for your team."
      />

      <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        {[
          {
            title: "Seminars",
            badge: seminarCount > 0 ? `${seminarCount} live` : null,
            image: seminar, // Replace with the correct image source
            description: "Join published seminars and learning links from your team.",
            // duration: "Duration: 60 mins",
            // onClick: () => window.location.href = "/seminars", // Replace with the actual URL
            onClick: () =>navigate("/seminar"), // Replace with the actual URL

          },
          {
            title: "Videos",
            image: videos, // Replace with the correct image source
            description: "Watch our expert-led video sessions anytime, anywhere.",
            // duration: "Duration: 25 mins",
            onClick: () =>navigate("/videos"), // Replace with the actual URL
          },
          {
            title: "Schedule meeting",
            image: meeting, // Replace with the correct image source
            description: "Set up a meeting with our specialists for personalized advice.",
            duration: "Flexible Timings",
            onClick: handleScheduleMeeting, // Custom function for scheduling meetings
          },
          {
            title: "Latest news",
            image: news, // Replace with the correct image source
            description: "Stay updated with the latest news and trends.",
            duration: "Updated Daily",
            onClick: () =>navigate("/news"), // Replace with the actual URL
          },
        ].map(({ title, image, description, duration, onClick, badge }, index) => (
          <div key={index} className="glass-card flex flex-col overflow-hidden p-0">
            <img src={image} alt={title} className="h-40 w-full object-cover" />
            <div className="flex flex-1 flex-col p-5">
              {badge && (
                <span className="mb-2 w-fit rounded-full bg-cyan-400/15 px-2 py-0.5 text-[10px] font-semibold uppercase text-cyan-200">
                  {badge}
                </span>
              )}
              <h3 className="text-lg font-semibold text-white">{title}</h3>
              <p className="mt-2 flex-1 text-sm text-slate-400">{description}</p>
              {duration && <p className="mt-2 text-xs text-slate-500">{duration}</p>}
              <button type="button" onClick={onClick} className="btn btn-primary mt-4 w-full">
                {title === "Schedule meeting" ? "Schedule Meeting" : "Learn More"}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="glass-panel p-6">
        {/* Table Header */}
        <div className="flex justify-between items-center mb-4">
          <div className="text-sm">
            Display <span className="font-semibold">5 documents</span>
          </div>
          <div className="flex items-center gap-4">
            {/* Button to trigger the file input */}
            <button
              type="button"
              onClick={() => document.getElementById("file-input").click()}
              className="btn btn-primary"
            >
              Add New Document
            </button>
            <input
              type="file"
              id="file-input"
              accept="application/pdf"
              onChange={handleFileChange}
              style={{ display: "none" }} // Hidden input, triggered by the button
            />
            <button type="button" onClick={handleFileUpload} className="btn btn-primary">
              Upload PDF
            </button>
            <input
              type="search"
              placeholder="Search documents..."
              className="max-w-xs"
              value={docSearch}
              onChange={(e) => setDocSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Table */}
        <table className="w-full text-left text-sm">
          <thead>
            <tr>
              <th className="py-3 px-4">Name</th>
              <th className="py-3 px-4">Uploaded By</th>
              <th className="py-3 px-4">For Task</th>
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4">Options</th>
            </tr>
          </thead>
          <tbody>
            {filteredDocuments.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-400">
                  {docSearch ? "No documents match your search." : "No documents yet."}
                </td>
              </tr>
            ) : (
            filteredDocuments.map((doc, index) => (
              <tr key={index}>
                <td className="py-3 px-4 flex items-center">
                  <span className="mr-2 bg-red-500 w-6 h-6 flex items-center justify-center text-white rounded-full text-xs">
                    PDF
                  </span>
                  <a href={doc.fileUrl} download className="text-blue-400 hover:text-blue-500">
                    {doc.name}
                  </a>
                </td>
                <td className="py-3 px-4">{doc.uploader}</td>
                <td className="py-3 px-4">{doc.task}</td>
                <td className="py-3 px-4">{doc.date}</td>
                <td className="py-3 px-4">
                  <button className="text-gray-400 hover:text-white">•••</button>
                </td>
              </tr>
            )))}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="flex justify-between items-center mt-4">
          <p className="text-gray-400 text-sm">
            Showing <span className="font-semibold">1 to 5</span> of 43
          </p>
          <div className="flex items-center gap-2">
            <button className="py-1 px-3 rounded-lg bg-gray-700 hover:bg-gray-600">1</button>
            <button className="py-1 px-3 rounded-lg bg-gray-700 hover:bg-gray-600">2</button>
            <button className="py-1 px-3 rounded-lg bg-gray-700 hover:bg-gray-600">3</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrainingPage;
