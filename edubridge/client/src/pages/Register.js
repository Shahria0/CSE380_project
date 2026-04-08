// ============================================================
// client/src/pages/Register.js
// ============================================================
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authAPI } from "../api/client";
import { useAuth } from "../context/AuthContext";

// Password strength checker
const getStrength = (val) => {
  let score = 0;
  if (val.length >= 8) score++;
  if (/[A-Z]/.test(val)) score++;
  if (/[0-9]/.test(val)) score++;
  if (/[^A-Za-z0-9]/.test(val)) score++;
  const map = [
    { w: "25%", c: "#EF4444", t: "Weak" },
    { w: "50%", c: "#F97316", t: "Fair" },
    { w: "75%", c: "#EAB308", t: "Good" },
    { w: "100%", c: "#22C55E", t: "Strong" },
  ];
  return val ? map[Math.max(0, score - 1)] : null;
};

const DEPARTMENTS = ["Computer Science","Electrical Engineering","Electronics & Telecom Engineering","Civil Engineering","Business Administration","Psychology","Biomedical Engineering","Environmental Science","Mathematics","Physics","Other"];

const Register = () => {
  const navigate = useNavigate();
  const { login, isLoggedIn } = useAuth();

  const [role, setRole] = useState("student");
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", password: "", confirmPassword: "", department: "", level: "", graduationYear: "", alumniGradYear: "", alumniField: "", currentRole: "" });
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isLoggedIn) navigate("/dashboard", { replace: true });
  }, [isLoggedIn, navigate]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!agree) { setError("Please agree to the Terms of Service."); return; }
    if (form.password !== form.confirmPassword) { setError("Passwords do not match."); return; }
    if (form.password.length < 8) { setError("Password must be at least 8 characters."); return; }

    setLoading(true);
    setError("");

    try {
      const payload = {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        password: form.password,
        role,
        ...(role === "student" && { department: form.department, level: form.level, graduationYear: form.graduationYear }),
        ...(role === "alumni" && { alumniGradYear: form.alumniGradYear, alumniField: form.alumniField, currentRole: form.currentRole }),
      };

      const { data } = await authAPI.register(payload);
      login(data.user, data.token);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const strength = getStrength(form.password);

  return (
    <div style={styles.page}>
      <div style={styles.brand}>
        <div style={styles.logoBox}>
          <svg viewBox="0 0 24 24" fill="#fff" width="28" height="28"><path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3zm-7 9.18V16l7 3.82 7-3.82v-3.82L12 16l-7-3.82z"/></svg>
        </div>
        <h1 style={styles.brandTitle}>Create Your Account</h1>
        <p style={styles.brandSub}>Join the academic collaboration community</p>
      </div>

      <div style={styles.card}>
        {error && <div className="alert alert-error alert-animated"><ErrIcon />{error}</div>}

        <form onSubmit={handleSubmit} noValidate>
          {/* Role toggle */}
          <div style={styles.roleToggle}>
            {["student", "alumni"].map((r) => (
              <button key={r} type="button"
                style={{ ...styles.roleBtn, ...(role === r ? styles.roleBtnActive : {}) }}
                onClick={() => { setRole(r); setError(""); }}>
                {r === "student" ? <GradIcon /> : <UserIcon />}
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </button>
            ))}
          </div>

          {/* Personal info */}
          <SectionLabel>Personal Information</SectionLabel>
          <div style={styles.row}>
            <Field label="First Name" name="firstName" value={form.firstName} onChange={handleChange} placeholder="John" required />
            <Field label="Last Name" name="lastName" value={form.lastName} onChange={handleChange} placeholder="Doe" required />
          </div>
          <Field label={role === "alumni" ? "Email" : "University Email"} name="email" type="email" value={form.email} onChange={handleChange} placeholder={role === "alumni" ? "you@example.com" : "you@university.edu"} required />

          {/* Role-specific fields */}
          {role === "student" ? (
            <>
              <SectionLabel>Academic Details</SectionLabel>
              <div style={styles.row}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Department <span className="req">*</span></label>
                  <select className="form-select" name="department" value={form.department} onChange={handleChange} required>
                    <option value="">Select department</option>
                    {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Level <span className="req">*</span></label>
                  <select className="form-select" name="level" value={form.level} onChange={handleChange} required>
                    <option value="">Select level</option>
                    <option>Undergraduate</option>
                    <option>Masters Student</option>
                    <option>PhD Student</option>
                  </select>
                </div>
              </div>
              <Field label="Expected Graduation Year" name="graduationYear" value={form.graduationYear} onChange={handleChange} placeholder="e.g. 2027" />
            </>
          ) : (
            <>
              <SectionLabel>Alumni Details</SectionLabel>
              <div style={styles.row}>
                <Field label="Graduation Year" name="alumniGradYear" value={form.alumniGradYear} onChange={handleChange} placeholder="e.g. 2019" />
                <Field label="Field / Department" name="alumniField" value={form.alumniField} onChange={handleChange} placeholder="e.g. Computer Science" />
              </div>
              <Field label="Current Role / Organization" name="currentRole" value={form.currentRole} onChange={handleChange} placeholder="e.g. Software Engineer at Google" />
            </>
          )}

          {/* Password */}
          <SectionLabel>Security</SectionLabel>
          <div className="form-group">
            <label className="form-label">Password <span className="req">*</span></label>
            <div className="pass-wrap">
              <input className="form-input" type={showPass ? "text" : "password"} name="password" value={form.password} onChange={handleChange} placeholder="At least 8 characters" required />
              <button type="button" className="pass-toggle" onClick={() => setShowPass(!showPass)}>{showPass ? <EyeOffIcon /> : <EyeIcon />}</button>
            </div>
            {strength && (
              <>
                <div className="strength-bar"><div className="strength-fill" style={{ width: strength.w, background: strength.c }} /></div>
                <p style={{ fontSize: "0.78rem", color: strength.c, marginTop: "0.2rem" }}>{strength.t}</p>
              </>
            )}
          </div>
          <div className="form-group">
            <label className="form-label">Confirm Password <span className="req">*</span></label>
            <div className="pass-wrap">
              <input className="form-input" type={showConfirm ? "text" : "password"} name="confirmPassword" value={form.confirmPassword} onChange={handleChange} placeholder="Re-enter password" required />
              <button type="button" className="pass-toggle" onClick={() => setShowConfirm(!showConfirm)}>{showConfirm ? <EyeOffIcon /> : <EyeIcon />}</button>
            </div>
          </div>

          {/* Terms */}
          <div style={styles.terms}>
            <input type="checkbox" id="agree" checked={agree} onChange={(e) => setAgree(e.target.checked)} style={{ accentColor: "var(--brand)", flexShrink: 0 }} />
            <label htmlFor="agree" style={{ fontSize: "0.85rem", color: "var(--text-secondary)", cursor: "pointer" }}>
              I agree to the <Link to="/" style={{ color: "var(--brand)" }}>Terms of Service</Link> and <Link to="/" style={{ color: "var(--brand)" }}>Privacy Policy</Link>
            </label>
          </div>

          <button className="btn btn-primary btn-full btn-lg btn-animated" type="submit" disabled={loading}>
            {loading && <span className="spinner" />}
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p style={styles.footer}>
          Already have an account? <Link to="/login" style={{ color: "var(--brand)", fontWeight: 600 }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
};

// ── HELPER COMPONENTS ──────────────────────────────────────────
const Field = ({ label, name, type = "text", value, onChange, placeholder, required }) => (
  <div className="form-group" style={{ flex: 1 }}>
    <label className="form-label">{label} {required && <span className="req">*</span>}</label>
    <input className="form-input" type={type} name={name} value={value} onChange={onChange} placeholder={placeholder} required={required} />
  </div>
);

const SectionLabel = ({ children }) => (
  <p style={{ fontSize: "0.78rem", fontWeight: 700, letterSpacing: "0.06em", color: "var(--text-faint)", textTransform: "uppercase", margin: "1.2rem 0 0.75rem", paddingBottom: "0.5rem", borderBottom: "1px solid var(--bg-light)" }}>{children}</p>
);

const styles = {
  page: { background: "var(--bg)", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem 1rem" },
  brand: { display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "1.5rem", gap: "0.5rem" },
  logoBox: { width: 52, height: 52, background: "var(--brand)", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center" },
  brandTitle: { fontSize: "1.75rem", fontWeight: 700, color: "var(--text-primary)" },
  brandSub: { fontSize: "0.95rem", color: "var(--text-muted)", textAlign: "center" },
  card: { background: "#fff", borderRadius: "var(--radius-xl)", border: "1px solid var(--border)", padding: "2rem 2.25rem", width: "100%", maxWidth: 520, boxShadow: "var(--shadow)" },
  roleToggle: { display: "flex", background: "var(--bg-light)", borderRadius: 10, padding: 4, marginBottom: "1.5rem", gap: 0 },
  roleBtn: { flex: 1, padding: "0.55rem 1rem", border: "none", borderRadius: 8, fontFamily: "var(--font-base)", fontSize: "0.9rem", fontWeight: 600, cursor: "pointer", background: "transparent", color: "var(--text-muted)", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem", transition: "all 0.2s" },
  roleBtnActive: { background: "#fff", color: "var(--brand)", boxShadow: "0 1px 4px rgba(15,23,43,0.12)" },
  row: { display: "flex", gap: "1rem" },
  terms: { display: "flex", alignItems: "flex-start", gap: "0.6rem", margin: "1rem 0 1.25rem" },
  footer: { textAlign: "center", marginTop: "1rem", fontSize: "0.9rem", color: "var(--text-muted)" },
};

const ErrIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="17" height="17" style={{ flexShrink: 0, marginRight: 4 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;
const EyeIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
const EyeOffIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>;
const GradIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/></svg>;
const UserIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>;

export default Register;
