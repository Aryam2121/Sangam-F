import React from 'react';
import { useNavigate } from 'react-router-dom';
import SidebarNav from './SidebarNav';
import { useAuth } from '../context/AuthContext';

const UserSidebar = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  return (
    <SidebarNav
      roleLabel="Worker"
      role="Worker"
      onLogout={() => {
        logout();
        navigate('/login');
      }}
    />
  );
};

export default UserSidebar;
