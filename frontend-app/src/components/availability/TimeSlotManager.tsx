import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage } from "../../i18n/LanguageContext";
import { availabilityService } from "../../services/availabilityService";
import "./TimeSlotManager.css";

export const TimeSlotManager: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [timeSlots, setTimeSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [generating, setGenerating] = useState(false);

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

  useEffect(() => {
    // Set default dates
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
  }, []);

  useEffect(() => {
    if (user?.mentorProfileId) {
      fetchTimeSlots();
    }
  }, [user, filterForm]);

  const fetchTimeSlots = async () => {
    if (!user?.mentorProfileId) return;

    setLoading(true);
    setError("");
    try {
      const data = await availabilityService.getTimeSlotsForMentor(
        user.mentorProfileId,
        filterForm.startDate || undefined,
        filterForm.endDate || undefined,
        filterForm.status || undefined
      );
      setTimeSlots(data);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to load time slots");
      console.error("Error loading time slots:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateSlots = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.mentorProfileId) return;

    setGenerating(true);
    try {
      const result = await availabilityService.generateTimeSlots(
        user.mentorProfileId,
        generateForm.startDate,
        generateForm.endDate,
        generateForm.slotDuration
      );
      alert(result.message);
      fetchTimeSlots();
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to generate time slots");
      console.error("Error generating time slots:", err);
    } finally {
      setGenerating(false);
    }
  };

  const handleDeleteSlot = async (slotId: number) => {
    if (!user?.mentorProfileId) return;
    if (!window.confirm("Delete this time slot?")) return;

    try {
      await availabilityService.deleteTimeSlot(slotId, user.mentorProfileId);
      fetchTimeSlots();
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to delete time slot");
      console.error("Error deleting time slot:", err);
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
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
        <h1 className="page-title">Time Slot Management</h1>
        <p className="page-subtitle">
          Generate and manage your bookable time slots
        </p>
      </div>

      {/* Generate Time Slots Form */}
      <div className="card" style={{ marginBottom: "var(--space-lg)" }}>
        <div className="card-header">
          <h2 className="card-title">Generate Time Slots</h2>
        </div>
        <form onSubmit={handleGenerateSlots} className="card-body">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "var(--space-md)",
            }}
          >
            <div className="form-group">
              <label className="form-label">Start Date</label>
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
              <label className="form-label">End Date</label>
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
              <label className="form-label">Slot Duration (minutes)</label>
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
                <option value={30}>30 minutes</option>
                <option value={45}>45 minutes</option>
                <option value={60}>60 minutes</option>
                <option value={90}>90 minutes</option>
                <option value={120}>120 minutes</option>
              </select>
            </div>
          </div>
          <div style={{ marginTop: "var(--space-md)" }}>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={generating}
            >
              {generating ? "Generating..." : "Generate Time Slots"}
            </button>
            <p
              style={{
                color: "var(--neutral-600)",
                fontSize: "var(--font-size-sm)",
                marginTop: "var(--space-xs)",
              }}
            >
              This will create bookable slots based on your availability
              settings
            </p>
          </div>
        </form>
      </div>

      {/* Filters */}
      <div className="timeslot-filters">
        <div className="form-group">
          <label className="form-label">Filter by Date Range</label>
          <div
            style={{
              display: "flex",
              gap: "var(--space-sm)",
              flexWrap: "wrap",
            }}
          >
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
          <label className="form-label">Status</label>
          <select
            className="form-select"
            value={filterForm.status}
            onChange={(e) =>
              setFilterForm({ ...filterForm, status: e.target.value })
            }
          >
            <option value="">All Statuses</option>
            <option value="AVAILABLE">Available</option>
            <option value="BOOKED">Booked</option>
            <option value="UNAVAILABLE">Unavailable</option>
          </select>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* Time Slots List */}
      {loading ? (
        <div className="loading-message">Loading time slots...</div>
      ) : timeSlots.length === 0 ? (
        <div className="empty-message">
          <p>
            No time slots found. Generate slots from your availability to start
            accepting bookings.
          </p>
        </div>
      ) : (
        <div className="timeslots-list">
          <h3>Time Slots ({timeSlots.length})</h3>
          {timeSlots.map((slot) => (
            <div key={slot.id} className="timeslot-card">
              <div className="timeslot-info">
                <div className="timeslot-datetime">
                  📅 {formatDateTime(slot.startTime)} -{" "}
                  {new Date(slot.endTime).toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                    hour12: true,
                  })}
                </div>
                <span className={`badge ${getStatusBadgeClass(slot.status)}`}>
                  {slot.status}
                </span>
                {slot.booking && (
                  <div className="timeslot-booking-info">
                    Booked by: {slot.booking.mentee?.user?.firstName}{" "}
                    {slot.booking.mentee?.user?.lastName}
                  </div>
                )}
              </div>
              {slot.status === "AVAILABLE" && (
                <button
                  className="btn btn-sm btn-outline btn-danger"
                  onClick={() => handleDeleteSlot(slot.id)}
                >
                  Delete
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
