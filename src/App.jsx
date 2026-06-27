import { lazy, Suspense, useEffect, useState } from "react";
import { BrowserRouter as Router, Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import GoogleMapsLoader from "./Components/GoogleMapsLoader";
import LoginPage from "./pages/LoginPage";
import Register from "./pages/Register";
import PrivateRoute from "./Components/PrivateRoute";
import GuestRoute from "./Components/ui/GuestRoute";
import HomeRedirect from "./Components/ui/HomeRedirect";
import RoleRoute from "./Components/ui/RoleRoute";
import CommandPalette from "./Components/ui/CommandPalette";

const Gis = lazy(() => import("./Components/Gis"));
const TrainingPage = lazy(() => import("./Components/Training"));
const VideoConferencePage = lazy(() => import("./pages/VideoConfrencing"));
const Project = lazy(() => import("./Components/Projects"));
const Resources = lazy(() => import("./Components/Resources"));
const TaskManager = lazy(() => import("./Components/TaskManager"));
const ProjectDetails = lazy(() => import("./Components/ProjectDetails"));
const ChatApp = lazy(() => import("./Components/Chat"));
const DiscussionForum = lazy(() => import("./Components/Disscuss"));
const BidSystem = lazy(() => import("./Components/BidSystem"));
const AnamolyDetectionPage = lazy(() => import("./Components/AnamolyDetection"));
const GisMap = lazy(() => import("./Components/GisMap"));
const DepartmentPage = lazy(() => import("./pages/DepartmentPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const Seminar = lazy(() => import("./Components/Seminar"));
const Videos = lazy(() => import("./Components/Videos"));
const News = lazy(() => import("./Components/News"));
const CostReductionPage = lazy(() => import("./Components/CostRedPred"));
const MapWithLine = lazy(() => import("./Components/MapWithLine"));
const UserDashboard = lazy(() => import("./Components/UserDashboard"));
const MapNew = lazy(() => import("./Components/MapNew"));
const ConflictPredPage = lazy(() => import("./Components/ConflictPre"));
const DepartmentPredPage = lazy(() => import("./Components/DepartmentPredPage"));
const ResourceAllocationPage = lazy(() => import("./Components/ResourceAllocationPage"));
const GisNew = lazy(() => import("./Components/Gisnew"));
const CompletedPath = lazy(() => import("./Components/CompletedPath"));
const TotalPath = lazy(() => import("./Components/TotalPath"));
const DepartmentDetails = lazy(() => import("./Components/DepartmentDetails"));
const CityKpiDashboard = lazy(() => import("./pages/CityKpiDashboard"));
const CityMapHub = lazy(() => import("./pages/CityMapHub"));
const WorkflowPage = lazy(() => import("./pages/WorkflowPage"));
const AuditTrailPage = lazy(() => import("./pages/AuditTrailPage"));
const BudgetPage = lazy(() => import("./pages/BudgetPage"));
const AnnouncementsPage = lazy(() => import("./pages/AnnouncementsPage"));
const IntegrationsPage = lazy(() => import("./pages/IntegrationsPage"));
const ApprovalsInboxPage = lazy(() => import("./pages/ApprovalsInboxPage"));

const RouteFallback = () => (
  <div className="page pb-10">
    <div className="glass-panel p-6">
      <div className="skeleton h-4 w-24" />
      <div className="skeleton mt-4 h-8 w-64" />
      <div className="skeleton mt-3 h-4 w-80" />
    </div>
  </div>
);

const App = () => {
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => {
    const onKeyDown = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen((prev) => !prev);
      }
      if (event.key === "Escape") setPaletteOpen(false);
    };
    const onOpenPalette = () => setPaletteOpen(true);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("open-command-palette", onOpenPalette);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("open-command-palette", onOpenPalette);
    };
  }, []);

  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <div className="App">
        <GoogleMapsLoader />
        <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "#0f172a",
              color: "#e2e8f0",
              border: "1px solid rgba(255,255,255,0.1)",
            },
          }}
        />
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route element={<GuestRoute />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<Register />} />
            </Route>
            <Route element={<PrivateRoute />}>
              <Route path="/" element={<HomeRedirect />} />
              <Route path="/dashboard" element={<HomeRedirect />} />
              <Route path="/city-kpi" element={<CityKpiDashboard />} />
              <Route path="/city-map" element={<CityMapHub />} />
              <Route path="/workflow" element={<WorkflowPage />} />
              <Route path="/approvals" element={<ApprovalsInboxPage />} />
              <Route path="/announcements" element={<AnnouncementsPage />} />
              <Route path="/budget" element={<RoleRoute><BudgetPage /></RoleRoute>} />
              <Route path="/audit" element={<RoleRoute><AuditTrailPage /></RoleRoute>} />
              <Route path="/integrations" element={<RoleRoute><IntegrationsPage /></RoleRoute>} />
              <Route path="/departmentprediction" element={<RoleRoute><DepartmentPredPage /></RoleRoute>} />
              <Route path="/departmentdetails" element={<RoleRoute><DepartmentDetails /></RoleRoute>} />
              <Route path="/costreduction" element={<RoleRoute><CostReductionPage /></RoleRoute>} />
              <Route path="/gisnew" element={<Navigate to="/city-map" replace />} />
              <Route path="/maps" element={<Navigate to="/city-map" replace />} />
              <Route path="/mapsnew" element={<Navigate to="/city-map" replace />} />
              <Route path="/Geolocation Interface" element={<Navigate to="/city-map" replace />} />
              <Route path="/aryan" element={<GisNew />} />
              <Route path="/completedpath" element={<CompletedPath />} />
              <Route path="/totalpath" element={<TotalPath />} />
              <Route path="/reallocate" element={<RoleRoute><ResourceAllocationPage /></RoleRoute>} />
              <Route path="/conflictprediction" element={<RoleRoute><ConflictPredPage /></RoleRoute>} />
              <Route path="/seminar" element={<Seminar />} />
              <Route path="/project/:projectId/anamoly" element={<AnamolyDetectionPage />} />
              <Route path="/videos" element={<Videos />} />
              <Route path="/news" element={<News />} />
              <Route path="/department" element={<RoleRoute><DepartmentPage /></RoleRoute>} />
              <Route path="/UserDashboard" element={<UserDashboard />} />
              <Route path="/project/:projectId/gis" element={<GisMap />} />
              <Route path="/Bidding" element={<Navigate to="/BidSystem" replace />} />
              <Route path="/training" element={<TrainingPage />} />
              <Route path="/BidSystem" element={<BidSystem />} />
              <Route path="/taskManager" element={<TaskManager />} />
              <Route path="/projects" element={<Project />} />
              <Route path="/project/:projectId" element={<ProjectDetails />} />
              <Route path="/chat" element={<ChatApp />} />
              <Route path="/discussion" element={<DiscussionForum />} />
              <Route path="/video-conference" element={<VideoConferencePage />} />
              <Route path="/ProjectManagement" element={<Navigate to="/projects" replace />} />
              <Route path="/resources" element={<Resources />} />
              <Route path="/profile" element={<ProfilePage />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </div>
    </Router>
  );
};

export default App;
