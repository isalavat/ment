import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authService } from "../../services/authService";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage } from "../../i18n/LanguageContext";
import { PlantIcon } from "../common/PlantIcon";
import "./Auth.css";

// ---------------------------------------------------------------------------
// Dev-mode quick-login users — only compiled in non-production builds.
// The list mirrors the accounts created by backend/src/devBootstrap.ts.
// ---------------------------------------------------------------------------
const IS_DEV = process.env.NODE_ENV !== "production";
const DEV_PASSWORD = process.env.REACT_APP_TEST_USERS_PASSWORD ?? "DevPass123!";

const DEV_USERS = [
  { label: "Regular User", email: "dev.user@mentorhub.local" },
  {
    label: "Mentor — Verified (bookable)",
    email: "dev.mentor@mentorhub.local",
  },
  {
    label: "Mentor — Pending review",
    email: "dev.mentor.pending@mentorhub.local",
  },
  {
    label: "Mentor — No profile",
    email: "dev.mentor.noprofile@mentorhub.local",
  },
  { label: "Admin", email: "dev.admin@mentorhub.local" },
] as const;

export const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();
  const { t } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const user = await authService.login({ email, password });
      login(user);
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.message || t.auth.login.loginFailed);
    } finally {
      setLoading(false);
    }
  };

  /** Quick-login: pre-fill fields then immediately submit. */
  const handleDevLogin = async (devEmail: string) => {
    setError("");
    setLoading(true);
    try {
      const user = await authService.login({
        email: devEmail,
        password: DEV_PASSWORD,
      });
      login(user);
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.message || t.auth.login.devLoginFailed);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card-container">
      <div
        className="card"
        style={{ maxWidth: "480px", width: "100%", margin: "0" }}
      >
        <div style={{ textAlign: "center", marginBottom: "var(--space-xl)" }}>
          <div className="auth-brand-icon">
            <PlantIcon size={54} className="auth-brand-icon-svg" />
          </div>
          <h1
            style={{
              fontSize: "var(--font-size-xxl)",
              marginBottom: "var(--space-xs)",
            }}
          >
            MentorHub
          </h1>
          <p style={{ color: "var(--neutral-600)" }}>{t.auth.login.subtitle}</p>
        </div>

        {/* ── Dev quick-login panel ─────────────────────────────── */}
        {IS_DEV && (
          <div className="dev-login-panel">
            <div className="dev-login-label">{t.auth.login.devQuickLogin}</div>
            <select
              className="form-select"
              defaultValue=""
              disabled={loading}
              onChange={(e) => {
                if (e.target.value) handleDevLogin(e.target.value);
              }}
            >
              <option value="" disabled>
                {t.auth.login.selectDemoAccount}
              </option>
              {DEV_USERS.map((u) => (
                <option key={u.email} value={u.email}>
                  {u.label}
                </option>
              ))}
            </select>
          </div>
        )}

        <form id="loginForm" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">{t.auth.login.email}</label>
            <input
              type="email"
              value={email}
              className="form-input"
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder={t.auth.login.emailPlaceholder}
            />
          </div>
          <div className="form-group">
            <label className="form-label">{t.auth.login.password}</label>
            <input
              type="password"
              value={password}
              className="form-input"
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder={t.auth.login.passwordPlaceholder}
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary btn-lg auth-btn"
          >
            {loading ? t.auth.login.loggingIn : t.nav.login}
          </button>
        </form>
        <div className="auth-text-block">
          <p className="auth-p">
            {t.auth.login.noAccount}{" "}
            <Link to="/register">{t.auth.login.registerHere}</Link>
          </p>
        </div>
      </div>
    </div>
  );
};
