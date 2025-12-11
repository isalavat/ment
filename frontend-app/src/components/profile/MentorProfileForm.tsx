import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { profileService } from '../../services/profileService';
import { adminService } from '../../services/adminService';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';
import './ProfileForm.css';
import '../admin/AdminUsers.css';

export const MentorProfileForm: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
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
  
  const [availableSkills, setAvailableSkills] = useState<Array<{ id: number; name: string }>>([]);
  const [selectedSkills, setSelectedSkills] = useState<Array<{ skill: { id: number; name: string } }>>([]);
  const [selectedSkillId, setSelectedSkillId] = useState<number | ''>('');
  const [newSkillName, setNewSkillName] = useState('');

  useEffect(() => {
    if (user?.role !== 'MENTOR') {
      setError(t.profile.errors.onlyMentors);
      return;
    }
    loadProfile();
    loadCategories();
    loadSkills();
  }, [user]);

  const loadSkills = async () => {
    try {
      const skills = await adminService.getSkills();
      setAvailableSkills(skills);
    } catch (err) {
      console.error('Error loading skills:', err);
    }
  };

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
        setSelectedSkills(userData.mentorProfile.skills || []);
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
      setError(null);
      setSuccess(null);
      await profileService.addCategoryToMentorProfile(categoryId);
      await loadProfile(); // Reload to get updated categories
      setSuccess('Category added successfully');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to add category');
    }
  };

  const handleRemoveCategory = async (categoryId: number) => {
    try {
      setError(null);
      setSuccess(null);
      await profileService.removeCategoryFromMentorProfile(categoryId);
      await loadProfile(); // Reload to get updated categories
      setSuccess('Category removed successfully');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to remove category');
    }
  };

  const handleAddSkill = async () => {
    if (!newSkillName && !selectedSkillId) {
      alert('Please select or enter a skill');
      return;
    }

    try {
      setError(null);
      setSuccess(null);
      const updatedProfile = await profileService.addSkillToMentorProfile(
        selectedSkillId ? Number(selectedSkillId) : undefined,
        newSkillName || undefined
      );
      
      if (updatedProfile.skills) {
        setSelectedSkills(updatedProfile.skills);
      }
      setNewSkillName('');
      setSelectedSkillId('');
      setSuccess('Skill added successfully');
      await loadSkills(); // Reload skills list in case new one was created
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to add skill');
    }
  };

  const handleRemoveSkill = async (skillId: number) => {
    try {
      setError(null);
      setSuccess(null);
      await profileService.removeSkillFromMentorProfile(skillId);
      setSelectedSkills(prev => prev.filter(s => s.skill.id !== skillId));
      setSuccess('Skill removed successfully');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to remove skill');
    }
  };

  if (loading && !formData.bio) {
    return <div className="loading-container">Loading...</div>;
  }

  return (
    <div className="content-area">
      <div className="page-header">
        <div>
          <button className="btn btn-outline btn-sm" onClick={() => navigate('/dashboard')}>
            ← Back
          </button>
          <h1 className="page-title mt-sm">
            {isEditing ? 'Edit Mentor Profile' : 'Complete Your Mentor Profile'}
          </h1>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger mb-md">{error}</div>
      )}

      {success && (
        <div className="alert alert-success mb-md">{success}</div>
      )}

      <div className="card">
        <div className="card-body">
          <form onSubmit={handleSubmit} className="admin-form">
            <div className="form-row">
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
            </div>

            <div className="form-row">
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
                <input
                  type="text"
                  id="currency"
                  name="currency"
                  value={formData.currency}
                  onChange={handleChange}
                  className="form-input"
                  maxLength={3}
                />
              </div>
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
                rows={5}
                className="form-textarea"
                placeholder={t.profile.mentor.bioPlaceholder}
              />
            </div>

            {/* Skills Management */}
            {isEditing && (
              <div className="form-group">
                <label className="form-label">Skills & Expertise</label>
                
                {/* Current Skills */}
                <div className="skills-list mb-md">
                  {selectedSkills.length > 0 ? (
                    selectedSkills.map((skillRel) => (
                      <div key={skillRel.skill.id} className="skill-chip">
                        <span>{skillRel.skill.name}</span>
                        <button
                          type="button"
                          className="skill-remove"
                          onClick={() => handleRemoveSkill(skillRel.skill.id)}
                          title="Remove skill"
                        >
                          ×
                        </button>
                      </div>
                    ))
                  ) : (
                    <p style={{ color: 'var(--neutral-500)', fontSize: 'var(--font-size-sm)' }}>
                      No skills added yet
                    </p>
                  )}
                </div>

                {/* Add New Skill */}
                <div className="skill-add-form">
                  <div className="form-row">
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <select
                        className="form-select"
                        value={selectedSkillId}
                        onChange={(e) => setSelectedSkillId(e.target.value ? Number(e.target.value) : '')}
                      >
                        <option value="">Select existing skill...</option>
                        {availableSkills.map(skill => (
                          <option key={skill.id} value={skill.id}>
                            {skill.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', padding: '0 var(--space-md)' }}>
                      <span style={{ color: 'var(--neutral-500)' }}>OR</span>
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Enter new skill name..."
                        value={newSkillName}
                        onChange={(e) => setNewSkillName(e.target.value)}
                      />
                    </div>

                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={handleAddSkill}
                    >
                      + Add Skill
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Categories Management */}
            {isEditing && (
              <div className="form-group">
                <label className="form-label">Categories</label>
                
                {/* Current Categories */}
                <div className="skills-list mb-md">
                  {selectedCategories.length > 0 ? (
                    selectedCategories.map((catRel) => (
                      <div key={catRel.category.id} className="skill-chip">
                        <span>{catRel.category.name}</span>
                        <button
                          type="button"
                          className="skill-remove"
                          onClick={() => handleRemoveCategory(catRel.category.id)}
                          title="Remove category"
                        >
                          ×
                        </button>
                      </div>
                    ))
                  ) : (
                    <p style={{ color: 'var(--neutral-500)', fontSize: 'var(--font-size-sm)' }}>
                      No categories assigned yet
                    </p>
                  )}
                </div>

                {/* Add Category */}
                <div className="skill-add-form">
                  <div className="form-row">
                    <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
                      <select
                        className="form-select"
                        defaultValue=""
                        onChange={(e) => {
                          if (e.target.value) {
                            handleAddCategory(parseInt(e.target.value));
                            e.target.value = '';
                          }
                        }}
                      >
                        <option value="">Select category...</option>
                        {categories
                          .filter(cat => !selectedCategories.some(sc => sc.category.id === cat.id))
                          .map((cat) => (
                            <option key={cat.id} value={cat.id}>
                              {cat.name}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="form-actions">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="btn btn-outline"
                disabled={loading}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Saving...' : isEditing ? 'Update Profile' : 'Create Profile'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
