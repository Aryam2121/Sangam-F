import React, { createContext, useContext, useMemo, useState } from 'react';

const SidebarContext = createContext(null);

export const SidebarProvider = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);

  const value = useMemo(
    () => ({
      collapsed,
      toggle: () => setCollapsed((prev) => !prev),
      sidebarWidth: collapsed ? 'w-[5.5rem]' : 'w-72',
    }),
    [collapsed]
  );

  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>;
};

export const useSidebar = () => {
  const ctx = useContext(SidebarContext);
  if (!ctx) {
    return {
      collapsed: false,
      toggle: () => {},
      sidebarWidth: 'w-72',
    };
  }
  return ctx;
};

/** Shared classes for sidebar nav items */
export const getNavPillClass = (isActive, isCollapsed) =>
  [
    'nav-pill min-w-0',
    isActive ? 'nav-pill-active' : 'nav-pill-idle',
    isCollapsed ? 'justify-center !gap-0 !px-3 !py-3.5' : '',
  ].join(' ');

export const getNavIconClass = (isCollapsed) =>
  isCollapsed ? 'text-[1.65rem] shrink-0' : 'text-xl shrink-0';
