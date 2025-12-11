import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../i18n/LanguageContext';
import { mentorService, MentorProfile } from '../../services/mentorService';
import { profileService } from '../../services/profileService';
import './Mentors.css';

export const Mentors: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [mentors, setMentors] = useState<MentorProfile[]>([]);
  const [skills, setSkills] = useState<Array<{ id: number; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    category: '',
    skill: '',
    rating: '',
    price: '',
    sort: 'rating',
  });

  // Load skills on mount
  useEffect(() => {
    const loadSkills = async () => {
      try {
        const result = await profileService.getSkills();
        setSkills(result.skills);
      } catch (err) {
        console.error('Failed to load skills:', err);
      }
    };
    loadSkills();
  }, []);

  // Fetch mentors from API
  useEffect(() => {
    const fetchMentors = async () => {
      setLoading(true);
      setError('');
      try {
        const params: any = {};
        
        if (filters.category) {
          params.category = filters.category;
        }
        
        if (filters.skill) {
          params.skill = filters.skill;
        }
        
        if (filters.rating) {
          params.rating = parseFloat(filters.rating);
        }
        
        if (filters.price) {
          if (filters.price === '0-50') {
            params.maxPrice = 50;
          } else if (filters.price === '50-100') {
            params.minPrice = 50;
            params.maxPrice = 100;
          } else if (filters.price === '100+') {
            params.minPrice = 100;
          }
        }

        const data = await mentorService.getMentors(params);
        setMentors(data);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to fetch mentors');
        console.error('Error fetching mentors:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMentors();
  }, [filters.category, filters.skill, filters.rating, filters.price]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    setFilters({
      category: '',
      skill: '',
      rating: '',
      price: '',
      sort: 'rating',
    });
  };

  // Sort mentors locally
  const sortedMentors = [...mentors].sort((a, b) => {
    if (filters.sort === 'rating') return (b.avgRating || 0) - (a.avgRating || 0);
    if (filters.sort === 'price-low') return (a.hourlyRate || 0) - (b.hourlyRate || 0);
    if (filters.sort === 'price-high') return (b.hourlyRate || 0) - (a.hourlyRate || 0);
    if (filters.sort === 'reviews') return (b.totalReviews || 0) - (a.totalReviews || 0);
    return 0;
  });

  // Helper function to get initials
  const getInitials = (mentor: MentorProfile) => {
    const firstName = mentor.user?.firstName || '';
    const lastName = mentor.user?.lastName || '';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <div className="content-area">
      <div className="page-header">
        <h1 className="page-title">{t.mentors.title}</h1>
        <p className="page-subtitle">{t.mentors.subtitle}</p>
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <div className="filter-item">
          <label className="form-label">{t.mentors.category}</label>
          <select
            className="form-select"
            value={filters.category}
            onChange={(e) => handleFilterChange('category', e.target.value)}
          >
            <option value="">{t.mentors.allCategories}</option>
            <option value="software">Software Development</option>
            <option value="data">Data Science</option>
            <option value="design">Design</option>
            <option value="product">Product Management</option>
            <option value="business">Business</option>
          </select>
        </div>

        <div className="filter-item">
          <label className="form-label">{t.mentors.skills}</label>
          <select
            className="form-select"
            value={filters.skill}
            onChange={(e) => handleFilterChange('skill', e.target.value)}
          >
            <option value="">{t.mentors.allSkills}</option>
            {skills.map(skill => (
              <option key={skill.id} value={skill.name}>{skill.name}</option>
            ))}
          </select>
        </div>

        <div className="filter-item">
          <label className="form-label">{t.mentors.minRating}</label>
          <select
            className="form-select"
            value={filters.rating}
            onChange={(e) => handleFilterChange('rating', e.target.value)}
          >
            <option value="">{t.mentors.anyRating}</option>
            <option value="4.5">4.5+ ⭐</option>
            <option value="4.0">4.0+ ⭐</option>
            <option value="3.5">3.5+ ⭐</option>
          </select>
        </div>

        <div className="filter-item">
          <label className="form-label">{t.mentors.priceRange}</label>
          <select
            className="form-select"
            value={filters.price}
            onChange={(e) => handleFilterChange('price', e.target.value)}
          >
            <option value="">{t.mentors.anyPrice}</option>
            <option value="0-50">$0 - $50/hr</option>
            <option value="50-100">$50 - $100/hr</option>
            <option value="100+">$100+/hr</option>
          </select>
        </div>

        <div className="filter-item" style={{ display: 'flex', alignItems: 'flex-end' }}>
          <button className="btn btn-outline" style={{ width: '100%' }} onClick={clearFilters}>
            {t.mentors.clearFilters}
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div style={{ textAlign: 'center', padding: 'var(--space-xl)', color: 'var(--neutral-600)' }}>
          Loading mentors...
        </div>
      )}

      {/* Error State */}
      {error && (
        <div style={{ 
          padding: 'var(--space-md)', 
          background: 'var(--danger-50)', 
          color: 'var(--danger-700)', 
          borderRadius: 'var(--radius-md)',
          marginBottom: 'var(--space-md)'
        }}>
          {error}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && sortedMentors.length === 0 && (
        <div style={{ textAlign: 'center', padding: 'var(--space-xl)', color: 'var(--neutral-600)' }}>
          No mentors found. Try adjusting your filters.
        </div>
      )}

      {/* Results Info */}
      {!loading && !error && sortedMentors.length > 0 && (
        <>
          <div className="flex-between mb-md">
            <div style={{ color: 'var(--neutral-600)' }}>
              {t.mentors.showing} <strong>{sortedMentors.length} {t.mentors.mentorsFound}</strong>
            </div>
            <div>
              <select
                className="form-select"
                style={{ width: 'auto' }}
                value={filters.sort}
                onChange={(e) => handleFilterChange('sort', e.target.value)}
              >
                <option value="rating">{t.mentors.sortBy}</option>
                <option value="price-low">{t.mentors.priceLowToHigh}</option>
                <option value="price-high">{t.mentors.priceHighToLow}</option>
                <option value="reviews">{t.mentors.mostReviews}</option>
              </select>
            </div>
          </div>

          {/* Mentor Grid */}
          <div className="grid grid-3">
            {sortedMentors.map((mentor) => (
              <div
                key={mentor.id}
                className="mentor-card"
                onClick={() => navigate(`/mentors/${mentor.id}`)}
              >
                <div className="mentor-card-header">
                  <div className="mentor-avatar-lg">{getInitials(mentor)}</div>
                  <div className="mentor-info">
                    <h3>{mentor.user?.firstName} {mentor.user?.lastName}</h3>
                    <div className="mentor-title">{mentor.title || 'Mentor'}</div>
                    <div className="mentor-rating">
                      ⭐ <strong>{mentor.avgRating?.toFixed(1) || '0.0'}</strong>{' '}
                      <span style={{ color: 'var(--neutral-500)' }}>
                        ({mentor.totalReviews || 0} {t.mentors.reviews})
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mentor-card-body">
                  <p className="mentor-bio">{mentor.bio || 'No bio available'}</p>

                  <div className="mentor-skills">
                    {mentor.skills?.map((skillRel) => (
                      <span key={skillRel.skill.id} className="skill-tag">
                        {skillRel.skill.name}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mentor-card-footer">
                  <div className="mentor-rate">${mentor.hourlyRate || 0}{t.mentors.perHour}</div>
                  <button className="btn btn-primary btn-sm">{t.common.viewProfile}</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Pagination */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          marginTop: 'var(--space-xl)',
          gap: 'var(--space-sm)',
        }}
      >
        <button className="btn btn-outline">← Previous</button>
        <button className="btn btn-primary">1</button>
        <button className="btn btn-outline">2</button>
        <button className="btn btn-outline">3</button>
        <button className="btn btn-outline">Next →</button>
      </div>
    </div>
  );
};
