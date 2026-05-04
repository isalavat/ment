import React, { useState, useEffect, useCallback, useMemo } from "react";
import { CalendarRange, Clock3, Sparkles, Ticket, X } from "lucide-react";
import { bookingService } from "../../services/bookingService";
import {
  availabilityService,
  Availability,
} from "../../services/availabilityService";
import { TimeSlot } from "../../types/booking";
import { useLanguage } from "../../i18n/LanguageContext";
import { ConfirmDialog } from "../common/ConfirmDialog";
import { AlertDialog } from "../common/AlertDialog";
import { WeekTimelineGrid } from "../common/WeekTimelineGrid";
import { DateTimeRangePicker } from "../common/DateTimeRangePicker";
import "./BookingModal.css";

interface BookingModalProps {
  mentorId: string;
  mentorName: string;
  mentorTitle: string;
  hourlyRate: number;
  currency: string;
  menteeId: string;
  initialDate?: string;
  inline?: boolean;
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
  initialDate,
  inline = false,
  onClose,
  onSuccess,
}) => {
  const { t } = useLanguage();
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [legacyTimeSlots, setLegacyTimeSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [calendarSlots, setCalendarSlots] = useState<TimeSlot[]>([]);
  const [bookingDraft, setBookingDraft] = useState({
    startDate: "",
    startTime: "09:00",
    endDate: "",
    endTime: "10:00",
  });
  const [activePicker, setActivePicker] = useState<"start" | "end" | null>(
    null,
  );
  const [pickerDraft, setPickerDraft] = useState({ date: "", time: "09:00" });
  const [pickerMonth, setPickerMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const getWeekStart = (dateStr: string) => {
    const date = new Date(dateStr);
    const day = date.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    date.setDate(date.getDate() + diff);
    date.setHours(0, 0, 0, 0);
    return date;
  };

  const getWeekDates = (dateStr: string) => {
    if (!dateStr) return [] as Date[];
    const start = getWeekStart(dateStr);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  };

  const toHourKey = (date: Date) =>
    `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${date.getHours()}`;

  const shiftSelectedWeek = (deltaDays: number) => {
    const base = new Date(selectedDate);
    base.setDate(base.getDate() + deltaDays);
    setSelectedDate(base.toISOString().split("T")[0]);
    setSelectedSlot(null);
  };

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
    // Set default date to preview-selected date or fallback to today.
    const today = new Date();
    const formattedDate = today.toISOString().split("T")[0];
    const baseDate = initialDate || formattedDate;
    setSelectedDate(baseDate);
    setBookingDraft((prev) => ({
      ...prev,
      startDate: baseDate,
      endDate: baseDate,
    }));
  }, [initialDate]);

  const fetchTimeSlots = useCallback(async () => {
    if (!selectedDate) return;
    setLoading(true);
    setError("");
    try {
      const startDate = getWeekStart(selectedDate);
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);

      const [availabilities, computedSlots, legacySlots] = await Promise.all([
        availabilityService.getAvailabilitiesForMentor(mentorId),
        bookingService.getComputedBookableSlots(
          mentorId,
          startDate.toISOString(),
          endDate.toISOString(),
          15,
          60,
        ),
        bookingService.getAvailableTimeSlots(
          mentorId,
          startDate.toISOString(),
          endDate.toISOString(),
        ),
      ]);

      const weekDates = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(startDate);
        d.setDate(startDate.getDate() + i);
        return d;
      });
      const cellMap = new Map<string, TimeSlot>();

      // Mirror mentor-side view: template availability first.
      availabilities.forEach((availability: Availability) => {
        const [startHour] = availability.startTime.split(":").map(Number);
        const [endHour] = availability.endTime.split(":").map(Number);

        weekDates.forEach((day) => {
          const dayIso = day.toISOString().split("T")[0];
          const matchRecurring =
            availability.isRecurring && availability.dayOfWeek === day.getDay();
          const matchSpecific =
            !availability.isRecurring &&
            availability.specificDate?.split("T")[0] === dayIso;

          if (!matchRecurring && !matchSpecific) return;

          for (let hour = startHour; hour < endHour; hour += 1) {
            const start = new Date(day);
            start.setHours(hour, 0, 0, 0);
            const end = new Date(start);
            end.setHours(hour + 1, 0, 0, 0);
            cellMap.set(toHourKey(start), {
              id: `avail-${availability.id}-${toHourKey(start)}`,
              mentorId,
              startTime: start.toISOString(),
              endTime: end.toISOString(),
              status: "AVAILABLE",
            });
          }
        });
      });

      // Overlay computed bookable slots as authoritative status.
      computedSlots.forEach((slot) => {
        const start = new Date(slot.startTime);
        cellMap.set(toHourKey(start), slot);
      });

      setCalendarSlots(Array.from(cellMap.values()));
      setLegacyTimeSlots(
        legacySlots.filter((slot) => slot.status === "AVAILABLE"),
      );
      setTimeSlots(computedSlots.filter((slot) => slot.status === "AVAILABLE"));
    } catch (err: any) {
      try {
        // Fallback while backend booking still depends on generated slot IDs.
        const startDate = getWeekStart(selectedDate);
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);

        const [availabilities, legacySlots] = await Promise.all([
          availabilityService.getAvailabilitiesForMentor(mentorId),
          bookingService.getMentorTimeSlots(
            mentorId,
            startDate.toISOString(),
            endDate.toISOString(),
          ),
        ]);

        const weekDates = Array.from({ length: 7 }, (_, i) => {
          const d = new Date(startDate);
          d.setDate(startDate.getDate() + i);
          return d;
        });
        const cellMap = new Map<string, TimeSlot>();

        availabilities.forEach((availability: Availability) => {
          const [startHour] = availability.startTime.split(":").map(Number);
          const [endHour] = availability.endTime.split(":").map(Number);

          weekDates.forEach((day) => {
            const dayIso = day.toISOString().split("T")[0];
            const matchRecurring =
              availability.isRecurring && availability.dayOfWeek === day.getDay();
            const matchSpecific =
              !availability.isRecurring &&
              availability.specificDate?.split("T")[0] === dayIso;

            if (!matchRecurring && !matchSpecific) return;

            for (let hour = startHour; hour < endHour; hour += 1) {
              const start = new Date(day);
              start.setHours(hour, 0, 0, 0);
              const end = new Date(start);
              end.setHours(hour + 1, 0, 0, 0);
              cellMap.set(toHourKey(start), {
                id: `avail-${availability.id}-${toHourKey(start)}`,
                mentorId,
                startTime: start.toISOString(),
                endTime: end.toISOString(),
                status: "AVAILABLE",
              });
            }
          });
        });

        legacySlots.forEach((slot) => {
          const start = new Date(slot.startTime);
          cellMap.set(toHourKey(start), slot);
        });

        setCalendarSlots(Array.from(cellMap.values()));
        const availableLegacySlots = legacySlots.filter(
          (slot) => slot.status === "AVAILABLE",
        );
        setTimeSlots(availableLegacySlots);
        setLegacyTimeSlots(availableLegacySlots);
      } catch (fallbackErr: any) {
        setError(
          fallbackErr.response?.data?.error || t.bookings.errors.loadSlotsFailed,
        );
        console.error("Error loading time slots:", fallbackErr);
      }
    } finally {
      setLoading(false);
    }
  }, [mentorId, selectedDate, t.bookings.errors.loadSlotsFailed]);

  useEffect(() => {
    if (selectedDate) {
      void fetchTimeSlots();
    }
  }, [selectedDate, fetchTimeSlots]);

  const handleSubmit = () => {
    if (!selectedRangeSlot) {
      setError(t.bookings.errors.selectTimeSlot);
      return;
    }

    setSelectedSlot(selectedRangeSlot);

    setShowConfirm(true);
  };

  const resolveBookableSlotId = useCallback(() => {
    return (
      legacyTimeSlots.find((slot) => {
        const start = new Date(slot.startTime);
        const end = new Date(slot.endTime);

        const slotStartDate = start.toISOString().split("T")[0];
        const slotEndDate = end.toISOString().split("T")[0];
        const slotStartTime = `${String(start.getHours()).padStart(2, "0")}:${String(
          start.getMinutes(),
        ).padStart(2, "0")}`;
        const slotEndTime = `${String(end.getHours()).padStart(2, "0")}:${String(
          end.getMinutes(),
        ).padStart(2, "0")}`;

        return (
          slotStartDate === bookingDraft.startDate &&
          slotStartTime === bookingDraft.startTime &&
          slotEndDate === bookingDraft.endDate &&
          slotEndTime === bookingDraft.endTime
        );
      }) || null
    );
  }, [
    legacyTimeSlots,
    bookingDraft.startDate,
    bookingDraft.startTime,
    bookingDraft.endDate,
    bookingDraft.endTime,
  ]);

  const confirmBooking = async () => {
    if (!selectedSlot) return;

    const slotForBooking = resolveBookableSlotId() || selectedSlot;

    setSubmitting(true);
    setError("");

    try {
      await bookingService.createBooking({
        menteeId,
        mentorId,
        timeSlotId: slotForBooking.id.startsWith("computed-")
          ? undefined
          : slotForBooking.id,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
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

  const weekDates = getWeekDates(selectedDate);
  const availableSlotsSorted = [...timeSlots].sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
  );

  const slotsForSelectedDate = availableSlotsSorted.filter(
    (slot) =>
      new Date(slot.startTime).toISOString().split("T")[0] === selectedDate,
  );

  const findSlotByRange = useCallback(
    (
      startDate: string,
      startTime: string,
      endDate: string,
      endTime: string,
    ) => {
      return availableSlotsSorted.find((slot) => {
        const start = new Date(slot.startTime);
        const end = new Date(slot.endTime);
        const slotStartDate = start.toISOString().split("T")[0];
        const slotEndDate = end.toISOString().split("T")[0];
        const slotStartTime = `${String(start.getHours()).padStart(2, "0")}:${String(
          start.getMinutes(),
        ).padStart(2, "0")}`;
        const slotEndTime = `${String(end.getHours()).padStart(2, "0")}:${String(
          end.getMinutes(),
        ).padStart(2, "0")}`;
        return (
          slotStartDate === startDate &&
          slotStartTime === startTime &&
          slotEndDate === endDate &&
          slotEndTime === endTime
        );
      });
    },
    [availableSlotsSorted],
  );

  const formatDateTimeLabel = (date: string, time: string) => {
    if (!date) return "--";
    const dt = new Date(`${date}T${time}:00`);
    if (Number.isNaN(dt.getTime())) return "--";
    return dt.toLocaleString([], {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const openPicker = (target: "start" | "end") => {
    const sourceDate =
      target === "start" ? bookingDraft.startDate : bookingDraft.endDate;
    const sourceTime =
      target === "start" ? bookingDraft.startTime : bookingDraft.endTime;
    setPickerDraft({ date: sourceDate || selectedDate, time: sourceTime });
    if (sourceDate) {
      const [year, month] = sourceDate.split("-").map(Number);
      setPickerMonth(new Date(year, month - 1, 1));
    }
    setActivePicker(target);
  };

  const pickerTimeOptions = useMemo(() => {
    if (!pickerDraft.date) {
      return [] as string[];
    }

    if (activePicker === "start") {
      const values = availableSlotsSorted
        .filter(
          (slot) =>
            new Date(slot.startTime).toISOString().split("T")[0] ===
            pickerDraft.date,
        )
        .map((slot) => {
          const d = new Date(slot.startTime);
          return `${String(d.getHours()).padStart(2, "0")}:${String(
            d.getMinutes(),
          ).padStart(2, "0")}`;
        });
      return Array.from(new Set(values));
    }

    const values = availableSlotsSorted
      .filter((slot) => {
        const slotStart = new Date(slot.startTime);
        const startDate = slotStart.toISOString().split("T")[0];
        const startTime = `${String(slotStart.getHours()).padStart(2, "0")}:${String(
          slotStart.getMinutes(),
        ).padStart(2, "0")}`;
        return (
          startDate === bookingDraft.startDate &&
          startTime === bookingDraft.startTime
        );
      })
      .map((slot) => {
        const d = new Date(slot.endTime);
        return `${String(d.getHours()).padStart(2, "0")}:${String(
          d.getMinutes(),
        ).padStart(2, "0")}`;
      });

    return Array.from(new Set(values));
  }, [
    activePicker,
    availableSlotsSorted,
    pickerDraft.date,
    bookingDraft.startDate,
    bookingDraft.startTime,
  ]);

  const calendarCells = useMemo(() => {
    const firstDay = new Date(
      pickerMonth.getFullYear(),
      pickerMonth.getMonth(),
      1,
    );
    const startOffset = (firstDay.getDay() + 6) % 7;
    const startDate = new Date(firstDay);
    startDate.setDate(firstDay.getDate() - startOffset);

    return Array.from({ length: 42 }, (_, idx) => {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + idx);
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, "0");
      const dd = String(date.getDate()).padStart(2, "0");
      const iso = `${yyyy}-${mm}-${dd}`;
      const hasAvailability = calendarSlots.some(
        (slot) => new Date(slot.startTime).toISOString().split("T")[0] === iso,
      );
      const hasBookableSlot = availableSlotsSorted.some(
        (slot) => new Date(slot.startTime).toISOString().split("T")[0] === iso,
      );
      return {
        date,
        iso,
        inMonth: date.getMonth() === pickerMonth.getMonth(),
        disabled: !hasAvailability,
        hasBookableSlot,
      };
    });
  }, [pickerMonth, availableSlotsSorted, calendarSlots]);

  const pickerQuarterTimeOptions = useMemo(
    () =>
      pickerTimeOptions.filter((time) => Number(time.split(":")[1]) % 15 === 0),
    [pickerTimeOptions],
  );

  useEffect(() => {
    if (
      !activePicker ||
      !pickerDraft.date ||
      pickerQuarterTimeOptions.length === 0
    )
      return;
    if (pickerQuarterTimeOptions.includes(pickerDraft.time)) return;
    setPickerDraft((prev) => ({ ...prev, time: pickerQuarterTimeOptions[0] }));
  }, [
    activePicker,
    pickerDraft.date,
    pickerDraft.time,
    pickerQuarterTimeOptions,
  ]);

  function applyPicker(dateOverride?: string, timeOverride?: string) {
    if (!activePicker) return;

    const effectiveDate = dateOverride ?? pickerDraft.date;
    const effectiveTime = timeOverride ?? pickerDraft.time;

    if (!effectiveDate || !effectiveTime) return;

    if (activePicker === "start") {
      const startMatch = availableSlotsSorted.find((slot) => {
        const start = new Date(slot.startTime);
        const date = start.toISOString().split("T")[0];
        const time = `${String(start.getHours()).padStart(2, "0")}:${String(
          start.getMinutes(),
        ).padStart(2, "0")}`;
        return date === effectiveDate && time === effectiveTime;
      });

      if (!startMatch) {
        setError(t.bookings.errors.selectTimeSlot);
        return;
      }

      const end = new Date(startMatch.endTime);
      const endDate = end.toISOString().split("T")[0];
      const endTime = `${String(end.getHours()).padStart(2, "0")}:${String(
        end.getMinutes(),
      ).padStart(2, "0")}`;

      setBookingDraft({
        startDate: effectiveDate,
        startTime: effectiveTime,
        endDate,
        endTime,
      });
      setSelectedDate(effectiveDate);
      setSelectedSlot(startMatch);
      setError("");
      setActivePicker(null);
      return;
    }

    const matched = findSlotByRange(
      bookingDraft.startDate,
      bookingDraft.startTime,
      effectiveDate,
      effectiveTime,
    );

    if (!matched) {
      setError(t.bookings.errors.selectTimeSlot);
      return;
    }

    setBookingDraft((prev) => ({
      ...prev,
      endDate: effectiveDate,
      endTime: effectiveTime,
    }));
    setSelectedSlot(matched);
    setError("");
    setActivePicker(null);
  }

  const handlePickerTimeChange = (time: string) => {
    if (!pickerDraft.date) return;
    setPickerDraft((prev) => ({ ...prev, time }));
    applyPicker(pickerDraft.date, time);
  };

  useEffect(() => {
    if (!bookingDraft.startDate || !bookingDraft.endDate) return;
    const matched = findSlotByRange(
      bookingDraft.startDate,
      bookingDraft.startTime,
      bookingDraft.endDate,
      bookingDraft.endTime,
    );
    if (matched) {
      setSelectedSlot(matched);
    }
  }, [
    bookingDraft.startDate,
    bookingDraft.startTime,
    bookingDraft.endDate,
    bookingDraft.endTime,
    timeSlots,
    findSlotByRange,
  ]);

  const calculateAmount = (slot: TimeSlot) => {
    const duration = getSlotDuration(slot);
    return (hourlyRate * (duration / 60)).toFixed(2);
  };

  const selectedRangeSlot = useMemo(
    () =>
      findSlotByRange(
        bookingDraft.startDate,
        bookingDraft.startTime,
        bookingDraft.endDate,
        bookingDraft.endTime,
      ),
    [
      bookingDraft.startDate,
      bookingDraft.startTime,
      bookingDraft.endDate,
      bookingDraft.endTime,
      findSlotByRange,
    ],
  );

  const isCurrentRangeBookable = Boolean(selectedRangeSlot);

  return (
    <div
      className={`modal-overlay ${inline ? "booking-inline-overlay" : ""}`}
      onClick={inline ? undefined : onClose}
    >
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

          <DateTimeRangePicker
            startLabel={t.availability.manager.startTime}
            endLabel={t.availability.manager.endTime}
            timeLabel={t.bookings.time}
            startValue={formatDateTimeLabel(
              bookingDraft.startDate,
              bookingDraft.startTime,
            )}
            endValue={formatDateTimeLabel(
              bookingDraft.endDate,
              bookingDraft.endTime,
            )}
            activePicker={activePicker}
            pickerMonth={pickerMonth}
            calendarCells={calendarCells.map((cell) => ({
              iso: cell.iso,
              date: cell.date,
              inMonth: cell.inMonth,
              disabled: cell.disabled,
              bookable: cell.hasBookableSlot,
            }))}
            selectedDate={pickerDraft.date}
            timeOptions={pickerQuarterTimeOptions}
            selectedTime={pickerDraft.time}
            emptyTimeLabel={t.bookings.noTimeSlotsForDate}
            onOpenPicker={openPicker}
            onClosePicker={() => setActivePicker(null)}
            onPrevMonth={() =>
              setPickerMonth(
                (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1),
              )
            }
            onNextMonth={() =>
              setPickerMonth(
                (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1),
              )
            }
            onSelectDate={(dateIso) =>
              setPickerDraft((prev) => ({ ...prev, date: dateIso }))
            }
            onSelectTime={handlePickerTimeChange}
          />

          {/* Time Slots */}
          <div className="form-group">
            <label className="form-label">
              {t.bookings.availableTimeSlots}
              {slotsForSelectedDate.length > 0 && (
                <span className="slots-count">
                  {` (${slotsForSelectedDate.length} ${t.bookings.slotsAvailable})`}
                </span>
              )}
            </label>

            <div className="booking-week-nav">
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => shiftSelectedWeek(-7)}
              >
                {t.common.back}
              </button>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => shiftSelectedWeek(7)}
              >
                {t.common.next}
              </button>
            </div>

            {loading ? (
              <div className="booking-loading">
                {t.bookings.loadingAvailableSlots}
              </div>
            ) : calendarSlots.length === 0 ? (
              <div className="booking-empty">
                {t.bookings.noTimeSlotsForDate}
              </div>
            ) : (
              <WeekTimelineGrid
                weekDates={weekDates}
                slots={calendarSlots}
                mergeAdjacentSlots
                hourStart={0}
                hourEnd={24}
                hourHeight={24}
              />
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
          <span
            className={`booking-bookable-indicator ${
              isCurrentRangeBookable ? "valid" : "invalid"
            }`}
          >
            {isCurrentRangeBookable
              ? `${t.bookings.time}: ${t.availability.status.available}`
              : `${t.bookings.time}: ${t.availability.status.unavailable}`}
          </span>
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
            disabled={!isCurrentRangeBookable || submitting}
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
