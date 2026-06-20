import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { firebaseSignOut } from "../config/firebase";
import { fetchNotifications, logoutSession } from "../services/sangamApi";
import { homePathForRole, normalizeRole } from "../utils/authRedirect";
import GlobalSearch from "./ui/GlobalSearch";
import { getUserAvatarUrl } from "../utils/userAvatar";
import sung from "../assets/newlogo.svg";
import { useStaleResource } from "../hooks/useStaleResource";

const Navbar = () => {
  const navigate = useNavigate();
  const { logout, userData } = useAuth();
  const menuRef = useRef(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const role = normalizeRole(userData?.role || localStorage.getItem("userRole"));

  const dashboardPath = useMemo(() => homePathForRole(role), [role]);

  const tasksPath = useMemo(() => {
    if (role === "Worker") return "/UserDashboard";
    return "/taskManager";
  }, [role]);

  const notificationsFetcher = useCallback(() => fetchNotifications(), []);
  const { data: notifData, loading: notifLoading } = useStaleResource({
    key: `notifications:${role}`,
    fetcher: notificationsFetcher,
    maxAgeMs: 30_000,
    refreshMs: 60_000,
    initialValue: { notifications: [] },
  });

  const notifications = useMemo(
    () =>
      (notifData?.notifications || []).map((n) => {
        let path = n.path || tasksPath;
        if (role === "Worker" && path === "/taskManager") path = "/UserDashboard";
        return {
          ...n,
          action: () => navigate(path),
        };
      }),
    [navigate, notifData?.notifications, role, tasksPath]
  );

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowNotifications(false);
        setShowProfileMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const userName = userData?.fullName || userData?.username || "Workspace";
  const userRole = userData?.role || localStorage.getItem("userRole") || "Workspace";
  const avatarUrl = useMemo(() => getUserAvatarUrl(userData), [userData]);
  const [avatarSrc, setAvatarSrc] = useState(avatarUrl);

  useEffect(() => {
    setAvatarSrc(avatarUrl);
  }, [avatarUrl]);

  return (
    <nav className="fixed left-0 top-0 z-50 w-full border-b border-white/10 bg-slate-950/80 backdrop-blur-xl shadow-lg shadow-slate-950/30">
      <div className="flex h-16 items-center justify-between px-3 sm:px-6">
        <div className="flex items-center gap-3 sm:gap-4">
          <img src={sung} alt="Sangam" className="h-9 w-auto sm:h-10" />
          <span className="hidden rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[10px] uppercase tracking-[0.25em] text-cyan-100 sm:inline-block">
            Control Center
          </span>
        </div>

        <GlobalSearch />

        <div ref={menuRef} className="relative flex items-center gap-2 sm:gap-4">
          <button
            type="button"
            onClick={() => {
              setShowNotifications((open) => !open);
              setShowProfileMenu(false);
            }}
            className="relative rounded-2xl border border-white/10 bg-white/5 p-2.5 text-slate-200 transition hover:bg-white/10"
            aria-label="Open notifications"
            aria-expanded={showNotifications}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor" className="h-6 w-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V4a2 2 0 10-4 0v1.341C7.67 7.165 7 8.97 7 11v3.159c0 .417-.154.823-.405 1.145L5 17h5m5 0a3 3 0 11-6 0m6 0H9" />
            </svg>
            {notifications.length > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-cyan-400 text-[9px] font-bold text-slate-950">
                {notifications.length > 9 ? "9+" : notifications.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event("open-command-palette"))}
            className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:bg-white/10 sm:hidden"
            aria-label="Open quick command palette"
          >
            Search
          </button>

          {showNotifications && (
            <div className="absolute right-14 top-14 w-[min(22rem,calc(100vw-2rem))] rounded-3xl border border-white/10 bg-slate-950/95 p-4 shadow-2xl sm:right-16">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-white">Notifications</p>
                  <p className="text-xs text-slate-400">Live from your workspace</p>
                </div>
                <button type="button" onClick={() => setShowNotifications(false)} className="btn px-3 py-1 text-xs">
                  Close
                </button>
              </div>

              <div className="max-h-64 space-y-2 overflow-y-auto custom-scrollbar">
                {notifLoading ? (
                  <div className="flex justify-center py-6">
                    <div className="loading-spinner" />
                  </div>
                ) : notifications.length === 0 ? (
                  <p className="px-2 py-4 text-center text-sm text-slate-400">No notifications right now</p>
                ) : (
                  notifications.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        item.action();
                        setShowNotifications(false);
                      }}
                      className="w-full rounded-2xl border border-white/10 bg-white/5 p-3 text-left transition hover:border-cyan-400/30 hover:bg-white/10"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-white">{item.title}</p>
                          <p className="mt-1 text-xs text-slate-400">{item.description}</p>
                        </div>
                        <span className="whitespace-nowrap text-[11px] text-slate-500">{item.time}</span>
                      </div>
                    </button>
                  ))
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  navigate(tasksPath);
                  setShowNotifications(false);
                }}
                className="btn btn-primary mt-3 w-full"
              >
                {role === "Worker" ? "View my dashboard" : role === "Officer" ? "Open task manager" : "View task center"}
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              setShowProfileMenu((open) => !open);
              setShowNotifications(false);
            }}
            className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-2 py-2 transition hover:bg-white/10 sm:gap-3 sm:px-3"
            aria-label="Open profile menu"
            aria-expanded={showProfileMenu}
          >
            <img
              src={avatarSrc}
              alt={userName}
              className="h-9 w-9 rounded-full border border-white/20 object-cover bg-slate-800"
              referrerPolicy="no-referrer"
              onError={() => setAvatarSrc(getUserAvatarUrl(userData, { skipPhoto: true }))}
            />
            <div className="hidden text-left text-xs text-slate-200 md:block">
              <p className="font-semibold">Welcome back</p>
              <p className="text-slate-400">{userName}</p>
            </div>
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 top-14 w-64 rounded-3xl border border-white/10 bg-slate-950/95 p-3 shadow-2xl">
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
                <img
                  src={avatarSrc}
                  alt={userName}
                  className="h-12 w-12 shrink-0 rounded-full border border-white/20 object-cover bg-slate-800"
                  referrerPolicy="no-referrer"
                  onError={() => setAvatarSrc(getUserAvatarUrl(userData, { skipPhoto: true }))}
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">{userName}</p>
                  <p className="truncate text-xs text-slate-400">{userData?.email || userRole}</p>
                  <p className="text-[10px] uppercase tracking-wider text-cyan-200/70">{userRole}</p>
                </div>
              </div>
              <div className="mt-3 space-y-2">
                <button type="button" onClick={() => { navigate(dashboardPath); setShowProfileMenu(false); }} className="w-full rounded-2xl bg-white/5 px-4 py-2 text-left text-sm text-slate-100 hover:bg-white/10">
                  Go to dashboard
                </button>
                <button type="button" onClick={() => { navigate("/profile"); setShowProfileMenu(false); }} className="w-full rounded-2xl bg-white/5 px-4 py-2 text-left text-sm text-slate-100 hover:bg-white/10">
                  Profile & password
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await logoutSession();
                    } catch {
                      /* session may already be invalid */
                    }
                    logout();
                    firebaseSignOut().catch(() => {});
                    navigate("/login");
                  }}
                  className="w-full rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-2 text-left text-sm text-red-100 hover:bg-red-400/15"
                >
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
