// ============================================================
// client/src/index.js — React Entry Point
// ============================================================
// This is the very first file React executes.
// It mounts our App component into the HTML <div id="root">
// element defined in public/index.html.
//
// BEGINNER NOTE: You rarely need to edit this file.
// ============================================================

import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css"; // Global styles must be imported here
import App from "./App";

// In React 18, we use createRoot instead of ReactDOM.render
// This enables concurrent features (better performance)
const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  // StrictMode renders components twice in development to detect bugs.
  // It has NO effect in production builds.
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
