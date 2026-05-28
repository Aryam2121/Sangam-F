import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
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
    localStorage.setItem('token', session.userToken);
    if (session.user?.role) {
      localStorage.setItem('userRole', session.user.role);
    }
  }, []);

  const logout = useCallback((message) => {
    clearAutoLogout();
    localStorage.removeItem('user_data');
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    setToken(null);
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

  const login = useCallback((newToken, newData, expiryTime) => {
    const expiry = Date.now() + expiryTime;
    const session = { userToken: newToken, user: newData, expiry };

    persistSession(session);
    setToken(newToken);
    setUserData(newData);
    setAuthenticated(true);
    setAutoLogout(expiryTime);
  }, [persistSession, setAutoLogout]);

  useEffect(() => {
    try {
      const storeData = JSON.parse(localStorage.getItem('user_data'));
      const legacyToken = localStorage.getItem('token');

      if (storeData?.userToken && storeData?.user && storeData?.expiry) {
        const now = Date.now();

        if (now < storeData.expiry) {
          setToken(storeData.userToken);
          setUserData(storeData.user);
          setAuthenticated(true);
          setAutoLogout(storeData.expiry - now);
        } else {
          logout();
        }
      } else if (legacyToken) {
        setToken(legacyToken);
        setAuthenticated(true);
      }
    } catch {
      logout();
    } finally {
      setIsReady(true);
    }

    return clearAutoLogout;
  }, [clearAutoLogout, logout, setAutoLogout]);

  const value = useMemo(
    () => ({ token, isAuthenticated, isReady, login, logout, userData }),
    [token, isAuthenticated, isReady, login, logout, userData]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
