import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminService, CreateUserData, CreateMentorProfileData, CreateMenteeProfileData } from '../../services/adminService';
import { useLanguage } from '../../i18n/LanguageContext';
import './AdminUsers.css';

export const AdminCreateUser: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'user' | 'profile'>('user');
  const [createdUserId, setCreatedUserId] = useState<string | null>(null);

  const [userData, setUserData] = useState<CreateUserData>({
    email: '',
    password: '',
    role: 'MENTEE',
    firstName: '',
    lastName: '',
    avatarUrl: ''
  });

  const [mentorProfile, setMentorProfile] = useState<CreateMentorProfileData>({
    bio: '',
    title: '',
    yearsExperience: 0,
    hourlyRate: 0,
    currency: 'USD'
  });

  const [menteeProfile, setMenteeProfile] = useState<CreateMenteeProfileData>({
    bio: '',
    goals: ''
  });

  const handleUserChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setUserData(prev => ({ ...prev, [name]: value }));
  };

  const handleMentorChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setMentorProfile(prev => ({ ...prev, [name]: name === 'yearsExperience' || name === 'hourlyRate' ? parseFloat(value) : value }));
  };

  const handleMenteeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setMenteeProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError('');
      
      const user = await adminService.createUser(userData);
      setCreatedUserId(user.id);
      
      if (userData.role === 'ADMIN') {
        // No profile needed for admin
        navigate('/admin/users');
        return;
      }
      
      // Move to profile creation step
      setStep('profile');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!createdUserId) return;
    
    try {
      setLoading(true);
      setError('');
      
      if (userData.role === 'MENTOR') {
        await adminService.createMentorProfile(createdUserId, mentorProfile);
      } else if (userData.role === 'MENTEE') {
        await adminService.createMenteeProfile(createdUserId, menteeProfile);
      }
      
      navigate('/admin/users');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSkipProfile = () => {
    navigate('/admin/users');
  };

  return (
    <div className="content-area">
      <div className="page-header">
        <div>
          <button className="btn btn-outline btn-sm" onClick={() => navigate('/admin/users')}>
            ← Back
          </button>
          <h1 className="page-title mt-sm">Create New User</h1>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger mb-md">{error}</div>
      )}

      <div className="card">
        <div className="card-body">
          {/* Step Indicator */}
          <div className="step-indicator mb-lg">
            <div className={`step ${step === 'user' ? 'active' : 'completed'}`}>
              <div className="step-number">1</div>
              <div className="step-label">User Details</div>
            </div>
            <div className="step-line"></div>
            <div className={`step ${step === 'profile' ? 'active' : ''}`}>
              <div className="step-number">2</div>
              <div className="step-label">Profile (Optional)</div>
            </div>
          </div>

          {step === 'user' ? (
            <form onSubmit={handleCreateUser} className="admin-form">
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
              </div>

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
                <label htmlFor="password" className="form-label">Password *</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  className="form-input"
                  value={userData.password}
                  onChange={handleUserChange}
                  required
                  minLength={6}
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

              <div className="form-group">
                <label htmlFor="avatarUrl" className="form-label">Avatar URL (optional)</label>
                <input
                  type="url"
                  id="avatarUrl"
                  name="avatarUrl"
                  className="form-input"
                  value={userData.avatarUrl}
                  onChange={handleUserChange}
                  placeholder="https://example.com/avatar.jpg"
                />
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => navigate('/admin/users')}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Creating...' : 'Next: Create Profile'}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleCreateProfile} className="admin-form">
              <h3 className="mb-md">
                {userData.role === 'MENTOR' ? 'Mentor Profile' : 'Mentee Profile'}
              </h3>

              {userData.role === 'MENTOR' ? (
                <>
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

                  <div className="form-row">
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
                  onClick={handleSkipProfile}
                  disabled={loading}
                >
                  Skip Profile
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Creating...' : 'Create Profile & Finish'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
