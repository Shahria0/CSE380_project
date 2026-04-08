// ============================================================
// client/src/components/ProtectedRoute.js
// ============================================================
// WHAT THIS DOES: Wraps any route that requires login.
// If the user is not logged in, they're redirected to /login.
// If auth is still loading (checking token), shows a spinner.
//
// USAGE in App.js:
//   <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
// ============================================================

import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ children }) => {
  const { isLoggedIn, loading } = useAuth();
  const location = useLocation();

  // Still checking if user is logged in (validating stored token)
  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <div>
          <div className="spinner spinner-dark" style={{ width: 32, height: 32, borderWidth: 3 }} />
          <p style={{ marginTop: "1rem", color: "var(--text-muted)", textAlign: "center" }}>Loading...</p>
        </div>
      </div>
    );
  }

  // Not logged in — redirect to login, but save the attempted URL
  // so we can send them back after they log in
  if (!isLoggedIn) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Logged in — render the protected page
  return children;
};

export default ProtectedRoute;
