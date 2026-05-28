import { lazy, Suspense, useEffect, useState } from "react";
import { BrowserRouter as Router, Navigate, Route, Routes } from "react-router-dom";
import { Toaster, toast } from "react-hot-toast";
import { generateFcmToken, getMessagingInstance } from "./config/firebase";
import { onMessage } from "firebase/messaging";

import AppShell from "./Components/AppShell";
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
const ProjectsM = lazy(() => import("./Components/ProjectsM"));
const Project = lazy(() => import("./Components/Projects"));
const Resources = lazy(() => import("./Components/Resources"));
const TaskManager = lazy(() => import("./Components/TaskManager"));
const ProjectDetails = lazy(() => import("./Components/ProjectDetails"));
const ChatApp = lazy(() => import("./Components/Chat"));
const DiscussionForum = lazy(() => import("./Components/Disscuss"));
const BidSystem = lazy(() => import("./Components/BidSystem"));
const BiddingPage = lazy(() => import("./Components/Bidding"));
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
const Arya = lazy(() => import("./Components/arya"));
const DepartmentDetails = lazy(() => import("./Components/DepartmentDetails"));

const RouteFallback = () => (
  <div className="page pb-10">
    <div className="glass-panel p-6">
      <div className="skeleton h-4 w-24" />
      <div className="skeleton mt-4 h-8 w-64" />
      <div className="skeleton mt-3 h-4 w-80" />
    </div>
  </div>
);

const AppRoutes = () => (
  <AppShell>
    <Routes future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Route element={<PrivateRoute />}>
        <Route path="/" element={<HomeRedirect />} />
        <Route path="/dashboard" element={<HomeRedirect />} />
        <Route path="/departmentprediction" element={<RoleRoute><DepartmentPredPage /></RoleRoute>} />
        <Route path="/departmentdetails" element={<RoleRoute><DepartmentDetails /></RoleRoute>} />
        <Route path="/costreduction" element={<RoleRoute><CostReductionPage /></RoleRoute>} />
        <Route path="/gisnew" element={<GisNew />} />
        <Route path="/aryan" element={<Arya />} />
        <Route path="/completedpath" element={<CompletedPath />} />
        <Route path="/totalpath" element={<TotalPath />} />
        <Route path="/reallocate" element={<RoleRoute><ResourceAllocationPage /></RoleRoute>} />
        <Route path="/conflictprediction" element={<RoleRoute><ConflictPredPage /></RoleRoute>} />
        <Route path="/seminar" element={<Seminar />} />
        <Route path="/maps" element={<MapWithLine />} />
        <Route path="/mapsnew" element={<MapNew />} />
        <Route path="/project/:projectId/anamoly" element={<AnamolyDetectionPage />} />
        <Route path="/videos" element={<Videos />} />
        <Route path="/news" element={<News />} />
        <Route path="/department" element={<RoleRoute><DepartmentPage /></RoleRoute>} />
        <Route path="/UserDashboard" element={<UserDashboard />} />
        <Route path="/project/:projectId/gis" element={<GisMap />} />
        <Route path="/Bidding" element={<RoleRoute><BiddingPage /></RoleRoute>} />
        <Route path="/Geolocation Interface" element={<Gis />} />
        <Route path="/training" element={<TrainingPage />} />
        <Route path="/BidSystem" element={<BidSystem />} />
        <Route path="/taskManager" element={<TaskManager />} />
        <Route path="/projects" element={<Project />} />
        <Route path="/project/:projectId" element={<ProjectDetails />} />
        <Route path="/chat" element={<ChatApp />} />
        <Route path="/discussion" element={<DiscussionForum />} />
        <Route path="/video-conference" element={<VideoConferencePage />} />
        <Route path="/ProjectManagement" element={<RoleRoute><ProjectsM /></RoleRoute>} />
        <Route path="/resources" element={<Resources />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </AppShell>
);

const App = () => {
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => {
    const setupNotifications = async () => {
      try {
        const messaging = await getMessagingInstance();
        await generateFcmToken();
        if (messaging) {
          onMessage(messaging, (payload) => {
            const body = payload?.notification?.body;
            if (body) toast(body, { icon: "🔔" });
          });
        }
      } catch (err) {
        console.warn("Push notifications unavailable:", err?.message || err);
      }
    };
    setupNotifications();
  }, []);

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
    <Router>
      <div className="App">
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
          <Route path="/*" element={<AppRoutes />} />
          </Routes>
        </Suspense>
      </div>
    </Router>
  );
};

export default App;
