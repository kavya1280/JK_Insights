import React, { useState } from "react";
import Login from "./Login";
import Admin from "./Admin";
import Uploader from "./Uploader";
import Reviewer from "./Reviewer";
import Viewer from "./Viewer";

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

  const handleLogin = async () => {
    setError("");
    try {
      const response = await fetch("http://localhost:5000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await response.json();

      if (response.ok) {
        setUser(data);
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
    setUser(null);
    setFormData({ username: "", password: "" });
  };

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

  const props = { user, logo, ajalabsblack, handleLogout };
  const role = user.role.toLowerCase();

  if (role === "admin") return <Admin {...props} />;
  if (role === "uploader") return <Uploader {...props} />;
  if (role === "reviewer") return <Reviewer {...props} />;
  if (role === "viewer") return <Viewer {...props} />;

  return <div>Role not recognized.</div>;
}

export default App;