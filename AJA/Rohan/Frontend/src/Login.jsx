import React, { useState, useRef, useEffect } from "react";
import "./login.css";

const EyeOpen = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeClosed = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

const ShieldIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const Login = ({
  handleLogin,
  handleDirectLogin,  // accepts { username, password } — no formData dependency
  handleInputChange,
  error,
  logo,
  ajalabsblack,
  leftIllustration,
  rightIllustration
}) => {
  const [mode, setMode] = useState("user");
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Admin card — fully isolated state
  const [adminCreds, setAdminCreds] = useState({ username: "", password: "" });
  const [adminShowPw, setAdminShowPw] = useState(false);
  const [adminError, setAdminError] = useState("");
  const [adminAuthenticating, setAdminAuthenticating] = useState(false);

  // Secret corner shield
  const [shieldClicks, setShieldClicks] = useState(0);
  const shieldTimer = useRef(null);

  const handleShieldClick = () => {
    setShieldClicks(n => {
      const next = n + 1;
      if (shieldTimer.current) clearTimeout(shieldTimer.current);
      shieldTimer.current = setTimeout(() => setShieldClicks(0), 2000);
      if (next >= 3) { setMode("admin"); return 0; }
      return next;
    });
  };

  useEffect(() => {
    setAdminError("");
    setShowPassword(false);
    setAdminShowPw(false);
    setAdminCreds({ username: "", password: "" });
  }, [mode]);

  // ── Regular user submit ────────────────────────────────────────────────────
  const onUserSubmit = async (e) => {
    e.preventDefault();
    setIsAuthenticating(true);
    const success = await handleLogin();
    if (!success) setIsAuthenticating(false);
  };

  // ── Admin submit — calls handleDirectLogin with explicit creds ────────────
  // NO formData, NO setTimeout, NO race condition.
  const onAdminSubmit = async (e) => {
    e.preventDefault();
    setAdminError("");

    if (!adminCreds.username.trim() || !adminCreds.password.trim()) {
      setAdminError("Please enter both username and password.");
      return;
    }

    setAdminAuthenticating(true);

    const result = await handleDirectLogin({
      username: adminCreds.username.trim(),
      password: adminCreds.password,
    }, "admin");

    if (!result.success) {
      setAdminError(result.message || "Invalid admin credentials.");
      setAdminAuthenticating(false);
    }
  };

  return (
    <div className="lp-root">

      {/* ── TOP NAV ── */}
      <nav className="lp-nav">
        <img src={ajalabsblack} alt="Ajalabs" className="lp-nav-logo" />
        <div className="lp-nav-right" />
      </nav>

      {/* ── STAGE ── */}
      <div className="lp-stage">

        <div className="lp-illustration lp-illustration--left">
          <img src={rightIllustration} alt="" />
        </div>

        {/* ══ USER CARD ══ */}
        {mode === "user" && (
          <div className="lp-card-wrap lp-card-wrap--enter">
            <div className="lp-card">
              <div className="lp-card-brand">
                <img src={logo} alt="JK Cement" className="lp-card-logo" />
              </div>

              <div className="lp-card-header">
                <h1 className="lp-card-title">Welcome back</h1>
                <p className="lp-card-sub">Sign in to your account to continue</p>
              </div>

              <div className="lp-role-chips">
                {["Uploader", "Viewer"].map(r => (
                  <span key={r} className="lp-role-chip">{r}</span>
                ))}
              </div>

              <form onSubmit={onUserSubmit} className="lp-form">
                <div className="lp-input-group">
                  <label className="lp-label">Username</label>
                  <input
                    type="text"
                    name="username"
                    placeholder="Enter your username"
                    onChange={handleInputChange}
                    required
                    autoComplete="username"
                    disabled={isAuthenticating}
                    className="lp-input"
                  />
                </div>

                <div className="lp-input-group">
                  <label className="lp-label">Password</label>
                  <div className="lp-pw-wrap">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      placeholder="Enter your password"
                      onChange={handleInputChange}
                      required
                      autoComplete="current-password"
                      disabled={isAuthenticating}
                      className="lp-input"
                    />
                    <button type="button" className="lp-pw-toggle"
                      onClick={() => setShowPassword(v => !v)}>
                      {showPassword ? <EyeOpen /> : <EyeClosed />}
                    </button>
                  </div>
                </div>

                <button type="submit" className="lp-submit-btn" disabled={isAuthenticating}>
                  {isAuthenticating
                    ? <><span className="lp-btn-spinner" /> Authenticating…</>
                    : "Sign In"}
                </button>
              </form>

              {error && (
                <div className="lp-error-box"><span>⚠</span> {error}</div>
              )}

              <div className="lp-divider"><span>or</span></div>

              <button type="button" className="lp-admin-portal-btn"
                onClick={() => setMode("admin")}>
                <ShieldIcon /> Admin Portal
              </button>
            </div>
          </div>
        )}

        {/* ══ ADMIN CARD ══ */}
        {mode === "admin" && (
          <div className="lp-card-wrap lp-card-wrap--enter">
            <div className="lp-card lp-card--admin">

              <div className="lp-admin-header-strip">
                <div className="lp-admin-shield">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                    strokeLinecap="round" strokeLinejoin="round" width="28" height="28">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </div>
                <div>
                  <div className="lp-admin-strip-title">Admin Portal</div>
                  <div className="lp-admin-strip-sub">Restricted — authorised personnel only</div>
                </div>
                <button type="button" className="lp-admin-back-btn"
                  onClick={() => setMode("user")} title="Back">←</button>
              </div>

              <div className="lp-card-brand lp-card-brand--compact">
                <img src={logo} alt="JK Cement" className="lp-card-logo" />
              </div>

              <form onSubmit={onAdminSubmit} className="lp-form">
                <div className="lp-input-group">
                  <label className="lp-label">Admin Username</label>
                  <input
                    type="text"
                    placeholder="Enter admin username"
                    value={adminCreds.username}
                    onChange={e => setAdminCreds(p => ({ ...p, username: e.target.value }))}
                    required
                    autoComplete="username"
                    disabled={adminAuthenticating}
                    className="lp-input lp-input--admin"
                  />
                </div>

                <div className="lp-input-group">
                  <label className="lp-label">Admin Password</label>
                  <div className="lp-pw-wrap">
                    <input
                      type={adminShowPw ? "text" : "password"}
                      placeholder="Enter admin password"
                      value={adminCreds.password}
                      onChange={e => setAdminCreds(p => ({ ...p, password: e.target.value }))}
                      required
                      autoComplete="current-password"
                      disabled={adminAuthenticating}
                      className="lp-input lp-input--admin"
                    />
                    <button type="button" className="lp-pw-toggle"
                      onClick={() => setAdminShowPw(v => !v)}>
                      {adminShowPw ? <EyeOpen /> : <EyeClosed />}
                    </button>
                  </div>
                </div>

                <button type="submit" className="lp-submit-btn lp-submit-btn--admin"
                  disabled={adminAuthenticating}>
                  {adminAuthenticating
                    ? <><span className="lp-btn-spinner lp-btn-spinner--admin" /> Verifying…</>
                    : <><ShieldIcon /> Access Admin Panel</>}
                </button>
              </form>

              {adminError && (
                <div className="lp-error-box lp-error-box--admin">
                  <span>⚠</span> {adminError}
                </div>
              )}

              <div className="lp-admin-security-note">
                🔐 All admin actions are monitored and logged
              </div>

              <button type="button" className="lp-back-link" onClick={() => setMode("user")}>
                ← Back to user login
              </button>
            </div>
          </div>
        )}

        <div className="lp-illustration lp-illustration--right">
          <img src={leftIllustration} alt="" />
        </div>
      </div>

      {/* ── SECRET TRIPLE-CLICK SHIELD ── */}
      <button
        className={`lp-shield-corner ${shieldClicks > 0 ? "lp-shield-corner--active" : ""}`}
        onClick={handleShieldClick}
        aria-label="Admin access"
      >
        <ShieldIcon />
        {shieldClicks > 0 && shieldClicks < 3 && (
          <span className="lp-shield-dots">
            {Array.from({ length: 3 }).map((_, i) => (
              <span key={i} className={`lp-shield-dot ${i < shieldClicks ? "filled" : ""}`} />
            ))}
          </span>
        )}
      </button>

      <footer className="lp-footer">
        <p>
          Copyright @ 2026 | Powered by Ajalabs.ai |{" "}
          <a href="https://www.ajalabs.ai/data-privacy.html" target="_blank" rel="noopener noreferrer">
            Data Privacy
          </a>
        </p>
      </footer>
    </div>
  );
};

export default Login;