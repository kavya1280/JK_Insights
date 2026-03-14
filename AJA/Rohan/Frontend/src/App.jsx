import React, { useState, useEffect, useRef } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import Login from "./Login";
import Admin from "./Admin";
import Uploader from "./Uploader";
import Reviewer from "./Reviewer";
import Viewer from "./Viewer";

import logo from "./assets/images/jkc.png";
import ajalabsblack from "./assets/images/ajalabs-black.png";
import leftImg from "./assets/images/homedesign1.png";
import rightImg from "./assets/images/homedesign2.png";

const API_BASE_URL = "http://localhost:5000";
const SESSION_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Helper function to render the correct component based on role
// Moved OUTSIDE App to avoid re-creation on every render
const RoleBasedContainer = ({ user, logo, ajalabsblack, handleLogout }) => {
  if (!user) return <Navigate to="/login" />;

  const props = { user, logo, ajalabsblack, handleLogout };
  const role = user.role.toLowerCase();

  if (role === "admin") return <Admin {...props} />;
  if (role === "uploader") return <Uploader {...props} />;
  if (role === "reviewer") return <Reviewer {...props} />;
  if (role === "viewer") return <Viewer {...props} />;
  return <div>Role not recognized.</div>;
};

function App() {
  // Always start as null — user must log in fresh every time the app opens
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Timer ref for the 24-hour auto-logout countdown
  const expiryTimerRef = useRef(null);

  // ── On every app open: clear localStorage and force /login ──────────────
  useEffect(() => {
    localStorage.removeItem("app_user");
    navigate("/login", { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── After login: start the 24-hour countdown timer ──────────────────────
  useEffect(() => {
    if (!user) return;

    const loginTime = new Date(user.login_time).getTime();
    const remaining = SESSION_EXPIRY_MS - (Date.now() - loginTime);

    if (remaining <= 0) {
      performLogout("expired");
      return;
    }

    expiryTimerRef.current = setTimeout(() => {
      performLogout("expired");
    }, remaining);

    return () => {
      if (expiryTimerRef.current) clearTimeout(expiryTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // ── Shared logout (manual button click OR auto-expiry) ───────────────────
  const performLogout = async (reason = "manual") => {
    if (expiryTimerRef.current) {
      clearTimeout(expiryTimerRef.current);
      expiryTimerRef.current = null;
    }
    // Notify backend so user_sessions.json is updated
    if (user) {
      try {
        await fetch(`${API_BASE_URL}/logout`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: user.username,
            session_token: user.session_token,
            reason,
          }),
        });
      } catch (_) {
        // Best-effort — don't block the UI if server is unreachable
      }
    }
    localStorage.removeItem("app_user");
    setUser(null);
    setFormData({ username: "", password: "" });
    setError("");
    navigate("/login");
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogin = async () => {
    setError("");
    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("app_user", JSON.stringify(data));
        setUser(data); // data now includes session_token and login_time from backend
        navigate(`/login/${data.username}`);
        return true;
      } else {
        setError(data.message || "Invalid credentials");
        return false;
      }
    } catch (err) {
      setError("Server connection failed.");
      return false;
    }
  };

  // Manual logout — delegates to performLogout
  const handleLogout = () => performLogout("manual");

  return (
    <Routes>
      {/* Route for the Login Page */}
      <Route
        path="/login"
        element={
          user ? (
            <Navigate to={`/login/${user.username}`} />
          ) : (
            <Login
              handleLogin={handleLogin}
              handleInputChange={handleInputChange}
              error={error}
              logo={logo}
              ajalabsblack={ajalabsblack}
              leftIllustration={leftImg}
              rightIllustration={rightImg}
            />
          )
        }
      />

      {/* Dynamic Route: Changes URL to /login/username */}
      <Route
        path="/login/:username/*"
        element={<RoleBasedContainer user={user} logo={logo} ajalabsblack={ajalabsblack} handleLogout={handleLogout} />}
      />

      {/* Redirect any other path to /login */}
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
}

export default App;   