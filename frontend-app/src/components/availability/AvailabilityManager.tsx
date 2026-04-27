import React, { useState, useEffect, useCallback } from "react";
import {
  CalendarRange,
  Clock3,
  Plus,
  Repeat,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import {
  availabilityService,
  Availability,
  WeeklyScheduleSlot,
} from "../../services/availabilityService";
import { useLanguage } from "../../i18n/LanguageContext";
import { PageShell } from "../common/PageShell";
import "./AvailabilityManager.css";

const DAYS_OF_WEEK = [0, 1, 2, 3, 4, 5, 6] as const;

export const AvailabilityManager: React.FC = () => {
  const { user, login } = useAuth();
  const { t } = useLanguage();
  const [availabilities, setAvailabilities] = useState<Availability[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [showWeeklyForm, setShowWeeklyForm] = useState(false);

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
        const updatedUser = { ...user, mentorHasAvailability: data.length > 0 };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        login(updatedUser);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || t.availability.manager.errors.loadFailed);
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
      alert(err.response?.data?.error || t.availability.manager.errors.createFailed);
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
        err.response?.data?.error || t.availability.manager.errors.createWeeklyFailed,
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
      alert(err.response?.data?.error || t.availability.manager.errors.deleteFailed);
      console.error("Error deleting availability:", err);
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
        <div className="error-message">{t.availability.manager.needMentorProfileFirst}</div>
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

      {error && <div className="error-message">{error}</div>}

      {showWeeklyForm && (
        <div className="modal-overlay" onClick={() => setShowWeeklyForm(false)}>
          <div
            className="modal-content availability-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <h2 className="modal-title">{t.availability.manager.setWeeklySchedule}</h2>
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
                <h2 className="modal-title">{t.availability.manager.addAvailability}</h2>
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
                  <label className="form-label">{t.availability.manager.type}</label>
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
                    <option value="recurring">{t.availability.manager.recurringWeekly}</option>
                    <option value="specific">{t.availability.manager.specificDate}</option>
                  </select>
                </div>

                {formData.isRecurring ? (
                  <div className="form-group">
                    <label className="form-label">{t.availability.manager.dayOfWeek}</label>
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
                    <label className="form-label">{t.availability.manager.date}</label>
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
                  <label className="form-label">{t.availability.manager.startTime}</label>
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
                  <label className="form-label">{t.availability.manager.endTime}</label>
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
                    <span className="availability-day">{getDayLabel(avail.dayOfWeek)}</span>
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
