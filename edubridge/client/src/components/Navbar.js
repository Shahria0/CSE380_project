// ============================================================
// client/src/components/Navbar.js — Top Navigation Bar
// ============================================================
// ANIMATION ADDITIONS:
//   - .logo-animated       → logo icon rotates on hover
//   - .nav-link-animated   → nav links get sliding bottom indicator
//   - .btn-animated        → create button lifts + ripples
//   - .dropdown-animated   → dropdown slides + scales in
//   - .dropdown-item-animated → items indent on hover
// ============================================================

import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const LogoIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
    <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3zm-7 9.18V16l7 3.82 7-3.82v-3.82L12 16l-7-3.82z" />
  </svg>
);

const Navbar = () => {
  const { user, isLoggedIn, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const handleLogout = () => { logout(); navigate("/"); };
  const isActive = (path) => location.pathname === path;

  return (
    <nav style={styles.navbar}>
      <div style={styles.navInner}>
        {/* ── BRAND: logo-animated spins on hover ── */}
        <Link to={isLoggedIn ? "/dashboard" : "/"} style={styles.brand}>
          <div className="logo-animated" style={styles.logoBox}>
            <LogoIcon />
          </div>
          <span style={styles.brandName}>EduBridge</span>
        </Link>

        {/* ── CENTER LINKS — nav-link-animated adds sliding underline ── */}
        {isLoggedIn && (
          <div style={styles.navLinks} className="hide-mobile">
            {[
              { to: "/listings", label: "Project Ideas" },
              { to: "/listings?type=thesis", label: "Research" },
              { to: "/alumni", label: "Experiences" },
            ].map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className={`nav-link-animated${isActive(to) ? " active" : ""}`}
                style={{
                  ...styles.navLink,
                  ...(isActive(to) ? styles.navLinkActive : {}),
                }}
              >
                {label}
              </Link>
            ))}
          </div>
        )}

        {/* ── RIGHT SIDE ── */}
        <div style={styles.navRight}>
          {isLoggedIn ? (
            <>
              {/* btn-animated: lifts + ripples on click */}
              <Link to="/create-post" style={{ textDecoration: "none" }} className="hide-mobile">
                <button className="btn-animated" style={styles.createBtn}>
                  <PlusIcon /> Create Post
                </button>
              </Link>

              {/* User dropdown */}
              <div style={{ position: "relative" }} ref={dropdownRef}>
                <button
                  style={styles.userBtn}
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  aria-expanded={dropdownOpen}
                >
                  {/* avatar-animated pops on hover */}
                  <div className="hover-scale" style={styles.avatar}>
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                  </div>
                  <span className="hide-mobile" style={{ fontSize: "0.88rem", fontWeight: 600 }}>
                    {user?.firstName}
                  </span>
                  <span style={{ transition: "transform 0.2s ease", display: "inline-block", transform: dropdownOpen ? "rotate(180deg)" : "rotate(0)" }}>
                    <ChevronIcon />
                  </span>
                </button>

                {/* dropdown-animated: slides in from top-right */}
                {dropdownOpen && (
                  <div className="dropdown-animated" style={styles.dropdown}>
                    <div style={styles.dropdownHeader}>
                      <div style={styles.dropdownName}>{user?.firstName} {user?.lastName}</div>
                      <div style={styles.dropdownRole}>
                        {user?.role === "student"
                          ? `Student · ${user?.department || ""}`
                          : `Alumni · ${user?.alumniField || ""}`}
                      </div>
                    </div>
                    <div style={styles.dropdownDivider} />

                    {[
                      { to: `/profile/${user?._id}`, icon: <UserIcon />, label: "My Profile" },
                      { to: "/dashboard",            icon: <HomeIcon />,  label: "Dashboard" },
                      { to: "/settings",             icon: <SettingsIcon />, label: "Settings" },
                    ].map(({ to, icon, label }) => (
                      // dropdown-item-animated: indents on hover
                      <Link
                        key={to}
                        to={to}
                        className="dropdown-item-animated"
                        style={styles.dropdownItem}
                        onClick={() => setDropdownOpen(false)}
                      >
                        {icon} {label}
                      </Link>
                    ))}

                    <div style={styles.dropdownDivider} />
                    <button
                      className="dropdown-item-animated"
                      style={{ ...styles.dropdownItem, color: "var(--danger)", width: "100%", textAlign: "left", border: "none", background: "none", cursor: "pointer" }}
                      onClick={handleLogout}
                    >
                      <LogoutIcon /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
              <Link to="/login">
                <button className="btn-secondary-animated" style={styles.loginBtn}>Sign In</button>
              </Link>
              <Link to="/register">
                <button className="btn-animated" style={styles.createBtn}>Get Started</button>
              </Link>
            </div>
          )}

          {isLoggedIn && (
            <button style={styles.hamburger} className="show-mobile" onClick={() => setMobileOpen(!mobileOpen)}>☰</button>
          )}
        </div>
      </div>

      {/* ── MOBILE MENU ── */}
      {mobileOpen && isLoggedIn && (
        <div className="anim-fade-up" style={styles.mobileMenu}>
          {[
            { to: "/dashboard", label: "Dashboard" },
            { to: "/listings", label: "Browse Posts" },
            { to: "/alumni", label: "Experiences" },
            { to: "/create-post", label: "+ Create Post" },
            { to: `/profile/${user?._id}`, label: "My Profile" },
            { to: "/settings", label: "Settings" },
          ].map(({ to, label }) => (
            <Link key={to} to={to} style={styles.mobileLink} onClick={() => setMobileOpen(false)}>{label}</Link>
          ))}
          <button style={{ ...styles.mobileLink, color: "var(--danger)", background: "none", border: "none", textAlign: "left", cursor: "pointer" }} onClick={handleLogout}>Sign Out</button>
        </div>
      )}
    </nav>
  );
};

const styles = {
  navbar: { position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, background: "var(--bg-white)", borderBottom: "1px solid var(--border)", height: "var(--nav-height)" },
  navInner: { display: "flex", alignItems: "center", justifyContent: "space-between", height: "100%", maxWidth: 1200, margin: "0 auto", padding: "0 1.5rem" },
  brand: { display: "flex", alignItems: "center", gap: "0.5rem" },
  logoBox: { width: 36, height: 36, background: "var(--brand)", borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" },
  brandName: { fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)" },
  navLinks: { display: "flex", gap: "0.25rem" },
  navLink: { padding: "0.45rem 0.9rem", borderRadius: "var(--radius-sm)", fontSize: "0.9rem", fontWeight: 500, color: "var(--text-secondary)" },
  navLinkActive: { background: "var(--brand-light)", color: "var(--brand)" },
  navRight: { display: "flex", alignItems: "center", gap: "0.75rem" },
  createBtn: { display: "flex", alignItems: "center", gap: "0.4rem", background: "var(--brand)", color: "#fff", border: "none", borderRadius: 9, padding: "0.5rem 1rem", fontSize: "0.9rem", fontWeight: 600, cursor: "pointer" },
  loginBtn: { padding: "0.45rem 1rem", border: "1.5px solid var(--border)", borderRadius: 9, fontSize: "0.9rem", fontWeight: 600, color: "var(--text-secondary)", background: "#fff", cursor: "pointer" },
  userBtn: { display: "flex", alignItems: "center", gap: "0.5rem", border: "1px solid var(--border)", borderRadius: 9, padding: "0.4rem 0.75rem", cursor: "pointer", background: "#fff", fontSize: "0.88rem", fontWeight: 600, transition: "border-color 0.18s ease" },
  avatar: { width: 30, height: 30, background: "var(--brand-100)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: 700, color: "var(--brand)" },
  dropdown: { position: "absolute", right: 0, top: "calc(100% + 10px)", background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-lg)", minWidth: 220, zIndex: 200, overflow: "hidden" },
  dropdownHeader: { padding: "0.9rem 1rem 0.75rem", borderBottom: "1px solid var(--bg-light)" },
  dropdownName: { fontSize: "0.92rem", fontWeight: 700 },
  dropdownRole: { fontSize: "0.8rem", color: "var(--text-muted)", marginTop: 2 },
  dropdownItem: { display: "flex", alignItems: "center", gap: "0.65rem", padding: "0.7rem 1rem", fontSize: "0.88rem", fontWeight: 500, color: "var(--text-secondary)" },
  dropdownDivider: { height: 1, background: "var(--bg-light)", margin: "0.25rem 0" },
  hamburger: { background: "none", border: "none", fontSize: "1.4rem", cursor: "pointer" },
  mobileMenu: { background: "#fff", borderTop: "1px solid var(--border)", padding: "0.5rem 0", display: "flex", flexDirection: "column" },
  mobileLink: { padding: "0.75rem 1.5rem", fontSize: "0.93rem", fontWeight: 500, color: "var(--text-primary)", display: "block" },
};

const PlusIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const ChevronIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>;
const UserIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>;
const SettingsIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>;
const HomeIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
const LogoutIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;

export default Navbar;
