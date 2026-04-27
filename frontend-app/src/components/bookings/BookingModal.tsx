import React, { useState, useEffect, useCallback } from "react";
import { CalendarRange, Clock3, Sparkles, Ticket, X } from "lucide-react";
import { bookingService } from "../../services/bookingService";
import { TimeSlot } from "../../types/booking";
import { useLanguage } from "../../i18n/LanguageContext";
import { ConfirmDialog } from "../common/ConfirmDialog";
import { AlertDialog } from "../common/AlertDialog";
import "./BookingModal.css";

interface BookingModalProps {
  mentorId: string;
  mentorName: string;
  mentorTitle: string;
  hourlyRate: number;
  currency: string;
  menteeId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  mentorId,
  mentorName,
  mentorTitle,
  hourlyRate,
  currency,
  menteeId,
  onClose,
  onSuccess,
}) => {
  const { t } = useLanguage();
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [selectedDate, setSelectedDate] = useState("");

  // Dialog states
  const [showConfirm, setShowConfirm] = useState(false);
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

  useEffect(() => {
    // Set default date to today
    const today = new Date();
    const formattedDate = today.toISOString().split("T")[0];
    setSelectedDate(formattedDate);
  }, []);

  const fetchTimeSlots = useCallback(async () => {
    if (!selectedDate) return;
    setLoading(true);
    setError("");
    try {
      const startDate = new Date(selectedDate);
      startDate.setHours(0, 0, 0, 0);

      const endDate = new Date(selectedDate);
      endDate.setHours(23, 59, 59, 999);

      const slots = await bookingService.getAvailableTimeSlots(
        mentorId,
        startDate.toISOString(),
        endDate.toISOString(),
      );
      setTimeSlots(slots);
    } catch (err: any) {
      setError(err.response?.data?.error || t.bookings.errors.loadSlotsFailed);
      console.error("Error loading time slots:", err);
    } finally {
      setLoading(false);
    }
  }, [mentorId, selectedDate, t.bookings.errors.loadSlotsFailed]);

  useEffect(() => {
    if (selectedDate) {
      void fetchTimeSlots();
    }
  }, [selectedDate, fetchTimeSlots]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedSlot) {
      setError(t.bookings.errors.selectTimeSlot);
      return;
    }

    setShowConfirm(true);
  };

  const confirmBooking = async () => {
    if (!selectedSlot) return;

    setSubmitting(true);
    setError("");

    try {
      await bookingService.createBooking({
        menteeId,
        mentorId,
        timeSlotId: selectedSlot.id,
        notes: notes || undefined,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || t.bookings.errors.createFailed);
      console.error("Error creating booking:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getSlotDuration = (slot: TimeSlot) => {
    const start = new Date(slot.startTime);
    const end = new Date(slot.endTime);
    const minutes = Math.round((end.getTime() - start.getTime()) / (1000 * 60));
    return minutes;
  };

  const calculateAmount = (slot: TimeSlot) => {
    const duration = getSlotDuration(slot);
    return (hourlyRate * (duration / 60)).toFixed(2);
  };

  // Get min date (today)
  const getMinDate = () => {
    return new Date().toISOString().split("T")[0];
  };

  // Get max date (3 months from now)
  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 3);
    return maxDate.toISOString().split("T")[0];
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 className="modal-title">{t.mentors.detail.bookSession}</h2>
            <p className="modal-subtitle">{t.bookings.chooseDatePickSlot}</p>
          </div>
          <button className="modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {/* Mentor Info */}
          <div className="booking-mentor-info">
            <div className="booking-mentor-info-copy">
              <span className="booking-modal-kicker">
                <Sparkles size={15} />
                {t.bookings.sessionWithKicker}
              </span>
              <h3>{mentorName}</h3>
              <p>{mentorTitle}</p>
            </div>
            <p className="booking-rate">
              ${hourlyRate} <span>{t.mentors.detail.perHour}</span>
            </p>
          </div>

          {/* Date Selection */}
          <div className="form-group">
            <label className="form-label">{t.bookings.selectDate}</label>
            <input
              type="date"
              className="form-input"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={getMinDate()}
              max={getMaxDate()}
            />
          </div>

          {/* Time Slots */}
          <div className="form-group">
            <label className="form-label">
              {t.bookings.availableTimeSlots}
              {timeSlots.length > 0 && (
                <span className="slots-count">
                  {` (${timeSlots.length} ${t.bookings.slotsAvailable})`}
                </span>
              )}
            </label>

            {loading ? (
              <div className="booking-loading">
                {t.bookings.loadingAvailableSlots}
              </div>
            ) : timeSlots.length === 0 ? (
              <div className="booking-empty">
                {t.bookings.noTimeSlotsForDate}
              </div>
            ) : (
              <div className="time-slots-grid">
                {timeSlots.map((slot) => (
                  <button
                    key={slot.id}
                    type="button"
                    className={`time-slot-card ${
                      selectedSlot?.id === slot.id ? "selected" : ""
                    }`}
                    onClick={() => setSelectedSlot(slot)}
                  >
                    <div className="time-slot-time">
                      {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                    </div>
                    <div className="time-slot-duration">
                      {getSlotDuration(slot)} {t.bookings.minutes}
                    </div>
                    <div className="time-slot-price">
                      ${calculateAmount(slot)}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="form-group">
            <label className="form-label">{t.bookings.notesOptional}</label>
            <textarea
              className="form-textarea"
              placeholder={t.bookings.notesPlaceholder}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
            />
          </div>

          {/* Summary */}
          {selectedSlot && (
            <div className="booking-summary">
              <h4>{t.bookings.bookingSummary}</h4>
              <div className="summary-row">
                <span>
                  <CalendarRange size={15} /> {t.dashboard.date}
                </span>
                <span>
                  {new Date(selectedSlot.startTime).toLocaleDateString()}
                </span>
              </div>
              <div className="summary-row">
                <span>
                  <Clock3 size={15} /> {t.bookings.time}
                </span>
                <span>
                  {formatTime(selectedSlot.startTime)} -{" "}
                  {formatTime(selectedSlot.endTime)}
                </span>
              </div>
              <div className="summary-row">
                <span>
                  <Ticket size={15} /> {t.bookings.duration}
                </span>
                <span>
                  {getSlotDuration(selectedSlot)} {t.bookings.minutes}
                </span>
              </div>
              <div className="summary-row summary-total">
                <span>{t.bookings.totalAmountLabel}</span>
                <span>
                  ${calculateAmount(selectedSlot)} {currency}
                </span>
              </div>
            </div>
          )}

          {error && <div className="booking-error">{error}</div>}
        </div>

        <div className="modal-footer">
          <button
            type="button"
            className="btn btn-outline"
            onClick={onClose}
            disabled={submitting}
          >
            {t.common.cancel}
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={!selectedSlot || submitting}
          >
            {submitting
              ? t.bookings.bookingInProgress
              : t.bookings.confirmBooking}
          </button>
        </div>

        {/* Confirmation Dialog */}
        <ConfirmDialog
          isOpen={showConfirm}
          title={t.bookings.confirmBooking}
          message={
            selectedSlot
              ? `${t.bookings.confirmBookingPrompt} ${formatTime(
                  selectedSlot.startTime,
                )} - ${formatTime(selectedSlot.endTime)} on ${new Date(
                  selectedSlot.startTime,
                ).toLocaleDateString()} ${t.bookings.totalLabel} $${calculateAmount(
                  selectedSlot,
                )} ${currency}`
              : ""
          }
          type="success"
          confirmText={t.bookings.bookNow}
          onConfirm={confirmBooking}
          onCancel={() => setShowConfirm(false)}
        />

        <AlertDialog
          isOpen={alertDialog.isOpen}
          title={alertDialog.title}
          message={alertDialog.message}
          type={alertDialog.type}
          onClose={() => setAlertDialog({ ...alertDialog, isOpen: false })}
        />
      </div>
    </div>
  );
};
