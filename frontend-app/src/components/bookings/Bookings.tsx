import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../../i18n/LanguageContext";
import { useAuth } from "../../contexts/AuthContext";
import { bookingService } from "../../services/bookingService";
import { Booking } from "../../types/booking";
import { ConfirmDialog } from "../common/ConfirmDialog";
import { AlertDialog } from "../common/AlertDialog";
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

  // Determine if user is viewing as mentor or mentee
  const isMentor = !!user?.mentorProfileId;
  const isMentee = !!user?.menteeProfileId;

  console.log("Bookings - User:", {
    user,
    isMentor,
    isMentee,
    mentorProfileId: user?.mentorProfileId,
  });

  useEffect(() => {
    fetchBookings();
  }, [activeTab]);

  const fetchBookings = async () => {
    // Check if user has either profile
    if (!isMentee && !isMentor) {
      setError("No profile found. Please create a mentee or mentor profile.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    try {
      let status: string | undefined;
      if (activeTab !== "ALL") {
        if (activeTab === "CANCELLED") {
          // We'll filter cancelled bookings client-side
          status = undefined;
        } else {
          status = activeTab;
        }
      }

      // Fetch bookings based on user role - prioritize mentor view if both profiles exist
      let data: Booking[];
      if (isMentor && user.mentorProfileId) {
        data = await bookingService.getBookingsForMentor(
          user.mentorProfileId,
          status
        );
      } else if (isMentee && user.menteeProfileId) {
        data = await bookingService.getBookingsForMentee(
          user.menteeProfileId,
          status
        );
      } else {
        setError("Profile not found");
        setLoading(false);
        return;
      }

      // Filter cancelled bookings
      let filteredData = data;
      if (activeTab === "CANCELLED") {
        filteredData = data.filter(
          (b) =>
            b.status === "CANCELLED_BY_MENTEE" ||
            b.status === "CANCELLED_BY_MENTOR"
        );
      } else if (activeTab !== "ALL") {
        filteredData = data.filter((b) => b.status === activeTab);
      }

      setBookings(filteredData);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to fetch bookings");
      console.error("Error fetching bookings:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmBooking = (bookingId: number) => {
    if (!user?.mentorProfileId) return;

    setConfirmDialog({
      isOpen: true,
      title: "Confirm Booking",
      message: "Are you sure you want to confirm this booking session?",
      type: "success",
      onConfirm: async () => {
        try {
          await bookingService.confirmBooking(bookingId, user.mentorProfileId!);
          fetchBookings();
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

  const handleCancelBooking = (bookingId: number) => {
    setConfirmDialog({
      isOpen: true,
      title: "Cancel Booking",
      message: "Are you sure you want to cancel this booking? This action cannot be undone.",
      type: "danger",
      onConfirm: async () => {
        try {
          if (isMentor && user?.mentorProfileId) {
            await bookingService.cancelBookingByMentor(
              bookingId,
              user.mentorProfileId
            );
          } else if (isMentee && user?.menteeProfileId) {
            await bookingService.cancelBookingByMentee(
              bookingId,
              user.menteeProfileId
            );
          }
          fetchBookings();
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

  return (
    <div className="content-area">
      <div className="page-header">
        <h1 className="page-title">{t.nav.bookings}</h1>
        <p className="page-subtitle">
          {isMentor
            ? "Manage your mentee sessions"
            : "Manage your mentorship sessions"}
        </p>
      </div>

      {/* Tabs */}
      <div className="booking-tabs">
        <button
          className={`tab-button ${activeTab === "ALL" ? "active" : ""}`}
          onClick={() => setActiveTab("ALL")}
        >
          All
        </button>
        <button
          className={`tab-button ${activeTab === "PENDING" ? "active" : ""}`}
          onClick={() => setActiveTab("PENDING")}
        >
          Pending
        </button>
        <button
          className={`tab-button ${activeTab === "CONFIRMED" ? "active" : ""}`}
          onClick={() => setActiveTab("CONFIRMED")}
        >
          Upcoming
        </button>
        <button
          className={`tab-button ${activeTab === "COMPLETED" ? "active" : ""}`}
          onClick={() => setActiveTab("COMPLETED")}
        >
          Completed
        </button>
        <button
          className={`tab-button ${activeTab === "CANCELLED" ? "active" : ""}`}
          onClick={() => setActiveTab("CANCELLED")}
        >
          Cancelled
        </button>
      </div>

      {/* Bookings List */}
      {loading ? (
        <div className="bookings-loading">Loading bookings...</div>
      ) : error ? (
        <div className="bookings-error">{error}</div>
      ) : bookings.length === 0 ? (
        <div className="bookings-empty">
          <p>No bookings found</p>
          <button
            className="btn btn-primary"
            onClick={() => navigate("/mentors")}
          >
            Find Mentors
          </button>
        </div>
      ) : (
        <div className="bookings-list">
          {bookings.map((booking) => {
            console.log("Booking card:", {
              id: booking.id,
              status: booking.status,
              isMentor,
              showConfirm: isMentor && booking.status === "PENDING",
            });
            return (
              <div key={booking.id} className="booking-card">
                <div className="booking-main">
                  <div className="booking-mentor-section">
                    <div className="mentor-avatar">
                      {isMentor
                        ? getInitials(
                            booking.mentee?.user?.firstName,
                            booking.mentee?.user?.lastName
                          )
                        : getInitials(
                            booking.mentor?.user?.firstName,
                            booking.mentor?.user?.lastName
                          )}
                    </div>
                    <div className="booking-info">
                      <div className="booking-header-row">
                        <h3 className="mentor-name">
                          {isMentor
                            ? `${booking.mentee?.user?.firstName} ${booking.mentee?.user?.lastName}`
                            : `${booking.mentor?.user?.firstName} ${booking.mentor?.user?.lastName}`}
                        </h3>
                        <span
                          className={`badge ${getStatusBadgeClass(
                            booking.status
                          )}`}
                        >
                          {getStatusText(booking.status)}
                        </span>
                      </div>
                      <p className="mentor-title">
                        {isMentor
                          ? booking.mentee?.user?.email
                          : booking.mentor?.title}
                      </p>
                      {booking.notes && (
                        <p className="booking-notes">{booking.notes}</p>
                      )}
                      <div className="booking-details">
                        <div className="detail-item">
                          📅{" "}
                          {booking.timeSlot &&
                            formatDate(booking.timeSlot.startTime)}
                        </div>
                        <div className="detail-item">
                          🕐{" "}
                          {booking.timeSlot &&
                            `${formatTime(
                              booking.timeSlot.startTime
                            )} - ${formatTime(booking.timeSlot.endTime)}`}
                        </div>
                        <div className="detail-item">
                          ⏱️ {booking.duration} min
                        </div>
                        <div className="detail-item">
                          💰 ${booking.totalAmount} {booking.currency}
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
                        Confirm
                      </button>
                    )}

                    {canJoinMeeting(booking) && (
                      <button
                        className="btn btn-success"
                        onClick={() =>
                          window.open(booking.meetingLink, "_blank")
                        }
                      >
                        Join Meeting
                      </button>
                    )}

                    {/* Mentee review option */}
                    {!isMentor &&
                      booking.status === "COMPLETED" &&
                      !booking.review && (
                        <button className="btn btn-primary">
                          Leave Review
                        </button>
                      )}

                    {canCancel(booking) && (
                      <button
                        className="btn btn-outline btn-danger"
                        onClick={() => handleCancelBooking(booking.id)}
                      >
                        Cancel
                      </button>
                    )}

                    <button
                      className="btn btn-outline"
                      onClick={() => navigate(`/bookings/${booking.id}`)}
                    >
                      View Details
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
    </div>
  );
};
