import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { profileService } from '../../services/profileService';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';
import './ProfileForm.css';

export const MenteeProfileForm: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    bio: '',
    goals: '',
  });

  useEffect(() => {
    if (user?.role !== 'MENTEE') {
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
          bio: userData.menteeProfile.bio || '',
          goals: userData.menteeProfile.goals || '',
        });
        setIsEditing(true);
      }
    } catch (err: any) {
      console.error('Error loading profile:', err);
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
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || t.profile.errors.failedToSave);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  if (loading && !formData.bio) {
    return <div className="loading-container">Loading...</div>;
  }

  return (
    <div className="profile-form-container">
      <div className="page-header">
        <h1 className="page-title">
          {isEditing ? t.profile.mentee.titleEdit : t.profile.mentee.title}
        </h1>
        <p className="page-subtitle">
          {t.profile.mentee.subtitle}
        </p>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="profile-form-card">

        <form onSubmit={handleSubmit} className="profile-form">
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
              rows={5}
              className="form-textarea"
              placeholder={t.profile.mentee.bioPlaceholder}
            />
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
              rows={5}
              className="form-textarea"
              placeholder={t.profile.mentee.goalsPlaceholder}
            />
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="btn-secondary"
              disabled={loading}
            >
              {t.common.cancel}
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? t.common.loading : isEditing ? t.profile.mentee.updateProfile : t.profile.mentee.createProfile}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
