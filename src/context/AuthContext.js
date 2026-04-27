import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => localStorage.getItem('user'));
  const [role, setRole] = useState(() => {
    const storedRole = localStorage.getItem('role');
    if (storedRole) return storedRole;

    const savedUser = localStorage.getItem('user');
    if (savedUser?.startsWith('merchant')) return 'merchant';
    if (savedUser?.startsWith('reviewer')) return 'reviewer';
    return null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, []);

  const login = ({ username, role }) => {
    localStorage.setItem('user', username.trim());
    if (role) {
      localStorage.setItem('role', role);
      setRole(role);
    }
    setUser(username.trim());
  };

  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('role');
    setUser(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider value={{ user, role, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};