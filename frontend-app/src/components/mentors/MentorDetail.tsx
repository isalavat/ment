import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../i18n/LanguageContext';
import { mentorService, MentorProfile } from '../../services/mentorService';
import './Mentors.css';

export const MentorDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [mentor, setMentor] = useState<MentorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchMentor = async () => {
      if (!id) return;
      
      setLoading(true);
      setError('');
      try {
        const data = await mentorService.getMentorById(parseInt(id));
        setMentor(data);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to fetch mentor details');
        console.error('Error fetching mentor:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMentor();
  }, [id]);

  const getInitials = (mentor: MentorProfile) => {
    const firstName = mentor.user?.firstName || '';
    const lastName = mentor.user?.lastName || '';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  if (loading) {
    return (
      <div className="content-area">
        <div style={{ textAlign: 'center', padding: 'var(--space-xl)', color: 'var(--neutral-600)' }}>
          Loading mentor profile...
        </div>
      </div>
    );
  }

  if (error || !mentor) {
    return (
      <div className="content-area">
        <div style={{ 
          padding: 'var(--space-md)', 
          background: 'var(--danger-50)', 
          color: 'var(--danger-700)', 
          borderRadius: 'var(--radius-md)',
          marginBottom: 'var(--space-md)'
        }}>
          {error || 'Mentor not found'}
        </div>
        <button className="btn btn-outline" onClick={() => navigate('/mentors')}>
          ← Back to Mentors
        </button>
      </div>
    );
  }

  return (
    <div className="content-area">
      <div style={{ marginBottom: 'var(--space-md)' }}>
        <a 
          onClick={() => navigate('/mentors')} 
          style={{ 
            color: 'var(--neutral-600)', 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: 'var(--space-xs)',
            cursor: 'pointer',
            textDecoration: 'none'
          }}
        >
          ← Back to Mentors
        </a>
      </div>

      {/* Profile Header Card */}
      <div className="card">
        <div style={{ display: 'flex', gap: 'var(--space-xl)', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 'var(--space-lg)', alignItems: 'start' }}>
            <div className="mentor-avatar-xl">{getInitials(mentor)}</div>
            
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', gap: 'var(--space-md)', flexWrap: 'wrap' }}>
                <div>
                  <h1 style={{ fontSize: 'var(--font-size-xxl)', marginBottom: 'var(--space-xs)' }}>
                    {mentor.user?.firstName} {mentor.user?.lastName}
                  </h1>
                  <p style={{ fontSize: 'var(--font-size-lg)', color: 'var(--neutral-600)', marginBottom: 'var(--space-sm)' }}>
                    {mentor.title || 'Mentor'}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', marginBottom: 'var(--space-md)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
                      <span style={{ color: 'var(--warning-yellow)', fontSize: '20px' }}>⭐</span>
                      <span style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600 }}>{mentor.avgRating?.toFixed(1) || '0.0'}</span>
                      <span style={{ color: 'var(--neutral-500)' }}>({mentor.totalReviews || 0} reviews)</span>
                    </div>
                    {mentor.yearsExperience && (
                      <>
                        <span style={{ color: 'var(--neutral-400)' }}>|</span>
                        <div>
                          <span style={{ fontWeight: 600 }}>{mentor.yearsExperience}</span> years experience
                        </div>
                      </>
                    )}
                  </div>
                  
                  <div style={{ display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
                    <button className="btn btn-primary btn-lg">
                      📅 Book Session
                    </button>
                    <button className="btn btn-outline btn-lg">
                      ❤️ Add to Favorites
                    </button>
                    <button className="btn btn-outline btn-lg">
                      💬 Message
                    </button>
                  </div>
                </div>
                
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 'var(--font-size-xxl)', fontWeight: 600, color: 'var(--primary-blue)' }}>
                    ${mentor.hourlyRate || 0}<span style={{ fontSize: 'var(--font-size-base)', fontWeight: 400, color: 'var(--neutral-600)' }}>/hour</span>
                  </div>
                  <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--neutral-500)' }}>{mentor.currency || 'USD'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-3">
        <div style={{ gridColumn: 'span 2' }}>
          {/* About Card */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">About</h2>
            </div>
            <div className="card-body">
              <p style={{ lineHeight: 1.8 }}>
                {mentor.bio || 'No bio available'}
              </p>
            </div>
          </div>

          {/* Skills & Expertise Card */}
          {mentor.skills && mentor.skills.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Skills & Expertise</h2>
              </div>
              <div className="card-body">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-sm)' }}>
                  {mentor.skills.map((skillRel) => (
                    <span key={skillRel.skill.id} className="badge badge-primary" style={{ padding: 'var(--space-sm) var(--space-md)', fontSize: 'var(--font-size-sm)' }}>
                      {skillRel.skill.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Reviews Card */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Reviews ({mentor.totalReviews || 0})</h2>
            </div>
            <div className="card-body">
              <div style={{ textAlign: 'center', color: 'var(--neutral-500)', padding: 'var(--space-xl)' }}>
                No reviews yet
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div>
          {/* Stats Card */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Stats</h2>
            </div>
            <div className="card-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                <div>
                  <div style={{ color: 'var(--neutral-500)', fontSize: 'var(--font-size-sm)', marginBottom: '4px' }}>Response Time</div>
                  <div style={{ fontWeight: 600, fontSize: 'var(--font-size-md)' }}>Within 24 hours</div>
                </div>
                
                <div>
                  <div style={{ color: 'var(--neutral-500)', fontSize: 'var(--font-size-sm)', marginBottom: '4px' }}>Total Sessions</div>
                  <div style={{ fontWeight: 600, fontSize: 'var(--font-size-md)' }}>{mentor.totalReviews || 0}+</div>
                </div>
                
                <div>
                  <div style={{ color: 'var(--neutral-500)', fontSize: 'var(--font-size-sm)', marginBottom: '4px' }}>Hourly Rate</div>
                  <div style={{ fontWeight: 600, fontSize: 'var(--font-size-md)' }}>${mentor.hourlyRate || 0}/{mentor.currency || 'USD'}</div>
                </div>
                
                <div>
                  <div style={{ color: 'var(--neutral-500)', fontSize: 'var(--font-size-sm)', marginBottom: '4px' }}>Contact</div>
                  <div style={{ fontWeight: 600, fontSize: 'var(--font-size-md)', wordBreak: 'break-all' }}>{mentor.user?.email}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Categories Card */}
          {mentor.categories && mentor.categories.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Categories</h2>
              </div>
              <div className="card-body">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
                  {mentor.categories.map((catRel) => (
                    <div key={catRel.category.id} style={{ 
                      padding: 'var(--space-sm)',
                      background: 'var(--neutral-50)',
                      borderRadius: 'var(--radius-sm)',
                      fontWeight: 500
                    }}>
                      {catRel.category.name}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
