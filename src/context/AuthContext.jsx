import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

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
    try {
      const storeData = JSON.parse(localStorage.getItem('user_data'));

      if (storeData?.user && storeData?.expiry) {
        const now = Date.now();

        if (now < storeData.expiry) {
          setUserData(storeData.user);
          setAuthenticated(true);
          setAutoLogout(storeData.expiry - now);
        } else {
          logout();
        }
      }
    } catch {
      logout();
    } finally {
      setIsReady(true);
    }

    return clearAutoLogout;
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
