import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { profileService } from "../../services/profileService";
import { authService } from "../../services/authService";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage } from "../../i18n/LanguageContext";
import "./ProfileForm.css";
import "../admin/AdminUsers.css";

export const MenteeProfileForm: React.FC = () => {
  const navigate = useNavigate();
  const { user, login } = useAuth();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    bio: "",
    goals: "",
  });

  useEffect(() => {
    loadProfile();
  }, [user]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const { user: userData } = await profileService.getMyProfile();
      setFormData({
        bio: userData.bio || "",
        goals: userData.goals || "",
      });
    } catch (err: any) {
      console.error("Error loading profile:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await profileService.updateMyProfile(formData);
      // Refresh user data to pick up bio/goals
      const updatedUser = await authService.fetchCurrenUser();
      login(updatedUser);
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.error || t.profile.errors.failedToSave);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  if (loading && !formData.bio) {
    return <div className="loading-container">Loading...</div>;
  }

  return (
    <div className="content-area">
      <div className="page-header">
        <div>
          <button
            className="btn btn-outline btn-sm"
            onClick={() => navigate("/dashboard")}
          >
            ← {t.profile.common.back}
          </button>
          <h1 className="page-title mt-sm">{t.profile.mentee.titleEdit}</h1>
        </div>
      </div>

      {error && <div className="alert alert-danger mb-md">{error}</div>}

      <div className="card">
        <div className="card-body">
          <form onSubmit={handleSubmit} className="admin-form">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={`${user?.firstName ?? ""} ${user?.lastName ?? ""}`}
                  readOnly
                  style={{ background: "var(--neutral-100)", cursor: "default" }}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="text"
                  className="form-input"
                  value={user?.email ?? ""}
                  readOnly
                  style={{ background: "var(--neutral-100)", cursor: "default" }}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="bio" className="form-label">
                {t.profile.mentee.bio}
              </label>
              <textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                rows={6}
                className="form-textarea"
                placeholder={t.profile.mentee.bioPlaceholder}
              />
              <small
                style={{
                  color: "var(--neutral-500)",
                  fontSize: "var(--font-size-sm)",
                  display: "block",
                  marginTop: "var(--space-xs)",
                }}
              >
                {t.profile.mentee.bioHelper}
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="goals" className="form-label">
                {t.profile.mentee.goals}
              </label>
              <textarea
                id="goals"
                name="goals"
                value={formData.goals}
                onChange={handleChange}
                rows={6}
                className="form-textarea"
                placeholder={t.profile.mentee.goalsPlaceholder}
              />
              <small
                style={{
                  color: "var(--neutral-500)",
                  fontSize: "var(--font-size-sm)",
                  display: "block",
                  marginTop: "var(--space-xs)",
                }}
              >
                {t.profile.mentee.goalsHelper}
              </small>
            </div>

            <div className="form-actions">
              <button
                type="button"
                onClick={() => navigate("/dashboard")}
                className="btn btn-outline"
                disabled={loading}
              >
                {t.profile.common.cancel}
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading
                  ? t.profile.common.saving
                  : t.profile.mentee.updateProfile}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
