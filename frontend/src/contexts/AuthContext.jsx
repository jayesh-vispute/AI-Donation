import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';
import { auth } from '../config/firebase';
import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithRedirect, 
  getRedirectResult, 
  sendPasswordResetEmail 
} from 'firebase/auth';

const AuthContext = createContext(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  const logout = async () => {
    setUser(null);
    setRole(null);
    localStorage.removeItem('userRole');
    localStorage.removeItem('authToken');
    try {
      if (auth.currentUser) {
        await auth.signOut();
      }
    } catch (e) {
      console.warn("Firebase signout error:", e);
    }
  };

  useEffect(() => {
    // Handle redirect result if signInWithRedirect was used
    getRedirectResult(auth)
      .then(async (result) => {
        if (result?.user) {
          const payload = {
            email: result.user.email,
            display_name: result.user.displayName || '',
            uid: result.user.uid,
            photo_url: result.user.photoURL || ''
          };
          const apiResult = await api.loginWithGoogle(payload);
          localStorage.setItem('authToken', apiResult.access_token);
          const userData = await api.getMe(apiResult.access_token);
          
          let newRole = (userData.role || '').toLowerCase();
          if (newRole.includes('donor')) newRole = 'donor';
          else if (newRole.includes('ngo')) newRole = 'ngo';
          else if (newRole.includes('admin')) newRole = 'admin';
          else newRole = 'donor';
          
          setUser({
            uid: userData.id,
            email: userData.email,
            displayName: userData.full_name,
            role: newRole,
          });
          setRole(newRole);
          localStorage.setItem('userRole', newRole);
        }
      })
      .catch((err) => {
        console.error("Redirect auth error:", err);
        logout();
      });

    // Try to load user from token on initial boot
    const token = localStorage.getItem('authToken');
    if (token) {
      api.getMe(token)
        .then((userData) => {
          let newRole = (userData.role || '').toLowerCase();
          if (newRole.includes('donor')) newRole = 'donor';
          else if (newRole.includes('ngo')) newRole = 'ngo';
          else if (newRole.includes('admin')) newRole = 'admin';
          else newRole = 'donor';

          setUser({
            uid: userData.id,
            email: userData.email,
            displayName: userData.full_name,
            role: newRole,
          });
          setRole(newRole);
          localStorage.setItem('userRole', newRole);
          setLoading(false);
        })
        .catch(() => {
          // Token invalid, expired, or user blocked
          logout();
          setLoading(false);
        });
    } else {
      logout();
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    try {
      const result = await api.login({ username: email, password });
      localStorage.setItem('authToken', result.access_token);
      
      const userData = await api.getMe(result.access_token);
      let newRole = (userData.role || '').toLowerCase();
      if (newRole.includes('donor')) newRole = 'donor';
      else if (newRole.includes('ngo')) newRole = 'ngo';
      else if (newRole.includes('admin')) newRole = 'admin';
      else newRole = 'donor';
      
      setUser({
        uid: userData.id,
        email: userData.email,
        displayName: userData.full_name,
        role: newRole,
      });
      setRole(newRole);
      localStorage.setItem('userRole', newRole);
      return { ...userData, role: newRole };
    } catch (error) {
      await logout();
      throw error;
    }
  };

  const loginWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      let result;
      try {
        result = await signInWithPopup(auth, provider);
      } catch (popupErr) {
        if (
          popupErr.code === 'auth/popup-blocked' || 
          popupErr.code === 'auth/cancelled-popup-request' ||
          popupErr.message?.includes('Cross-Origin-Opener-Policy') ||
          popupErr.message?.includes('window.closed')
        ) {
          console.warn("Popup blocked or COOP restriction detected. Falling back to signInWithRedirect...");
          await signInWithRedirect(auth, provider);
          return null;
        }
        throw popupErr;
      }
      
      if (!result?.user) return null;

      const payload = {
        email: result.user.email,
        display_name: result.user.displayName || '',
        uid: result.user.uid,
        photo_url: result.user.photoURL || ''
      };

      const apiResult = await api.loginWithGoogle(payload);
      localStorage.setItem('authToken', apiResult.access_token);
      
      const userData = await api.getMe(apiResult.access_token);
      let newRole = (userData.role || '').toLowerCase();
      if (newRole.includes('donor')) newRole = 'donor';
      else if (newRole.includes('ngo')) newRole = 'ngo';
      else if (newRole.includes('admin')) newRole = 'admin';
      else newRole = 'donor';
      
      setUser({
        uid: userData.id,
        email: userData.email,
        displayName: userData.full_name,
        role: newRole,
      });
      setRole(newRole);
      localStorage.setItem('userRole', newRole);
      return { ...userData, role: newRole };
    } catch (error) {
      await logout();
      throw error;
    }
  };

  const register = async (email, password, displayName, selectedRole) => {
    try {
      // Different endpoints depending on role (simplified here for Donor vs NGO)
      const userData = {
        email,
        password,
        full_name: displayName,
        role: selectedRole.toUpperCase()
      };
      
      let result;
      if (selectedRole.toLowerCase() === 'ngo') {
        // Need additional fields for true NGO registration but we'll map basics
        result = await api.registerNgo({ ...userData, organization_name: displayName });
      } else {
        result = await api.register(userData);
      }
      
      // Auto-login after registration
      await login(email, password);
      return result;
    } catch (error) {
      throw error;
    }
  };

  const resetPassword = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      console.error("Firebase Password Reset Error:", error.code, error.message);
      throw error;
    }
  };

  const setUserRole = (newRole) => {
    setRole(newRole);
    localStorage.setItem('userRole', newRole);
  };

  const value = {
    user,
    setUser,
    role,
    loading,
    login,
    loginWithGoogle,
    register,
    logout,
    resetPassword,
    setUserRole,
    isAuthenticated: !!user,
    isDonor: role === 'donor',
    isNgo: role === 'ngo',
    isAdmin: role === 'admin',
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
