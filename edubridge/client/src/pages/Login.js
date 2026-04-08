// ============================================================
// client/src/pages/Login.js
// ============================================================
// HOW IT WORKS (MERN flow):
// 1. User fills form and submits
// 2. We call POST /api/auth/login with email + password
// 3. Server validates, returns { token, user }
// 4. We store token in localStorage via AuthContext.login()
// 5. React Router redirects to dashboard (or the page they tried to visit)
// ============================================================

import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { authAPI } from "../api/client";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoggedIn } = useAuth();

  // Form state — controlled inputs
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // If already logged in, redirect to dashboard
  useEffect(() => {
    if (isLoggedIn) navigate("/dashboard", { replace: true });
  }, [isLoggedIn, navigate]);

  // Check for session-expired message from axios interceptor redirect
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("session") === "expired") {
      setError("Your session has expired. Please sign in again.");
    }
    // Check for success message after registration
    if (location.state?.success) {
      setSuccessMsg(location.state.success);
    }
  }, [location]);

  // ── HANDLE FORM FIELD CHANGES ─────────────────────────────
  // One handler for all fields — uses the input's `name` attribute
  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError(""); // Clear error when user starts typing
  };

  // ── HANDLE SUBMIT ─────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent default HTML form submission
    if (!form.email || !form.password) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Call the login API
      const { data } = await authAPI.login(form);

      // Store token + user in AuthContext (persists to localStorage)
      login(data.user, data.token);

      // Redirect to where they were trying to go, or dashboard
      // location.state?.from is set by ProtectedRoute when redirecting
      const redirectTo = location.state?.from?.pathname || "/dashboard";
      navigate(redirectTo, { replace: true });
    } catch (err) {
      // axios wraps the error — the server's message is in err.response.data.message
      setError(err.response?.data?.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      {/* ── BRAND ── */}
      <div style={styles.brand}>
        <div style={styles.logoBox}>
          <svg viewBox="0 0 24 24" fill="#fff" width="28" height="28">
            <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3zm-7 9.18V16l7 3.82 7-3.82v-3.82L12 16l-7-3.82z" />
          </svg>
        </div>
        <h1 style={styles.brandTitle}>Welcome Back</h1>
        <p style={styles.brandSub}>Sign in to continue your academic collaboration</p>
      </div>

      {/* ── CARD ── */}
      <div style={styles.card}>
        {/* Flash messages */}
        {error && (
          <div className="alert alert-error alert-animated">
            <ErrorIcon /> {error}
          </div>
        )}
        {successMsg && (
          <div className="alert alert-success alert-animated">
            <CheckIcon /> {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {/* Email */}
          <div className="form-group">
            <label className="form-label" htmlFor="email">
              Email Address <span className="req">*</span>
            </label>
            <input
              className="form-input"
              id="email"
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@university.edu"
              autoComplete="email"
              required
            />
          </div>

          {/* Password */}
          <div className="form-group">
            <label className="form-label" htmlFor="password">
              Password <span className="req">*</span>
            </label>
            <div className="pass-wrap">
              <input
                className="form-input"
                id="password"
                type={showPass ? "text" : "password"}
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Enter your password"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="pass-toggle"
                onClick={() => setShowPass(!showPass)}
                aria-label="Toggle password visibility"
              >
                {showPass ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
          </div>

          {/* Remember me + Forgot password */}
          <div style={styles.rowBetween}>
            <label style={styles.rememberLabel}>
              <input type="checkbox" style={{ accentColor: "var(--brand)" }} />
              {" "}Remember me
            </label>
            <Link to="/forgot-password" style={styles.forgotLink}>
              Forgot password?
            </Link>
          </div>

          {/* Submit */}
          <button
            className="btn btn-primary btn-full btn-lg btn-animated"
            type="submit"
            disabled={loading}
            style={{ marginTop: "0.5rem" }}
          >
            {loading && <span className="spinner" />}
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p style={styles.footer}>
          Don't have an account?{" "}
          <Link to="/register" style={styles.link}>Create an account</Link>
        </p>
      </div>

      <p style={styles.legal}>
        By signing in, you agree to our{" "}
        <Link to="/" style={{ color: "var(--text-secondary)" }}>Terms of Service</Link>
        {" "}and{" "}
        <Link to="/" style={{ color: "var(--text-secondary)" }}>Privacy Policy</Link>
      </p>
    </div>
  );
};

const styles = {
  page: { fontFamily: "var(--font-base)", background: "var(--bg)", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem 1rem" },
  brand: { display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "1.5rem", gap: "0.5rem" },
  logoBox: { width: 52, height: 52, background: "var(--brand)", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center" },
  brandTitle: { fontSize: "1.75rem", fontWeight: 700, color: "var(--text-primary)" },
  brandSub: { fontSize: "0.95rem", color: "var(--text-muted)", textAlign: "center" },
  card: { background: "#fff", borderRadius: "var(--radius-xl)", border: "1px solid var(--border)", padding: "2rem 2.25rem", width: "100%", maxWidth: 460, boxShadow: "var(--shadow)" },
  rowBetween: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" },
  rememberLabel: { display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.88rem", color: "var(--text-secondary)", cursor: "pointer" },
  forgotLink: { fontSize: "0.88rem", color: "var(--brand)", fontWeight: 500 },
  footer: { textAlign: "center", marginTop: "1.25rem", fontSize: "0.9rem", color: "var(--text-muted)" },
  link: { color: "var(--brand)", fontWeight: 600 },
  legal: { marginTop: "1.5rem", fontSize: "0.8rem", color: "var(--text-faint)", textAlign: "center" },
};

const ErrorIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="17" height="17"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;
const CheckIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="17" height="17"><path d="M20 6L9 17l-5-5"/></svg>;
const EyeIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
const EyeOffIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>;

export default Login;
