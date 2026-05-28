import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { canAccessRoute } from "../../utils/rolePermissions";
import { normalizeRole } from "../../utils/authRedirect";
import { homePathForRole } from "../../utils/authRedirect";

/**
 * Blocks admin-only URLs for Officer / Worker roles.
 */
const RoleRoute = ({ children }) => {
  const { userData, isAuthenticated } = useAuth();
  const { pathname } = useLocation();
  const role = normalizeRole(userData?.role || localStorage.getItem("userRole"));

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!canAccessRoute(role, pathname)) {
    return <Navigate to={homePathForRole(role)} replace state={{ accessDenied: true }} />;
  }

  return children;
};

export default RoleRoute;
