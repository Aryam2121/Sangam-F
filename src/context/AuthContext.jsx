import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { refreshAccessToken } from '../config/api';

const SESSION_EXPIRED_EVENT = 'auth:session-expired';

const isGuestPath = () => {
  if (typeof window === 'undefined') return false;
  const path = window.location.pathname;
  return path === '/login' || path === '/register';
};

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [userData, setUserData] = useState(null);
  const [isAuthenticated, setAuthenticated] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const logoutTimerRef = useRef(null);

  const clearAutoLogout = useCallback(() => {
    if (logoutTimerRef.current) {
      clearTimeout(logoutTimerRef.current);
      logoutTimerRef.current = null;
    }
  }, []);

  const persistSession = useCallback((session) => {
    localStorage.setItem('user_data', JSON.stringify(session));
    if (session.user?.role) {
      localStorage.setItem('userRole', session.user.role);
    }
  }, []);

  const logout = useCallback((message) => {
    clearAutoLogout();
    localStorage.removeItem('user_data');
    localStorage.removeItem('userRole');
    Object.keys(localStorage)
      .filter((key) => key.startsWith('cache:'))
      .forEach((key) => localStorage.removeItem(key));
    setUserData(null);
    setAuthenticated(false);
    if (message) {
      console.info(message);
    }
  }, [clearAutoLogout]);

  const setAutoLogout = useCallback((timeUntilLogout) => {
    clearAutoLogout();
    logoutTimerRef.current = setTimeout(() => {
      logout('Session has expired. Please log in again.');
    }, timeUntilLogout);
  }, [clearAutoLogout, logout]);

  const login = useCallback((newData, expiryTime) => {
    const expiry = Date.now() + expiryTime;
    const session = { user: newData, expiry };

    persistSession(session);
    setUserData(newData);
    setAuthenticated(true);
    setAutoLogout(expiryTime);
  }, [persistSession, setAutoLogout]);

  useEffect(() => {
    const onSessionExpired = () => {
      logout('Session has expired. Please log in again.');
    };

    window.addEventListener(SESSION_EXPIRED_EVENT, onSessionExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onSessionExpired);
  }, [logout]);

  useEffect(() => {
    let cancelled = false;

    const restoreSession = async () => {
      try {
        const storeData = JSON.parse(localStorage.getItem('user_data'));

        if (storeData?.user && storeData?.expiry) {
          const now = Date.now();

          if (isGuestPath()) {
            logout();
          } else if (now < storeData.expiry) {
            try {
              await refreshAccessToken();
              if (cancelled) return;
              setUserData(storeData.user);
              setAuthenticated(true);
              setAutoLogout(storeData.expiry - now);
            } catch {
              if (!cancelled) logout();
            }
          } else {
            logout();
          }
        }
      } catch {
        logout();
      } finally {
        if (!cancelled) setIsReady(true);
      }
    };

    restoreSession();

    return () => {
      cancelled = true;
      clearAutoLogout();
    };
  }, [clearAutoLogout, logout, setAutoLogout]);

  const value = useMemo(
    () => ({ isAuthenticated, isReady, login, logout, userData }),
    [isAuthenticated, isReady, login, logout, userData]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
