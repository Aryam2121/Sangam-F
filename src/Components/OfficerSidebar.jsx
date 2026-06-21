import React from 'react';
import { useNavigate } from 'react-router-dom';
import SidebarNav from './SidebarNav';
import { useAuth } from '../context/AuthContext';

const OfficerSidebar = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  return (
    <SidebarNav
      roleLabel="Officer"
      role="Officer"
      onLogout={() => {
        logout();
        navigate('/login');
      }}
    />
  );
};

export default OfficerSidebar;
