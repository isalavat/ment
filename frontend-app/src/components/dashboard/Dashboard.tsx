import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { Link, useNavigate } from 'react-router-dom';
import { bookingService } from '../../services/bookingService';
import { mentorService } from '../../services/mentorService';
import { Booking } from '../../types/booking';
import { MentorProfile } from '../../services/mentorService';
import './Dashboard.css'

export const Dashboard: React.FC = () => {
    const { user } = useAuth();
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [recommendedMentors, setRecommendedMentors] = useState<MentorProfile[]>([]);
    
    const isMentor = !!user?.mentorProfileId;
    const isMentee = !!user?.menteeProfileId;

    useEffect(() => {
        fetchDashboardData();
    }, [user]);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            // Fetch bookings based on role
            let bookingsData: Booking[] = [];
            if (isMentor && user?.mentorProfileId) {
                bookingsData = await bookingService.getBookingsForMentor(user.mentorProfileId);
            } else if (isMentee && user?.menteeProfileId) {
                bookingsData = await bookingService.getBookingsForMentee(user.menteeProfileId);
            }
            setBookings(bookingsData);

            // Fetch recommended mentors (only for mentees)
            if (isMentee) {
                const response = await mentorService.getMentors();
                setRecommendedMentors(response.mentors.slice(0, 3)); // Top 3 mentors
            }
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    // Calculate stats
    const now = new Date();
    const upcomingBookings = bookings
        .filter(b => {
            if (!b.timeSlot) return false;
            const hasValidStatus = b.status === 'PENDING' || b.status === 'CONFIRMED';
            // Check if session hasn't ended yet (use endTime instead of startTime)
            const hasNotEnded = new Date(b.timeSlot.endTime) > now;
            return hasValidStatus && hasNotEnded;
        })
        .sort((a, b) => new Date(a.timeSlot!.startTime).getTime() - new Date(b.timeSlot!.startTime).getTime());
    
    const completedSessions = bookings.filter(b => b.status === 'COMPLETED');
    
    // Sessions that are past but still marked as CONFIRMED (not completed yet)
    const pastConfirmedSessions = bookings.filter(b => 
        b.timeSlot &&
        b.status === 'CONFIRMED' &&
        new Date(b.timeSlot.endTime) < now
    ).sort((a, b) => new Date(b.timeSlot!.startTime).getTime() - new Date(a.timeSlot!.startTime).getTime());
    
    // Combine completed and past confirmed for "Recent Sessions"
    const recentSessions = [...completedSessions, ...pastConfirmedSessions]
        .sort((a, b) => new Date(b.timeSlot!.startTime).getTime() - new Date(a.timeSlot!.startTime).getTime());
    
    const pendingSessions = bookings.filter(b => b.status === 'PENDING');
    
    const totalHours = completedSessions.reduce((acc, b) => acc + (b.duration / 60), 0);

    const getInitials = (firstName?: string, lastName?: string) => {
        return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
    };

    const formatDateTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    };

    const canJoinMeeting = (booking: Booking) => {
        if (booking.status !== 'CONFIRMED' || !booking.meetingLink) return false;
        
        const now = new Date();
        const startTime = new Date(booking.timeSlot?.startTime || '');
        const endTime = new Date(booking.timeSlot?.endTime || '');
        
        // Allow joining 15 minutes before and during the session
        const joinableTime = new Date(startTime.getTime() - 15 * 60 * 1000);
        
        return now >= joinableTime && now <= endTime;
    };

    return (
        <div className="content-area">
            <div className="page-header">
                <h1 className="page-title">{t.dashboard.title}</h1>
                <p className="page-subtitle">
                    {t.dashboard.subtitle.replace('{name}', user?.firstName || '')}
                </p>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: 'var(--space-xl)', color: 'var(--neutral-600)' }}>
                    Loading dashboard...
                </div>
            ) : (
                <>
                    {/* Stats Grid */}
                    <div className="stats-grid">
                        <div className="stat-card">
                            <div className="stat-label">{t.dashboard.stats.totalSessions}</div>
                            <div className="stat-value">{bookings.length}</div>
                            <div className="stat-change">{completedSessions.length} completed</div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-label">{t.dashboard.stats.upcomingBookings}</div>
                            <div className="stat-value">{upcomingBookings.length}</div>
                            <div className="stat-change">{pendingSessions.length} pending</div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-label">{isMentor ? 'My Mentees' : t.dashboard.stats.favoriteMentors}</div>
                            <div className="stat-value">{isMentor ? new Set(bookings.map(b => b.menteeId)).size : '-'}</div>
                            <div className="stat-change">{t.dashboard.stats.activeConnections}</div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-label">{t.dashboard.stats.hoursLearned}</div>
                            <div className="stat-value">{Math.round(totalHours)}</div>
                            <div className="stat-change">total hours</div>
                        </div>
                    </div>

                    {/* Upcoming Sessions */}
                    <div className="card">
                        <div className="card-header">
                            <h2 className="card-title">{t.dashboard.upcomingSessions}</h2>
                        </div>
                        <div className="card-body">
                            {upcomingBookings.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: 'var(--space-lg)', color: 'var(--neutral-600)' }}>
                                    No upcoming sessions. {!isMentor && <Link to="/mentors">Browse mentors</Link>}
                                </div>
                            ) : (
                                <div className="table-container">
                                    <table className="table">
                                        <thead>
                                            <tr>
                                                <th>{isMentor ? 'Mentee' : t.dashboard.mentor}</th>
                                                <th>{t.dashboard.topic}</th>
                                                <th>{t.dashboard.dateTime}</th>
                                                <th>{t.dashboard.status}</th>
                                                <th>{t.dashboard.action}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {upcomingBookings.slice(0, 5).map(booking => {
                                                const person = isMentor ? booking.mentee : booking.mentor;
                                                return (
                                                    <tr key={booking.id}>
                                                        <td>
                                                            <div className="flex gap-sm">
                                                                <div className="user-avatar">
                                                                    {getInitials(person?.user?.firstName, person?.user?.lastName)}
                                                                </div>
                                                                <div>
                                                                    <div style={{ fontWeight: 500 }}>
                                                                        {person?.user?.firstName} {person?.user?.lastName}
                                                                    </div>
                                                                    <div style={{ fontSize: '12px', color: 'var(--neutral-600)' }}>
                                                                        {isMentor ? person?.user?.email : booking.mentor?.title}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td>{booking.notes || '-'}</td>
                                                        <td>{formatDateTime(booking.timeSlot?.startTime || '')}</td>
                                                        <td>
                                                            <span className={`badge ${booking.status === 'CONFIRMED' ? 'badge-success' : 'badge-warning'}`}>
                                                                {booking.status === 'CONFIRMED' ? t.dashboard.confirmed : t.dashboard.pending}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            {canJoinMeeting(booking) ? (
                                                                <button 
                                                                    className="btn btn-sm btn-primary"
                                                                    onClick={() => window.open(booking.meetingLink, '_blank')}
                                                                >
                                                                    {t.dashboard.joinMeeting}
                                                                </button>
                                                            ) : (
                                                                <button 
                                                                    className="btn btn-sm btn-outline"
                                                                    onClick={() => navigate(`/bookings/${booking.id}`)}
                                                                >
                                                                    {t.common.viewDetails}
                                                                </button>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Recent Sessions */}
                    <div className="card">
                        <div className="card-header">
                            <h2 className="card-title">Recent Sessions</h2>
                            <Link to="/bookings" className="btn btn-sm btn-outline">View All</Link>
                        </div>
                        <div className="card-body">
                            {recentSessions.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: 'var(--space-lg)', color: 'var(--neutral-600)' }}>
                                    No recent sessions yet
                                </div>
                            ) : (
                                <div className="table-container">
                                    <table className="table">
                                        <thead>
                                            <tr>
                                                <th>{isMentor ? 'Mentee' : 'Mentor'}</th>
                                                <th>Topic</th>
                                                <th>Date</th>
                                                <th>Duration</th>
                                                <th>Status</th>
                                                <th>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {recentSessions.slice(0, 5).map(booking => {
                                                const person = isMentor ? booking.mentee : booking.mentor;
                                                const isPastConfirmed = booking.status === 'CONFIRMED' && 
                                                    booking.timeSlot && 
                                                    new Date(booking.timeSlot.endTime) < now;
                                                return (
                                                    <tr key={booking.id}>
                                                        <td>
                                                            <div className="flex gap-sm">
                                                                <div className="user-avatar">
                                                                    {getInitials(person?.user?.firstName, person?.user?.lastName)}
                                                                </div>
                                                                <div>
                                                                    <div style={{ fontWeight: 500 }}>
                                                                        {person?.user?.firstName} {person?.user?.lastName}
                                                                    </div>
                                                                    <div style={{ fontSize: '12px', color: 'var(--neutral-600)' }}>
                                                                        {isMentor ? person?.user?.email : booking.mentor?.title}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td>{booking.notes || '-'}</td>
                                                        <td>{formatDateTime(booking.timeSlot?.startTime || '')}</td>
                                                        <td>{booking.duration} min</td>
                                                        <td>
                                                            {isPastConfirmed ? (
                                                                <span className="badge badge-warning">
                                                                    Needs Completion
                                                                </span>
                                                            ) : (
                                                                <span className="badge badge-success">
                                                                    Completed
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td>
                                                            <button 
                                                                className="btn btn-sm btn-outline"
                                                                onClick={() => navigate(`/bookings/${booking.id}`)}
                                                            >
                                                                {isPastConfirmed ? 'Complete' : 'View Details'}
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
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
                        {bookings.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: 'var(--space-lg)', color: 'var(--neutral-600)' }}>
                                No activity yet
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                                {bookings.slice(0, 5).map(booking => {
                                    const person = isMentor ? booking.mentee : booking.mentor;
                                    let icon = '📅';
                                    let color = 'var(--primary-blue)';
                                    let title = 'Booking';
                                    
                                    if (booking.status === 'COMPLETED') {
                                        icon = '✓';
                                        color = 'var(--success-green)';
                                        title = 'Session Completed';
                                    } else if (booking.status === 'CONFIRMED') {
                                        icon = '✓';
                                        color = 'var(--success-green)';
                                        title = 'Booking Confirmed';
                                    } else if (booking.status.includes('CANCELLED')) {
                                        icon = '✕';
                                        color = 'var(--danger-red)';
                                        title = 'Booking Cancelled';
                                    }
                                    
                                    return (
                                        <div 
                                            key={booking.id}
                                            style={{ 
                                                display: 'flex', 
                                                gap: 'var(--space-md)', 
                                                padding: 'var(--space-sm)', 
                                                borderLeft: `3px solid ${color}`,
                                                cursor: 'pointer'
                                            }}
                                            onClick={() => navigate(`/bookings/${booking.id}`)}
                                        >
                                            <div style={{ color }}>{icon}</div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: 500 }}>{title}</div>
                                                <div style={{ fontSize: '12px', color: 'var(--neutral-600)' }}>
                                                    {isMentor ? 'Session with ' : 'Session with '}
                                                    {person?.user?.firstName} {person?.user?.lastName}
                                                </div>
                                                <div style={{ fontSize: '11px', color: 'var(--neutral-500)', marginTop: '4px' }}>
                                                    {new Date(booking.createdAt).toLocaleDateString()}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Recommended Mentors */}
                {!isMentor && (
                    <div className="card">
                        <div className="card-header">
                            <h2 className="card-title">{t.dashboard.recommendedForYou}</h2>
                        </div>
                        <div className="card-body">
                            {recommendedMentors.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: 'var(--space-lg)', color: 'var(--neutral-600)' }}>
                                    No mentors available
                                </div>
                            ) : (
                                <>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                                        {recommendedMentors.map(mentor => (
                                            <div 
                                                key={mentor.id}
                                                style={{ 
                                                    display: 'flex', 
                                                    gap: 'var(--space-md)', 
                                                    padding: 'var(--space-sm)', 
                                                    background: 'var(--neutral-50)', 
                                                    borderRadius: 'var(--radius-sm)',
                                                    cursor: 'pointer'
                                                }}
                                                onClick={() => navigate(`/mentors/${mentor.id}`)}
                                            >
                                                <div className="user-avatar">
                                                    {getInitials(mentor.user?.firstName, mentor.user?.lastName)}
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontWeight: 500 }}>
                                                        {mentor.user?.firstName} {mentor.user?.lastName}
                                                    </div>
                                                    <div style={{ fontSize: '12px', color: 'var(--neutral-600)' }}>
                                                        {mentor.title}
                                                    </div>
                                                    <div style={{ display: 'flex', gap: '4px', marginTop: '4px', flexWrap: 'wrap' }}>
                                                        {mentor.skills?.slice(0, 2).map((skillRel) => (
                                                            <span key={skillRel.skill.id} className="skill-tag">
                                                                {skillRel.skill.name}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    <div style={{ fontWeight: 600, color: 'var(--neutral-900)' }}>
                                                        ${mentor.hourlyRate || 0}/hr
                                                    </div>
                                                    <div style={{ fontSize: '12px', color: 'var(--warning-yellow)' }}>
                                                        ★ {mentor.avgRating?.toFixed(1) || '0.0'}
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
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </>
    )}
</div>
    );
};