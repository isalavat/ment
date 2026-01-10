import React, { useState, useEffect } from "react";
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

  useEffect(() => {
    if (selectedDate) {
      fetchTimeSlots();
    }
  }, [selectedDate, mentorId]);

  const fetchTimeSlots = async () => {
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
        endDate.toISOString()
      );
      setTimeSlots(slots);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to load time slots");
      console.error("Error loading time slots:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedSlot) {
      setError("Please select a time slot");
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
      setError(err.response?.data?.error || "Failed to create booking");
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
          <h2 className="modal-title">Book a Session</h2>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-body">
          {/* Mentor Info */}
          <div className="booking-mentor-info">
            <h3>{mentorName}</h3>
            <p>{mentorTitle}</p>
            <p className="booking-rate">
              ${hourlyRate} <span>/ hour</span>
            </p>
          </div>

          {/* Date Selection */}
          <div className="form-group">
            <label className="form-label">Select Date</label>
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
              Available Time Slots
              {timeSlots.length > 0 && (
                <span className="slots-count">
                  {" "}
                  ({timeSlots.length} available)
                </span>
              )}
            </label>

            {loading ? (
              <div className="booking-loading">Loading available slots...</div>
            ) : timeSlots.length === 0 ? (
              <div className="booking-empty">
                No available time slots for this date. Please select another
                date.
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
                      {getSlotDuration(slot)} min
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
            <label className="form-label">Notes (Optional)</label>
            <textarea
              className="form-textarea"
              placeholder="What would you like to discuss in this session?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
            />
          </div>

          {/* Summary */}
          {selectedSlot && (
            <div className="booking-summary">
              <h4>Booking Summary</h4>
              <div className="summary-row">
                <span>Date:</span>
                <span>
                  {new Date(selectedSlot.startTime).toLocaleDateString()}
                </span>
              </div>
              <div className="summary-row">
                <span>Time:</span>
                <span>
                  {formatTime(selectedSlot.startTime)} -{" "}
                  {formatTime(selectedSlot.endTime)}
                </span>
              </div>
              <div className="summary-row">
                <span>Duration:</span>
                <span>{getSlotDuration(selectedSlot)} minutes</span>
              </div>
              <div className="summary-row summary-total">
                <span>Total Amount:</span>
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
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={!selectedSlot || submitting}
          >
            {submitting ? "Booking..." : "Confirm Booking"}
          </button>
        </div>

        {/* Confirmation Dialog */}
        <ConfirmDialog
          isOpen={showConfirm}
          title="Confirm Booking"
          message={
            selectedSlot
              ? `Confirm booking for ${formatTime(
                  selectedSlot.startTime
                )} - ${formatTime(selectedSlot.endTime)} on ${new Date(
                  selectedSlot.startTime
                ).toLocaleDateString()}? Total: $${calculateAmount(
                  selectedSlot
                )} ${currency}`
              : ""
          }
          type="success"
          confirmText="Book Now"
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
