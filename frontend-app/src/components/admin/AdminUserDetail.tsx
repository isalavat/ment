import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { adminService, User, UpdateUserData, UpdateMentorProfileData, UpdateMenteeProfileData, Skill } from '../../services/adminService';
import { useLanguage } from '../../i18n/LanguageContext';
import './AdminUsers.css';

export const AdminUserDetail: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { id } = useParams<{ id: string }>();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState<'user' | 'profile'>('user');

  const [userData, setUserData] = useState<UpdateUserData>({
    firstName: '',
    lastName: '',
    email: '',
    role: 'MENTEE'
  });

  const [mentorProfile, setMentorProfile] = useState<UpdateMentorProfileData>({
    bio: '',
    title: '',
    yearsExperience: 0,
    hourlyRate: 0,
    currency: 'USD'
  });

  const [menteeProfile, setMenteeProfile] = useState<UpdateMenteeProfileData>({
    bio: '',
    goals: ''
  });

  const [availableSkills, setAvailableSkills] = useState<Skill[]>([]);
  const [mentorSkills, setMentorSkills] = useState<any[]>([]);
  const [newSkillName, setNewSkillName] = useState('');
  const [selectedSkillId, setSelectedSkillId] = useState<number | ''>('');

  useEffect(() => {
    if (id) {
      loadUser();
      loadSkills();
    }
  }, [id]);

  const loadUser = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await adminService.getUser(parseInt(id!));
      setUser(data);
      
      // Populate user data
      setUserData({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        role: data.role
      });

      // Populate profile data if exists
      if (data.mentorProfile) {
        setMentorProfile({
          bio: (data.mentorProfile as any).bio || '',
          title: (data.mentorProfile as any).title || '',
          yearsExperience: (data.mentorProfile as any).yearsExperience || 0,
          hourlyRate: parseFloat((data.mentorProfile as any).hourlyRate || 0),
          currency: (data.mentorProfile as any).currency || 'USD'
        });
        
        // Load mentor skills
        if ((data.mentorProfile as any).skills) {
          setMentorSkills((data.mentorProfile as any).skills);
        }
      }

      if (data.menteeProfile) {
        setMenteeProfile({
          bio: (data.menteeProfile as any).bio || '',
          goals: (data.menteeProfile as any).goals || ''
        });
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load user');
    } finally {
      setLoading(false);
    }
  };

  const loadSkills = async () => {
    try {
      const skills = await adminService.getSkills();
      setAvailableSkills(skills);
    } catch (err) {
      console.error('Failed to load skills', err);
    }
  };

  const handleUserChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setUserData(prev => ({ ...prev, [name]: value }));
  };

  const handleMentorChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setMentorProfile(prev => ({ 
      ...prev, 
      [name]: name === 'yearsExperience' || name === 'hourlyRate' ? parseFloat(value) : value 
    }));
  };

  const handleMenteeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setMenteeProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      setError('');
      setSuccess('');
      
      await adminService.updateUser(parseInt(id!), userData);
      setSuccess('User updated successfully');
      loadUser();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update user');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    try {
      setSaving(true);
      setError('');
      setSuccess('');
      
      if (user.role === 'MENTOR') {
        if (user.mentorProfile) {
          await adminService.updateMentorProfile(parseInt(id!), mentorProfile);
        } else {
          await adminService.createMentorProfile(parseInt(id!), mentorProfile as any);
        }
      } else if (user.role === 'MENTEE') {
        if (user.menteeProfile) {
          await adminService.updateMenteeProfile(parseInt(id!), menteeProfile);
        } else {
          await adminService.createMenteeProfile(parseInt(id!), menteeProfile);
        }
      }
      
      setSuccess('Profile updated successfully');
      loadUser();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleAddSkill = async () => {
    if (!newSkillName && !selectedSkillId) {
      alert('Please select or enter a skill');
      return;
    }

    try {
      setError('');
      const updatedProfile = await adminService.addSkillToMentor(
        parseInt(id!), 
        selectedSkillId ? Number(selectedSkillId) : undefined,
        newSkillName || undefined
      );
      
      setMentorSkills(updatedProfile.skills);
      setNewSkillName('');
      setSelectedSkillId('');
      setSuccess('Skill added successfully');
      loadSkills(); // Reload skills list in case new one was created
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to add skill');
    }
  };

  const handleRemoveSkill = async (skillId: number) => {
    try {
      setError('');
      await adminService.removeSkillFromMentor(parseInt(id!), skillId);
      setMentorSkills(prev => prev.filter(ms => ms.skill.id !== skillId));
      setSuccess('Skill removed successfully');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to remove skill');
    }
  };

  if (loading) {
    return (
      <div className="content-area">
        <div className="card">
          <div className="card-body" style={{ textAlign: 'center', padding: 'var(--space-xxl)' }}>
            Loading user...
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="content-area">
        <div className="card">
          <div className="card-body">
            <p>User not found</p>
            <button className="btn btn-outline mt-md" onClick={() => navigate('/admin/users')}>
              Back to Users
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="content-area">
      <div className="page-header">
        <div>
          <button className="btn btn-outline btn-sm" onClick={() => navigate('/admin/users')}>
            ← Back
          </button>
          <h1 className="page-title mt-sm">Edit User: {user.firstName} {user.lastName}</h1>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger mb-md">{error}</div>
      )}

      {success && (
        <div className="alert alert-success mb-md">{success}</div>
      )}

      {/* Tabs */}
      <div className="tabs mb-md">
        <button
          className={`tab ${activeTab === 'user' ? 'active' : ''}`}
          onClick={() => setActiveTab('user')}
        >
          User Details
        </button>
        {(user.role === 'MENTOR' || user.role === 'MENTEE') && (
          <button
            className={`tab ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            {user.role === 'MENTOR' ? 'Mentor' : 'Mentee'} Profile
          </button>
        )}
      </div>

      <div className="card">
        <div className="card-body">
          {activeTab === 'user' ? (
            <form onSubmit={handleUpdateUser} className="admin-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="firstName" className="form-label">First Name *</label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    className="form-input"
                    value={userData.firstName}
                    onChange={handleUserChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="lastName" className="form-label">Last Name *</label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    className="form-input"
                    value={userData.lastName}
                    onChange={handleUserChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="role" className="form-label">Role *</label>
                  <select
                    id="role"
                    name="role"
                    className="form-select"
                    value={userData.role}
                    onChange={handleUserChange}
                    required
                  >
                    <option value="MENTEE">Mentee</option>
                    <option value="MENTOR">Mentor</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="email" className="form-label">Email *</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    className="form-input"
                    value={userData.email}
                    onChange={handleUserChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="password" className="form-label">New Password (leave blank to keep current)</label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    className="form-input"
                    onChange={handleUserChange}
                    placeholder="Enter new password"
                  />
                </div>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => navigate('/admin/users')}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : 'Update User'}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleUpdateProfile} className="admin-form">
              {user.role === 'MENTOR' ? (
                <>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="title" className="form-label">Professional Title *</label>
                      <input
                        type="text"
                        id="title"
                        name="title"
                        className="form-input"
                        value={mentorProfile.title}
                        onChange={handleMentorChange}
                        required
                        placeholder="e.g., Senior Software Engineer"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="yearsExperience" className="form-label">Years of Experience *</label>
                      <input
                        type="number"
                        id="yearsExperience"
                        name="yearsExperience"
                        className="form-input"
                        value={mentorProfile.yearsExperience}
                        onChange={handleMentorChange}
                        required
                        min="0"
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="hourlyRate" className="form-label">Hourly Rate *</label>
                      <input
                        type="number"
                        id="hourlyRate"
                        name="hourlyRate"
                        className="form-input"
                        value={mentorProfile.hourlyRate}
                        onChange={handleMentorChange}
                        required
                        min="0"
                        step="0.01"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="currency" className="form-label">Currency</label>
                      <input
                        type="text"
                        id="currency"
                        name="currency"
                        className="form-input"
                        value={mentorProfile.currency}
                        onChange={handleMentorChange}
                        maxLength={3}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="bio" className="form-label">Bio *</label>
                    <textarea
                      id="bio"
                      name="bio"
                      className="form-textarea"
                      value={mentorProfile.bio}
                      onChange={handleMentorChange}
                      required
                      rows={5}
                      placeholder="Tell about your experience and expertise..."
                    />
                  </div>

                  {/* Skills Management */}
                  <div className="form-group">
                    <label className="form-label">Skills</label>
                    
                    {/* Current Skills */}
                    <div className="skills-list mb-md">
                      {mentorSkills.length > 0 ? (
                        mentorSkills.map((ms: any) => (
                          <div key={ms.skill.id} className="skill-chip">
                            <span>{ms.skill.name}</span>
                            <button
                              type="button"
                              className="skill-remove"
                              onClick={() => handleRemoveSkill(ms.skill.id)}
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
                </>
              ) : (
                <>
                  <div className="form-group">
                    <label htmlFor="bio" className="form-label">Bio</label>
                    <textarea
                      id="bio"
                      name="bio"
                      className="form-textarea"
                      value={menteeProfile.bio}
                      onChange={handleMenteeChange}
                      rows={5}
                      placeholder="Tell about yourself..."
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="goals" className="form-label">Learning Goals</label>
                    <textarea
                      id="goals"
                      name="goals"
                      className="form-textarea"
                      value={menteeProfile.goals}
                      onChange={handleMenteeChange}
                      rows={5}
                      placeholder="What do you want to learn?"
                    />
                  </div>
                </>
              )}

              <div className="form-actions">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setActiveTab('user')}
                  disabled={saving}
                >
                  Back to User Details
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : user.mentorProfile || user.menteeProfile ? 'Update Profile' : 'Create Profile'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
