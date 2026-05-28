import React from 'react';
import { useLocation } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import UserSidebar from './UserSidebar';
import OfficerSidebar from './OfficerSidebar';
import { useAuth } from '../context/AuthContext';
import { normalizeRole } from '../utils/authRedirect';

const Sidebar = () => {
  const location = useLocation();
  const { isAuthenticated, userData } = useAuth();

  const noSidebarRoutes = ['/login', '/register'];
  const shouldShowSidebar = isAuthenticated && !noSidebarRoutes.includes(location.pathname);
  const role = normalizeRole(userData?.role || localStorage.getItem('userRole'));

  if (!shouldShowSidebar) {
    return null;
  }

  if (role === 'Main Admin') return <AdminSidebar />;
  if (role === 'Officer') return <OfficerSidebar />;
  if (role === 'Worker') return <UserSidebar />;

  return <AdminSidebar />;
};

export default Sidebar;
