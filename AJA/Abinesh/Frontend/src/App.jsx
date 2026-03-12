import React, { useState, useEffect } from "react";
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
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("app_user");
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // No longer need to navigate on mount if we are already on a valid path
  // The Route definitions handle the redirection if user is present/absent

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
        setUser(data);
        // CHANGE THE URL TO include the username
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

  const handleLogout = () => {
    localStorage.removeItem("app_user");
    setUser(null);
    setFormData({ username: "", password: "" });
    navigate("/login"); // Go back to base login URL
  };

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