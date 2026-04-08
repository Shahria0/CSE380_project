// ============================================================
// client/src/pages/Settings.js
// ============================================================
import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { usersAPI } from "../api/client";

const DEPARTMENTS = ["Computer Science","Electrical Engineering","Electronics & Telecom Engineering","Civil Engineering","Business Administration","Psychology","Biomedical Engineering","Environmental Science","Mathematics","Physics","Other"];

const Settings = () => {
  const { user, updateUser, logout } = useAuth();
  const [activePanel, setActivePanel] = useState("profile");
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState({ type: "", msg: "" });

  // Profile form state initialized from the current user
  const [profile, setProfile] = useState({
    firstName: user?.firstName || "", lastName: user?.lastName || "",
    bio: user?.bio || "", skills: (user?.skills || []).join(", "),
    interests: (user?.interests || []).join(", "),
    linkedIn: user?.linkedIn || "", github: user?.github || "", website: user?.website || "",
    department: user?.department || "", level: user?.level || "",
    graduationYear: user?.graduationYear || "", alumniField: user?.alumniField || "",
    currentRole: user?.currentRole || "",
  });

  // Password form state
  const [passForm, setPassForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [showPass, setShowPass] = useState(false);

  const showAlert = (type, msg) => {
    setAlert({ type, msg });
    setTimeout(() => setAlert({ type: "", msg: "" }), 4000);
  };

  // ── SAVE PROFILE ─────────────────────────────────────────
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await usersAPI.updateProfile(profile);
      updateUser(data.user); // Update global auth state
      showAlert("success", "Profile updated successfully!");
    } catch (err) {
      showAlert("error", err.response?.data?.message || "Update failed.");
    } finally { setSaving(false); }
  };

  // ── CHANGE PASSWORD ───────────────────────────────────────
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passForm.newPassword !== passForm.confirmPassword) { showAlert("error", "Passwords do not match."); return; }
    if (passForm.newPassword.length < 8) { showAlert("error", "Password must be at least 8 characters."); return; }
    setSaving(true);
    try {
      await usersAPI.changePassword({ currentPassword: passForm.currentPassword, newPassword: passForm.newPassword });
      setPassForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      showAlert("success", "Password changed successfully!");
    } catch (err) {
      showAlert("error", err.response?.data?.message || "Password change failed.");
    } finally { setSaving(false); }
  };

  // ── DELETE ACCOUNT ────────────────────────────────────────
  const handleDeleteAccount = async () => {
    const confirmed = window.confirm("Are you absolutely sure? This will deactivate your account. All your posts will remain visible but you won't be able to log in.");
    if (!confirmed) return;
    try {
      await usersAPI.deleteAccount();
      logout();
    } catch (err) {
      showAlert("error", err.response?.data?.message || "Failed to delete account.");
    }
  };

  const navItems = [
    { key: "profile", label: "Profile", icon: "👤" },
    { key: "academic", label: "Academic Info", icon: "🎓" },
    { key: "password", label: "Password", icon: "🔒" },
    { key: "danger", label: "Danger Zone", icon: "⚠️" },
  ];

  return (
    <div className="page-content">
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "0 1.5rem 4rem" }}>
        <div style={styles.pageHeader}>
          <h1 style={{ fontSize: "1.6rem", fontWeight: 700 }}>Settings</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.93rem" }}>Manage your account and preferences</p>
        </div>

        <div style={styles.layout}>
          {/* ── SIDEBAR NAV ── */}
          <nav style={styles.sideNav}>
            {navItems.map((item) => (
              <button
                key={item.key}
                className={`settings-nav-animated${activePanel === item.key ? " active" : ""}`} style={{ ...styles.navItem, ...(activePanel === item.key ? styles.navItemActive : {}) }}
                onClick={() => setActivePanel(item.key)}
              >
                {item.icon} {item.label}
              </button>
            ))}
          </nav>

          {/* ── PANELS ── */}
          <div>
            {/* Global alert */}
            {alert.msg && (
              <div className={`alert alert-${alert.type}`} style={{ marginBottom: "1rem" }}>
                {alert.msg}
              </div>
            )}

            {/* ── PROFILE PANEL ── */}
            {activePanel === "profile" && (
              <div style={styles.card}>
                <h2 style={styles.cardTitle}>Profile Information</h2>
                <p style={styles.cardSub}>Update your personal details and online presence</p>
                <form onSubmit={handleSaveProfile}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    <F label="First Name" name="firstName" value={profile.firstName} onChange={(e) => setProfile(p => ({ ...p, [e.target.name]: e.target.value }))} />
                    <F label="Last Name" name="lastName" value={profile.lastName} onChange={(e) => setProfile(p => ({ ...p, [e.target.name]: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Bio</label>
                    <textarea className="form-textarea" name="bio" value={profile.bio} onChange={(e) => setProfile(p => ({ ...p, bio: e.target.value }))} placeholder="Tell your academic community about yourself..." maxLength={500} />
                    <p className="form-hint">{profile.bio.length}/500</p>
                  </div>
                  <F label="Skills (comma-separated)" name="skills" value={profile.skills} onChange={(e) => setProfile(p => ({ ...p, skills: e.target.value }))} placeholder="e.g. Python, Machine Learning, Data Analysis" />
                  <F label="Interests (comma-separated)" name="interests" value={profile.interests} onChange={(e) => setProfile(p => ({ ...p, interests: e.target.value }))} placeholder="e.g. AI, Climate Tech, Biomedical Research" />
                  <F label="LinkedIn URL" name="linkedIn" value={profile.linkedIn} onChange={(e) => setProfile(p => ({ ...p, linkedIn: e.target.value }))} placeholder="https://linkedin.com/in/..." />
                  <F label="GitHub URL" name="github" value={profile.github} onChange={(e) => setProfile(p => ({ ...p, github: e.target.value }))} placeholder="https://github.com/..." />
                  <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
                    <button className="btn btn-primary btn-animated" type="submit" disabled={saving}>{saving ? "Saving..." : "Save Changes"}</button>
                  </div>
                </form>
              </div>
            )}

            {/* ── ACADEMIC PANEL ── */}
            {activePanel === "academic" && (
              <div style={styles.card}>
                <h2 style={styles.cardTitle}>Academic Information</h2>
                <p style={styles.cardSub}>Update your academic background</p>
                <form onSubmit={handleSaveProfile}>
                  {user?.role === "student" ? (
                    <>
                      <div className="form-group">
                        <label className="form-label">Department</label>
                        <select className="form-select" name="department" value={profile.department} onChange={(e) => setProfile(p => ({ ...p, department: e.target.value }))}>
                          <option value="">Select department</option>
                          {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Level</label>
                        <select className="form-select" name="level" value={profile.level} onChange={(e) => setProfile(p => ({ ...p, level: e.target.value }))}>
                          <option value="">Select level</option>
                          <option>Undergraduate</option>
                          <option>Masters Student</option>
                          <option>PhD Student</option>
                        </select>
                      </div>
                      <F label="Expected Graduation Year" name="graduationYear" value={profile.graduationYear} onChange={(e) => setProfile(p => ({ ...p, graduationYear: e.target.value }))} placeholder="e.g. 2027" />
                    </>
                  ) : (
                    <>
                      <F label="Field / Department" name="alumniField" value={profile.alumniField} onChange={(e) => setProfile(p => ({ ...p, alumniField: e.target.value }))} />
                      <F label="Current Role / Organization" name="currentRole" value={profile.currentRole} onChange={(e) => setProfile(p => ({ ...p, currentRole: e.target.value }))} placeholder="e.g. Software Engineer at Google" />
                    </>
                  )}
                  <button className="btn btn-primary btn-animated" type="submit" disabled={saving}>{saving ? "Saving..." : "Save Changes"}</button>
                </form>
              </div>
            )}

            {/* ── PASSWORD PANEL ── */}
            {activePanel === "password" && (
              <div style={styles.card}>
                <h2 style={styles.cardTitle}>Change Password</h2>
                <p style={styles.cardSub}>Use a strong password you don't use elsewhere</p>
                <form onSubmit={handleChangePassword}>
                  <div className="form-group">
                    <label className="form-label">Current Password</label>
                    <div className="pass-wrap">
                      <input className="form-input" type={showPass ? "text" : "password"} value={passForm.currentPassword} onChange={(e) => setPassForm(p => ({ ...p, currentPassword: e.target.value }))} required />
                      <button type="button" className="pass-toggle" onClick={() => setShowPass(!showPass)}>👁</button>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">New Password</label>
                    <input className="form-input" type="password" value={passForm.newPassword} onChange={(e) => setPassForm(p => ({ ...p, newPassword: e.target.value }))} minLength={8} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Confirm New Password</label>
                    <input className="form-input" type="password" value={passForm.confirmPassword} onChange={(e) => setPassForm(p => ({ ...p, confirmPassword: e.target.value }))} required />
                  </div>
                  <button className="btn btn-primary btn-animated" type="submit" disabled={saving}>{saving ? "Changing..." : "Change Password"}</button>
                </form>
              </div>
            )}

            {/* ── DANGER ZONE ── */}
            {activePanel === "danger" && (
              <div style={{ ...styles.card, borderColor: "var(--danger-border)" }}>
                <h2 style={{ ...styles.cardTitle, color: "var(--danger-dark)" }}>Danger Zone</h2>
                <p style={styles.cardSub}>Irreversible actions — proceed with caution</p>
                <div style={{ borderTop: "1px solid var(--danger-border)", paddingTop: "1.25rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
                    <div>
                      <h4 style={{ fontWeight: 700, marginBottom: "0.25rem" }}>Deactivate Account</h4>
                      <p style={{ fontSize: "0.84rem", color: "var(--text-muted)" }}>Your profile and posts will no longer be visible. This action deactivates your account.</p>
                    </div>
                    <button className="btn btn-danger btn-animated" onClick={handleDeleteAccount} style={{ whiteSpace: "nowrap" }}>Deactivate Account</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Simple field helper
const F = ({ label, name, value, onChange, placeholder, type = "text" }) => (
  <div className="form-group">
    <label className="form-label">{label}</label>
    <input className="form-input" type={type} name={name} value={value} onChange={onChange} placeholder={placeholder} />
  </div>
);

const styles = {
  pageHeader: { padding: "2rem 0 1.75rem" },
  layout: { display: "grid", gridTemplateColumns: "200px 1fr", gap: "1.5rem", alignItems: "start" },
  sideNav: { background: "#fff", border: "1.5px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "0.5rem", position: "sticky", top: 76, display: "flex", flexDirection: "column" },
  navItem: { display: "flex", alignItems: "center", gap: "0.6rem", padding: "0.65rem 0.9rem", borderRadius: "var(--radius-sm)", fontSize: "0.88rem", fontWeight: 600, color: "var(--text-secondary)", cursor: "pointer", background: "none", border: "none", textAlign: "left", transition: "all 0.15s" },
  navItemActive: { background: "var(--brand-light)", color: "var(--brand)" },
  card: { background: "#fff", border: "1.5px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "1.75rem 2rem" },
  cardTitle: { fontSize: "1.05rem", fontWeight: 700, marginBottom: "0.25rem" },
  cardSub: { fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1.5rem" },
};

export default Settings;
