import React, { useState, useEffect, useCallback } from "react";
import {
  CalendarRange,
  Heart,
  Mail,
  MessageCircle,
  Sparkles,
  Star,
} from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { useLanguage } from "../../i18n/LanguageContext";
import { useAuth } from "../../contexts/AuthContext";
import { mentorService, MentorProfile } from "../../services/mentorService";
import { bookingService } from "../../services/bookingService";
import { TimeSlot } from "../../types/booking";
import { AlertDialog } from "../common/AlertDialog";
import { PageShell } from "../common/PageShell";
import "./Mentors.css";

export const MentorDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, locale } = useLanguage();
  const { user } = useAuth();
  const [mentor, setMentor] = useState<MentorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [previewDate, setPreviewDate] = useState("");
  const [previewSlots, setPreviewSlots] = useState<TimeSlot[]>([]);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState("");
  const [alertDialog, setAlertDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type?: "danger" | "warning" | "info" | "success";
    onCloseAction?: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
  });

  useEffect(() => {
    const today = new Date();
    setPreviewDate(today.toISOString().split("T")[0]);
  }, []);

  useEffect(() => {
    const fetchMentor = async () => {
      if (!id) return;

      setLoading(true);
      setError("");
      try {
        const data = await mentorService.getMentorById(id);
        setMentor(data);
      } catch (err: any) {
        setError(err.response?.data?.error || "Failed to fetch mentor details");
        console.error("Error fetching mentor:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMentor();
  }, [id]);

  const fetchPreviewSlots = useCallback(async () => {
    if (!mentor?.id || !previewDate) return;

    setPreviewLoading(true);
    setPreviewError("");
    try {
      const startDate = new Date(previewDate);
      startDate.setHours(0, 0, 0, 0);

      const endDate = new Date(previewDate);
      endDate.setHours(23, 59, 59, 999);

      const data = await bookingService.getAvailableTimeSlots(
        mentor.id,
        startDate.toISOString(),
        endDate.toISOString(),
      );
      setPreviewSlots(data);
    } catch (err: any) {
      setPreviewError(
        err.response?.data?.error || t.bookings.errors.loadSlotsFailed,
      );
      console.error("Error fetching preview slots:", err);
    } finally {
      setPreviewLoading(false);
    }
  }, [mentor?.id, previewDate, t.bookings.errors.loadSlotsFailed]);

  useEffect(() => {
    if (mentor?.id && previewDate) {
      void fetchPreviewSlots();
    }
  }, [mentor?.id, previewDate, fetchPreviewSlots]);

  const getInitials = (mentor: MentorProfile) => {
    const firstName = mentor.user?.firstName || "";
    const lastName = mentor.user?.lastName || "";
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const handleBookSession = () => {
    if (!mentor?.id) return;

    if (!user) {
      setAlertDialog({
        isOpen: true,
        title: "Login Required",
        message: "Please log in to book a session",
        type: "warning",
        onCloseAction: () => navigate("/login"),
      });
      return;
    }

    navigate(`/mentors/${mentor.id}/book`, {
      state: {
        initialDate: previewDate || undefined,
      },
    });
  };

  const localeCode =
    locale === "ru" ? "ru-RU" : locale === "ky" ? "ky-KG" : "en-US";

  const formatSlotTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString(localeCode, {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  if (loading) {
    return (
      <PageShell title={t.mentors.title} subtitle={t.mentors.subtitle}>
        <div className="mentor-state-box">{t.mentors.detail.loading}</div>
      </PageShell>
    );
  }

  if (error || !mentor) {
    return (
      <PageShell title={t.mentors.title} subtitle={t.mentors.subtitle}>
        <div className="mentor-error-box">
          {error || t.mentors.detail.notFound}
        </div>
        <button
          className="btn btn-outline"
          onClick={() => navigate("/mentors")}
        >
          ← {t.mentors.detail.backToMentors}
        </button>
      </PageShell>
    );
  }

  return (
    <PageShell
      title={`${mentor.user?.firstName} ${mentor.user?.lastName}`}
      subtitle={mentor.title || t.mentors.detail.defaultTitle}
      eyebrow="Mentor profile"
      className="mentor-detail-page"
    >
      <div className="mentor-detail-back-row">
        <button
          type="button"
          className="mentor-detail-back-link"
          onClick={() => navigate("/mentors")}
        >
          ← {t.mentors.detail.backToMentors}
        </button>
      </div>

      {/* Profile Header Card */}
      <div className="card mentor-detail-hero-card">
        <div className="mentor-detail-hero-layout">
          <div className="mentor-detail-hero-main">
            <div className="mentor-avatar-xl">{getInitials(mentor)}</div>

            <div className="mentor-detail-hero-info">
              <div className="mentor-detail-heading-row">
                <div>
                  <h1 className="mentor-detail-name">
                    {mentor.user?.firstName} {mentor.user?.lastName}
                  </h1>
                  <p className="mentor-detail-title-text">
                    {mentor.title || t.mentors.detail.defaultTitle}
                  </p>
                  <div className="mentor-detail-meta-row">
                    <div className="mentor-detail-rating">
                      <span className="mentor-detail-rating-star">
                        <Star size={16} fill="currentColor" />
                      </span>
                      <span className="mentor-detail-rating-value">
                        {mentor.avgRating?.toFixed(1) || "0.0"}
                      </span>
                      <span className="mentor-detail-rating-reviews">
                        ({mentor.totalReviews || 0} {t.mentors.reviews})
                      </span>
                    </div>
                    {mentor.yearsExperience && (
                      <div className="mentor-detail-experience">
                        <span className="mentor-detail-experience-divider">
                          |
                        </span>
                        <div className="mentor-detail-experience-text">
                          <span className="mentor-detail-experience-value">
                            {mentor.yearsExperience}
                          </span>{" "}
                          {t.mentors.detail.yearsExperience}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mentor-detail-actions">
                    <button
                      className="btn btn-primary btn-lg mentor-detail-action-btn"
                      onClick={handleBookSession}
                    >
                      <CalendarRange size={16} />
                      {t.mentors.detail.bookSession}
                    </button>
                    <button className="btn btn-outline btn-lg mentor-detail-action-btn">
                      <Heart size={16} />
                      {t.mentors.detail.addToFavorites}
                    </button>
                    <button className="btn btn-outline btn-lg mentor-detail-action-btn">
                      <MessageCircle size={16} />
                      {t.mentors.detail.message}
                    </button>
                  </div>
                </div>

                <div className="mentor-detail-price-block">
                  <div className="mentor-detail-price-value">
                    ${mentor.hourlyRate || 0}
                    <span className="mentor-detail-price-unit">
                      {t.mentors.detail.perHour}
                    </span>
                  </div>
                  <div className="mentor-detail-price-currency">
                    {mentor.currency || "USD"}
                  </div>
                </div>
              </div>

              <div className="mentor-detail-highlight-row">
                <div className="mentor-detail-highlight-chip">
                  <Sparkles size={15} />
                  Verified-ready profile
                </div>
                <div className="mentor-detail-highlight-chip mentor-detail-highlight-chip-muted">
                  <Mail size={15} />
                  {mentor.user?.email}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mentor-detail-grid">
        <div className="mentor-detail-main-column">
          {/* About Card */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">{t.mentors.detail.about}</h2>
            </div>
            <div className="card-body">
              <p className="mentor-detail-copy">
                {mentor.bio || t.mentors.detail.noBio}
              </p>
            </div>
          </div>

          {/* Skills & Expertise Card */}
          {mentor.skills && mentor.skills.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">
                  {t.mentors.detail.skillsExpertise}
                </h2>
              </div>
              <div className="card-body">
                <div className="mentor-detail-chip-list">
                  {mentor.skills.map((skillRel) => (
                    <span
                      key={skillRel.skill.id}
                      className="mentor-detail-skill-chip"
                    >
                      {skillRel.skill.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Reviews Card */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">
                {t.mentors.detail.reviewsTitle} ({mentor.totalReviews || 0})
              </h2>
            </div>
            <div className="card-body">
              <div className="mentor-detail-empty-state">
                {t.mentors.detail.noReviews}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="mentor-detail-sidebar">
          <div className="card mentor-detail-preview-card">
            <div className="card-header">
              <h2 className="card-title">
                {t.mentors.detail.slotPreviewTitle}
              </h2>
            </div>
            <div className="card-body">
              <p className="mentor-detail-preview-copy">
                {t.mentors.detail.slotPreviewSubtitle}
              </p>
              <div className="form-group">
                <label className="form-label">{t.bookings.selectDate}</label>
                <input
                  type="date"
                  className="form-input"
                  value={previewDate}
                  onChange={(e) => setPreviewDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>

              {previewLoading ? (
                <div className="mentor-detail-preview-state">
                  {t.bookings.loadingAvailableSlots}
                </div>
              ) : previewError ? (
                <div className="mentor-detail-preview-error">
                  {previewError}
                </div>
              ) : previewSlots.length === 0 ? (
                <div className="mentor-detail-preview-state">
                  {t.mentors.detail.slotPreviewEmpty}
                </div>
              ) : (
                <>
                  <div className="mentor-detail-preview-list">
                    {previewSlots.slice(0, 6).map((slot) => (
                      <div key={slot.id} className="mentor-detail-preview-item">
                        <span>
                          {formatSlotTime(slot.startTime)} -{" "}
                          {formatSlotTime(slot.endTime)}
                        </span>
                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                          onClick={handleBookSession}
                        >
                          {t.mentors.detail.bookSession}
                        </button>
                      </div>
                    ))}
                  </div>
                  {previewSlots.length > 6 && (
                    <p className="mentor-detail-preview-more">
                      +{previewSlots.length - 6} {t.mentors.detail.moreSlots}
                    </p>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Stats Card */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">{t.mentors.detail.stats}</h2>
            </div>
            <div className="card-body">
              <div className="mentor-detail-stat-list">
                <div className="mentor-detail-stat-item">
                  <div className="mentor-detail-stat-label">
                    {t.mentors.detail.responseTime}
                  </div>
                  <div className="mentor-detail-stat-value">
                    {t.mentors.detail.responseTimeValue}
                  </div>
                </div>

                <div className="mentor-detail-stat-item">
                  <div className="mentor-detail-stat-label">
                    {t.mentors.detail.totalSessions}
                  </div>
                  <div className="mentor-detail-stat-value">
                    {mentor.totalReviews || 0}+
                  </div>
                </div>

                <div className="mentor-detail-stat-item">
                  <div className="mentor-detail-stat-label">
                    {t.mentors.detail.hourlyRate}
                  </div>
                  <div className="mentor-detail-stat-value">
                    ${mentor.hourlyRate || 0}/{mentor.currency || "USD"}
                  </div>
                </div>

                <div className="mentor-detail-stat-item">
                  <div className="mentor-detail-stat-label">
                    {t.mentors.detail.contact}
                  </div>
                  <div className="mentor-detail-stat-value mentor-detail-stat-value-break">
                    {mentor.user?.email}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Categories Card */}
          {mentor.categories && mentor.categories.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">{t.mentors.detail.categories}</h2>
              </div>
              <div className="card-body">
                <div className="mentor-detail-category-list">
                  {mentor.categories.map((catRel) => (
                    <div
                      key={catRel.category.id}
                      className="mentor-detail-category-item"
                    >
                      {catRel.category.name}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Alert Dialog */}
      <AlertDialog
        isOpen={alertDialog.isOpen}
        title={alertDialog.title}
        message={alertDialog.message}
        type={alertDialog.type}
        onClose={() => {
          setAlertDialog({ ...alertDialog, isOpen: false });
          if (alertDialog.onCloseAction) {
            alertDialog.onCloseAction();
          }
        }}
      />
    </PageShell>
  );
};
