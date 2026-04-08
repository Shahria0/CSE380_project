// ============================================================
// client/src/context/AuthContext.js — Global Auth State
// ============================================================
// WHAT IS CONTEXT? React Context is a way to share data between
// components WITHOUT passing it as props through every level.
//
// WHY WE NEED THIS: The logged-in user's data is needed by the
// Navbar, Dashboard, Profile, Settings, etc. Without context,
// we'd have to pass user as a prop through every component —
// called "prop drilling". Context makes user data available
// anywhere in the app.
//
// HOW TO USE:
//   import { useAuth } from '../context/AuthContext'
//   const { user, login, logout } = useAuth()
// ============================================================

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { authAPI } from "../api/client";

// ── CREATE CONTEXT ────────────────────────────────────────────
// Creates the context object. The default value here is just a
// type hint — the actual value comes from AuthProvider.
const AuthContext = createContext(null);

// ── AUTH PROVIDER COMPONENT ───────────────────────────────────
// Wrap your entire app with this to make auth state available everywhere.
// Usage in index.js: <AuthProvider><App /></AuthProvider>
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);       // Logged-in user object (or null)
  const [loading, setLoading] = useState(true); // True while checking if user is logged in

  // ── INITIALIZE: Check if user is already logged in ──────────
  // BEGINNER NOTE: When the page loads (or refreshes), we check
  // localStorage for a saved token and validate it with the server.
  // This keeps users "logged in" across browser sessions.
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem("edubridge_token");

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        // Validate the token with the server and get fresh user data
        // The token is automatically attached by our axios interceptor
        const { data } = await authAPI.me();
        setUser(data.user);
      } catch {
        // Token is invalid or expired — clear it
        localStorage.removeItem("edubridge_token");
        localStorage.removeItem("edubridge_user");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []); // Empty array = run only on mount (once)

  // ── LOGIN FUNCTION ────────────────────────────────────────────
  // Call this after a successful login API response
  const login = useCallback((userData, token) => {
    // Persist token so user stays logged in on refresh
    localStorage.setItem("edubridge_token", token);
    localStorage.setItem("edubridge_user", JSON.stringify(userData));
    setUser(userData);
  }, []);

  // ── LOGOUT FUNCTION ───────────────────────────────────────────
  const logout = useCallback(() => {
    localStorage.removeItem("edubridge_token");
    localStorage.removeItem("edubridge_user");
    setUser(null);
  }, []);

  // ── UPDATE USER (after profile update) ────────────────────────
  // Updates local state without a full re-login
  const updateUser = useCallback((updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem("edubridge_user", JSON.stringify(updatedUser));
  }, []);

  // The value object is what all consumers of this context will receive
  const value = {
    user,           // The logged-in user object (null if not logged in)
    loading,        // True while checking auth status
    isLoggedIn: !!user, // Convenience boolean
    login,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// ── CUSTOM HOOK ────────────────────────────────────────────────
// This is a convenience wrapper. Instead of:
//   import AuthContext from '../context/AuthContext'
//   const auth = useContext(AuthContext)
// You just write:
//   const { user, logout } = useAuth()
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    // This error means you forgot to wrap your app with AuthProvider
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;
