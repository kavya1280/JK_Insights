import React, { useState } from "react";
import "./Login.css";

const Login = ({ handleLogin, handleInputChange, error, logo, ajalabsblack, leftIllustration, rightIllustration }) => {
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const [showPassword, setShowPassword] = useState(false);

  const onFormSubmit = async (e) => {
    e.preventDefault();
    // Start animation
    setIsAuthenticating(true);

    // Slight delay to let the user see the logo travel before the page redirects
    setTimeout(() => {
      handleLogin(e);
    }, 800); // Adjust duration to match your CSS transition
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className={`login-page ${isAuthenticating ? "page-loading" : ""}`}>
      {/* Top Navigation */}
      <nav className="top-nav">
        <div className="nav-left">
          <img src={ajalabsblack} alt="Ajalabs" className="nav-logo-small" />
        </div>
        <div className="nav-right">
          {/* This is where the logo will move to */}
          <div className="nav-logo-placeholder"></div>
        </div>
      </nav>

      <div className="main-content">
        {/* Left Side Illustration */}
        <div className="side-illustration left">
          <img src={rightIllustration} alt="Construction Design" />
        </div>

        {/* Central Login Card */}
        <div className={`login-card ${isAuthenticating ? "fade-out-elements" : ""}`}>

          {/* JK Cement Branding with animation class */}
          <div className="card-brand-area">
            <img
              src={logo}
              alt="JK Cement"
              className={`card-logo-jk ${isAuthenticating ? "animate-to-top-right" : ""}`}
            />
          </div>

          <div className="card-header">
            <h1>User Login</h1>
            <p className="subtitle">Hey, Enter your details to get sign in to your account</p>
          </div>

          <form onSubmit={onFormSubmit}>
            <div className="input-group">
              <input
                type="text"
                name="username"
                placeholder="Enter your User Name"
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="input-group">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Enter your Password"
                onChange={handleInputChange}
                required
              />
              <span className="show-hide" onClick={togglePasswordVisibility}>
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                )}
              </span>
            </div>

            <button type="submit" className="login-btn" disabled={isAuthenticating}>
              {isAuthenticating ? "Authenticating..." : "Sign in"}
            </button>
          </form>

          {error && <p className="error-text">{error}</p>}
        </div>

        {/* Right Side Illustration */}
        <div className="side-illustration right">
          <img src={leftIllustration} alt="Logistics Illustration" />
        </div>
      </div>

      <footer className="login-page-footer">
        <p>Copyright @ 2024 | Powered by Ajalabs | Data Privacy </p>
      </footer>
    </div>
  );
};

export default Login;