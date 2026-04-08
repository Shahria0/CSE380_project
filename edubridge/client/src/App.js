// ============================================================
// client/src/App.js — Root Application Component
// ============================================================
// CHANGES IN THIS VERSION:
//   - Imports animations.css (all hover + transition styles)
//   - Wraps <Routes> in <PageTransition key={location.key}>
//     so every route change triggers a fresh entrance animation
//   - useLocation() is called inside the Router so we can read
//     the current path and pass it as the animation trigger key
// ============================================================

import React from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import PageTransition from "./components/PageTransition";

import "./animations.css";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import Dashboard from "./pages/Dashboard";
import Listings from "./pages/Listings";
import PostDetail from "./pages/PostDetail";
import CreatePost from "./pages/CreatePost";
import EditPost from "./pages/EditPost";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import Alumni from "./pages/Alumni";

const NotFound = () => (
  <div style={{ textAlign: "center", padding: "6rem 2rem" }}>
    <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>🔍</div>
    <h1 style={{ fontSize: "2rem", fontWeight: 700, marginBottom: "0.5rem" }}>Page Not Found</h1>
    <p style={{ color: "var(--text-muted)", marginBottom: "2rem" }}>The page you're looking for doesn't exist.</p>
    <a href="/"><button className="btn btn-primary btn-lg btn-animated">Go Home</button></a>
  </div>
);

// AnimatedRoutes must be a child of BrowserRouter to use useLocation()
const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    // key={location.key} forces PageTransition to remount on every navigation
    // This is what makes the animation replay on each page change
    <PageTransition key={location.key}>
      <Routes location={location}>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/listings" element={<Listings />} />
        <Route path="/posts/:id" element={<PostDetail />} />
        <Route path="/alumni" element={<Alumni />} />
        <Route path="/profile/:id" element={<Profile />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/create-post" element={<ProtectedRoute><CreatePost /></ProtectedRoute>} />
        <Route path="/edit-post/:id" element={<ProtectedRoute><EditPost /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="/home" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </PageTransition>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Navbar />
        <AnimatedRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
