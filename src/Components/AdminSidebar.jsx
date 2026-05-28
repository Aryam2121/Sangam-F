import React from 'react';
import { BiBookAlt, BiHome, BiStats, BiTask, BiTrain, BiLogOut, BiCurrentLocation, BiChevronLeft, BiChevronRight } from "react-icons/bi";
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSidebar, getNavPillClass, getNavIconClass } from '../context/SidebarContext';

const navItems = [
  { to: '/', icon: BiHome, label: 'Admin Dashboard', match: (p) => p === '/' || p === '/dashboard' },
  { to: '/taskManager', icon: BiTask, label: 'Tasks' },
  { to: '/projects', icon: BiBookAlt, label: 'Projects' },
  { to: '/resources', icon: BiStats, label: 'Resources' },
  { to: '/training', icon: BiTrain, label: 'Training' },
  { to: '/gisnew', icon: BiCurrentLocation, label: 'GeoLocation' },
  { to: '/Bidding', icon: BiCurrentLocation, label: 'Bidding' },
  { to: '/department', icon: BiCurrentLocation, label: 'Departments' },
  { to: '/costreduction', icon: BiCurrentLocation, label: 'Cost Reduction' },
];

const AdminSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { collapsed, toggle, sidebarWidth } = useSidebar();

  const isActive = (item) =>
    item.match ? item.match(location.pathname) : location.pathname === item.to;

  return (
    <aside
      className={`glass-panel fixed left-0 top-16 z-30 hidden max-h-[calc(100vh-4rem)] shrink-0 overflow-hidden transition-all duration-300 ease-in-out md:left-6 md:top-[calc(4rem+1.5rem)] md:block md:max-h-[calc(100vh-4rem-3rem)] md:h-[calc(100vh-4rem-3rem)] ${sidebarWidth} ${
        collapsed ? 'p-3' : 'p-4'
      }`}
    >
      <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'}`}>
        {!collapsed && (
          <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Admin</p>
        )}
        <button
          onClick={toggle}
          className={`rounded-2xl border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10 ${
            collapsed ? 'p-2.5' : 'p-2'
          }`}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          type="button"
        >
          {collapsed ? (
            <BiChevronRight className="text-2xl" />
          ) : (
            <BiChevronLeft className="text-xl" />
          )}
        </button>
      </div>

      <div className="mt-5 flex h-[calc(100%-3rem)] flex-col gap-1.5 sidebar-scroll overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item);
          return (
            <Link
              key={item.to + item.label}
              to={item.to}
              title={collapsed ? item.label : undefined}
              className={getNavPillClass(active, collapsed)}
            >
              <Icon className={getNavIconClass(collapsed)} />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
        <button
          onClick={() => {
            logout();
            navigate('/login');
          }}
          className={getNavPillClass(false, collapsed)}
          type="button"
          title={collapsed ? 'Logout' : undefined}
        >
          <BiLogOut className={getNavIconClass(collapsed)} />
          {!collapsed && <span className="truncate">Logout</span>}
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;
