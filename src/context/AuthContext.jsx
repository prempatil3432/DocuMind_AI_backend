import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('documind_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('documind_token');
    if (token) {
      api.get('/auth/profile')
        .then(res => {
          if (res.data.data) {
            setUser(res.data.data);
            localStorage.setItem('documind_user', JSON.stringify(res.data.data));
          }
        })
        .catch(() => {
          localStorage.removeItem('documind_token');
          localStorage.removeItem('documind_user');
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { token, user: loggedUser } = res.data.data;
    localStorage.setItem('documind_token', token);
    localStorage.setItem('documind_user', JSON.stringify(loggedUser));
    setUser(loggedUser);
    return loggedUser;
  };

  const register = async (email, password, name) => {
    const res = await api.post('/auth/register', { email, password, name });
    const { token, user: registeredUser } = res.data.data;
    localStorage.setItem('documind_token', token);
    localStorage.setItem('documind_user', JSON.stringify(registeredUser));
    setUser(registeredUser);
    return registeredUser;
  };

  const demoLogin = async () => {
    const res = await api.post('/auth/demo-login');
    const { token, user: demoUser } = res.data.data;
    localStorage.setItem('documind_token', token);
    localStorage.setItem('documind_user', JSON.stringify(demoUser));
    setUser(demoUser);
    return demoUser;
  };

  const logout = () => {
    localStorage.removeItem('documind_token');
    localStorage.removeItem('documind_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, demoLogin, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
