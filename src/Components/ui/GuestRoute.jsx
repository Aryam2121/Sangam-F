import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { homePathForRole, normalizeRole } from "../../utils/authRedirect";
import LoadingScreen from "./LoadingScreen";

const GuestRoute = () => {
  const { isAuthenticated, isReady, userData } = useAuth();

  if (!isReady) {
    return <LoadingScreen label="Loading..." />;
  }

  if (isAuthenticated) {
    const role = normalizeRole(userData?.role || localStorage.getItem("userRole"));
    return <Navigate to={homePathForRole(role)} replace />;
  }

  return <Outlet />;
};

export default GuestRoute;
