import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage } from "../../i18n/LanguageContext";
import {
  availabilityService,
  Availability,
  WeeklyScheduleSlot,
} from "../../services/availabilityService";
import "./AvailabilityManager.css";

const DAYS_OF_WEEK = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

export const AvailabilityManager: React.FC = () => {
  const { user } = useAuth();
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

  useEffect(() => {
    if (user?.mentorProfileId) {
      fetchAvailabilities();
    }
  }, [user]);

  const fetchAvailabilities = async () => {
    if (!user?.mentorProfileId) return;

    setLoading(true);
    setError("");
    try {
      const data = await availabilityService.getAvailabilitiesForMentor(
        user.mentorProfileId
      );
      setAvailabilities(data);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to load availabilities");
      console.error("Error loading availabilities:", err);
    } finally {
      setLoading(false);
    }
  };

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
      fetchAvailabilities();
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to create availability");
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
      alert("Please select at least one day");
      return;
    }

    try {
      const result = await availabilityService.createWeeklySchedule(
        user.mentorProfileId,
        schedule
      );
      alert(result.message);
      setShowWeeklyForm(false);
      fetchAvailabilities();
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to create weekly schedule");
      console.error("Error creating weekly schedule:", err);
    }
  };

  const handleDeleteAvailability = async (id: string) => {
    if (!user?.mentorProfileId) return;
    if (!window.confirm("Delete this availability?")) return;

    try {
      await availabilityService.deleteAvailability(id, user.mentorProfileId);
      fetchAvailabilities();
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to delete availability");
      console.error("Error deleting availability:", err);
    }
  };

  const getDayLabel = (dayOfWeek: number) => {
    return DAYS_OF_WEEK.find((d) => d.value === dayOfWeek)?.label || "";
  };

  if (!user?.mentorProfileId) {
    return (
      <div className="content-area">
        <div className="error-message">
          You need to create a mentor profile first.
        </div>
      </div>
    );
  }

  return (
    <div className="content-area">
      <div className="page-header">
        <h1 className="page-title">Availability Management</h1>
        <p className="page-subtitle">
          Set your weekly schedule and specific dates
        </p>
      </div>

      <div className="availability-actions">
        <button
          className="btn btn-primary"
          onClick={() => setShowWeeklyForm(true)}
        >
          Set Weekly Schedule
        </button>
        <button
          className="btn btn-outline"
          onClick={() => setShowAddForm(true)}
        >
          Add Single Slot
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* Weekly Schedule Form Modal */}
      {showWeeklyForm && (
        <div className="modal-overlay" onClick={() => setShowWeeklyForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Set Weekly Schedule</h2>
              <button
                className="modal-close"
                onClick={() => setShowWeeklyForm(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleCreateWeeklySchedule}>
              <div className="modal-body">
                {DAYS_OF_WEEK.map((day) => (
                  <div key={day.value} className="weekly-day-row">
                    <label className="day-checkbox">
                      <input
                        type="checkbox"
                        checked={weeklySchedule[day.value].enabled}
                        onChange={(e) =>
                          setWeeklySchedule({
                            ...weeklySchedule,
                            [day.value]: {
                              ...weeklySchedule[day.value],
                              enabled: e.target.checked,
                            },
                          })
                        }
                      />
                      <span className="day-label">{day.label}</span>
                    </label>
                    {weeklySchedule[day.value].enabled && (
                      <div className="time-inputs">
                        <input
                          type="time"
                          className="form-input"
                          value={weeklySchedule[day.value].startTime}
                          onChange={(e) =>
                            setWeeklySchedule({
                              ...weeklySchedule,
                              [day.value]: {
                                ...weeklySchedule[day.value],
                                startTime: e.target.value,
                              },
                            })
                          }
                        />
                        <span>to</span>
                        <input
                          type="time"
                          className="form-input"
                          value={weeklySchedule[day.value].endTime}
                          onChange={(e) =>
                            setWeeklySchedule({
                              ...weeklySchedule,
                              [day.value]: {
                                ...weeklySchedule[day.value],
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
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Single Availability Modal */}
      {showAddForm && (
        <div className="modal-overlay" onClick={() => setShowAddForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Add Availability</h2>
              <button
                className="modal-close"
                onClick={() => setShowAddForm(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleAddAvailability}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Type</label>
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
                    <option value="recurring">Recurring Weekly</option>
                    <option value="specific">Specific Date</option>
                  </select>
                </div>

                {formData.isRecurring ? (
                  <div className="form-group">
                    <label className="form-label">Day of Week</label>
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
                        <option key={day.value} value={day.value}>
                          {day.label}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="form-group">
                    <label className="form-label">Date</label>
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
                  <label className="form-label">Start Time</label>
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
                  <label className="form-label">End Time</label>
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
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Add Availability
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Availability List */}
      {loading ? (
        <div className="loading-message">Loading availabilities...</div>
      ) : availabilities.length === 0 ? (
        <div className="empty-message">
          <p>
            No availabilities set yet. Create your schedule to start receiving
            bookings.
          </p>
        </div>
      ) : (
        <div className="availability-list">
          <h3>Current Availabilities</h3>
          {availabilities.map((avail) => (
            <div key={avail.id} className="availability-card">
              <div className="availability-info">
                {avail.isRecurring ? (
                  <>
                    <span className="availability-type">Recurring</span>
                    <span className="availability-day">
                      {getDayLabel(avail.dayOfWeek)}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="availability-type">Specific Date</span>
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
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
