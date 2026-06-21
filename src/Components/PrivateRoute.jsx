import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import LoadingScreen from "./ui/LoadingScreen";
import AppShell from "./AppShell";
import AuthenticatedEffects from "./AuthenticatedEffects";

const PrivateRoute = () => {
  const { isAuthenticated, isReady } = useAuth();

  if (!isReady) {
    return <LoadingScreen label="Restoring your session..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <AppShell>
      <AuthenticatedEffects />
      <Outlet />
    </AppShell>
  );
};

export default PrivateRoute;
