import { Navigate } from "react-router-dom";
import DashboardPage from "../Dashboard";
import OfficerDashboard from "../OfficerDashboard";
import { normalizeRole } from "../../utils/authRedirect";

const HomeRedirect = () => {
  const role = normalizeRole(localStorage.getItem("userRole"));

  if (role === "Worker") {
    return <Navigate to="/UserDashboard" replace />;
  }

  if (role === "Officer") {
    return <OfficerDashboard />;
  }

  return <DashboardPage />;
};

export default HomeRedirect;
