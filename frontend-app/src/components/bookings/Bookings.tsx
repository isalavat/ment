import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Sparkles,
  Ticket,
  Video,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../../i18n/LanguageContext";
import { useAuth } from "../../contexts/AuthContext";
import { bookingService } from "../../services/bookingService";
import { Booking } from "../../types/booking";
import { ConfirmDialog } from "../common/ConfirmDialog";
import { AlertDialog } from "../common/AlertDialog";
import { PageShell } from "../common/PageShell";
import {
  WeekTimelineGrid,
  type TimelineSlot,
} from "../common/WeekTimelineGrid";
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
  const [weekAnchorDate, setWeekAnchorDate] = useState(
    () => new Date().toISOString().split("T")[0],
  );
  const [selectedDate, setSelectedDate] = useState(
    () => new Date().toISOString().split("T")[0],
  );

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

  const getCounterpartName = (booking: Booking) => {
    if (isMentor) {
      return `${booking.mentee?.firstName ?? ""} ${booking.mentee?.lastName ?? ""}`.trim();
    }
    return `${booking.mentor?.user?.firstName ?? ""} ${booking.mentor?.user?.lastName ?? ""}`.trim();
  };

  const bookingRoleClass = isMentor
    ? "booking-role-mentor"
    : "booking-role-mentee";

  const bookingsByDate = useMemo(() => {
    const map = new Map<string, Booking[]>();
    bookings.forEach((booking) => {
      const start = booking.timeSlot?.startTime;
      if (!start) return;
      const key = new Date(start).toISOString().split("T")[0];
      const arr = map.get(key) ?? [];
      arr.push(booking);
      map.set(key, arr);
    });

    map.forEach((arr) => {
      arr.sort(
        (a, b) =>
          new Date(a.timeSlot?.startTime ?? "").getTime() -
          new Date(b.timeSlot?.startTime ?? "").getTime(),
      );
    });

    return map;
  }, [bookings]);

  const weekDates = useMemo(() => {
    const start = new Date(weekAnchorDate);
    const day = start.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    start.setDate(start.getDate() + diff);
    start.setHours(0, 0, 0, 0);
    return Array.from({ length: 7 }, (_, idx) => {
      const d = new Date(start);
      d.setDate(start.getDate() + idx);
      return d;
    });
  }, [weekAnchorDate]);

  const calendarSlots = useMemo<TimelineSlot[]>(() => {
    return bookings
      .filter(
        (booking) => booking.timeSlot?.startTime && booking.timeSlot?.endTime,
      )
      .map((booking) => ({
        id: booking.id,
        startTime: booking.timeSlot!.startTime,
        endTime: booking.timeSlot!.endTime,
        status:
          booking.status === "CANCELLED_BY_MENTOR" ||
          booking.status === "CANCELLED_BY_USER"
            ? "UNAVAILABLE"
            : "AVAILABLE",
      }));
  }, [bookings]);

  const selectedDateBookings = bookingsByDate.get(selectedDate) ?? [];

  const shiftWeek = (deltaDays: number) => {
    const nextAnchor = new Date(weekAnchorDate);
    nextAnchor.setDate(nextAnchor.getDate() + deltaDays);
    const nextAnchorIso = nextAnchor.toISOString().split("T")[0];
    setWeekAnchorDate(nextAnchorIso);

    const nextSelected = new Date(selectedDate);
    nextSelected.setDate(nextSelected.getDate() + deltaDays);
    setSelectedDate(nextSelected.toISOString().split("T")[0]);
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
        <>
          <section className="booking-calendar-card card">
            <div className="booking-calendar-head">
              <button
                type="button"
                className="btn btn-outline btn-sm booking-week-nav-btn"
                onClick={() => shiftWeek(-7)}
                aria-label={t.common.back}
              >
                <ChevronLeft size={14} />
                <span className="booking-week-nav-text">{t.common.back}</span>
              </button>
              <h3>
                {weekDates[0]?.toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })}{" "}
                {" - "}
                {weekDates[6]?.toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </h3>
              <button
                type="button"
                className="btn btn-outline btn-sm booking-week-nav-btn"
                onClick={() => shiftWeek(7)}
                aria-label={t.common.next}
              >
                <span className="booking-week-nav-text">{t.common.next}</span>
                <ChevronRight size={14} />
              </button>
            </div>

            <div
              className={`bookings-week-wrap ${
                isMentor
                  ? "bookings-week-role-mentor"
                  : "bookings-week-role-mentee"
              }`}
            >
              <WeekTimelineGrid
                weekDates={weekDates}
                slots={calendarSlots}
                hourStart={6}
                hourEnd={22}
                hourHeight={16}
                interactiveStatuses={["AVAILABLE", "BOOKED", "UNAVAILABLE"]}
                onCellClick={(day) => {
                  setSelectedDate(day.toISOString().split("T")[0]);
                }}
                onSlotClick={(slot) => {
                  const slotDate = new Date(slot.startTime)
                    .toISOString()
                    .split("T")[0];
                  setSelectedDate(slotDate);
                  navigate(`/bookings/${slot.id}`);
                }}
              />
            </div>

            <div className="booking-calendar-agenda">
              <strong>
                {new Date(`${selectedDate}T00:00:00`).toLocaleDateString(
                  undefined,
                  {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  },
                )}
              </strong>
              {selectedDateBookings.length === 0 ? (
                <p className="booking-calendar-agenda-empty">
                  {t.bookings.noBookingsFound}
                </p>
              ) : (
                <div className="booking-calendar-agenda-list">
                  {selectedDateBookings.map((booking) => (
                    <button
                      type="button"
                      key={booking.id}
                      className={`booking-calendar-agenda-item ${bookingRoleClass}`}
                      onClick={() => navigate(`/bookings/${booking.id}`)}
                    >
                      <span>
                        {formatTime(booking.timeSlot?.startTime ?? "")} -{" "}
                        {formatTime(booking.timeSlot?.endTime ?? "")}
                      </span>
                      <strong>{getCounterpartName(booking)}</strong>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </section>

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
                        className="btn btn-outline booking-action-details"
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
        </>
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
