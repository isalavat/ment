import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { Link } from 'react-router-dom';
import './Dashboard.css'

// Mock data
const mockStats = {
  totalSessions: 24,
  upcomingBookings: 3,
  favoriteMentors: 8,
  hoursLearned: 42
};

const mockUpcomingSessions = [
  {
    id: 1,
    mentor: { initials: 'SA', name: 'Sarah Anderson', title: 'Senior Frontend Developer' },
    topic: 'React Advanced Patterns',
    dateTime: 'Nov 25, 2025 - 10:00 AM',
    status: 'Confirmed'
  },
  {
    id: 2,
    mentor: { initials: 'MJ', name: 'Michael Johnson', title: 'Data Scientist' },
    topic: 'Machine Learning Basics',
    dateTime: 'Nov 26, 2025 - 2:00 PM',
    status: 'Pending'
  },
  {
    id: 3,
    mentor: { initials: 'EW', name: 'Emily Williams', title: 'UX Designer' },
    topic: 'Design System Review',
    dateTime: 'Nov 28, 2025 - 4:00 PM',
    status: 'Confirmed'
  }
];

const mockActivities = [
  {
    id: 1,
    type: 'completed',
    icon: '✓',
    color: 'var(--success-green)',
    title: 'Session Completed',
    description: 'React Performance Optimization with Sarah Anderson',
    time: '2 hours ago'
  },
  {
    id: 2,
    type: 'booking',
    icon: '📅',
    color: 'var(--primary-blue)',
    title: 'New Booking',
    description: 'Scheduled session with Michael Johnson',
    time: '1 day ago'
  },
  {
    id: 3,
    type: 'review',
    icon: '⭐',
    color: 'var(--warning-yellow)',
    title: 'Review Posted',
    description: 'You reviewed David Chen - 5 stars',
    time: '3 days ago'
  },
  {
    id: 4,
    type: 'favorite',
    icon: '❤️',
    color: 'var(--primary-blue)',
    title: 'Added to Favorites',
    description: 'Emily Williams added to your favorites',
    time: '5 days ago'
  }
];

const mockRecommendedMentors = [
  {
    id: 1,
    initials: 'DL',
    name: 'David Lee',
    title: 'Cloud Architect',
    skills: ['AWS', 'Kubernetes'],
    rate: 85,
    rating: 4.9
  },
  {
    id: 2,
    initials: 'LK',
    name: 'Lisa Kim',
    title: 'Product Manager',
    skills: ['Strategy', 'Agile'],
    rate: 90,
    rating: 5.0
  },
  {
    id: 3,
    initials: 'RP',
    name: 'Robert Patel',
    title: 'Security Engineer',
    skills: ['Security', 'DevSecOps'],
    rate: 95,
    rating: 4.8
  }
];

