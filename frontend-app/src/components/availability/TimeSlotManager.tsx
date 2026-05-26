import React, { useState, useEffect, useCallback } from "react";
import {
  CalendarRange,
  Clock3,
  Filter,
  Sparkles,
  Ticket,
  Trash2,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { availabilityService } from "../../services/availabilityService";
import { useLanguage } from "../../i18n/LanguageContext";
import { PageShell } from "../common/PageShell";
import { WeekTimelineGrid } from "../common/WeekTimelineGrid";
import "./TimeSlotManager.css";

export const TimeSlotManager: React.FC = () => {
  const { user } = useAuth();
  const { t, locale } = useLanguage();
  const [timeSlots, setTimeSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [generating, setGenerating] = useState(false);
  const [clearingRange, setClearingRange] = useState(false);
  const [updatingSlotId, setUpdatingSlotId] = useState<string | null>(null);
  const [timelineAnchorDate, setTimelineAnchorDate] = useState("");

  // Generate slots form
  const [generateForm, setGenerateForm] = useState({
    startDate: "",
    endDate: "",
    slotDuration: 60,
  });

  // Filter form
  const [filterForm, setFilterForm] = useState({
    startDate: "",
    endDate: "",
    status: "",
  });

  const [bulkDeleteForm, setBulkDeleteForm] = useState({
    startDate: "",
    endDate: "",
  });

  useEffect(() => {
    const today = new Date();
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    setGenerateForm({
      startDate: today.toISOString().split("T")[0],
      endDate: nextMonth.toISOString().split("T")[0],
      slotDuration: 60,
    });

    setFilterForm({
      startDate: today.toISOString().split("T")[0],
      endDate: nextMonth.toISOString().split("T")[0],
      status: "",
    });

    setBulkDeleteForm({
      startDate: today.toISOString().split("T")[0],
      endDate: nextMonth.toISOString().split("T")[0],
    });
    setTimelineAnchorDate(today.toISOString().split("T")[0]);
  }, []);

  const getStartOfWeek = (dateStr: string) => {
    const date = new Date(dateStr);
    const day = date.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    date.setDate(date.getDate() + diff);
    date.setHours(0, 0, 0, 0);
    return date;
  };

  const getWeekDates = (anchor: string) => {
    if (!anchor) return [] as Date[];
    const start = getStartOfWeek(anchor);
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      return date;
    });
  };

  const weekDates = getWeekDates(timelineAnchorDate);

  const fetchTimeSlots = useCallback(async () => {
    if (!user?.mentorProfileId) return;

    setLoading(true);
    setError("");
    try {
      const data = await availabilityService.getTimeSlotsForMentor(
        user.mentorProfileId,
        filterForm.startDate || undefined,
        filterForm.endDate || undefined,
        filterForm.status || undefined,
      );
      setTimeSlots(data);
    } catch (err: any) {
      setError(
        err.response?.data?.error || t.availability.slots.errors.loadFailed,
      );
      console.error("Error loading time slots:", err);
    } finally {
      setLoading(false);
    }
  }, [
    user?.mentorProfileId,
    filterForm.startDate,
    filterForm.endDate,
    filterForm.status,
    t.availability.slots.errors.loadFailed,
  ]);

  useEffect(() => {
    if (user?.mentorProfileId) {
      void fetchTimeSlots();
    }
  }, [user?.mentorProfileId, fetchTimeSlots]);

  const handleGenerateSlots = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.mentorProfileId) return;

    setGenerating(true);
    try {
      const result = await availabilityService.generateTimeSlots(
        user.mentorProfileId,
        generateForm.startDate,
        generateForm.endDate,
        generateForm.slotDuration,
      );
      alert(result.message || t.availability.slots.generatedSuccess);
      void fetchTimeSlots();
    } catch (err: any) {
      alert(
        err.response?.data?.error || t.availability.slots.errors.generateFailed,
      );
      console.error("Error generating time slots:", err);
    } finally {
      setGenerating(false);
    }
  };

  const handleDeleteSlot = async (slotId: string) => {
    if (!user?.mentorProfileId) return;
    if (!window.confirm(t.availability.slots.deleteConfirm)) return;

    try {
      await availabilityService.deleteTimeSlot(slotId, user.mentorProfileId);
      void fetchTimeSlots();
    } catch (err: any) {
      alert(
        err.response?.data?.error || t.availability.slots.errors.deleteFailed,
      );
      console.error("Error deleting time slot:", err);
    }
  };

  const handleToggleSlotStatus = async (slot: any) => {
    if (!user?.mentorProfileId || slot.status === "BOOKED") return;
    const nextStatus =
      slot.status === "AVAILABLE" ? "UNAVAILABLE" : "AVAILABLE";
    setUpdatingSlotId(slot.id);
    try {
      await availabilityService.updateTimeSlotStatus(
        slot.id,
        user.mentorProfileId,
        nextStatus,
      );
      void fetchTimeSlots();
    } catch (err: any) {
      alert(
        err.response?.data?.error ||
          t.availability.slots.errors.updateStatusFailed,
      );
      console.error("Error updating time slot status:", err);
    } finally {
      setUpdatingSlotId(null);
    }
  };

  const handleBulkDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.mentorProfileId) return;
    if (!window.confirm(t.availability.slots.bulkDeleteConfirm)) return;

    setClearingRange(true);
    try {
      const result = await availabilityService.bulkDeleteTimeSlots(
        user.mentorProfileId,
        bulkDeleteForm.startDate,
        bulkDeleteForm.endDate,
      );
      alert(result.message || t.availability.slots.bulkDeleteSuccess);
      void fetchTimeSlots();
    } catch (err: any) {
      alert(
        err.response?.data?.error ||
          t.availability.slots.errors.bulkDeleteFailed,
      );
      console.error("Error bulk deleting slots:", err);
    } finally {
      setClearingRange(false);
    }
  };

  const getRangeDays = (startDate: string, endDate: string) => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    if (end < start) return 0;
    const diffMs = end.getTime() - start.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
  };

  const generateRangeDays = getRangeDays(
    generateForm.startDate,
    generateForm.endDate,
  );
  const bulkDeleteRangeDays = getRangeDays(
    bulkDeleteForm.startDate,
    bulkDeleteForm.endDate,
  );

  const localeCode =
    locale === "ru" ? "ru-RU" : locale === "ky" ? "ky-KG" : "en-US";

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString(localeCode, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatEndTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString(localeCode, {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "AVAILABLE":
        return "badge-success";
      case "BOOKED":
        return "badge-warning";
      case "UNAVAILABLE":
        return "badge-danger";
      default:
        return "badge-neutral";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "AVAILABLE":
        return t.availability.status.available;
      case "BOOKED":
        return t.availability.status.booked;
      case "UNAVAILABLE":
        return t.availability.status.unavailable;
      default:
        return status;
    }
  };

  if (!user?.mentorProfileId) {
    return (
      <PageShell
        title={t.availability.slots.title}
        subtitle={t.availability.slots.mentorSetupRequired}
      >
        <div className="error-message">
          {t.availability.slots.needMentorProfileFirst}
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title={t.availability.slots.title}
      subtitle={t.availability.slots.subtitle}
      eyebrow={t.nav.sections.mentorTools}
      className="timeslot-page"
    >
      <section className="timeslot-overview-card card">
        <div className="timeslot-overview-copy">
          <span className="timeslot-overview-kicker">
            <Sparkles size={16} />
            {t.availability.slots.overviewKicker}
          </span>
          <h2 className="timeslot-overview-title">
            {t.availability.slots.overviewTitle}
          </h2>
          <p className="timeslot-overview-text">
            {t.availability.slots.overviewText}
          </p>
        </div>
        <div className="timeslot-overview-metrics">
          <div className="timeslot-overview-metric">
            <span className="timeslot-overview-metric-icon">
              <Ticket size={18} />
            </span>
            <span className="timeslot-overview-metric-label">
              {t.availability.slots.totalSlots}
            </span>
            <strong className="timeslot-overview-metric-value">
              {timeSlots.length}
            </strong>
          </div>
          <div className="timeslot-overview-metric">
            <span className="timeslot-overview-metric-icon">
              <Clock3 size={18} />
            </span>
            <span className="timeslot-overview-metric-label">
              {t.availability.status.available}
            </span>
            <strong className="timeslot-overview-metric-value">
              {timeSlots.filter((slot) => slot.status === "AVAILABLE").length}
            </strong>
          </div>
          <div className="timeslot-overview-metric">
            <span className="timeslot-overview-metric-icon">
              <CalendarRange size={18} />
            </span>
            <span className="timeslot-overview-metric-label">
              {t.availability.status.booked}
            </span>
            <strong className="timeslot-overview-metric-value">
              {timeSlots.filter((slot) => slot.status === "BOOKED").length}
            </strong>
          </div>
        </div>
      </section>

      <div className="card timeslot-generate-card">
        <div className="card-header">
          <h2 className="card-title">{t.availability.slots.generateTitle}</h2>
        </div>
        <form onSubmit={handleGenerateSlots} className="card-body">
          <div className="timeslot-generate-grid">
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
                  setGenerateForm({ ...generateForm, endDate: e.target.value })
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
          <div className="timeslot-generate-footer">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={generating}
            >
              <Ticket size={16} />
              {generating
                ? t.availability.slots.generating
                : t.availability.slots.generateButton}
            </button>
            <div className="timeslot-preview-row">
              <span className="timeslot-preview-chip">
                {t.availability.slots.previewDuration}:{" "}
                {generateForm.slotDuration} {t.availability.slots.minutes}
              </span>
              <span className="timeslot-preview-chip">
                {t.availability.slots.previewRange}: {generateRangeDays}{" "}
                {t.availability.slots.days}
              </span>
            </div>
            <p className="timeslot-generate-hint">
              {t.availability.slots.generateHint}
            </p>
          </div>
        </form>
      </div>

      <div className="card timeslot-bulk-card">
        <div className="card-header">
          <h2 className="card-title">{t.availability.slots.bulkDeleteTitle}</h2>
        </div>
        <form onSubmit={handleBulkDelete} className="card-body">
          <p className="timeslot-generate-hint">
            {t.availability.slots.bulkDeleteHint}
          </p>
          <div className="timeslot-generate-grid">
            <div className="form-group">
              <label className="form-label">
                {t.availability.slots.startDate}
              </label>
              <input
                type="date"
                className="form-input"
                value={bulkDeleteForm.startDate}
                onChange={(e) =>
                  setBulkDeleteForm({
                    ...bulkDeleteForm,
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
                value={bulkDeleteForm.endDate}
                onChange={(e) =>
                  setBulkDeleteForm({
                    ...bulkDeleteForm,
                    endDate: e.target.value,
                  })
                }
                required
              />
            </div>
          </div>
          <div className="timeslot-generate-footer">
            <span className="timeslot-preview-chip">
              {t.availability.slots.previewRange}: {bulkDeleteRangeDays}{" "}
              {t.availability.slots.days}
            </span>
            <button
              type="submit"
              className="btn btn-outline btn-danger"
              disabled={clearingRange}
            >
              <Trash2 size={16} />
              {clearingRange
                ? t.availability.slots.clearing
                : t.availability.slots.clearRangeButton}
            </button>
          </div>
        </form>
      </div>

      <div className="timeslot-filters">
        <div className="timeslot-filters-header">
          <span className="timeslot-filters-icon">
            <Filter size={16} />
          </span>
          <div>
            <div className="timeslot-filters-title">
              {t.availability.slots.filterTitle}
            </div>
            <div className="timeslot-filters-subtitle">
              {t.availability.slots.filterSubtitle}
            </div>
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">
            {t.availability.slots.filterDateRange}
          </label>
          <div className="timeslot-filter-range">
            <input
              type="date"
              className="form-input"
              value={filterForm.startDate}
              onChange={(e) =>
                setFilterForm({ ...filterForm, startDate: e.target.value })
              }
            />
            <input
              type="date"
              className="form-input"
              value={filterForm.endDate}
              onChange={(e) =>
                setFilterForm({ ...filterForm, endDate: e.target.value })
              }
            />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">{t.availability.slots.status}</label>
          <select
            className="form-select"
            value={filterForm.status}
            onChange={(e) =>
              setFilterForm({ ...filterForm, status: e.target.value })
            }
          >
            <option value="">{t.availability.slots.allStatuses}</option>
            <option value="AVAILABLE">{t.availability.status.available}</option>
            <option value="BOOKED">{t.availability.status.booked}</option>
            <option value="UNAVAILABLE">
              {t.availability.status.unavailable}
            </option>
          </select>
        </div>
      </div>

      <div className="card timeslot-timeline-card">
        <div className="card-header">
          <h2 className="card-title">{t.availability.slots.timelineTitle}</h2>
        </div>
        <div className="card-body">
          <div className="timeslot-week-nav">
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => {
                const current = new Date(timelineAnchorDate);
                current.setDate(current.getDate() - 7);
                const start = getStartOfWeek(
                  current.toISOString().split("T")[0],
                );
                const end = new Date(start);
                end.setDate(start.getDate() + 6);
                setTimelineAnchorDate(current.toISOString().split("T")[0]);
                setFilterForm({
                  ...filterForm,
                  startDate: start.toISOString().split("T")[0],
                  endDate: end.toISOString().split("T")[0],
                });
              }}
            >
              {t.common.back}
            </button>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => {
                const current = new Date(timelineAnchorDate);
                current.setDate(current.getDate() + 7);
                const start = getStartOfWeek(
                  current.toISOString().split("T")[0],
                );
                const end = new Date(start);
                end.setDate(start.getDate() + 6);
                setTimelineAnchorDate(current.toISOString().split("T")[0]);
                setFilterForm({
                  ...filterForm,
                  startDate: start.toISOString().split("T")[0],
                  endDate: end.toISOString().split("T")[0],
                });
              }}
            >
              {t.common.next}
            </button>
          </div>
          <WeekTimelineGrid
            weekDates={weekDates}
            slots={timeSlots}
            onSlotClick={(slot) => {
              if (!updatingSlotId) {
                void handleToggleSlotStatus(slot);
              }
            }}
            interactiveStatuses={["AVAILABLE", "UNAVAILABLE"]}
            hourStart={0}
            hourEnd={24}
            hourHeight={24}
          />
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="loading-message">{t.availability.slots.loading}</div>
      ) : timeSlots.length === 0 ? (
        <div className="empty-message">
          <p>{t.availability.slots.emptyState}</p>
        </div>
      ) : (
        <div className="timeslots-list">
          <div className="timeslots-list-header">
            <h3>{t.availability.slots.listTitle}</h3>
            <span className="timeslots-list-count">
              {timeSlots.length} {t.availability.slots.visible}
            </span>
          </div>
          {timeSlots.map((slot) => (
            <div key={slot.id} className="timeslot-card">
              <div className="timeslot-info">
                <div className="timeslot-datetime">
                  <CalendarRange size={15} /> {formatDateTime(slot.startTime)} -{" "}
                  {formatEndTime(slot.endTime)}
                </div>
                <span className={`badge ${getStatusBadgeClass(slot.status)}`}>
                  {getStatusLabel(slot.status)}
                </span>
                {slot.booking && (
                  <div className="timeslot-booking-info">
                    {t.availability.slots.bookedBy}:{" "}
                    {slot.booking.mentee?.user?.firstName}{" "}
                    {slot.booking.mentee?.user?.lastName}
                  </div>
                )}
              </div>
              {slot.status === "AVAILABLE" && (
                <button
                  className="btn btn-sm btn-outline btn-danger"
                  onClick={() => handleDeleteSlot(slot.id)}
                >
                  <Trash2 size={14} />
                  {t.common.delete}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </PageShell>
  );
};
