import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useLanguage } from "../../i18n/LanguageContext";
import { useAuth } from "../../contexts/AuthContext";
import { bookingService } from "../../services/bookingService";
import { Booking } from "../../types/booking";
import { ConfirmDialog } from "../common/ConfirmDialog";
import { AlertDialog } from "../common/AlertDialog";
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
    type?: 'danger' | 'warning' | 'info' | 'success';
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
    type?: 'danger' | 'warning' | 'info' | 'success';
  }>({
    isOpen: false,
    title: "",
    message: "",
  });

  const isMentor = !!user?.mentorProfileId;

  useEffect(() => {
    fetchBooking();
  }, [id]);

  const fetchBooking = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const data = await bookingService.getBookingById(parseInt(id));
      setBooking(data);
      setError("");
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to load booking");
      console.error("Error fetching booking:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmBooking = () => {
    if (!booking || !user?.mentorProfileId) return;

    setConfirmDialog({
      isOpen: true,
      title: "Confirm Booking",
      message: "Are you sure you want to confirm this booking session?",
      type: "success",
      onConfirm: async () => {
        try {
          await bookingService.confirmBooking(booking.id, user.mentorProfileId!);
          fetchBooking();
          setAlertDialog({
            isOpen: true,
            title: "Success",
            message: "Booking confirmed successfully!",
            type: "success",
          });
        } catch (err: any) {
          setAlertDialog({
            isOpen: true,
            title: "Error",
            message: err.response?.data?.error || "Failed to confirm booking",
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
      title: "Cancel Booking",
      message: "Are you sure you want to cancel this booking? This action cannot be undone.",
      type: "danger",
      onConfirm: async () => {
        try {
          if (isMentor && user?.mentorProfileId) {
            await bookingService.cancelBookingByMentor(
              booking.id,
              user.mentorProfileId
            );
          } else if (user?.menteeProfileId) {
            await bookingService.cancelBookingByMentee(
              booking.id,
              user.menteeProfileId
            );
          }
          fetchBooking();
          setAlertDialog({
            isOpen: true,
            title: "Cancelled",
            message: "Booking cancelled successfully",
            type: "info",
          });
        } catch (err: any) {
          setAlertDialog({
            isOpen: true,
            title: "Error",
            message: err.response?.data?.error || "Failed to cancel booking",
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
        meetingLink
      );
      setShowMeetingLinkForm(false);
      fetchBooking();
      setAlertDialog({
        isOpen: true,
        title: "Success",
        message: "Meeting link updated successfully!",
        type: "success",
      });
    } catch (err: any) {
      setAlertDialog({
        isOpen: true,
        title: "Error",
        message: err.response?.data?.error || "Failed to update meeting link",
        type: "danger",
      });
      console.error("Error updating meeting link:", err);
    }
  };

  const handleCompleteBooking = () => {
    if (!booking) return;

    setConfirmDialog({
      isOpen: true,
      title: "Complete Session",
      message: "Mark this session as completed? This confirms that the session has finished.",
      type: "success",
      onConfirm: async () => {
        try {
          await bookingService.completeBooking(booking.id);
          fetchBooking();
          setAlertDialog({
            isOpen: true,
            title: "Success",
            message: "Session marked as completed!",
            type: "success",
          });
        } catch (err: any) {
          setAlertDialog({
            isOpen: true,
            title: "Error",
            message: err.response?.data?.error || "Failed to complete booking",
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
      case "CANCELLED_BY_MENTEE":
      case "CANCELLED_BY_MENTOR":
        return "badge-danger";
      default:
        return "badge-neutral";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return "Confirmed";
      case "PENDING":
        return "Pending";
      case "COMPLETED":
        return "Completed";
      case "CANCELLED_BY_MENTEE":
        return isMentor ? "Cancelled by Mentee" : "Cancelled by You";
      case "CANCELLED_BY_MENTOR":
        return isMentor ? "Cancelled by You" : "Cancelled by Mentor";
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
      <div className="content-area">
        <div
          style={{
            textAlign: "center",
            padding: "var(--space-xl)",
            color: "var(--neutral-600)",
          }}
        >
          Loading booking details...
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="content-area">
        <div
          style={{
            padding: "var(--space-md)",
            background: "var(--danger-50)",
            color: "var(--danger-700)",
            borderRadius: "var(--radius-md)",
            marginBottom: "var(--space-md)",
          }}
        >
          {error || "Booking not found"}
        </div>
        <button
          className="btn btn-outline"
          onClick={() => navigate("/bookings")}
        >
          ← Back to Bookings
        </button>
      </div>
    );
  }

  const otherPerson = isMentor ? booking.mentee : booking.mentor;
  const otherPersonName = `${otherPerson?.user?.firstName || ""} ${
    otherPerson?.user?.lastName || ""
  }`;

  return (
    <div className="content-area">
      {/* Back Button */}
      <div style={{ marginBottom: "var(--space-md)" }}>
        <button
          className="btn btn-outline"
          onClick={() => navigate("/bookings")}
        >
          ← Back to Bookings
        </button>
      </div>

      {/* Header Card */}
      <div className="card">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "start",
            flexWrap: "wrap",
            gap: "var(--space-md)",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: "var(--space-md)",
              alignItems: "center",
            }}
          >
            <div
              className="mentor-avatar"
              style={{ width: "80px", height: "80px", fontSize: "24px" }}
            >
              {getInitials(
                otherPerson?.user?.firstName,
                otherPerson?.user?.lastName
              )}
            </div>
            <div>
              <h1
                style={{
                  fontSize: "var(--font-size-xxl)",
                  marginBottom: "var(--space-xs)",
                }}
              >
                {isMentor ? "Session with " : "Mentorship Session"}
                {isMentor ? otherPersonName : ""}
              </h1>
              <p
                style={{
                  fontSize: "var(--font-size-lg)",
                  color: "var(--neutral-600)",
                }}
              >
                {isMentor
                  ? otherPerson?.user?.email
                  : `with ${otherPersonName}`}
              </p>
              {!isMentor && booking.mentor?.title && (
                <p
                  style={{
                    fontSize: "var(--font-size-md)",
                    color: "var(--neutral-500)",
                  }}
                >
                  {booking.mentor.title}
                </p>
              )}
            </div>
          </div>
          <span
            className={`badge ${getStatusBadgeClass(booking.status)}`}
            style={{
              fontSize: "var(--font-size-lg)",
              padding: "var(--space-sm) var(--space-md)",
            }}
          >
            {getStatusText(booking.status)}
          </span>
        </div>
      </div>

      <div className="grid grid-3">
        <div style={{ gridColumn: "span 2" }}>
          {/* Session Details Card */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Session Details</h2>
            </div>
            <div className="card-body">
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "var(--space-lg)",
                }}
              >
                <div>
                  <div
                    style={{
                      fontWeight: 600,
                      marginBottom: "var(--space-xs)",
                      color: "var(--neutral-700)",
                    }}
                  >
                    📅 Date
                  </div>
                  <div style={{ fontSize: "var(--font-size-lg)" }}>
                    {booking.timeSlot && formatDate(booking.timeSlot.startTime)}
                  </div>
                </div>

                <div>
                  <div
                    style={{
                      fontWeight: 600,
                      marginBottom: "var(--space-xs)",
                      color: "var(--neutral-700)",
                    }}
                  >
                    🕐 Time
                  </div>
                  <div style={{ fontSize: "var(--font-size-lg)" }}>
                    {booking.timeSlot &&
                      `${formatTime(booking.timeSlot.startTime)} - ${formatTime(
                        booking.timeSlot.endTime
                      )}`}
                  </div>
                </div>

                <div>
                  <div
                    style={{
                      fontWeight: 600,
                      marginBottom: "var(--space-xs)",
                      color: "var(--neutral-700)",
                    }}
                  >
                    ⏱️ Duration
                  </div>
                  <div style={{ fontSize: "var(--font-size-lg)" }}>
                    {booking.duration} minutes
                  </div>
                </div>

                <div>
                  <div
                    style={{
                      fontWeight: 600,
                      marginBottom: "var(--space-xs)",
                      color: "var(--neutral-700)",
                    }}
                  >
                    💰 Total Amount
                  </div>
                  <div
                    style={{
                      fontSize: "var(--font-size-xl)",
                      fontWeight: 600,
                      color: "var(--primary-blue)",
                    }}
                  >
                    ${booking.totalAmount} {booking.currency}
                  </div>
                </div>

                {booking.notes && (
                  <div>
                    <div
                      style={{
                        fontWeight: 600,
                        marginBottom: "var(--space-xs)",
                        color: "var(--neutral-700)",
                      }}
                    >
                      📝 Notes
                    </div>
                    <div
                      style={{
                        padding: "var(--space-md)",
                        background: "var(--neutral-50)",
                        borderRadius: "var(--radius-sm)",
                        lineHeight: 1.6,
                      }}
                    >
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
              <h2 className="card-title">Meeting Link</h2>
            </div>
            <div className="card-body">
              {booking.meetingLink ? (
                <div>
                  <div
                    style={{
                      padding: "var(--space-md)",
                      background: "var(--neutral-50)",
                      borderRadius: "var(--radius-sm)",
                      marginBottom: "var(--space-md)",
                      wordBreak: "break-all",
                    }}
                  >
                    {booking.meetingLink}
                  </div>
                  {canJoinMeeting() && (
                    <button
                      className="btn btn-success"
                      onClick={() => window.open(booking.meetingLink, "_blank")}
                      style={{ marginRight: "var(--space-sm)" }}
                    >
                      Join Meeting
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
                        Update Link
                      </button>
                    )}
                </div>
              ) : (
                <div>
                  {isMentor &&
                  (booking.status === "PENDING" ||
                    booking.status === "CONFIRMED") ? (
                    showMeetingLinkForm ? (
                      <form onSubmit={handleUpdateMeetingLink}>
                        <div style={{ marginBottom: "var(--space-md)" }}>
                          <input
                            type="url"
                            className="input"
                            placeholder="https://zoom.us/j/..."
                            value={meetingLink}
                            onChange={(e) => setMeetingLink(e.target.value)}
                            required
                          />
                        </div>
                        <button
                          type="submit"
                          className="btn btn-primary"
                          style={{ marginRight: "var(--space-sm)" }}
                        >
                          Save Link
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline"
                          onClick={() => setShowMeetingLinkForm(false)}
                        >
                          Cancel
                        </button>
                      </form>
                    ) : (
                      <div>
                        <p
                          style={{
                            color: "var(--neutral-600)",
                            marginBottom: "var(--space-md)",
                          }}
                        >
                          No meeting link set yet
                        </p>
                        <button
                          className="btn btn-primary"
                          onClick={() => setShowMeetingLinkForm(true)}
                        >
                          Add Meeting Link
                        </button>
                      </div>
                    )
                  ) : (
                    <p style={{ color: "var(--neutral-600)" }}>
                      Meeting link not available yet
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div>
          {/* Actions Card */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Actions</h2>
            </div>
            <div className="card-body">
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "var(--space-sm)",
                }}
              >
                {isMentor && booking.status === "PENDING" && (
                  <button
                    className="btn btn-success"
                    onClick={handleConfirmBooking}
                    style={{ width: "100%" }}
                  >
                    Confirm Booking
                  </button>
                )}

                {canJoinMeeting() && (
                  <button
                    className="btn btn-success"
                    onClick={() => window.open(booking.meetingLink, "_blank")}
                    style={{ width: "100%" }}
                  >
                    Join Meeting
                  </button>
                )}

                {booking.status === "CONFIRMED" && (
                  <button
                    className="btn btn-primary"
                    onClick={handleCompleteBooking}
                    style={{ width: "100%" }}
                  >
                    Complete Session
                  </button>
                )}

                {canCancel() && (
                  <button
                    className="btn btn-danger"
                    onClick={handleCancelBooking}
                    style={{ width: "100%" }}
                  >
                    Cancel Booking
                  </button>
                )}

                {!isMentor &&
                  booking.status === "COMPLETED" &&
                  !booking.review && (
                    <button
                      className="btn btn-primary"
                      style={{ width: "100%" }}
                    >
                      Leave Review
                    </button>
                  )}
              </div>
            </div>
          </div>

          {/* Booking Info Card */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Booking Information</h2>
            </div>
            <div className="card-body">
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "var(--space-md)",
                  fontSize: "var(--font-size-sm)",
                }}
              >
                <div>
                  <div
                    style={{ color: "var(--neutral-500)", marginBottom: "4px" }}
                  >
                    Booking ID
                  </div>
                  <div style={{ fontWeight: 600 }}>#{booking.id}</div>
                </div>

                <div>
                  <div
                    style={{ color: "var(--neutral-500)", marginBottom: "4px" }}
                  >
                    Created
                  </div>
                  <div style={{ fontWeight: 600 }}>
                    {new Date(booking.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </div>
                </div>

                {booking.confirmedAt && (
                  <div>
                    <div
                      style={{
                        color: "var(--neutral-500)",
                        marginBottom: "4px",
                      }}
                    >
                      Confirmed
                    </div>
                    <div style={{ fontWeight: 600 }}>
                      {new Date(booking.confirmedAt).toLocaleDateString(
                        "en-US",
                        {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        }
                      )}
                    </div>
                  </div>
                )}

                {(booking.status === "CANCELLED_BY_MENTEE" ||
                  booking.status === "CANCELLED_BY_MENTOR") &&
                  booking.cancelledAt && (
                    <div>
                      <div
                        style={{
                          color: "var(--neutral-500)",
                          marginBottom: "4px",
                        }}
                      >
                        Cancelled
                      </div>
                      <div style={{ fontWeight: 600 }}>
                        {new Date(booking.cancelledAt).toLocaleDateString(
                          "en-US",
                          {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          }
                        )}
                      </div>
                    </div>
                  )}

                {booking.status === "COMPLETED" && booking.completedAt && (
                  <div>
                    <div
                      style={{
                        color: "var(--neutral-500)",
                        marginBottom: "4px",
                      }}
                    >
                      Completed
                    </div>
                    <div style={{ fontWeight: 600 }}>
                      {new Date(booking.completedAt).toLocaleDateString(
                        "en-US",
                        {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        }
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
    </div>
  );
};
