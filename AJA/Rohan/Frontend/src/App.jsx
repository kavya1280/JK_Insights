import React, { useState, useEffect, useRef } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import Login from "./Login";
import Admin from "./Admin";
import Uploader from "./Uploader";
import Viewer from "./Viewer";

import logo from "./assets/images/jkc.png";
import ajalabsblack from "./assets/images/ajalabs-black.png";
import leftImg from "./assets/images/homedesign1.png";
import rightImg from "./assets/images/homedesign2.png";

const API_BASE_URL = "http://localhost:5000";
const SESSION_EXPIRY_MS = 24 * 60 * 60 * 1000;

const RoleBasedContainer = ({ user, logo, ajalabsblack, handleLogout }) => {
  if (!user) return <Navigate to="/login" />;
  const props = { user, logo, ajalabsblack, handleLogout };
  const role = user.role.toLowerCase();
  
  if (role === "admin") return <Admin    {...props} />;
  if (role === "uploader") return <Uploader {...props} />;
  if (role === "viewer") return <Viewer   {...props} />;
  
  return <div>Role not recognized.</div>;
};

function App() {
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const expiryTimerRef = useRef(null);

  useEffect(() => {
    localStorage.removeItem("app_user");
    navigate("/login", { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!user) return;
    const loginTime = new Date(user.login_time).getTime();
    const remaining = SESSION_EXPIRY_MS - (Date.now() - loginTime);
    if (remaining <= 0) { performLogout("expired"); return; }
    expiryTimerRef.current = setTimeout(() => performLogout("expired"), remaining);
    return () => { if (expiryTimerRef.current) clearTimeout(expiryTimerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const performLogout = async (reason = "manual") => {
    if (expiryTimerRef.current) { clearTimeout(expiryTimerRef.current); expiryTimerRef.current = null; }
    if (user) {
      try {
        await fetch(`${API_BASE_URL}/logout`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: user.username, session_token: user.session_token, reason }),
        });
      } catch (_) { }
    }
    localStorage.removeItem("app_user");
    setUser(null);
    setFormData({ username: "", password: "" });
    setError("");
    navigate("/login");
  };

  const handleInputChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // ── Standard login — reads from formData state (regular user form) ────────
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
        setUser(data);
        navigate(`/login/${data.username}`);
        return true;
      } else {
        setError(data.message || "Invalid credentials");
        return false;
      }
    } catch {
      setError("Server connection failed.");
      return false;
    }
  };

  // ── Direct login — accepts { username, password } explicitly ─────────────
  // Used by the admin portal to avoid React state async race conditions.
  const handleDirectLogin = async (credentials, requiredRole = null) => {
    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });
      const data = await response.json();
      if (response.ok) {
        // Secure Role Check
        if (requiredRole && data.role !== requiredRole) {
          return { success: false, message: `Invalid ${requiredRole} credentials.` };
        }
        localStorage.setItem("app_user", JSON.stringify(data));
        setUser(data);
        navigate(`/login/${data.username}`);
        return { success: true, data };
      } else {
        return { success: false, message: data.message || "Invalid credentials" };
      }
    } catch {
      return { success: false, message: "Server connection failed." };
    }
  };

  const handleLogout = () => performLogout("manual");

  return (
    <Routes>
      <Route
        path="/login"
        element={
          user ? (
            <Navigate to={`/login/${user.username}`} />
          ) : (
            <Login
              handleLogin={handleLogin}
              handleDirectLogin={handleDirectLogin}
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
      <Route
        path="/login/:username/*"
        element={
          <RoleBasedContainer
            user={user}
            logo={logo}
            ajalabsblack={ajalabsblack}
            handleLogout={handleLogout}
          />
        }
      />
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
}

export default App;