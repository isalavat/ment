import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  CalendarRange,
  Clock3,
  Plus,
  Repeat,
  Sparkles,
  Ticket,
  Trash2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import {
  availabilityService,
  Availability,
  WeeklyScheduleSlot,
} from "../../services/availabilityService";
import { useLanguage } from "../../i18n/LanguageContext";
import { PageShell } from "../common/PageShell";
import {
  WeekTimelineGrid,
  type TimelineSlot,
} from "../common/WeekTimelineGrid";
import { DateTimeRangePicker } from "../common/DateTimeRangePicker";
import "./AvailabilityManager.css";

const DAYS_OF_WEEK = [0, 1, 2, 3, 4, 5, 6] as const;

interface CalendarCell extends TimelineSlot {
  availabilityId?: string;
}

export const AvailabilityManager: React.FC = () => {
  const { user, login } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [availabilities, setAvailabilities] = useState<Availability[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [showWeeklyForm, setShowWeeklyForm] = useState(false);
  const [generatingSlots, setGeneratingSlots] = useState(false);
  const [quickCreating, setQuickCreating] = useState(false);
  const [calendarAnchorDate, setCalendarAnchorDate] = useState("");
  const [calendarSlots, setCalendarSlots] = useState<CalendarCell[]>([]);
  const [rangeDraft, setRangeDraft] = useState({
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

  const [generateForm, setGenerateForm] = useState({
    startDate: "",
    endDate: "",
    slotDuration: 60,
  });

  // Single availability form
  const [formData, setFormData] = useState({
    dayOfWeek: 1,
    startTime: "09:00",
    endTime: "17:00",
    isRecurring: true,
    specificDate: "",
  });

  // Weekly schedule form
  const [weeklySchedule, setWeeklySchedule] = useState<
    Record<number, { enabled: boolean; startTime: string; endTime: string }>
  >({
    1: { enabled: false, startTime: "09:00", endTime: "17:00" },
    2: { enabled: false, startTime: "09:00", endTime: "17:00" },
    3: { enabled: false, startTime: "09:00", endTime: "17:00" },
    4: { enabled: false, startTime: "09:00", endTime: "17:00" },
    5: { enabled: false, startTime: "09:00", endTime: "17:00" },
    6: { enabled: false, startTime: "09:00", endTime: "17:00" },
    0: { enabled: false, startTime: "09:00", endTime: "17:00" },
  });

  const fetchAvailabilities = useCallback(async () => {
    if (!user?.mentorProfileId) return;

    setLoading(true);
    setError("");
    try {
      const data = await availabilityService.getAvailabilitiesForMentor(
        user.mentorProfileId,
      );
      setAvailabilities(data);
      if (user) {
        const hasAvailability = data.length > 0;
        if (user.mentorHasAvailability !== hasAvailability) {
          const updatedUser = {
            ...user,
            mentorHasAvailability: hasAvailability,
          };
          localStorage.setItem("user", JSON.stringify(updatedUser));
          login(updatedUser);
        }
      }
    } catch (err: any) {
      setError(
        err.response?.data?.error || t.availability.manager.errors.loadFailed,
      );
      console.error("Error loading availabilities:", err);
    } finally {
      setLoading(false);
    }
  }, [user, login, t.availability.manager.errors.loadFailed]);

  useEffect(() => {
    if (user?.mentorProfileId) {
      void fetchAvailabilities();
    }
  }, [user?.mentorProfileId, fetchAvailabilities]);

  useEffect(() => {
    const today = new Date();
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    setGenerateForm({
      startDate: today.toISOString().split("T")[0],
      endDate: nextMonth.toISOString().split("T")[0],
      slotDuration: 60,
    });
    setCalendarAnchorDate(today.toISOString().split("T")[0]);
    setRangeDraft({
      startDate: today.toISOString().split("T")[0],
      startTime: "09:00",
      endDate: today.toISOString().split("T")[0],
      endTime: "10:00",
    });
  }, []);

  const getStartOfWeek = (dateStr: string) => {
    const date = new Date(dateStr);
    const day = date.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    date.setDate(date.getDate() + diff);
    date.setHours(0, 0, 0, 0);
    return date;
  };

  const getWeekDates = (anchorDate: string) => {
    if (!anchorDate) return [] as Date[];
    const start = getStartOfWeek(anchorDate);
    return Array.from({ length: 7 }, (_, idx) => {
      const date = new Date(start);
      date.setDate(start.getDate() + idx);
      return date;
    });
  };

  const weekDates = getWeekDates(calendarAnchorDate);

  const toHourKey = (date: Date) =>
    `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${date.getHours()}`;

  const buildCalendarSlots = useCallback(
    async (week: Date[]) => {
      if (!user?.mentorProfileId || week.length === 0) return;

      const cellMap = new Map<string, CalendarCell>();

      // Overlay availability templates as AVAILABLE.
      availabilities.forEach((availability) => {
        const [startHour] = availability.startTime.split(":").map(Number);
        const [endHour] = availability.endTime.split(":").map(Number);

        week.forEach((day) => {
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
              availabilityId: availability.id,
              startTime: start.toISOString(),
              endTime: end.toISOString(),
              status: "AVAILABLE",
            });
          }
        });
      });

      // Overlay generated slot status (booked/unavailable/available) when present.
      const startDate = new Date(week[0]);
      const endDate = new Date(week[week.length - 1]);
      endDate.setHours(23, 59, 59, 999);
      const generatedSlots = await availabilityService.getTimeSlotsForMentor(
        user.mentorProfileId,
        startDate.toISOString(),
        endDate.toISOString(),
      );

      generatedSlots.forEach((slot: any) => {
        const start = new Date(slot.startTime);
        const hourKey = toHourKey(start);
        cellMap.set(hourKey, {
          id: slot.id,
          startTime: slot.startTime,
          endTime: slot.endTime,
          status: slot.status,
        });
      });

      setCalendarSlots(Array.from(cellMap.values()));
    },
    [user?.mentorProfileId, availabilities],
  );

  useEffect(() => {
    if (weekDates.length > 0) {
      void buildCalendarSlots(weekDates);
    }
  }, [weekDates, buildCalendarSlots]);

  const handleApplyRange = async () => {
    if (!user?.mentorProfileId) return;

    const start = new Date(
      `${rangeDraft.startDate}T${rangeDraft.startTime}:00`,
    );
    const end = new Date(`${rangeDraft.endDate}T${rangeDraft.endTime}:00`);
    if (
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime()) ||
      end <= start
    ) {
      alert(t.availability.manager.errors.createFailed);
      return;
    }
    if (start.toDateString() !== end.toDateString()) {
      alert(t.availability.manager.errors.createFailed);
      return;
    }
    const startTime = `${String(start.getHours()).padStart(2, "0")}:${String(
      start.getMinutes(),
    ).padStart(2, "0")}`;
    const endTime = `${String(end.getHours()).padStart(2, "0")}:${String(
      end.getMinutes(),
    ).padStart(2, "0")}`;
    const specificDate = start.toISOString().split("T")[0];

    setQuickCreating(true);
    try {
      await availabilityService.createAvailability({
        mentorId: user.mentorProfileId,
        startTime,
        endTime,
        isRecurring: false,
        specificDate,
      });
      await fetchAvailabilities();
    } catch (err: any) {
      alert(
        err.response?.data?.error || t.availability.manager.errors.createFailed,
      );
      console.error("Error creating calendar availability:", err);
    } finally {
      setQuickCreating(false);
    }
  };

  const openPicker = (target: "start" | "end") => {
    const sourceDate =
      target === "start" ? rangeDraft.startDate : rangeDraft.endDate;
    if (target === "start") {
      setPickerDraft({
        date: rangeDraft.startDate,
        time: rangeDraft.startTime,
      });
    } else {
      setPickerDraft({ date: rangeDraft.endDate, time: rangeDraft.endTime });
    }
    if (sourceDate) {
      const [year, month] = sourceDate.split("-").map(Number);
      setPickerMonth(new Date(year, month - 1, 1));
    }
    setActivePicker(target);
  };

  function applyPicker(dateOverride?: string, timeOverride?: string) {
    if (!activePicker) return;
    const effectiveDate = dateOverride ?? pickerDraft.date;
    const effectiveTime = timeOverride ?? pickerDraft.time;
    if (!effectiveDate || !effectiveTime) return;

    if (activePicker === "start") {
      setRangeDraft((prev) => ({
        ...prev,
        startDate: effectiveDate,
        startTime: effectiveTime,
      }));
      setCalendarAnchorDate(effectiveDate);
    } else {
      setRangeDraft((prev) => ({
        ...prev,
        endDate: effectiveDate,
        endTime: effectiveTime,
      }));
    }
    setActivePicker(null);
  }

  const handlePickerTimeChange = (time: string) => {
    if (!pickerDraft.date) return;
    setPickerDraft((prev) => ({ ...prev, time }));
    applyPicker(pickerDraft.date, time);
  };

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
      return {
        date,
        iso: `${yyyy}-${mm}-${dd}`,
        inMonth: date.getMonth() === pickerMonth.getMonth(),
      };
    });
  }, [pickerMonth]);

  const timeOptions = useMemo(() => {
    const options: string[] = [];
    for (let hour = 0; hour < 24; hour += 1) {
      for (let minute = 0; minute < 60; minute += 15) {
        options.push(
          `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
        );
      }
    }
    return options;
  }, []);

  const handleAddAvailability = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.mentorProfileId) return;

    try {
      await availabilityService.createAvailability({
        mentorId: user.mentorProfileId,
        dayOfWeek: formData.isRecurring ? formData.dayOfWeek : undefined,
        startTime: formData.startTime,
        endTime: formData.endTime,
        isRecurring: formData.isRecurring,
        specificDate: !formData.isRecurring ? formData.specificDate : undefined,
      });

      setShowAddForm(false);
      setFormData({
        dayOfWeek: 1,
        startTime: "09:00",
        endTime: "17:00",
        isRecurring: true,
        specificDate: "",
      });
      void fetchAvailabilities();
    } catch (err: any) {
      alert(
        err.response?.data?.error || t.availability.manager.errors.createFailed,
      );
      console.error("Error creating availability:", err);
    }
  };

  const handleCreateWeeklySchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.mentorProfileId) return;

    const schedule: WeeklyScheduleSlot[] = [];
    for (const [day, config] of Object.entries(weeklySchedule)) {
      if (config.enabled) {
        schedule.push({
          dayOfWeek: parseInt(day),
          startTime: config.startTime,
          endTime: config.endTime,
        });
      }
    }

    if (schedule.length === 0) {
      alert(t.availability.manager.selectAtLeastOneDay);
      return;
    }

    try {
      const result = await availabilityService.createWeeklySchedule(
        user.mentorProfileId,
        schedule,
      );
      alert(result.message || t.availability.manager.weeklyScheduleCreated);
      setShowWeeklyForm(false);
      void fetchAvailabilities();
    } catch (err: any) {
      alert(
        err.response?.data?.error ||
          t.availability.manager.errors.createWeeklyFailed,
      );
      console.error("Error creating weekly schedule:", err);
    }
  };

  const handleDeleteAvailability = async (id: string) => {
    if (!user?.mentorProfileId) return;
    if (!window.confirm(t.availability.manager.deleteConfirm)) return;

    try {
      await availabilityService.deleteAvailability(id, user.mentorProfileId);
      void fetchAvailabilities();
    } catch (err: any) {
      alert(
        err.response?.data?.error || t.availability.manager.errors.deleteFailed,
      );
      console.error("Error deleting availability:", err);
    }
  };

  const handleGenerateSlotsInline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.mentorProfileId) return;

    if (availabilities.length === 0) {
      alert(t.availability.manager.needAvailabilityBeforeGenerating);
      return;
    }

    setGeneratingSlots(true);
    try {
      const result = await availabilityService.generateTimeSlots(
        user.mentorProfileId,
        generateForm.startDate,
        generateForm.endDate,
        generateForm.slotDuration,
      );

      alert(result.message || t.availability.slots.generatedSuccess);
      navigate("/time-slots");
    } catch (err: any) {
      alert(
        err.response?.data?.error || t.availability.slots.errors.generateFailed,
      );
      console.error("Error generating time slots:", err);
    } finally {
      setGeneratingSlots(false);
    }
  };

  const getDayLabel = (dayOfWeek: number) => {
    switch (dayOfWeek) {
      case 0:
        return t.availability.days.sunday;
      case 1:
        return t.availability.days.monday;
      case 2:
        return t.availability.days.tuesday;
      case 3:
        return t.availability.days.wednesday;
      case 4:
        return t.availability.days.thursday;
      case 5:
        return t.availability.days.friday;
      case 6:
        return t.availability.days.saturday;
      default:
        return "";
    }
  };

  const recurringCount = availabilities.filter(
    (availability) => availability.isRecurring,
  ).length;
  const specificCount = availabilities.length - recurringCount;

  if (!user?.mentorProfileId) {
    return (
      <PageShell
        title={t.availability.manager.title}
        subtitle={t.availability.manager.mentorSetupRequired}
      >
        <div className="error-message">
          {t.availability.manager.needMentorProfileFirst}
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title={t.availability.manager.title}
      subtitle={t.availability.manager.subtitle}
      eyebrow={t.nav.sections.mentorTools}
      className="availability-page"
    >
      <section className="availability-overview-card card">
        <div className="availability-overview-copy">
          <span className="availability-overview-kicker">
            <Sparkles size={16} />
            {t.availability.manager.overviewKicker}
          </span>
          <h2 className="availability-overview-title">
            {t.availability.manager.overviewTitle}
          </h2>
          <p className="availability-overview-text">
            {t.availability.manager.overviewText}
          </p>
        </div>
        <div className="availability-overview-metrics">
          <div className="availability-overview-metric">
            <span className="availability-overview-metric-icon">
              <Repeat size={18} />
            </span>
            <span className="availability-overview-metric-label">
              {t.availability.manager.recurring}
            </span>
            <strong className="availability-overview-metric-value">
              {recurringCount}
            </strong>
          </div>
          <div className="availability-overview-metric">
            <span className="availability-overview-metric-icon">
              <CalendarRange size={18} />
            </span>
            <span className="availability-overview-metric-label">
              {t.availability.manager.specificDates}
            </span>
            <strong className="availability-overview-metric-value">
              {specificCount}
            </strong>
          </div>
          <div className="availability-overview-metric">
            <span className="availability-overview-metric-icon">
              <Clock3 size={18} />
            </span>
            <span className="availability-overview-metric-label">
              {t.availability.manager.totalWindows}
            </span>
            <strong className="availability-overview-metric-value">
              {availabilities.length}
            </strong>
          </div>
        </div>
      </section>

      <div className="availability-actions">
        <button
          className="btn btn-primary"
          onClick={() => setShowWeeklyForm(true)}
        >
          <Repeat size={16} />
          {t.availability.manager.setWeeklySchedule}
        </button>
        <button
          className="btn btn-outline"
          onClick={() => setShowAddForm(true)}
        >
          <Plus size={16} />
          {t.availability.manager.addSingleSlot}
        </button>
      </div>

      <section className="availability-calendar-card card">
        <div className="availability-calendar-header">
          <div>
            <span className="availability-flow-step">
              {t.availability.manager.calendarQuickCreate}
            </span>
            <h3>{t.availability.manager.calendarTitle}</h3>
            <p>{t.availability.manager.calendarSubtitle}</p>
          </div>
          <div className="availability-calendar-nav">
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => {
                const current = new Date(calendarAnchorDate);
                current.setDate(current.getDate() - 7);
                setCalendarAnchorDate(current.toISOString().split("T")[0]);
              }}
            >
              {t.common.back}
            </button>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => {
                const current = new Date(calendarAnchorDate);
                current.setDate(current.getDate() + 7);
                setCalendarAnchorDate(current.toISOString().split("T")[0]);
              }}
            >
              {t.common.next}
            </button>
          </div>
        </div>

        <div className="availability-week-grid">
          <div className="availability-range-strip">
            <button
              type="button"
              className="availability-range-panel"
              onClick={() => openPicker("start")}
            >
              <span>{t.availability.manager.startTime}</span>
              <strong>
                {formatDateTimeLabel(
                  rangeDraft.startDate,
                  rangeDraft.startTime,
                )}
              </strong>
            </button>
            <button
              type="button"
              className="availability-range-panel"
              onClick={() => openPicker("end")}
            >
              <span>{t.availability.manager.endTime}</span>
              <strong>
                {formatDateTimeLabel(rangeDraft.endDate, rangeDraft.endTime)}
              </strong>
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => void handleApplyRange()}
              disabled={quickCreating}
            >
              {quickCreating
                ? t.common.loading
                : t.availability.manager.addAvailability}
            </button>
          </div>

          <WeekTimelineGrid
            weekDates={weekDates}
            slots={calendarSlots}
            mergeAdjacentSlots
            hourStart={0}
            hourEnd={24}
            hourHeight={24}
          />
        </div>
        <div className="availability-calendar-legend">
          <span className="availability-legend-item availability-legend-available">
            {t.availability.status.available}
          </span>
          <span className="availability-legend-item availability-legend-booked">
            {t.availability.status.booked}
          </span>
          <span className="availability-legend-item availability-legend-unavailable">
            {t.availability.status.unavailable}
          </span>
        </div>
      </section>

      <section className="availability-flow-card card">
        <div className="availability-flow-header">
          <span className="availability-flow-step">
            {t.availability.manager.stepTwo}
          </span>
          <h3>{t.availability.manager.generateSlotsTitle}</h3>
          <p>{t.availability.manager.generateSlotsSubtitle}</p>
        </div>
        <form
          onSubmit={handleGenerateSlotsInline}
          className="availability-flow-form"
        >
          <div className="availability-flow-grid">
            <div className="form-group">
              <label className="form-label">
                {t.availability.slots.startDate}
              </label>
              <input
                type="date"
                className="form-input"
                value={generateForm.startDate}
                onChange={(e) =>
                  setGenerateForm({
                    ...generateForm,
                    startDate: e.target.value,
                  })
                }
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">
                {t.availability.slots.endDate}
              </label>
              <input
                type="date"
                className="form-input"
                value={generateForm.endDate}
                onChange={(e) =>
                  setGenerateForm({
                    ...generateForm,
                    endDate: e.target.value,
                  })
                }
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">
                {t.availability.slots.slotDuration}
              </label>
              <select
                className="form-select"
                value={generateForm.slotDuration}
                onChange={(e) =>
                  setGenerateForm({
                    ...generateForm,
                    slotDuration: parseInt(e.target.value),
                  })
                }
              >
                <option value={30}>30 {t.availability.slots.minutes}</option>
                <option value={45}>45 {t.availability.slots.minutes}</option>
                <option value={60}>60 {t.availability.slots.minutes}</option>
                <option value={90}>90 {t.availability.slots.minutes}</option>
                <option value={120}>120 {t.availability.slots.minutes}</option>
              </select>
            </div>
          </div>
          <div className="availability-flow-actions">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={generatingSlots}
            >
              <Ticket size={16} />
              {generatingSlots
                ? t.availability.slots.generating
                : t.availability.manager.generateAndReviewSlots}
            </button>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => navigate("/time-slots")}
            >
              {t.availability.manager.openTimeSlotManager}
            </button>
          </div>
        </form>
      </section>

      {error && <div className="error-message">{error}</div>}

      {activePicker && (
        <div className="modal-overlay" onClick={() => setActivePicker(null)}>
          <div
            className="modal-content availability-modal-content availability-picker-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-body availability-picker-body">
              <DateTimeRangePicker
                startLabel={t.availability.manager.startTime}
                endLabel={t.availability.manager.endTime}
                timeLabel={t.bookings.time}
                startValue={formatDateTimeLabel(
                  rangeDraft.startDate,
                  rangeDraft.startTime,
                )}
                endValue={formatDateTimeLabel(
                  rangeDraft.endDate,
                  rangeDraft.endTime,
                )}
                activePicker={activePicker}
                pickerMonth={pickerMonth}
                calendarCells={calendarCells.map((cell) => ({
                  iso: cell.iso,
                  date: cell.date,
                  inMonth: cell.inMonth,
                }))}
                selectedDate={pickerDraft.date}
                timeOptions={timeOptions}
                selectedTime={pickerDraft.time}
                emptyTimeLabel={t.bookings.noTimeSlotsForDate}
                onOpenPicker={openPicker}
                onClosePicker={() => setActivePicker(null)}
                onPrevMonth={() =>
                  setPickerMonth(
                    (prev) =>
                      new Date(prev.getFullYear(), prev.getMonth() - 1, 1),
                  )
                }
                onNextMonth={() =>
                  setPickerMonth(
                    (prev) =>
                      new Date(prev.getFullYear(), prev.getMonth() + 1, 1),
                  )
                }
                onSelectDate={(dateIso) =>
                  setPickerDraft((prev) => ({ ...prev, date: dateIso }))
                }
                onSelectTime={handlePickerTimeChange}
              />
            </div>
          </div>
        </div>
      )}

      {showWeeklyForm && (
        <div className="modal-overlay" onClick={() => setShowWeeklyForm(false)}>
          <div
            className="modal-content availability-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <h2 className="modal-title">
                  {t.availability.manager.setWeeklySchedule}
                </h2>
                <p className="availability-modal-subtitle">
                  {t.availability.manager.weeklyModalSubtitle}
                </p>
              </div>
              <button
                className="modal-close"
                onClick={() => setShowWeeklyForm(false)}
              >
                x
              </button>
            </div>
            <form onSubmit={handleCreateWeeklySchedule}>
              <div className="modal-body">
                {DAYS_OF_WEEK.map((day) => (
                  <div key={day} className="weekly-day-row">
                    <label className="day-checkbox">
                      <input
                        type="checkbox"
                        checked={weeklySchedule[day].enabled}
                        onChange={(e) =>
                          setWeeklySchedule({
                            ...weeklySchedule,
                            [day]: {
                              ...weeklySchedule[day],
                              enabled: e.target.checked,
                            },
                          })
                        }
                      />
                      <span className="day-label">{getDayLabel(day)}</span>
                    </label>
                    {weeklySchedule[day].enabled && (
                      <div className="time-inputs">
                        <input
                          type="time"
                          className="form-input"
                          value={weeklySchedule[day].startTime}
                          onChange={(e) =>
                            setWeeklySchedule({
                              ...weeklySchedule,
                              [day]: {
                                ...weeklySchedule[day],
                                startTime: e.target.value,
                              },
                            })
                          }
                        />
                        <span>{t.availability.manager.to}</span>
                        <input
                          type="time"
                          className="form-input"
                          value={weeklySchedule[day].endTime}
                          onChange={(e) =>
                            setWeeklySchedule({
                              ...weeklySchedule,
                              [day]: {
                                ...weeklySchedule[day],
                                endTime: e.target.value,
                              },
                            })
                          }
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowWeeklyForm(false)}
                >
                  {t.common.cancel}
                </button>
                <button type="submit" className="btn btn-primary">
                  {t.availability.manager.createSchedule}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddForm && (
        <div className="modal-overlay" onClick={() => setShowAddForm(false)}>
          <div
            className="modal-content availability-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <h2 className="modal-title">
                  {t.availability.manager.addAvailability}
                </h2>
                <p className="availability-modal-subtitle">
                  {t.availability.manager.addModalSubtitle}
                </p>
              </div>
              <button
                className="modal-close"
                onClick={() => setShowAddForm(false)}
              >
                x
              </button>
            </div>
            <form onSubmit={handleAddAvailability}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">
                    {t.availability.manager.type}
                  </label>
                  <select
                    className="form-select"
                    value={formData.isRecurring ? "recurring" : "specific"}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        isRecurring: e.target.value === "recurring",
                      })
                    }
                  >
                    <option value="recurring">
                      {t.availability.manager.recurringWeekly}
                    </option>
                    <option value="specific">
                      {t.availability.manager.specificDate}
                    </option>
                  </select>
                </div>

                {formData.isRecurring ? (
                  <div className="form-group">
                    <label className="form-label">
                      {t.availability.manager.dayOfWeek}
                    </label>
                    <select
                      className="form-select"
                      value={formData.dayOfWeek}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          dayOfWeek: parseInt(e.target.value),
                        })
                      }
                    >
                      {DAYS_OF_WEEK.map((day) => (
                        <option key={day} value={day}>
                          {getDayLabel(day)}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="form-group">
                    <label className="form-label">
                      {t.availability.manager.date}
                    </label>
                    <input
                      type="date"
                      className="form-input"
                      value={formData.specificDate}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          specificDate: e.target.value,
                        })
                      }
                      required
                      min={new Date().toISOString().split("T")[0]}
                    />
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">
                    {t.availability.manager.startTime}
                  </label>
                  <input
                    type="time"
                    className="form-input"
                    value={formData.startTime}
                    onChange={(e) =>
                      setFormData({ ...formData, startTime: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    {t.availability.manager.endTime}
                  </label>
                  <input
                    type="time"
                    className="form-input"
                    value={formData.endTime}
                    onChange={(e) =>
                      setFormData({ ...formData, endTime: e.target.value })
                    }
                    required
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowAddForm(false)}
                >
                  {t.common.cancel}
                </button>
                <button type="submit" className="btn btn-primary">
                  {t.availability.manager.addAvailability}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="loading-message">{t.availability.manager.loading}</div>
      ) : availabilities.length === 0 ? (
        <div className="empty-message">
          <p>{t.availability.manager.emptyState}</p>
          <p className="availability-empty-hint">
            {t.availability.manager.emptyStateHint}
          </p>
        </div>
      ) : (
        <div className="availability-list">
          <div className="availability-list-header">
            <h3>{t.availability.manager.currentAvailabilities}</h3>
            <span className="availability-list-count">
              {availabilities.length} {t.availability.manager.items}
            </span>
          </div>
          {availabilities.map((avail) => (
            <div key={avail.id} className="availability-card">
              <div className="availability-info">
                {avail.isRecurring ? (
                  <>
                    <span className="availability-type availability-type-recurring">
                      <Repeat size={14} />
                      {t.availability.manager.recurring}
                    </span>
                    <span className="availability-day">
                      {getDayLabel(avail.dayOfWeek)}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="availability-type availability-type-specific">
                      <CalendarRange size={14} />
                      {t.availability.manager.specificDate}
                    </span>
                    <span className="availability-day">
                      {avail.specificDate
                        ? new Date(avail.specificDate).toLocaleDateString()
                        : ""}
                    </span>
                  </>
                )}
                <span className="availability-time">
                  {avail.startTime} - {avail.endTime}
                </span>
              </div>
              <button
                className="btn btn-sm btn-outline btn-danger"
                onClick={() => handleDeleteAvailability(avail.id)}
              >
                <Trash2 size={14} />
                {t.common.delete}
              </button>
            </div>
          ))}
        </div>
      )}
    </PageShell>
  );
};
