import React, { useState, useEffect, useCallback } from "react";
import {
  CalendarClock,
  CircleCheckBig,
  CircleSlash,
  LayoutDashboard,
  Sparkles,
  Users,
  Wallet,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage } from "../../i18n/LanguageContext";
import { Link, useNavigate } from "react-router-dom";
import { bookingService } from "../../services/bookingService";
import { mentorService } from "../../services/mentorService";
import { Booking } from "../../types/booking";
import { MentorProfile } from "../../services/mentorService";
import { PageShell } from "../common/PageShell";
import "./Dashboard.css";

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [recommendedMentors, setRecommendedMentors] = useState<MentorProfile[]>(
    [],
  );

  const isMentor = user?.role === "MENTOR" || !!user?.mentorProfileId;

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch bookings based on role
      let bookingsData: Booking[] = [];
      if (isMentor && user?.mentorProfileId) {
        bookingsData = await bookingService.getBookingsForMentor(
          user.mentorProfileId,
        );
      } else if (user?.id) {
        bookingsData = await bookingService.getBookingsForMentee(user.id);
      }
      setBookings(bookingsData);

      // Fetch recommended mentors (only for non-mentors)
      if (!isMentor) {
        const response = await mentorService.getMentors();
        setRecommendedMentors(response.mentors.slice(0, 3)); // Top 3 mentors
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }, [isMentor, user?.mentorProfileId, user?.id]);

  useEffect(() => {
    void fetchDashboardData();
  }, [fetchDashboardData]);

  // Calculate stats
  const now = new Date();
  const upcomingBookings = bookings
    .filter((b) => {
      if (!b.timeSlot) return false;
      const hasValidStatus = b.status === "PENDING" || b.status === "CONFIRMED";
      // Check if session hasn't ended yet (use endTime instead of startTime)
      const hasNotEnded = new Date(b.timeSlot.endTime) > now;
      return hasValidStatus && hasNotEnded;
    })
    .sort(
      (a, b) =>
        new Date(a.timeSlot!.startTime).getTime() -
        new Date(b.timeSlot!.startTime).getTime(),
    );

  const completedSessions = bookings.filter((b) => b.status === "COMPLETED");

  // Sessions that are past but still marked as CONFIRMED (not completed yet)
  const pastConfirmedSessions = bookings
    .filter(
      (b) =>
        b.timeSlot &&
        b.status === "CONFIRMED" &&
        new Date(b.timeSlot.endTime) < now,
    )
    .sort(
      (a, b) =>
        new Date(b.timeSlot!.startTime).getTime() -
        new Date(a.timeSlot!.startTime).getTime(),
    );

  // Combine completed and past confirmed for "Recent Sessions"
  const recentSessions = [...completedSessions, ...pastConfirmedSessions].sort(
    (a, b) =>
      new Date(b.timeSlot!.startTime).getTime() -
      new Date(a.timeSlot!.startTime).getTime(),
  );

  const pendingSessions = bookings.filter((b) => b.status === "PENDING");

  const totalHours = completedSessions.reduce(
    (acc, b) => acc + b.duration / 60,
    0,
  );

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.charAt(0) || ""}${
      lastName?.charAt(0) || ""
    }`.toUpperCase();
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const canJoinMeeting = (booking: Booking) => {
    if (booking.status !== "CONFIRMED" || !booking.meetingLink) return false;

    const now = new Date();
    const startTime = new Date(booking.timeSlot?.startTime || "");
    const endTime = new Date(booking.timeSlot?.endTime || "");

    // Allow joining 15 minutes before and during the session
    const joinableTime = new Date(startTime.getTime() - 15 * 60 * 1000);

    return now >= joinableTime && now <= endTime;
  };

  const dashboardTabs = [
    {
      key: "overview",
      label: t.dashboard.title,
      icon: <LayoutDashboard size={16} />,
      active: true,
    },
    {
      key: "actions",
      label: t.dashboard.upcomingSessions,
      icon: <CalendarClock size={16} />,
      active: false,
    },
    {
      key: "records",
      label: t.nav.bookings,
      icon: <Wallet size={16} />,
      active: false,
    },
  ];

  const stats = [
    {
      label: t.dashboard.stats.totalSessions,
      value: bookings.length,
      meta: `${completedSessions.length} completed`,
      icon: <CalendarClock size={18} />,
      tone: "olive",
    },
    {
      label: t.dashboard.stats.upcomingBookings,
      value: upcomingBookings.length,
      meta: `${pendingSessions.length} pending`,
      icon: <CircleCheckBig size={18} />,
      tone: "olive",
    },
    {
      label: isMentor ? "My Mentees" : t.dashboard.stats.favoriteMentors,
      value: isMentor ? new Set(bookings.map((b) => b.menteeId)).size : "-",
      meta: t.dashboard.stats.activeConnections,
      icon: <Users size={18} />,
      tone: "light",
    },
    {
      label: t.dashboard.stats.hoursLearned,
      value: Math.round(totalHours),
      meta: "total hours",
      icon: <Sparkles size={18} />,
      tone: "light",
    },
  ];

  const getActivityVariant = (booking: Booking) => {
    if (booking.status === "COMPLETED") {
      return {
        icon: <CircleCheckBig size={16} />,
        title: t.dashboard.sessionCompleted,
        variant: "success",
      };
    }

    if (booking.status === "CONFIRMED") {
      return {
        icon: <CircleCheckBig size={16} />,
        title: t.dashboard.bookingConfirmed,
        variant: "success",
      };
    }

    if (booking.status.includes("CANCELLED")) {
      return {
        icon: <CircleSlash size={16} />,
        title: t.dashboard.bookingCancelled,
        variant: "danger",
      };
    }

    return {
      icon: <CalendarClock size={16} />,
      title: t.dashboard.booking,
      variant: "default",
    };
  };

  return (
    <PageShell
      title={t.dashboard.title}
      subtitle={t.dashboard.subtitle.replace("{name}", user?.firstName || "")}
      eyebrow={user?.role === "MENTOR" ? "Mentor Workspace" : "Workspace"}
      actions={
        <div
          className="dashboard-segmented-tabs"
          role="tablist"
          aria-label="Dashboard sections"
        >
          {dashboardTabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={
                tab.active
                  ? "dashboard-tab dashboard-tab-active"
                  : "dashboard-tab"
              }
              aria-pressed={tab.active}
            >
              <span className="dashboard-tab-icon">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      }
      className="dashboard-shell"
    >
      {loading ? (
        <div className="dashboard-state">Loading dashboard...</div>
      ) : (
        <>
          <section className="dashboard-summary-shell">
            <div className="dashboard-summary-user">
              <div className="dashboard-summary-avatar">
                {getInitials(user?.firstName, user?.lastName)}
              </div>
              <div className="dashboard-summary-copy">
                <span className="dashboard-summary-label">
                  {user?.role === "MENTOR" ? "Mentor" : "Account"}
                </span>
                <strong className="dashboard-summary-name">
                  {user?.firstName} {user?.lastName}
                </strong>
                <span className="dashboard-summary-meta">
                  {isMentor ? t.nav.mentorTools.availability : t.nav.profile}
                </span>
              </div>
            </div>
          </section>

          {/* Stats Grid */}
          <div className="stats-grid">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className={`stat-card stat-card-${stat.tone}`}
              >
                <div className="stat-card-icon">{stat.icon}</div>
                <div className="stat-label">{stat.label}</div>
                <div className="stat-value">{stat.value}</div>
                <div className="stat-change">{stat.meta}</div>
              </div>
            ))}
          </div>

          {/* Upcoming Sessions */}
          <div className="card dashboard-section-card">
            <div className="card-header">
              <h2 className="card-title">{t.dashboard.upcomingSessions}</h2>
            </div>
            <div className="card-body">
              {upcomingBookings.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "var(--space-lg)",
                    color: "var(--neutral-600)",
                  }}
                >
                  {t.dashboard.noUpcomingSessions}{" "}
                  {!isMentor && (
                    <Link to="/mentors">{t.dashboard.browseMentors}</Link>
                  )}
                </div>
              ) : (
                <>
                  <div className="table-container dashboard-upcoming-table">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>
                            {isMentor ? t.dashboard.mentee : t.dashboard.mentor}
                          </th>
                          <th>{t.dashboard.topic}</th>
                          <th>{t.dashboard.dateTime}</th>
                          <th>{t.dashboard.status}</th>
                          <th>{t.dashboard.action}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {upcomingBookings.slice(0, 5).map((booking) => {
                          return (
                            <tr key={booking.id}>
                              <td>
                                <div className="flex gap-sm">
                                  <div className="user-avatar">
                                    {getInitials(
                                      isMentor
                                        ? booking.mentee?.firstName
                                        : booking.mentor?.user?.firstName,
                                      isMentor
                                        ? booking.mentee?.lastName
                                        : booking.mentor?.user?.lastName,
                                    )}
                                  </div>
                                  <div>
                                    <div className="dashboard-person-name">
                                      {isMentor
                                        ? booking.mentee?.firstName
                                        : booking.mentor?.user?.firstName}{" "}
                                      {isMentor
                                        ? booking.mentee?.lastName
                                        : booking.mentor?.user?.lastName}
                                    </div>
                                    <div className="dashboard-person-meta">
                                      {isMentor
                                        ? booking.mentee?.email
                                        : booking.mentor?.title}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td>{booking.notes || "-"}</td>
                              <td>
                                {formatDateTime(
                                  booking.timeSlot?.startTime || "",
                                )}
                              </td>
                              <td>
                                <span
                                  className={`badge ${
                                    booking.status === "CONFIRMED"
                                      ? "badge-success"
                                      : "badge-warning"
                                  }`}
                                >
                                  {booking.status === "CONFIRMED"
                                    ? t.dashboard.confirmed
                                    : t.dashboard.pending}
                                </span>
                              </td>
                              <td>
                                {canJoinMeeting(booking) ? (
                                  <button
                                    className="btn btn-sm btn-primary"
                                    onClick={() =>
                                      window.open(booking.meetingLink, "_blank")
                                    }
                                  >
                                    {t.dashboard.joinMeeting}
                                  </button>
                                ) : (
                                  <button
                                    className="btn btn-sm btn-outline"
                                    onClick={() =>
                                      navigate(`/bookings/${booking.id}`)
                                    }
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
                  <div className="dashboard-upcoming-mobile-list">
                    {upcomingBookings.slice(0, 5).map((booking) => {
                      const personFirstName = isMentor
                        ? booking.mentee?.firstName
                        : booking.mentor?.user?.firstName;
                      const personLastName = isMentor
                        ? booking.mentee?.lastName
                        : booking.mentor?.user?.lastName;

                      return (
                        <article
                          key={`${booking.id}-mobile`}
                          className="dashboard-upcoming-mobile-card"
                        >
                          <div className="dashboard-upcoming-mobile-head">
                            <div className="flex gap-sm">
                              <div className="user-avatar">
                                {getInitials(personFirstName, personLastName)}
                              </div>
                              <div>
                                <div className="dashboard-person-name">
                                  {personFirstName} {personLastName}
                                </div>
                                <div className="dashboard-person-meta">
                                  {isMentor
                                    ? booking.mentee?.email
                                    : booking.mentor?.title}
                                </div>
                              </div>
                            </div>
                            <span
                              className={`badge ${
                                booking.status === "CONFIRMED"
                                  ? "badge-success"
                                  : "badge-warning"
                              }`}
                            >
                              {booking.status === "CONFIRMED"
                                ? t.dashboard.confirmed
                                : t.dashboard.pending}
                            </span>
                          </div>

                          <div className="dashboard-upcoming-mobile-meta">
                            <div className="dashboard-upcoming-mobile-item">
                              <span className="dashboard-upcoming-mobile-label">
                                {t.dashboard.topic}
                              </span>
                              <span className="dashboard-upcoming-mobile-value">
                                {booking.notes || "-"}
                              </span>
                            </div>
                            <div className="dashboard-upcoming-mobile-item">
                              <span className="dashboard-upcoming-mobile-label">
                                {t.dashboard.dateTime}
                              </span>
                              <span className="dashboard-upcoming-mobile-value">
                                {formatDateTime(
                                  booking.timeSlot?.startTime || "",
                                )}
                              </span>
                            </div>
                          </div>

                          <div className="dashboard-upcoming-mobile-action">
                            {canJoinMeeting(booking) ? (
                              <button
                                className="btn btn-sm btn-primary"
                                onClick={() =>
                                  window.open(booking.meetingLink, "_blank")
                                }
                              >
                                {t.dashboard.joinMeeting}
                              </button>
                            ) : (
                              <button
                                className="btn btn-sm btn-outline"
                                onClick={() =>
                                  navigate(`/bookings/${booking.id}`)
                                }
                              >
                                {t.common.viewDetails}
                              </button>
                            )}
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Recent Sessions */}
          <div className="card dashboard-section-card">
            <div className="card-header">
              <h2 className="card-title">{t.dashboard.recentSessions}</h2>
              <Link to="/bookings" className="btn btn-sm btn-outline">
                {t.dashboard.viewAll}
              </Link>
            </div>
            <div className="card-body">
              {recentSessions.length === 0 ? (
                <div className="dashboard-empty-state">
                  {t.dashboard.noRecentSessions}
                </div>
              ) : (
                <>
                  <div className="table-container dashboard-recent-table">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>
                            {isMentor ? t.dashboard.mentee : t.dashboard.mentor}
                          </th>
                          <th>{t.dashboard.topic}</th>
                          <th>{t.dashboard.date}</th>
                          <th>{t.dashboard.duration}</th>
                          <th>{t.dashboard.status}</th>
                          <th>{t.dashboard.action}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentSessions.slice(0, 5).map((booking) => {
                          const isPastConfirmed =
                            booking.status === "CONFIRMED" &&
                            booking.timeSlot &&
                            new Date(booking.timeSlot.endTime) < now;
                          return (
                            <tr key={booking.id}>
                              <td>
                                <div className="flex gap-sm">
                                  <div className="user-avatar">
                                    {getInitials(
                                      isMentor
                                        ? booking.mentee?.firstName
                                        : booking.mentor?.user?.firstName,
                                      isMentor
                                        ? booking.mentee?.lastName
                                        : booking.mentor?.user?.lastName,
                                    )}
                                  </div>
                                  <div>
                                    <div className="dashboard-person-name">
                                      {isMentor
                                        ? booking.mentee?.firstName
                                        : booking.mentor?.user?.firstName}{" "}
                                      {isMentor
                                        ? booking.mentee?.lastName
                                        : booking.mentor?.user?.lastName}
                                    </div>
                                    <div className="dashboard-person-meta">
                                      {isMentor
                                        ? booking.mentee?.email
                                        : booking.mentor?.title}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td>{booking.notes || "-"}</td>
                              <td>
                                {formatDateTime(
                                  booking.timeSlot?.startTime || "",
                                )}
                              </td>
                              <td>{booking.duration} min</td>
                              <td>
                                {isPastConfirmed ? (
                                  <span className="badge badge-warning">
                                    {t.dashboard.needsCompletion}
                                  </span>
                                ) : (
                                  <span className="badge badge-success">
                                    {t.dashboard.completed}
                                  </span>
                                )}
                              </td>
                              <td>
                                <button
                                  className="btn btn-sm btn-outline"
                                  onClick={() =>
                                    navigate(`/bookings/${booking.id}`)
                                  }
                                >
                                  {isPastConfirmed
                                    ? t.dashboard.complete
                                    : t.dashboard.viewDetails}
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <div className="dashboard-recent-mobile-list">
                    {recentSessions.slice(0, 5).map((booking) => {
                      const isPastConfirmed =
                        booking.status === "CONFIRMED" &&
                        booking.timeSlot &&
                        new Date(booking.timeSlot.endTime) < now;

                      const personFirstName = isMentor
                        ? booking.mentee?.firstName
                        : booking.mentor?.user?.firstName;
                      const personLastName = isMentor
                        ? booking.mentee?.lastName
                        : booking.mentor?.user?.lastName;

                      return (
                        <article
                          key={`${booking.id}-recent-mobile`}
                          className="dashboard-recent-mobile-card"
                        >
                          <div className="dashboard-upcoming-mobile-head">
                            <div className="flex gap-sm">
                              <div className="user-avatar">
                                {getInitials(personFirstName, personLastName)}
                              </div>
                              <div>
                                <div className="dashboard-person-name">
                                  {personFirstName} {personLastName}
                                </div>
                                <div className="dashboard-person-meta">
                                  {isMentor
                                    ? booking.mentee?.email
                                    : booking.mentor?.title}
                                </div>
                              </div>
                            </div>
                            {isPastConfirmed ? (
                              <span className="badge badge-warning">
                                {t.dashboard.needsCompletion}
                              </span>
                            ) : (
                              <span className="badge badge-success">
                                {t.dashboard.completed}
                              </span>
                            )}
                          </div>

                          <div className="dashboard-upcoming-mobile-meta">
                            <div className="dashboard-upcoming-mobile-item">
                              <span className="dashboard-upcoming-mobile-label">
                                {t.dashboard.topic}
                              </span>
                              <span className="dashboard-upcoming-mobile-value">
                                {booking.notes || "-"}
                              </span>
                            </div>
                            <div className="dashboard-upcoming-mobile-item">
                              <span className="dashboard-upcoming-mobile-label">
                                {t.dashboard.date}
                              </span>
                              <span className="dashboard-upcoming-mobile-value">
                                {formatDateTime(
                                  booking.timeSlot?.startTime || "",
                                )}
                              </span>
                            </div>
                            <div className="dashboard-upcoming-mobile-item">
                              <span className="dashboard-upcoming-mobile-label">
                                {t.dashboard.duration}
                              </span>
                              <span className="dashboard-upcoming-mobile-value">
                                {booking.duration} min
                              </span>
                            </div>
                          </div>

                          <div className="dashboard-upcoming-mobile-action">
                            <button
                              className="btn btn-sm btn-outline"
                              onClick={() =>
                                navigate(`/bookings/${booking.id}`)
                              }
                            >
                              {isPastConfirmed
                                ? t.dashboard.complete
                                : t.dashboard.viewDetails}
                            </button>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Recent Activity & Recommended Mentors */}
          <div className="grid grid-2">
            {/* Recent Activity */}
            <div className="card dashboard-section-card">
              <div className="card-header">
                <h2 className="card-title">{t.dashboard.recentActivity}</h2>
              </div>
              <div className="card-body">
                {bookings.length === 0 ? (
                  <div className="dashboard-empty-state">
                    {t.dashboard.noActivityYet}
                  </div>
                ) : (
                  <div className="dashboard-activity-list">
                    {bookings.slice(0, 5).map((booking) => {
                      const activity = getActivityVariant(booking);

                      return (
                        <div
                          key={booking.id}
                          className={`dashboard-activity-item dashboard-activity-item-${activity.variant}`}
                          onClick={() => navigate(`/bookings/${booking.id}`)}
                        >
                          <div className="dashboard-activity-icon">
                            {activity.icon}
                          </div>
                          <div className="dashboard-activity-content">
                            <div className="dashboard-activity-title">
                              {activity.title}
                            </div>
                            <div className="dashboard-activity-meta">
                              {t.dashboard.sessionWith}{" "}
                              {isMentor
                                ? booking.mentee?.firstName
                                : booking.mentor?.user?.firstName}{" "}
                              {isMentor
                                ? booking.mentee?.lastName
                                : booking.mentor?.user?.lastName}
                            </div>
                            <div className="dashboard-activity-time">
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
              <div className="card dashboard-section-card">
                <div className="card-header">
                  <h2 className="card-title">
                    {t.dashboard.recommendedForYou}
                  </h2>
                </div>
                <div className="card-body">
                  {recommendedMentors.length === 0 ? (
                    <div className="dashboard-empty-state">
                      {t.dashboard.noMentorsAvailable}
                    </div>
                  ) : (
                    <>
                      <div className="dashboard-recommended-list">
                        {recommendedMentors.map((mentor) => (
                          <div
                            key={mentor.id}
                            className="dashboard-recommended-card"
                            onClick={() => navigate(`/mentors/${mentor.id}`)}
                          >
                            <div className="user-avatar">
                              {getInitials(
                                mentor.user?.firstName,
                                mentor.user?.lastName,
                              )}
                            </div>
                            <div className="dashboard-recommended-info">
                              <div className="dashboard-recommended-name">
                                {mentor.user?.firstName} {mentor.user?.lastName}
                              </div>
                              <div className="dashboard-recommended-title">
                                {mentor.title}
                              </div>
                              <div className="dashboard-recommended-skills">
                                {mentor.skills?.slice(0, 2).map((skillRel) => (
                                  <span
                                    key={skillRel.skill.id}
                                    className="skill-tag"
                                  >
                                    {skillRel.skill.name}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <div className="dashboard-recommended-rate">
                              <div className="dashboard-recommended-price">
                                ${mentor.hourlyRate || 0}/hr
                              </div>
                              <div className="dashboard-recommended-rating">
                                ★ {mentor.avgRating?.toFixed(1) || "0.0"}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="mt-md">
                        <Link
                          to="/mentors"
                          className="btn btn-outline dashboard-recommended-link"
                        >
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
    </PageShell>
  );
};
