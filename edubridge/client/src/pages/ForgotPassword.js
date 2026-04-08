// ============================================================
// client/src/pages/ForgotPassword.js — 3-Step Password Reset
// ============================================================
// Step 1: Enter email → server sends OTP
// Step 2: Enter OTP → server validates, returns resetToken
// Step 3: Enter new password → done
// ============================================================

import React, { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authAPI } from "../api/client";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);       // Current step (1, 2, 3, or 4=success)
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]); // 6-digit OTP as array
  const [resetToken, setResetToken] = useState(""); // Temporary token from verify-otp
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPass, setShowPass] = useState(false);

  // Refs for OTP input boxes — enables auto-focus on next input
  const otpRefs = useRef([]);

  // ── STEP 1: Send OTP ──────────────────────────────────────
  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!email) { setError("Please enter your email."); return; }
    setLoading(true); setError("");
    try {
      await authAPI.forgotPassword(email);
      setStep(2); // Always advance — server returns success even for unknown emails
    } catch {
      setError("Something went wrong. Please try again.");
    } finally { setLoading(false); }
  };

  // ── OTP INPUT HANDLING ────────────────────────────────────
  // Handles typing in each OTP box and auto-moves focus
  const handleOtpChange = (index, val) => {
    if (!/^\d*$/.test(val)) return; // Only allow digits
    const newOtp = [...otp];
    newOtp[index] = val.slice(-1); // Only keep last character (if pasting)
    setOtp(newOtp);
    // Auto-focus next box
    if (val && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index, e) => {
    // Backspace: clear current box and move back
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  // Handle paste into OTP field
  const handleOtpPaste = (e) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(""));
      otpRefs.current[5]?.focus();
    }
  };

  // ── STEP 2: Verify OTP ────────────────────────────────────
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const otpString = otp.join("");
    if (otpString.length !== 6) { setError("Please enter the complete 6-digit code."); return; }
    setLoading(true); setError("");
    try {
      const { data } = await authAPI.verifyOtp(email, otpString);
      setResetToken(data.resetToken);
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.message || "Invalid or expired code.");
    } finally { setLoading(false); }
  };

  // ── STEP 3: Reset Password ────────────────────────────────
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPass !== confirmPass) { setError("Passwords do not match."); return; }
    if (newPass.length < 8) { setError("Password must be at least 8 characters."); return; }
    setLoading(true); setError("");
    try {
      await authAPI.resetPassword(resetToken, newPass);
      setStep(4); // Success state
    } catch (err) {
      setError(err.response?.data?.message || "Reset failed. Please start over.");
    } finally { setLoading(false); }
  };

  return (
    <div style={styles.page}>
      <div style={styles.brand}>
        <div style={styles.logoBox}>
          <svg viewBox="0 0 24 24" fill="#fff" width="28" height="28"><path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3zm-7 9.18V16l7 3.82 7-3.82v-3.82L12 16l-7-3.82z"/></svg>
        </div>
        <h1 style={styles.brandTitle}>Reset Password</h1>
        <p style={styles.brandSub}>We'll send a verification code to your email</p>
      </div>

      <div style={styles.card}>
        {/* Step indicators */}
        {step < 4 && (
          <div style={styles.steps}>
            {["Email", "Verify", "Reset"].map((label, i) => {
              const n = i + 1;
              const isDone = step > n;
              const isActive = step === n;
              return (
                <React.Fragment key={n}>
                  <div style={styles.stepItem}>
                    <div style={{ ...styles.stepCircle, ...(isDone ? styles.stepDone : isActive ? styles.stepActive : {}) }}>
                      {isDone ? "✓" : n}
                    </div>
                    <span style={{ ...styles.stepLabel, ...(isActive ? styles.stepLabelActive : {}) }}>{label}</span>
                  </div>
                  {i < 2 && <div style={{ ...styles.stepLine, ...(step > n ? styles.stepLineDone : {}) }} />}
                </React.Fragment>
              );
            })}
          </div>
        )}

        {error && (
          <div className="alert alert-error alert-animated">
            <ErrIcon /> {error}
          </div>
        )}

        {/* ── STEP 1: Email ── */}
        {step === 1 && (
          <form onSubmit={handleSendOtp}>
            <div className="form-group">
              <label className="form-label">Email Address <span className="req">*</span></label>
              <input className="form-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@university.edu" required autoFocus />
              <p className="form-hint">Enter the email associated with your account.</p>
            </div>
            <button className="btn btn-primary btn-full btn-lg btn-animated" type="submit" disabled={loading}>
              {loading && <span className="spinner" />} Send Reset Code
            </button>
            <Link to="/login" style={styles.backLink}>← Back to Sign In</Link>
          </form>
        )}

        {/* ── STEP 2: OTP ── */}
        {step === 2 && (
          <form onSubmit={handleVerifyOtp}>
            <p style={{ fontSize: "0.93rem", color: "var(--text-muted)", marginBottom: "1rem", textAlign: "center" }}>
              Enter the 6-digit code sent to <strong>{email}</strong>
            </p>
            <div style={styles.otpRow} onPaste={handleOtpPaste}>
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => (otpRefs.current[i] = el)}
                  style={styles.otpBox}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                  autoFocus={i === 0}
                />
              ))}
            </div>
            <p style={{ textAlign: "center", fontSize: "0.87rem", color: "var(--text-muted)", marginTop: "0.75rem" }}>
              Didn't receive it?{" "}
              <button type="button" style={{ background: "none", border: "none", color: "var(--brand)", cursor: "pointer", fontWeight: 600 }}
                onClick={() => { setOtp(["","","","","",""]); handleSendOtp({ preventDefault: () => {} }); }}>
                Resend code
              </button>
            </p>
            <button className="btn btn-primary btn-full btn-lg btn-animated" type="submit" disabled={loading} style={{ marginTop: "1rem" }}>
              {loading && <span className="spinner" />} Verify Code
            </button>
            <button type="button" style={styles.backLink} onClick={() => setStep(1)}>← Back</button>
          </form>
        )}

        {/* ── STEP 3: New Password ── */}
        {step === 3 && (
          <form onSubmit={handleResetPassword}>
            <div className="form-group">
              <label className="form-label">New Password <span className="req">*</span></label>
              <div className="pass-wrap">
                <input className="form-input" type={showPass ? "text" : "password"} value={newPass} onChange={(e) => setNewPass(e.target.value)} placeholder="At least 8 characters" required />
                <button type="button" className="pass-toggle" onClick={() => setShowPass(!showPass)}><EyeIcon /></button>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Confirm New Password <span className="req">*</span></label>
              <input className="form-input" type="password" value={confirmPass} onChange={(e) => setConfirmPass(e.target.value)} placeholder="Re-enter new password" required />
            </div>
            <button className="btn btn-primary btn-full btn-lg btn-animated" type="submit" disabled={loading}>
              {loading && <span className="spinner" />} Reset Password
            </button>
          </form>
        )}

        {/* ── STEP 4: Success ── */}
        {step === 4 && (
          <div style={{ textAlign: "center" }}>
            <div style={styles.successIcon}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" width="32" height="32"><path d="M20 6L9 17l-5-5"/></svg>
            </div>
            <h2 style={{ fontSize: "1.3rem", fontWeight: 700, marginBottom: "0.5rem" }}>Password Reset!</h2>
            <p style={{ color: "var(--text-muted)", lineHeight: 1.6, marginBottom: "1.5rem" }}>Your password has been successfully reset. You can now sign in.</p>
            <button className="btn btn-primary btn-full btn-lg btn-animated" onClick={() => navigate("/login")}>Go to Sign In</button>
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  page: { background: "var(--bg)", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem 1rem" },
  brand: { display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "1.5rem", gap: "0.5rem" },
  logoBox: { width: 52, height: 52, background: "var(--brand)", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center" },
  brandTitle: { fontSize: "1.75rem", fontWeight: 700 },
  brandSub: { fontSize: "0.95rem", color: "var(--text-muted)", textAlign: "center" },
  card: { background: "#fff", borderRadius: "var(--radius-xl)", border: "1px solid var(--border)", padding: "2rem 2.25rem", width: "100%", maxWidth: 460, boxShadow: "var(--shadow)" },
  steps: { display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1.75rem" },
  stepItem: { display: "flex", flexDirection: "column", alignItems: "center", gap: "0.3rem" },
  stepCircle: { width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.85rem", fontWeight: 700, background: "var(--border)", color: "var(--text-faint)", transition: "all 0.3s" },
  stepActive: { background: "var(--brand)", color: "#fff" },
  stepDone: { background: "var(--success)", color: "#fff" },
  stepLabel: { fontSize: "0.72rem", color: "var(--text-faint)", fontWeight: 600 },
  stepLabelActive: { color: "var(--brand)" },
  stepLine: { flex: 1, height: 2, background: "var(--border)", margin: "0 0.5rem 1.2rem", transition: "background 0.3s", minWidth: 40 },
  stepLineDone: { background: "var(--success)" },
  otpRow: { display: "flex", gap: "0.6rem", justifyContent: "center", margin: "1rem 0" },
  otpBox: { width: 52, height: 56, textAlign: "center", fontSize: "1.3rem", fontWeight: 700, border: "1.5px solid var(--border-dark)", borderRadius: "var(--radius)", outline: "none", fontFamily: "var(--font-base)", transition: "border-color 0.2s" },
  backLink: { display: "block", textAlign: "center", marginTop: "1.2rem", fontSize: "0.9rem", color: "var(--brand)", background: "none", border: "none", cursor: "pointer", fontWeight: 500 },
  successIcon: { width: 64, height: 64, background: "var(--success-bg)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem" },
};

const ErrIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="17" height="17" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;
const EyeIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;

export default ForgotPassword;
