import React, { useState, useEffect, useCallback } from "react";
import {
  CalendarRange,
  Clock3,
  Link2,
  Mail,
  NotebookPen,
  Receipt,
  Sparkles,
  Video,
} from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { useLanguage } from "../../i18n/LanguageContext";
import { useAuth } from "../../contexts/AuthContext";
import { bookingService } from "../../services/bookingService";
import { Booking } from "../../types/booking";
import { ConfirmDialog } from "../common/ConfirmDialog";
import { AlertDialog } from "../common/AlertDialog";
import { PageShell } from "../common/PageShell";
import "./Bookings.css";

export const BookingDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user } = useAuth();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [meetingLink, setMeetingLink] = useState("");
  const [showMeetingLinkForm, setShowMeetingLinkForm] = useState(false);

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

  const isMentor = user?.role === "MENTOR" || !!user?.mentorProfileId;

  const fetchBooking = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);
      const data = await bookingService.getBookingById(id);
      setBooking(data);
      setError("");
    } catch (err: any) {
      setError(err.response?.data?.error || t.bookings.errors.loadDetailFailed);
      console.error("Error fetching booking:", err);
    } finally {
      setLoading(false);
    }
  }, [id, t.bookings.errors.loadDetailFailed]);

  useEffect(() => {
    void fetchBooking();
  }, [fetchBooking]);

  const handleConfirmBooking = () => {
    if (!booking || !user?.mentorProfileId) return;

    setConfirmDialog({
      isOpen: true,
      title: t.bookings.confirmBooking,
      message: t.bookings.confirmBookingMessage,
      type: "success",
      onConfirm: async () => {
        try {
          await bookingService.confirmBooking(
            booking.id,
            user.mentorProfileId!,
          );
          fetchBooking();
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

  const handleCancelBooking = () => {
    if (!booking) return;

    setConfirmDialog({
      isOpen: true,
      title: t.bookings.cancelBooking,
      message: t.bookings.cancelBookingMessage,
      type: "danger",
      onConfirm: async () => {
        try {
          if (isMentor && user?.mentorProfileId) {
            await bookingService.cancelBookingByMentor(
              booking.id,
              user.mentorProfileId,
            );
          } else if (user?.id) {
            await bookingService.cancelBookingByMentee(booking.id, user.id);
          }
          fetchBooking();
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

  const handleUpdateMeetingLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!booking || !user?.mentorProfileId) return;

    try {
      await bookingService.updateMeetingLink(
        booking.id,
        user.mentorProfileId,
        meetingLink,
      );
      setShowMeetingLinkForm(false);
      fetchBooking();
      setAlertDialog({
        isOpen: true,
        title: t.common.success,
        message: t.bookings.meetingLinkUpdated,
        type: "success",
      });
    } catch (err: any) {
      setAlertDialog({
        isOpen: true,
        title: t.common.error,
        message:
          err.response?.data?.error || t.bookings.errors.updateLinkFailed,
        type: "danger",
      });
      console.error("Error updating meeting link:", err);
    }
  };

  const handleCompleteBooking = () => {
    if (!booking) return;

    setConfirmDialog({
      isOpen: true,
      title: t.bookings.completeSession,
      message: t.bookings.completeSessionMessage,
      type: "success",
      onConfirm: async () => {
        try {
          await bookingService.completeBooking(booking.id);
          fetchBooking();
          setAlertDialog({
            isOpen: true,
            title: t.common.success,
            message: t.bookings.sessionCompleted,
            type: "success",
          });
        } catch (err: any) {
          setAlertDialog({
            isOpen: true,
            title: t.common.error,
            message:
              err.response?.data?.error || t.bookings.errors.completeFailed,
            type: "danger",
          });
          console.error("Error completing booking:", err);
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
      weekday: "long",
      month: "long",
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

  const canJoinMeeting = () => {
    if (!booking || booking.status !== "CONFIRMED" || !booking.meetingLink)
      return false;

    const now = new Date();
    const startTime = new Date(booking.timeSlot?.startTime || "");
    const endTime = new Date(booking.timeSlot?.endTime || "");

    // Allow joining 15 minutes before and during the session
    const joinableTime = new Date(startTime.getTime() - 15 * 60 * 1000);

    return now >= joinableTime && now <= endTime;
  };

  const canCancel = () => {
    if (!booking) return false;
    return booking.status === "PENDING" || booking.status === "CONFIRMED";
  };

  if (loading) {
    return (
      <PageShell title={t.nav.bookings} subtitle={t.bookings.bookingDetails}>
        <div className="bookings-loading">
          {t.bookings.loadingBookingDetails}
        </div>
      </PageShell>
    );
  }

  if (error || !booking) {
    return (
      <PageShell title={t.nav.bookings} subtitle={t.bookings.bookingDetails}>
        <div className="bookings-error">
          {error || t.bookings.bookingNotFound}
        </div>
        <button
          className="btn btn-outline"
          onClick={() => navigate("/bookings")}
        >
          ← {t.bookings.backToBookings}
        </button>
      </PageShell>
    );
  }

  const otherPersonName = isMentor
    ? `${booking.mentee?.firstName || ""} ${booking.mentee?.lastName || ""}`
    : `${booking.mentor?.user?.firstName || ""} ${booking.mentor?.user?.lastName || ""}`;

  return (
    <PageShell
      title={t.nav.bookings}
      subtitle={t.bookings.bookingDetails}
      eyebrow={t.bookings.sessionDetail}
      className="booking-detail-page"
    >
      {/* Back Button */}
      <div className="booking-detail-back-row">
        <button
          className="btn btn-outline"
          onClick={() => navigate("/bookings")}
        >
          ← {t.bookings.backToBookings}
        </button>
      </div>

      {/* Header Card */}
      <div className="card booking-detail-hero-card">
        <div className="booking-detail-header">
          <div className="booking-detail-main">
            <div className="mentor-avatar booking-detail-avatar">
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
              <h1 className="booking-detail-title">
                {isMentor
                  ? `${t.bookings.sessionWith} `
                  : t.bookings.mentorshipSession}
                {isMentor ? otherPersonName : ""}
              </h1>
              <p className="booking-detail-subtitle">
                {isMentor
                  ? booking.mentee?.email
                  : `${t.bookings.with} ${otherPersonName}`}
              </p>
              {!isMentor && booking.mentor?.title && (
                <p className="booking-detail-mentor-title">
                  {booking.mentor.title}
                </p>
              )}
              <div className="booking-detail-hero-meta">
                <span className="booking-detail-hero-chip">
                  <Sparkles size={14} />
                  {booking.timeSlot && formatDate(booking.timeSlot.startTime)}
                </span>
                <span className="booking-detail-hero-chip booking-detail-hero-chip-muted">
                  <Mail size={14} />
                  {isMentor
                    ? booking.mentee?.email
                    : booking.mentor?.user?.email}
                </span>
              </div>
            </div>
          </div>
          <span
            className={`badge booking-detail-status ${getStatusBadgeClass(booking.status)}`}
          >
            {getStatusText(booking.status)}
          </span>
        </div>
      </div>

      <div className="booking-detail-grid">
        <div className="booking-detail-main-column">
          {/* Session Details Card */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">{t.bookings.sessionDetails}</h2>
            </div>
            <div className="card-body">
              <div className="booking-detail-section-list">
                <div className="booking-detail-info-card">
                  <div className="booking-detail-info-label">
                    <CalendarRange size={16} />
                    {t.dashboard.date}
                  </div>
                  <div className="booking-detail-info-value">
                    {booking.timeSlot && formatDate(booking.timeSlot.startTime)}
                  </div>
                </div>

                <div className="booking-detail-info-card">
                  <div className="booking-detail-info-label">
                    <Clock3 size={16} />
                    {t.bookings.time}
                  </div>
                  <div className="booking-detail-info-value">
                    {booking.timeSlot &&
                      `${formatTime(booking.timeSlot.startTime)} - ${formatTime(
                        booking.timeSlot.endTime,
                      )}`}
                  </div>
                </div>

                <div className="booking-detail-info-card">
                  <div className="booking-detail-info-label">
                    <Video size={16} />
                    {t.bookings.duration}
                  </div>
                  <div className="booking-detail-info-value">
                    {booking.duration} {t.bookings.minutes}
                  </div>
                </div>

                <div className="booking-detail-info-card booking-detail-info-card-accent">
                  <div className="booking-detail-info-label">
                    <Receipt size={16} />
                    {t.bookings.totalAmount}
                  </div>
                  <div className="booking-detail-info-value booking-detail-amount-value">
                    ${booking.totalAmount} {booking.currency}
                  </div>
                </div>

                {booking.notes && (
                  <div className="booking-detail-notes-card">
                    <div className="booking-detail-info-label">
                      <NotebookPen size={16} />
                      {t.bookings.notes}
                    </div>
                    <div className="booking-detail-notes-copy">
                      {booking.notes}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Meeting Link Card */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">{t.bookings.meetingLink}</h2>
            </div>
            <div className="card-body">
              {booking.meetingLink ? (
                <div className="booking-detail-link-panel">
                  <div className="booking-detail-link-box">
                    <span className="booking-detail-link-icon">
                      <Link2 size={16} />
                    </span>
                    {booking.meetingLink}
                  </div>
                  <div className="booking-detail-link-actions">
                    {canJoinMeeting() && (
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
                    {isMentor &&
                      (booking.status === "PENDING" ||
                        booking.status === "CONFIRMED") && (
                        <button
                          className="btn btn-outline"
                          onClick={() =>
                            setShowMeetingLinkForm(!showMeetingLinkForm)
                          }
                        >
                          {t.bookings.updateLink}
                        </button>
                      )}
                  </div>
                </div>
              ) : (
                <div>
                  {isMentor &&
                  (booking.status === "PENDING" ||
                    booking.status === "CONFIRMED") ? (
                    showMeetingLinkForm ? (
                      <form onSubmit={handleUpdateMeetingLink}>
                        <div className="booking-detail-form-row">
                          <input
                            type="url"
                            className="form-input"
                            placeholder="https://zoom.us/j/..."
                            value={meetingLink}
                            onChange={(e) => setMeetingLink(e.target.value)}
                            required
                          />
                        </div>
                        <div className="booking-detail-form-actions">
                          <button type="submit" className="btn btn-primary">
                            {t.bookings.saveMeetingLink}
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline"
                            onClick={() => setShowMeetingLinkForm(false)}
                          >
                            {t.common.cancel}
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div>
                        <p className="booking-detail-empty-copy">
                          {t.bookings.noMeetingLink}
                        </p>
                        <button
                          className="btn btn-primary"
                          onClick={() => setShowMeetingLinkForm(true)}
                        >
                          {t.bookings.addMeetingLink}
                        </button>
                      </div>
                    )
                  ) : (
                    <p className="text-subtle">
                      {t.bookings.meetingLinkNotAvailable}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="booking-detail-sidebar">
          {/* Actions Card */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">{t.bookings.actions}</h2>
            </div>
            <div className="card-body">
              <div className="booking-detail-action-list">
                {isMentor && booking.status === "PENDING" && (
                  <button
                    className="btn btn-success"
                    onClick={handleConfirmBooking}
                  >
                    {t.bookings.confirmBooking}
                  </button>
                )}

                {canJoinMeeting() && (
                  <button
                    className="btn btn-success"
                    onClick={() => window.open(booking.meetingLink, "_blank")}
                  >
                    <Video size={16} />
                    {t.bookings.joinMeeting}
                  </button>
                )}

                {booking.status === "CONFIRMED" && (
                  <button
                    className="btn btn-primary"
                    onClick={handleCompleteBooking}
                  >
                    {t.bookings.completeSession}
                  </button>
                )}

                {canCancel() && (
                  <button
                    className="btn btn-danger"
                    onClick={handleCancelBooking}
                  >
                    {t.bookings.cancelBooking}
                  </button>
                )}

                {!isMentor &&
                  booking.status === "COMPLETED" &&
                  !booking.review && (
                    <button className="btn btn-primary">
                      {t.bookings.leaveReview}
                    </button>
                  )}
              </div>
            </div>
          </div>

          {/* Booking Info Card */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">{t.bookings.bookingInformation}</h2>
            </div>
            <div className="card-body">
              <div className="booking-detail-meta-list">
                <div className="booking-detail-meta-item">
                  <div className="booking-detail-meta-label">
                    {t.bookings.bookingId}
                  </div>
                  <div className="booking-detail-meta-value">#{booking.id}</div>
                </div>

                <div className="booking-detail-meta-item">
                  <div className="booking-detail-meta-label">
                    {t.bookings.created}
                  </div>
                  <div className="booking-detail-meta-value">
                    {new Date(booking.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </div>
                </div>

                {booking.confirmedAt && (
                  <div className="booking-detail-meta-item">
                    <div className="booking-detail-meta-label">
                      {t.dashboard.confirmed}
                    </div>
                    <div className="booking-detail-meta-value">
                      {new Date(booking.confirmedAt).toLocaleDateString(
                        "en-US",
                        {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        },
                      )}
                    </div>
                  </div>
                )}

                {(booking.status === "CANCELLED_BY_USER" ||
                  booking.status === "CANCELLED_BY_MENTOR") &&
                  booking.cancelledAt && (
                    <div className="booking-detail-meta-item">
                      <div className="booking-detail-meta-label">
                        {t.bookings.cancelled}
                      </div>
                      <div className="booking-detail-meta-value">
                        {new Date(booking.cancelledAt).toLocaleDateString(
                          "en-US",
                          {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          },
                        )}
                      </div>
                    </div>
                  )}

                {booking.status === "COMPLETED" && booking.completedAt && (
                  <div className="booking-detail-meta-item">
                    <div className="booking-detail-meta-label">
                      {t.dashboard.completed}
                    </div>
                    <div className="booking-detail-meta-value">
                      {new Date(booking.completedAt).toLocaleDateString(
                        "en-US",
                        {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        },
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

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
