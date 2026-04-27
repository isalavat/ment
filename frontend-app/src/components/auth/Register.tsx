import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authService } from "../../services/authService";
import { UserRole } from "../../types/auth";
import { useLanguage } from "../../i18n/LanguageContext";
import { PlantIcon } from "../common/PlantIcon";
import "./Auth.css";

export const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    role: "USER" as UserRole,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { t } = useLanguage();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError(t.auth.register.passwordsDoNotMatch);
      return;
    }
    setLoading(true);
    try {
      const { confirmPassword, ...registerData } = formData;
      await authService.register(registerData);
      navigate("/login", {
        state: { message: t.auth.register.registrationSuccess },
      });
    } catch (err: any) {
      setError(
        err.response?.data?.message || t.auth.register.registrationFailed,
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card-container">
      <div className="card w-full max-w-auth-card mx-auto auth-card">
        <div className="auth-brand">
          <div className="auth-brand-icon">
            <PlantIcon size={54} className="auth-brand-icon-svg" />
          </div>
          <h1 className="auth-brand-title">{t.auth.register.title}</h1>
          <p className="auth-brand-subtitle">{t.auth.register.subtitle}</p>
        </div>
        <form id="registerForm" onSubmit={handleSubmit}>
          <div className="grid grid-2">
            <div className="form-group">
              <label className="form-label">{t.auth.register.firstName}</label>
              <input
                type="text"
                name="firstName"
                className="form-input"
                value={formData.firstName}
                onChange={handleChange}
                required
                placeholder={t.auth.register.firstNamePlaceholder}
              />
            </div>
            <div className="form-group">
              <label className="form-label">{t.auth.register.lastName}</label>
              <input
                type="text"
                name="lastName"
                className="form-input"
                value={formData.lastName}
                onChange={handleChange}
                required
                placeholder={t.auth.register.lastNamePlaceholder}
              />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">{t.auth.register.email}</label>
            <input
              type="email"
              name="email"
              className="form-input"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder={t.auth.register.emailPlaceholder}
            />
          </div>

          <div className="form-group">
            <label className="form-label">{t.auth.register.password}</label>
            <input
              type="password"
              name="password"
              className="form-input"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder={t.auth.register.passwordPlaceholder}
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              {t.auth.register.confirmPassword}
            </label>
            <input
              type="password"
              name="confirmPassword"
              className="form-input"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              placeholder={t.auth.register.confirmPasswordPlaceholder}
            />
          </div>

          <div className="form-group">
            <label className="form-label">{t.auth.register.role}</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              required
              className="form-select"
            >
              <option value="USER">{t.auth.register.mentee}</option>
              <option value="MENTOR">{t.auth.register.mentor}</option>
              <option value="ADMIN">{t.auth.register.adminTemporary}</option>
            </select>
          </div>

          {error && <div className="error-message">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary btn-lg auth-btn "
          >
            {loading ? t.auth.register.registering : t.nav.register}
          </button>
        </form>
        <div className="auth-text-block">
          <p className="auth-p">
            {t.auth.register.hasAccount}{" "}
            <Link to="/login">{t.auth.register.loginHere}</Link>
          </p>
        </div>
      </div>
    </div>
  );
};
