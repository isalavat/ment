import React, { useState, useEffect, useCallback } from "react";
import { CalendarRange, Clock3, Sparkles, Ticket, Video } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../../i18n/LanguageContext";
import { useAuth } from "../../contexts/AuthContext";
import { bookingService } from "../../services/bookingService";
import { Booking } from "../../types/booking";
import { ConfirmDialog } from "../common/ConfirmDialog";
import { AlertDialog } from "../common/AlertDialog";
import { PageShell } from "../common/PageShell";
import "./Bookings.css";

type BookingStatusFilter =
  | "ALL"
  | "PENDING"
  | "CONFIRMED"
  | "COMPLETED"
  | "CANCELLED";

export const Bookings: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<BookingStatusFilter>("ALL");

  // Dialog states
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type?: "danger" | "warning" | "info" | "success";
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  const [alertDialog, setAlertDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type?: "danger" | "warning" | "info" | "success";
  }>({
    isOpen: false,
    title: "",
    message: "",
  });

  // Determine if user is viewing as mentor or mentee
  const isMentor = user?.role === "MENTOR" || !!user?.mentorProfileId;

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      let status: string | undefined;
      if (activeTab !== "ALL") {
        if (activeTab === "CANCELLED") {
          status = undefined;
        } else {
          status = activeTab;
        }
      }

      // Fetch bookings based on user role
      let data: Booking[];
      if (isMentor && user?.mentorProfileId) {
        data = await bookingService.getBookingsForMentor(
          user.mentorProfileId,
          status,
        );
      } else if (user?.id) {
        data = await bookingService.getBookingsForMentee(user.id, status);
      } else {
        setError(t.bookings.errors.profileNotFound);
        setLoading(false);
        return;
      }

      // Filter cancelled bookings
      let filteredData = data;
      if (activeTab === "CANCELLED") {
        filteredData = data.filter(
          (b) =>
            b.status === "CANCELLED_BY_USER" ||
            b.status === "CANCELLED_BY_MENTOR",
        );
      } else if (activeTab !== "ALL") {
        filteredData = data.filter((b) => b.status === activeTab);
      }

      setBookings(filteredData);
    } catch (err: any) {
      setError(err.response?.data?.error || t.bookings.errors.fetchFailed);
      console.error("Error fetching bookings:", err);
    } finally {
      setLoading(false);
    }
  }, [
    activeTab,
    isMentor,
    t.bookings.errors.fetchFailed,
    t.bookings.errors.profileNotFound,
    user?.mentorProfileId,
    user?.id,
  ]);

  useEffect(() => {
    void fetchBookings();
  }, [fetchBookings]);

  const handleConfirmBooking = (bookingId: string) => {
    if (!user?.mentorProfileId) return;

    setConfirmDialog({
      isOpen: true,
      title: t.bookings.confirmBooking,
      message: t.bookings.confirmBookingMessage,
      type: "success",
      onConfirm: async () => {
        try {
          await bookingService.confirmBooking(bookingId, user.mentorProfileId!);
          fetchBookings();
          setAlertDialog({
            isOpen: true,
            title: t.common.success,
            message: t.bookings.bookingConfirmed,
            type: "success",
          });
        } catch (err: any) {
          setAlertDialog({
            isOpen: true,
            title: t.common.error,
            message:
              err.response?.data?.error || t.bookings.errors.confirmFailed,
            type: "danger",
          });
          console.error("Error confirming booking:", err);
        }
      },
    });
  };

  const handleCancelBooking = (bookingId: string) => {
    setConfirmDialog({
      isOpen: true,
      title: t.bookings.cancelBooking,
      message: t.bookings.cancelBookingMessage,
      type: "danger",
      onConfirm: async () => {
        try {
          if (isMentor && user?.mentorProfileId) {
            await bookingService.cancelBookingByMentor(
              bookingId,
              user.mentorProfileId,
            );
          } else if (user?.id) {
            await bookingService.cancelBookingByMentee(bookingId, user.id);
          }
          fetchBookings();
          setAlertDialog({
            isOpen: true,
            title: t.bookings.cancelled,
            message: t.bookings.bookingCancelled,
            type: "info",
          });
        } catch (err: any) {
          setAlertDialog({
            isOpen: true,
            title: t.common.error,
            message:
              err.response?.data?.error || t.bookings.errors.cancelFailed,
            type: "danger",
          });
          console.error("Error cancelling booking:", err);
        }
      },
    });
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.charAt(0) || ""}${
      lastName?.charAt(0) || ""
    }`.toUpperCase();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return "badge-success";
      case "PENDING":
        return "badge-warning";
      case "COMPLETED":
        return "badge-info";
      case "CANCELLED_BY_USER":
      case "CANCELLED_BY_MENTOR":
        return "badge-danger";
      default:
        return "badge-neutral";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return t.dashboard.confirmed;
      case "PENDING":
        return t.dashboard.pending;
      case "COMPLETED":
        return t.dashboard.completed;
      case "CANCELLED_BY_USER":
        return isMentor
          ? t.bookings.status.cancelledByUser
          : t.bookings.status.cancelledByYou;
      case "CANCELLED_BY_MENTOR":
        return isMentor
          ? t.bookings.status.cancelledByYou
          : t.bookings.status.cancelledByMentor;
      default:
        return status;
    }
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

  const canCancel = (booking: Booking) => {
    return booking.status === "PENDING" || booking.status === "CONFIRMED";
  };

  const summaryItems = [
    {
      label: t.bookings.labels.totalBookings,
      value: bookings.length,
      icon: <Ticket size={18} />,
    },
    {
      label: t.bookings.labels.upcoming,
      value: bookings.filter((booking) => booking.status === "CONFIRMED")
        .length,
      icon: <CalendarRange size={18} />,
    },
    {
      label: t.bookings.labels.pending,
      value: bookings.filter((booking) => booking.status === "PENDING").length,
      icon: <Clock3 size={18} />,
    },
  ];

  return (
    <PageShell
      title={t.nav.bookings}
      eyebrow={
        isMentor
          ? t.bookings.labels.mentorSessions
          : t.bookings.labels.sessionManagement
      }
      subtitle={
        isMentor
          ? t.bookings.labels.manageMenteeSessions
          : t.bookings.labels.manageMentorshipSessions
      }
      className="bookings-page"
    >
      <section className="booking-overview-card card">
        <div className="booking-overview-copy">
          <span className="booking-overview-kicker">
            <Sparkles size={16} />
            {t.bookings.labels.sessionTimeline}
          </span>
          <h2 className="booking-overview-title">
            {t.bookings.labels.keepBookingsInOnePlace}
          </h2>
          <p className="booking-overview-text">
            {t.bookings.labels.overviewText}
          </p>
        </div>
        <div className="booking-overview-metrics">
          {summaryItems.map((item) => (
            <div key={item.label} className="booking-overview-metric">
              <span className="booking-overview-metric-icon">{item.icon}</span>
              <span className="booking-overview-metric-label">
                {item.label}
              </span>
              <strong className="booking-overview-metric-value">
                {item.value}
              </strong>
            </div>
          ))}
        </div>
      </section>

      {/* Tabs */}
      <div className="booking-tabs">
        <button
          className={`tab-button ${activeTab === "ALL" ? "active" : ""}`}
          onClick={() => setActiveTab("ALL")}
        >
          {t.bookings.labels.all}
        </button>
        <button
          className={`tab-button ${activeTab === "PENDING" ? "active" : ""}`}
          onClick={() => setActiveTab("PENDING")}
        >
          {t.dashboard.pending}
        </button>
        <button
          className={`tab-button ${activeTab === "CONFIRMED" ? "active" : ""}`}
          onClick={() => setActiveTab("CONFIRMED")}
        >
          {t.bookings.labels.upcoming}
        </button>
        <button
          className={`tab-button ${activeTab === "COMPLETED" ? "active" : ""}`}
          onClick={() => setActiveTab("COMPLETED")}
        >
          {t.dashboard.completed}
        </button>
        <button
          className={`tab-button ${activeTab === "CANCELLED" ? "active" : ""}`}
          onClick={() => setActiveTab("CANCELLED")}
        >
          {t.bookings.cancelled}
        </button>
      </div>

      {/* Bookings List */}
      {loading ? (
        <div className="bookings-loading">{t.bookings.loadingBookings}</div>
      ) : error ? (
        <div className="bookings-error">{error}</div>
      ) : bookings.length === 0 ? (
        <div className="bookings-empty">
          <p>{t.bookings.noBookingsFound}</p>
          <button
            className="btn btn-primary"
            onClick={() => navigate("/mentors")}
          >
            {t.nav.mentors}
          </button>
        </div>
      ) : (
        <div className="bookings-list">
          {bookings.map((booking) => {
            return (
              <div key={booking.id} className="booking-card">
                <div className="booking-card-top">
                  <span
                    className={`badge ${getStatusBadgeClass(booking.status)}`}
                  >
                    {getStatusText(booking.status)}
                  </span>
                  <span className="booking-card-price">
                    ${booking.totalAmount} {booking.currency}
                  </span>
                </div>

                <div className="booking-main">
                  <div className="booking-mentor-section">
                    <div className="mentor-avatar">
                      {isMentor
                        ? getInitials(
                            booking.mentee?.firstName,
                            booking.mentee?.lastName,
                          )
                        : getInitials(
                            booking.mentor?.user?.firstName,
                            booking.mentor?.user?.lastName,
                          )}
                    </div>
                    <div className="booking-info">
                      <div className="booking-header-row">
                        <h3 className="mentor-name">
                          {isMentor
                            ? `${booking.mentee?.firstName} ${booking.mentee?.lastName}`
                            : `${booking.mentor?.user?.firstName} ${booking.mentor?.user?.lastName}`}
                        </h3>
                      </div>
                      <p className="mentor-title">
                        {isMentor
                          ? booking.mentee?.email
                          : booking.mentor?.title}
                      </p>
                      {booking.notes && (
                        <p className="booking-notes">{booking.notes}</p>
                      )}
                      <div className="booking-details">
                        <div className="detail-item">
                          <CalendarRange size={15} />
                          {booking.timeSlot &&
                            formatDate(booking.timeSlot.startTime)}
                        </div>
                        <div className="detail-item">
                          <Clock3 size={15} />
                          {booking.timeSlot &&
                            `${formatTime(
                              booking.timeSlot.startTime,
                            )} - ${formatTime(booking.timeSlot.endTime)}`}
                        </div>
                        <div className="detail-item">
                          <Video size={15} /> {booking.duration} min
                        </div>
                        <div className="detail-item booking-detail-item-muted">
                          {booking.meetingLink
                            ? t.bookings.meetingLinkReady
                            : t.bookings.meetingLinkPending}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="booking-actions">
                    {/* Mentor actions */}
                    {isMentor && booking.status === "PENDING" && (
                      <button
                        className="btn btn-success"
                        onClick={() => handleConfirmBooking(booking.id)}
                      >
                        {t.common.confirm}
                      </button>
                    )}

                    {canJoinMeeting(booking) && (
                      <button
                        className="btn btn-success"
                        onClick={() =>
                          window.open(booking.meetingLink, "_blank")
                        }
                      >
                        <Video size={16} />
                        {t.bookings.joinMeeting}
                      </button>
                    )}

                    {/* Mentee review option */}
                    {!isMentor &&
                      booking.status === "COMPLETED" &&
                      !booking.review && (
                        <button className="btn btn-primary">
                          {t.bookings.leaveReview}
                        </button>
                      )}

                    {canCancel(booking) && (
                      <button
                        className="btn btn-outline btn-danger"
                        onClick={() => handleCancelBooking(booking.id)}
                      >
                        {t.common.cancel}
                      </button>
                    )}

                    <button
                      className="btn btn-outline"
                      onClick={() => navigate(`/bookings/${booking.id}`)}
                    >
                      {t.bookings.viewDetails}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Dialogs */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        type={confirmDialog.type}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
      />

      <AlertDialog
        isOpen={alertDialog.isOpen}
        title={alertDialog.title}
        message={alertDialog.message}
        type={alertDialog.type}
        onClose={() => setAlertDialog({ ...alertDialog, isOpen: false })}
      />
    </PageShell>
  );
};
