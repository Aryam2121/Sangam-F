import React from 'react';
import { useNavigate } from 'react-router-dom';
import SidebarNav from './SidebarNav';
import { useAuth } from '../context/AuthContext';
import { normalizeRole } from '../utils/authRedirect';

const AdminSidebar = () => {
  const navigate = useNavigate();
  const { logout, userData } = useAuth();
  const role = normalizeRole(userData?.role || localStorage.getItem('userRole'));

  return (
    <SidebarNav
      roleLabel="Admin"
      role={role}
      onLogout={() => {
        logout();
        navigate('/login');
      }}
    />
  );
};

export default AdminSidebar;
