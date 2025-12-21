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
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    bio: "",
    goals: "",
  });

  useEffect(() => {
    if (user?.role !== "MENTEE") {
      setError(t.profile.errors.onlyMentees);
      return;
    }
    loadProfile();
  }, [user]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const { user: userData } = await profileService.getMyProfile();
      if (userData.menteeProfile) {
        setFormData({
          bio: userData.menteeProfile.bio || "",
          goals: userData.menteeProfile.goals || "",
        });
        setIsEditing(true);
      }
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
      if (isEditing) {
        await profileService.updateMenteeProfile(formData);
      } else {
        await profileService.createMenteeProfile(formData);
      }
      // Refresh user data to get the new profile ID
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
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
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
          <h1 className="page-title mt-sm">
            {isEditing ? t.profile.mentee.titleEdit : t.profile.mentee.title}
          </h1>
        </div>
      </div>

      {error && <div className="alert alert-danger mb-md">{error}</div>}

      <div className="card">
        <div className="card-body">
          <form onSubmit={handleSubmit} className="admin-form">
            <div className="form-group">
              <label htmlFor="bio" className="form-label">
                {t.profile.mentee.bio} *
              </label>
              <textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                required
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
                {t.profile.mentee.goals} *
              </label>
              <textarea
                id="goals"
                name="goals"
                value={formData.goals}
                onChange={handleChange}
                required
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
                  : isEditing
                  ? t.profile.mentee.updateProfile
                  : t.profile.mentee.createProfile}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
