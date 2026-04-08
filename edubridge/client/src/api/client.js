// ============================================================
// client/src/api/client.js — Axios API Client
// ============================================================
// WHAT THIS DOES: Creates a pre-configured axios instance that
// automatically:
//   1. Points to our backend URL
//   2. Attaches the JWT token to every request
//   3. Handles 401 errors (expired tokens) by logging out
//
// BEGINNER NOTE: Instead of writing
//   axios.get('http://localhost:5000/api/posts', { headers: { Authorization: `Bearer ${token}` }})
// everywhere, we configure it ONCE here and just call:
//   api.get('/posts')
// ============================================================

import axios from "axios";

// Base URL — in development this hits localhost:5000
// In production, set REACT_APP_API_URL in your .env file
const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

// Create a custom axios instance with our defaults
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000, // 15 second timeout — prevents hanging requests
});

// ── REQUEST INTERCEPTOR ───────────────────────────────────────
// Runs BEFORE every request is sent.
// Automatically attaches the JWT token from localStorage.
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("edubridge_token");
    if (token) {
      // "Bearer" is the standard prefix for JWT tokens in HTTP headers
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── RESPONSE INTERCEPTOR ──────────────────────────────────────
// Runs AFTER every response is received.
// Handles global errors like expired tokens.
api.interceptors.response.use(
  (response) => response, // Pass through successful responses unchanged

  (error) => {
    // If the server returned 401 (Unauthorized / token expired)
    if (error.response?.status === 401) {
      // Clear stored auth data
      localStorage.removeItem("edubridge_token");
      localStorage.removeItem("edubridge_user");

      // Redirect to login page
      // SENIOR NOTE: We use window.location instead of React Router's navigate()
      // because this interceptor is outside the React component tree.
      if (window.location.pathname !== "/login") {
        window.location.href = "/login?session=expired";
      }
    }

    return Promise.reject(error);
  }
);

export default api;

// ── CONVENIENCE METHODS (pre-built API calls) ─────────────────
// These functions wrap common API calls for reuse across components.
// BEGINNER NOTE: Instead of calling api.get('/posts') in every component,
// we define it here and import { getPosts } where needed.

export const authAPI = {
  register: (data) => api.post("/auth/register", data),
  login: (data) => api.post("/auth/login", data),
  me: () => api.get("/auth/me"),
  forgotPassword: (email) => api.post("/auth/forgot-password", { email }),
  verifyOtp: (email, otp) => api.post("/auth/verify-otp", { email, otp }),
  resetPassword: (resetToken, newPassword) =>
    api.post("/auth/reset-password", { resetToken, newPassword }),
};

export const postsAPI = {
  getAll: (params) => api.get("/posts", { params }), // params = query string filters
  getOne: (id) => api.get(`/posts/${id}`),
  create: (data) => api.post("/posts", data),
  update: (id, data) => api.put(`/posts/${id}`, data),
  delete: (id) => api.delete(`/posts/${id}`),
  addComment: (id, text) => api.post(`/posts/${id}/comment`, { text }),
  toggleInterest: (id) => api.post(`/posts/${id}/interest`),
  incrementView: (id) => api.post(`/posts/${id}/view`),
};

export const usersAPI = {
  getProfile: (id) => api.get(`/users/${id}`),
  getUserPosts: (id) => api.get(`/users/${id}/posts`),
  updateProfile: (data) => api.put("/users/profile", data),
  changePassword: (data) => api.put("/users/password", data),
  toggleSavePost: (postId) => api.post(`/users/save-post/${postId}`),
  deleteAccount: () => api.delete("/users/account"),
};
