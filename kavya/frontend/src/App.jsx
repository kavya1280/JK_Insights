import React, { useState } from "react";
import Login from "./Login";
import Admin from "./Admin";
import Uploader from "./Uploader";
import Reviewer from "./Reviewer";
import Viewer from "./Viewer";

// Assets
import logo from "./assets/images/jkc.png";
import ajalabsblack from "./assets/images/ajalabs-black.png";
import leftImg from "./assets/images/homedesign1.png";
import rightImg from "./assets/images/homedesign2.png";

function App() {
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [error, setError] = useState("");

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      // Assuming your Flask/Node backend has a /login endpoint that reads user.json
      const response = await fetch("http://localhost:5000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        // Data should contain { username, role }
        setUser(data);
      } else {
        setError(data.message || "Invalid Username or Password");
      }
    } catch (err) {
      setError("Backend server not reachable.");
    }
  };

  const handleLogout = () => {
    setUser(null);
    setFormData({ username: "", password: "" });
  };

  // --- ROLE BASED ROUTING ---
  // If not logged in, show Login page
  if (!user) {
    return (
      <Login
        handleLogin={handleLogin}
        handleInputChange={handleInputChange}
        error={error}
        logo={logo}
        ajalabsblack={ajalabsblack}
        leftIllustration={leftImg}
        rightIllustration={rightImg}
      />
    );
  }

  // Common props for all dashboards
  const dashboardProps = { user, logo, ajalabsblack, handleLogout };

  // Navigate to corresponding pages based on role in user.json
  switch (user.role) {
    case "admin":
      return <Admin {...dashboardProps} />;
    case "uploader":
      return <Uploader {...dashboardProps} />;
    case "reviewer":
      return <Reviewer {...dashboardProps} />;
    case "viewer":
      return <Viewer {...dashboardProps} />;
    default:
      return (
        <div style={{ textAlign: 'center', marginTop: '50px' }}>
          <h1>Role Error</h1>
          <p>No dashboard assigned to this role.</p>
          <button onClick={handleLogout}>Back to Login</button>
        </div>
      );
  }
}

export default App;