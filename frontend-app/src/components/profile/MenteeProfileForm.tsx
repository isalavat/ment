import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { profileService } from "../../services/profileService";
import { authService } from "../../services/authService";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage } from "../../i18n/LanguageContext";
import { PageShell } from "../common/PageShell";
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
    return <div className="loading-container">{t.common.loading}</div>;
  }

  return (
    <PageShell
      title={t.profile.mentee.titleEdit}
      actions={
        <div>
          <button
            className="btn btn-outline btn-sm"
            onClick={() => navigate("/dashboard")}
          >
            ← {t.profile.common.back}
          </button>
        </div>
      }
    >
      {error && <div className="alert alert-danger mb-md">{error}</div>}

      <div className="card">
        <div className="card-body">
          <form onSubmit={handleSubmit} className="admin-form">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">{t.common.name}</label>
                <input
                  type="text"
                  value={`${user?.firstName ?? ""} ${user?.lastName ?? ""}`}
                  readOnly
                  className="form-input profile-readonly-input"
                />
              </div>
              <div className="form-group">
                <label className="form-label">{t.common.email}</label>
                <input
                  type="text"
                  value={user?.email ?? ""}
                  readOnly
                  className="form-input profile-readonly-input"
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
              <small className="profile-helper-text">
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
              <small className="profile-helper-text">
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
    </PageShell>
  );
};
