import React from "react";
import { Link, useLocation } from "react-router-dom";
import { BiChevronLeft, BiChevronRight, BiLogOut } from "react-icons/bi";
import { useSidebar, getNavPillClass, getNavIconClass } from "../context/SidebarContext";
import { navForRole } from "../config/navItems";

const SidebarNav = ({ roleLabel, role, onLogout }) => {
  const location = useLocation();
  const { collapsed, toggle, sidebarWidth } = useSidebar();
  const items = navForRole(role);

  const isActive = (item) =>
    item.match ? item.match(location.pathname) : location.pathname === item.to;

  return (
    <aside
      className={`glass-panel fixed left-0 top-16 z-30 hidden max-h-[calc(100vh-4rem)] shrink-0 overflow-hidden transition-all duration-300 ease-in-out md:left-6 md:top-[calc(4rem+1.5rem)] md:block md:max-h-[calc(100vh-4rem-3rem)] md:h-[calc(100vh-4rem-3rem)] ${sidebarWidth} ${
        collapsed ? "p-3" : "p-4"
      }`}
    >
      <div className={`flex items-center ${collapsed ? "justify-center" : "justify-between"}`}>
        {!collapsed && <p className="text-xs uppercase tracking-[0.4em] text-slate-400">{roleLabel}</p>}
        <button
          onClick={toggle}
          className={`rounded-2xl border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10 ${collapsed ? "p-2.5" : "p-2"}`}
          type="button"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <BiChevronRight className="text-2xl" /> : <BiChevronLeft className="text-xl" />}
        </button>
      </div>

      <div className="mt-5 flex h-[calc(100%-3rem)] flex-col gap-1.5 sidebar-scroll overflow-y-auto">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.to + item.label}
              to={item.to}
              title={collapsed ? item.label : undefined}
              className={getNavPillClass(isActive(item), collapsed)}
            >
              <Icon className={getNavIconClass(collapsed)} />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
        <button
          onClick={onLogout}
          className={getNavPillClass(false, collapsed)}
          type="button"
          title={collapsed ? "Logout" : undefined}
        >
          <BiLogOut className={getNavIconClass(collapsed)} />
          {!collapsed && <span className="truncate">Logout</span>}
        </button>
      </div>
    </aside>
  );
};

export default SidebarNav;
