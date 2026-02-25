import React, { useState } from "react";
import "./login.css";

const Login = ({
  handleLogin,
  handleInputChange,
  error,
  logo,
  ajalabsblack,
  leftIllustration,
  rightIllustration
}) => {
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const onFormSubmit = async (e) => {
    e.preventDefault();
    setIsAuthenticating(true);

    // Call handleLogin and wait for the server response
    const success = await handleLogin();

    // If failed: We stop the loading state so the user can see the error
    if (!success) {
      setIsAuthenticating(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="login-page">
      {/* Top Navigation */}
      <nav className="top-nav">
        <div className="nav-left">
          <img src={ajalabsblack} alt="Ajalabs" className="nav-logo-small" />
        </div>
        <div className="nav-right">
          <div className="nav-logo-placeholder"></div>
        </div>
      </nav>

      <div className="main-content">
        <div className="side-illustration left">
          <img src={rightIllustration} alt="Design Left" />
        </div>

        {/* Removed "fade-out-elements" class here */}
        <div className="login-card">
          <div className="card-brand-area">
            {/* Removed the animation class logic from the logo */}
            <img
              src={logo}
              alt="JK Cement"
              className="card-logo-jk"
            />
          </div>

          <div className="card-header">
            <h1>User Login</h1>
            <p className="subtitle">Enter your details to sign in to your account</p>
          </div>

          <form onSubmit={onFormSubmit}>
            <div className="input-group">
              <input
                type="text"
                name="username"
                placeholder="User Name"
                onChange={handleInputChange}
                required
                autoComplete="username"
                disabled={isAuthenticating}
              />
            </div>
            <div className="input-group">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Password"
                onChange={handleInputChange}
                required
                autoComplete="current-password"
                disabled={isAuthenticating}
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

          {error && <div className="error-text-container"><p className="error-text">{error}</p></div>}
        </div>

        <div className="side-illustration right">
          <img src={leftIllustration} alt="Design Right" />
        </div>
      </div>

      <footer className="login-page-footer">
        <p>Copyright @ 2024 | Powered by Ajalabs | Data Privacy</p>
      </footer>
    </div>
  );
};

export default Login;