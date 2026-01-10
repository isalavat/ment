import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useLanguage } from "../../i18n/LanguageContext";
import { useAuth } from "../../contexts/AuthContext";
import { mentorService, MentorProfile } from "../../services/mentorService";
import { BookingModal } from "../bookings/BookingModal";
import { AlertDialog } from "../common/AlertDialog";
import "./Mentors.css";

export const MentorDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user } = useAuth();
  const [mentor, setMentor] = useState<MentorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showBookingModal, setShowBookingModal] = useState(false);
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

  const getInitials = (mentor: MentorProfile) => {
    const firstName = mentor.user?.firstName || "";
    const lastName = mentor.user?.lastName || "";
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const handleBookSession = () => {
    console.log("Book Session clicked", {
      user,
      menteeProfileId: user?.menteeProfileId,
    });

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

    if (!user.menteeProfileId) {
      setAlertDialog({
        isOpen: true,
        title: "Profile Required",
        message: "You need to create a mentee profile first",
        type: "warning",
        onCloseAction: () => navigate("/profile/mentee"),
      });
      return;
    }

    setShowBookingModal(true);
  };

  const handleBookingSuccess = () => {
    setAlertDialog({
      isOpen: true,
      title: "Success!",
      message: "Booking created successfully! Check your bookings page.",
      type: "success",
      onCloseAction: () => navigate("/bookings"),
    });
  };

  if (loading) {
    return (
      <div className="content-area">
        <div
          style={{
            textAlign: "center",
            padding: "var(--space-xl)",
            color: "var(--neutral-600)",
          }}
        >
          {t.mentors.detail.loading}
        </div>
      </div>
    );
  }

  if (error || !mentor) {
    return (
      <div className="content-area">
        <div
          style={{
            padding: "var(--space-md)",
            background: "var(--danger-50)",
            color: "var(--danger-700)",
            borderRadius: "var(--radius-md)",
            marginBottom: "var(--space-md)",
          }}
        >
          {error || t.mentors.detail.notFound}
        </div>
        <button
          className="btn btn-outline"
          onClick={() => navigate("/mentors")}
        >
          ← {t.mentors.detail.backToMentors}
        </button>
      </div>
    );
  }

  return (
    <div className="content-area">
      <div style={{ marginBottom: "var(--space-md)" }}>
        <a
          onClick={() => navigate("/mentors")}
          style={{
            color: "var(--neutral-600)",
            display: "inline-flex",
            alignItems: "center",
            gap: "var(--space-xs)",
            cursor: "pointer",
            textDecoration: "none",
          }}
        >
          ← {t.mentors.detail.backToMentors}
        </a>
      </div>

      {/* Profile Header Card */}
      <div className="card">
        <div
          style={{ display: "flex", gap: "var(--space-xl)", flexWrap: "wrap" }}
        >
          <div
            style={{
              display: "flex",
              gap: "var(--space-lg)",
              alignItems: "start",
            }}
          >
            <div className="mentor-avatar-xl">{getInitials(mentor)}</div>

            <div style={{ flex: 1 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "start",
                  justifyContent: "space-between",
                  gap: "var(--space-md)",
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <h1
                    style={{
                      fontSize: "var(--font-size-xxl)",
                      marginBottom: "var(--space-xs)",
                    }}
                  >
                    {mentor.user?.firstName} {mentor.user?.lastName}
                  </h1>
                  <p
                    style={{
                      fontSize: "var(--font-size-lg)",
                      color: "var(--neutral-600)",
                      marginBottom: "var(--space-sm)",
                    }}
                  >
                    {mentor.title || t.mentors.detail.defaultTitle}
                  </p>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "var(--space-md)",
                      marginBottom: "var(--space-md)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "var(--space-xs)",
                      }}
                    >
                      <span
                        style={{
                          color: "var(--warning-yellow)",
                          fontSize: "20px",
                        }}
                      >
                        ⭐
                      </span>
                      <span
                        style={{
                          fontSize: "var(--font-size-lg)",
                          fontWeight: 600,
                        }}
                      >
                        {mentor.avgRating?.toFixed(1) || "0.0"}
                      </span>
                      <span style={{ color: "var(--neutral-500)" }}>
                        ({mentor.totalReviews || 0} {t.mentors.reviews})
                      </span>
                    </div>
                    {mentor.yearsExperience && (
                      <>
                        <span style={{ color: "var(--neutral-400)" }}>|</span>
                        <div>
                          <span style={{ fontWeight: 600 }}>
                            {mentor.yearsExperience}
                          </span>{" "}
                          {t.mentors.detail.yearsExperience}
                        </div>
                      </>
                    )}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: "var(--space-sm)",
                      flexWrap: "wrap",
                    }}
                  >
                    <button
                      className="btn btn-primary btn-lg"
                      onClick={handleBookSession}
                    >
                      📅 {t.mentors.detail.bookSession}
                    </button>
                    <button className="btn btn-outline btn-lg">
                      ❤️ {t.mentors.detail.addToFavorites}
                    </button>
                    <button className="btn btn-outline btn-lg">
                      💬 {t.mentors.detail.message}
                    </button>
                  </div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <div
                    style={{
                      fontSize: "var(--font-size-xxl)",
                      fontWeight: 600,
                      color: "var(--primary-blue)",
                    }}
                  >
                    ${mentor.hourlyRate || 0}
                    <span
                      style={{
                        fontSize: "var(--font-size-base)",
                        fontWeight: 400,
                        color: "var(--neutral-600)",
                      }}
                    >
                      {t.mentors.detail.perHour}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: "var(--font-size-sm)",
                      color: "var(--neutral-500)",
                    }}
                  >
                    {mentor.currency || "USD"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-3">
        <div style={{ gridColumn: "span 2" }}>
          {/* About Card */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">{t.mentors.detail.about}</h2>
            </div>
            <div className="card-body">
              <p style={{ lineHeight: 1.8 }}>
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
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "var(--space-sm)",
                  }}
                >
                  {mentor.skills.map((skillRel) => (
                    <span
                      key={skillRel.skill.id}
                      className="badge badge-primary"
                      style={{
                        padding: "var(--space-sm) var(--space-md)",
                        fontSize: "var(--font-size-sm)",
                      }}
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
              <div
                style={{
                  textAlign: "center",
                  color: "var(--neutral-500)",
                  padding: "var(--space-xl)",
                }}
              >
                {t.mentors.detail.noReviews}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div>
          {/* Stats Card */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">{t.mentors.detail.stats}</h2>
            </div>
            <div className="card-body">
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "var(--space-md)",
                }}
              >
                <div>
                  <div
                    style={{
                      color: "var(--neutral-500)",
                      fontSize: "var(--font-size-sm)",
                      marginBottom: "4px",
                    }}
                  >
                    {t.mentors.detail.responseTime}
                  </div>
                  <div
                    style={{ fontWeight: 600, fontSize: "var(--font-size-md)" }}
                  >
                    {t.mentors.detail.responseTimeValue}
                  </div>
                </div>

                <div>
                  <div
                    style={{
                      color: "var(--neutral-500)",
                      fontSize: "var(--font-size-sm)",
                      marginBottom: "4px",
                    }}
                  >
                    {t.mentors.detail.totalSessions}
                  </div>
                  <div
                    style={{ fontWeight: 600, fontSize: "var(--font-size-md)" }}
                  >
                    {mentor.totalReviews || 0}+
                  </div>
                </div>

                <div>
                  <div
                    style={{
                      color: "var(--neutral-500)",
                      fontSize: "var(--font-size-sm)",
                      marginBottom: "4px",
                    }}
                  >
                    {t.mentors.detail.hourlyRate}
                  </div>
                  <div
                    style={{ fontWeight: 600, fontSize: "var(--font-size-md)" }}
                  >
                    ${mentor.hourlyRate || 0}/{mentor.currency || "USD"}
                  </div>
                </div>

                <div>
                  <div
                    style={{
                      color: "var(--neutral-500)",
                      fontSize: "var(--font-size-sm)",
                      marginBottom: "4px",
                    }}
                  >
                    {t.mentors.detail.contact}
                  </div>
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: "var(--font-size-md)",
                      wordBreak: "break-all",
                    }}
                  >
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
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "var(--space-xs)",
                  }}
                >
                  {mentor.categories.map((catRel) => (
                    <div
                      key={catRel.category.id}
                      style={{
                        padding: "var(--space-sm)",
                        background: "var(--neutral-50)",
                        borderRadius: "var(--radius-sm)",
                        fontWeight: 500,
                      }}
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

      {/* Booking Modal */}
      {showBookingModal && mentor && user?.menteeProfileId && (
        <BookingModal
          mentorId={mentor.id}
          mentorName={`${mentor.user?.firstName} ${mentor.user?.lastName}`}
          mentorTitle={mentor.title || ""}
          hourlyRate={mentor.hourlyRate || 0}
          currency={mentor.currency || "USD"}
          menteeId={user.menteeProfileId}
          onClose={() => setShowBookingModal(false)}
          onSuccess={handleBookingSuccess}
        />
      )}

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
    </div>
  );
};
