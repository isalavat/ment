import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { profileService } from '../../services/profileService';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';
import './ProfileForm.css';

export const MentorProfileForm: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [mentorProfileId, setMentorProfileId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    bio: '',
    title: '',
    yearsExperience: 0,
    hourlyRate: 0,
    currency: 'USD',
  });
  const [categories, setCategories] = useState<Array<{ id: number; name: string; slug: string }>>([]);
  const [selectedCategories, setSelectedCategories] = useState<Array<{ category: { id: number; name: string; slug: string } }>>([]);
  const [availableCategories, setAvailableCategories] = useState<Array<{ id: number; name: string; slug: string }>>([]);

  useEffect(() => {
    if (user?.role !== 'MENTOR') {
      setError(t.profile.errors.onlyMentors);
      return;
    }
    loadProfile();
    loadCategories();
  }, [user]);

  const loadCategories = async () => {
    try {
      const { categories: allCategories } = await profileService.getCategories();
      setCategories(allCategories);
    } catch (err) {
      console.error('Error loading categories:', err);
    }
  };

  const loadProfile = async () => {
    try {
      setLoading(true);
      const { user: userData } = await profileService.getMyProfile();
      if (userData.mentorProfile) {
        setFormData({
          bio: userData.mentorProfile.bio,
          title: userData.mentorProfile.title,
          yearsExperience: userData.mentorProfile.yearsExperience,
          hourlyRate: userData.mentorProfile.hourlyRate,
          currency: userData.mentorProfile.currency,
        });
        setMentorProfileId(userData.mentorProfile.id);
        setSelectedCategories(userData.mentorProfile.categories || []);
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
        await profileService.updateMentorProfile(formData);
      } else {
        await profileService.createMentorProfile(formData);
      }
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || t.profile.errors.failedToSave);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'yearsExperience' || name === 'hourlyRate' ? Number(value) : value,
    });
  };

  const handleAddCategory = async (categoryId: number) => {
    try {
      await profileService.addCategoryToMentorProfile(categoryId);
      await loadProfile(); // Reload to get updated categories
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to add category');
    }
  };

  const handleRemoveCategory = async (categoryId: number) => {
    try {
      await profileService.removeCategoryFromMentorProfile(categoryId);
      await loadProfile(); // Reload to get updated categories
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to remove category');
    }
  };

  // Get categories that are not yet selected
  const getAvailableCategories = () => {
    const selectedIds = selectedCategories.map(c => c.category.id);
    return categories.filter(c => !selectedIds.includes(c.id));
  };

  if (loading && !formData.bio) {
    return <div className="loading-container">Loading...</div>;
  }

  return (
    <div className="profile-form-container">
      <div className="page-header">
        <h1 className="page-title">
          {isEditing ? t.profile.mentor.titleEdit : t.profile.mentor.title}
        </h1>
        <p className="page-subtitle">
          {t.profile.mentor.subtitle}
        </p>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="profile-form-card">

        <form onSubmit={handleSubmit} className="profile-form">
          <div className="form-group">
            <label htmlFor="title" className="form-label">
              {t.profile.mentor.professionalTitle} *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="form-input"
              placeholder={t.profile.mentor.titlePlaceholder}
            />
          </div>

          <div className="form-group">
            <label htmlFor="bio" className="form-label">
              {t.profile.mentor.bio} *
            </label>
            <textarea
              id="bio"
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              required
              rows={6}
              className="form-textarea"
              placeholder={t.profile.mentor.bioPlaceholder}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="yearsExperience" className="form-label">
                {t.profile.mentor.yearsExperience} *
              </label>
              <input
                type="number"
                id="yearsExperience"
                name="yearsExperience"
                value={formData.yearsExperience}
                onChange={handleChange}
                required
                min="0"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="hourlyRate" className="form-label">
                {t.profile.mentor.hourlyRate} *
              </label>
              <input
                type="number"
                id="hourlyRate"
                name="hourlyRate"
                value={formData.hourlyRate}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="currency" className="form-label">
                {t.profile.mentor.currency}
              </label>
              <select
                id="currency"
                name="currency"
                value={formData.currency}
                onChange={handleChange}
                className="form-select"
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="RUB">RUB</option>
                <option value="KGS">KGS</option>
              </select>
            </div>
          </div>

          {isEditing && (
            <div className="form-group">
              <label className="form-label">Categories</label>
              <div className="categories-section">
                <div className="selected-categories">
                  {selectedCategories.map((catRel) => (
                    <div key={catRel.category.id} className="category-chip">
                      <span>{catRel.category.name}</span>
                      <button
                        type="button"
                        className="category-remove"
                        onClick={() => handleRemoveCategory(catRel.category.id)}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                {getAvailableCategories().length > 0 && (
                  <div className="add-category-form">
                    <select
                      className="form-select"
                      onChange={(e) => {
                        if (e.target.value) {
                          handleAddCategory(parseInt(e.target.value));
                          e.target.value = '';
                        }
                      }}
                    >
                      <option value="">Add a category...</option>
                      {getAvailableCategories().map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>
          )}

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
              {loading ? t.common.loading : isEditing ? t.profile.mentor.updateProfile : t.profile.mentor.createProfile}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
