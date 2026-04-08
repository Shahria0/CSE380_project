// ============================================================
// client/src/components/PageTransition.js
// ============================================================
// WHAT THIS DOES:
// Wraps every page with an animation trigger. Each time the
// route changes, this component re-mounts (React unmounts the
// old route's component and mounts the new one). We exploit
// that lifecycle by using `key={location.pathname}` in App.js
// so a fresh animation plays on every navigation.
//
// HOW IT WORKS:
// 1. The wrapper div starts invisible (opacity: 0, offset y)
// 2. CSS class "page-enter" triggers the @keyframes animation
// 3. After ~420ms the page is fully visible
//
// The `variant` prop lets auth pages use a different animation
// (scale instead of slide) for visual variety.
//
// BEGINNER NOTE: We use useLocation() to detect the current
// route and pick a direction. React re-renders this component
// on every route change because App.js passes location.key as
// the `key` prop — forcing a full remount = fresh animation.
// ============================================================

import React, { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

// Auth pages (centered card layouts) use a different animation
const AUTH_ROUTES = ["/login", "/register", "/forgot-password"];

const PageTransition = ({ children }) => {
  const location = useLocation();
  const ref = useRef(null);

  const isAuthPage = AUTH_ROUTES.includes(location.pathname);
  const animClass = isAuthPage ? "page-enter-scale" : "page-enter";

  // SENIOR NOTE: We use a ref + class manipulation instead of
  // React state to avoid an extra re-render cycle. Setting a
  // class directly is synchronous and doesn't trigger React's
  // reconciliation loop.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Remove the class first (in case of same-route navigation)
    el.classList.remove("page-enter", "page-enter-scale");

    // Force a reflow so the browser "sees" the removal before re-adding.
    // Without this, the animation won't retrigger on same-route navigation.
    // This is a known technique — void el.offsetHeight forces a synchronous layout.
    void el.offsetHeight;

    // Re-add to trigger animation
    el.classList.add(animClass);
  }, [location.key, animClass]);

  return (
    <div
      ref={ref}
      className={animClass}
      style={{
        // These inline styles ensure the element is always visible
        // even before the animation class kicks in (prevents flash)
        minHeight: isAuthPage ? undefined : "inherit",
      }}
    >
      {children}
    </div>
  );
};

export default PageTransition;
