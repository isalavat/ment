import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../i18n/LanguageContext';
import './Mentors.css';

// Mock data
const mockMentors = [
  {
    id: 1,
    initials: 'SA',
    name: 'Sarah Anderson',
    title: 'Senior Frontend Developer',
    bio: '10+ years building scalable web applications. Specialized in React, TypeScript, and modern frontend architecture.',
    skills: ['React', 'TypeScript', 'Next.js', 'CSS'],
    rating: 4.9,
    reviews: 127,
    rate: 75,
    category: 'software',
  },
  {
    id: 2,
    initials: 'MJ',
    name: 'Michael Johnson',
    title: 'Data Scientist',
    bio: 'PhD in ML, helping professionals transition into data science. Expert in Python, TensorFlow, and statistical analysis.',
    skills: ['Python', 'ML', 'TensorFlow', 'Statistics'],
    rating: 4.8,
    reviews: 93,
    rate: 95,
    category: 'data',
  },
  {
    id: 3,
    initials: 'EW',
    name: 'Emily Williams',
    title: 'Senior UX Designer',
    bio: 'Award-winning designer with 12 years experience. Passionate about creating user-centered designs that drive business results.',
    skills: ['Figma', 'UX Research', 'Prototyping', 'Design Systems'],
    rating: 5.0,
    reviews: 156,
    rate: 85,
    category: 'design',
  },
  {
    id: 4,
    initials: 'DC',
    name: 'David Chen',
    title: 'DevOps Engineer',
    bio: 'Cloud infrastructure expert. Helping teams implement CI/CD pipelines and scale their applications on AWS and Azure.',
    skills: ['AWS', 'Docker', 'Kubernetes', 'Terraform'],
    rating: 4.7,
    reviews: 84,
    rate: 90,
    category: 'software',
  },
  {
    id: 5,
    initials: 'JM',
    name: 'Jennifer Martinez',
    title: 'Product Manager',
    bio: 'Led product teams at Fortune 500 companies. Teaching product strategy, roadmapping, and stakeholder management.',
    skills: ['Product Strategy', 'Agile', 'Analytics', 'Roadmapping'],
    rating: 4.9,
    reviews: 112,
    rate: 100,
    category: 'product',
  },
  {
    id: 6,
    initials: 'RT',
    name: 'Robert Taylor',
    title: 'Backend Architect',
    bio: '15 years designing scalable backend systems. Expert in microservices, databases, and distributed systems architecture.',
    skills: ['Node.js', 'PostgreSQL', 'Redis', 'Microservices'],
    rating: 4.8,
    reviews: 98,
    rate: 110,
    category: 'software',
  },
  {
    id: 7,
    initials: 'AM',
    name: 'Anna Miller',
    title: 'Mobile Developer',
    bio: 'iOS and Android expert. Published 20+ apps with millions of downloads. Teaching Swift, Kotlin, and React Native.',
    skills: ['Swift', 'Kotlin', 'React Native', 'Firebase'],
    rating: 4.9,
    reviews: 145,
    rate: 80,
    category: 'software',
  },
  {
    id: 8,
    initials: 'KB',
    name: 'Kevin Brown',
    title: 'Security Engineer',
    bio: 'Cybersecurity specialist with focus on application security, penetration testing, and secure coding practices.',
    skills: ['Security', 'Pentesting', 'OWASP', 'Compliance'],
    rating: 4.7,
    reviews: 76,
    rate: 105,
    category: 'software',
  },
  {
    id: 9,
    initials: 'LG',
    name: 'Lisa Garcia',
    title: 'Technical Writer',
    bio: 'Creating clear, comprehensive documentation for technical products. Expert in API docs, user guides, and content strategy.',
    skills: ['Documentation', 'API Docs', 'Markdown', 'Content'],
    rating: 5.0,
    reviews: 89,
    rate: 65,
    category: 'other',
  },
];

export const Mentors: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [filters, setFilters] = useState({
    category: '',
    skill: '',
    rating: '',
    price: '',
    sort: 'rating',
  });

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

  // Filter mentors based on selected filters
  const filteredMentors = mockMentors.filter((mentor) => {
    if (filters.category && mentor.category !== filters.category) return false;
    if (filters.rating && mentor.rating < parseFloat(filters.rating)) return false;
    if (filters.price) {
      if (filters.price === '0-50' && mentor.rate > 50) return false;
      if (filters.price === '50-100' && (mentor.rate < 50 || mentor.rate > 100)) return false;
      if (filters.price === '100+' && mentor.rate < 100) return false;
    }
    return true;
  });

  // Sort mentors
  const sortedMentors = [...filteredMentors].sort((a, b) => {
    if (filters.sort === 'rating') return b.rating - a.rating;
    if (filters.sort === 'price-low') return a.rate - b.rate;
    if (filters.sort === 'price-high') return b.rate - a.rate;
    if (filters.sort === 'reviews') return b.reviews - a.reviews;
    return 0;
  });

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
            <option value="react">React</option>
            <option value="python">Python</option>
            <option value="aws">AWS</option>
            <option value="figma">Figma</option>
            <option value="ml">Machine Learning</option>
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

      {/* Results Info */}
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
              <div className="mentor-avatar-lg">{mentor.initials}</div>
              <div className="mentor-info">
                <h3>{mentor.name}</h3>
                <div className="mentor-title">{mentor.title}</div>
                <div className="mentor-rating">
                  ⭐ <strong>{mentor.rating}</strong>{' '}
                  <span style={{ color: 'var(--neutral-500)' }}>({mentor.reviews} {t.mentors.reviews})</span>
                </div>
              </div>
            </div>

            <div className="mentor-card-body">
              <p className="mentor-bio">{mentor.bio}</p>

              <div className="mentor-skills">
                {mentor.skills.map((skill, idx) => (
                  <span key={idx} className="skill-tag">
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <div className="mentor-card-footer">
              <div className="mentor-rate">${mentor.rate}{t.mentors.perHour}</div>
              <button className="btn btn-primary btn-sm">{t.common.viewProfile}</button>
            </div>
          </div>
        ))}
      </div>

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