export const Dashboard: React.FC = () => {
    const { user } = useAuth();
    const { t } = useLanguage();

    return (
        <div className="content-area">
            <div className="page-header">
                <h1 className="page-title">{t.dashboard.title}</h1>
                <p className="page-subtitle">
                    {t.dashboard.subtitle.replace('{name}', user?.firstName || '')}
                </p>
            </div>

            {/* Stats Grid */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-label">{t.dashboard.stats.totalSessions}</div>
                    <div className="stat-value">{mockStats.totalSessions}</div>
                    <div className="stat-change positive">↑ 12% from last month</div>
                </div>

                <div className="stat-card">
                    <div className="stat-label">{t.dashboard.stats.upcomingBookings}</div>
                    <div className="stat-value">{mockStats.upcomingBookings}</div>
                    <div className="stat-change">{t.dashboard.stats.thisWeek}</div>
                </div>

                <div className="stat-card">
                    <div className="stat-label">{t.dashboard.stats.favoriteMentors}</div>
                    <div className="stat-value">{mockStats.favoriteMentors}</div>
                    <div className="stat-change">{t.dashboard.stats.activeConnections}</div>
                </div>

                <div className="stat-card">
                    <div className="stat-label">{t.dashboard.stats.hoursLearned}</div>
                    <div className="stat-value">{mockStats.hoursLearned}</div>
                    <div className="stat-change positive">↑ 8 {t.dashboard.stats.thisMonth}</div>
                </div>
            </div>

            {/* Upcoming Sessions */}
            <div className="card">
                <div className="card-header">
                    <h2 className="card-title">{t.dashboard.upcomingSessions}</h2>
                </div>
                <div className="card-body">
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>{t.dashboard.mentor}</th>
                                    <th>{t.dashboard.topic}</th>
                                    <th>{t.dashboard.dateTime}</th>
                                    <th>{t.dashboard.status}</th>
                                    <th>{t.dashboard.action}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {mockUpcomingSessions.map(session => (
                                    <tr key={session.id}>
                                        <td>
                                            <div className="flex gap-sm">
                                                <div className="user-avatar">{session.mentor.initials}</div>
                                                <div>
                                                    <div style={{ fontWeight: 500 }}>{session.mentor.name}</div>
                                                    <div style={{ fontSize: '12px', color: 'var(--neutral-600)' }}>
                                                        {session.mentor.title}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>{session.topic}</td>
                                        <td>{session.dateTime}</td>
                                        <td>
                                            <span className={`badge ${session.status === 'Confirmed' ? 'badge-success' : 'badge-warning'}`}>
                                                {session.status === 'Confirmed' ? t.dashboard.confirmed : t.dashboard.pending}
                                            </span>
                                        </td>
                                        <td>
                                            <button className={`btn btn-sm ${session.status === 'Confirmed' ? 'btn-primary' : 'btn-outline'}`}>
                                                {session.status === 'Confirmed' ? t.dashboard.joinMeeting : t.common.viewDetails}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Recent Activity & Recommended Mentors */}
            <div className="grid grid-2">
                {/* Recent Activity */}
                <div className="card">
                    <div className="card-header">
                        <h2 className="card-title">{t.dashboard.recentActivity}</h2>
                    </div>
                    <div className="card-body">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                            {mockActivities.map(activity => (
                                <div 
                                    key={activity.id}
                                    style={{ 
                                        display: 'flex', 
                                        gap: 'var(--space-md)', 
                                        padding: 'var(--space-sm)', 
                                        borderLeft: `3px solid ${activity.color}` 
                                    }}
                                >
                                    <div style={{ color: activity.color }}>{activity.icon}</div>
                                    <div>
                                        <div style={{ fontWeight: 500 }}>{activity.title}</div>
                                        <div style={{ fontSize: '12px', color: 'var(--neutral-600)' }}>
                                            {activity.description}
                                        </div>
                                        <div style={{ fontSize: '11px', color: 'var(--neutral-500)', marginTop: '4px' }}>
                                            {activity.time}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Recommended Mentors */}
                <div className="card">
                    <div className="card-header">
                        <h2 className="card-title">{t.dashboard.recommendedForYou}</h2>
                    </div>
                    <div className="card-body">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                            {mockRecommendedMentors.map(mentor => (
                                <div 
                                    key={mentor.id}
                                    style={{ 
                                        display: 'flex', 
                                        gap: 'var(--space-md)', 
                                        padding: 'var(--space-sm)', 
                                        background: 'var(--neutral-50)', 
                                        borderRadius: 'var(--radius-sm)' 
                                    }}
                                >
                                    <div className="user-avatar">{mentor.initials}</div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 500 }}>{mentor.name}</div>
                                        <div style={{ fontSize: '12px', color: 'var(--neutral-600)' }}>
                                            {mentor.title}
                                        </div>
                                        <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                                            {mentor.skills.map((skill, idx) => (
                                                <span key={idx} className="skill-tag">{skill}</span>
                                            ))}
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontWeight: 600, color: 'var(--neutral-900)' }}>
                                            ${mentor.rate}/hr
                                        </div>
                                        <div style={{ fontSize: '12px', color: 'var(--warning-yellow)' }}>
                                            ★ {mentor.rating}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-md">
                            <Link to="/mentors" className="btn btn-outline" style={{ width: '100%', justifyContent: 'center' }}>
                                {t.dashboard.browseAllMentors}
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}