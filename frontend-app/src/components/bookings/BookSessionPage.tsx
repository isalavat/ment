import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { PageShell } from "../common/PageShell";
import { mentorService, MentorProfile } from "../../services/mentorService";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage } from "../../i18n/LanguageContext";
import { BookingModal } from "./BookingModal";

interface LocationState {
  initialDate?: string;
}

export const BookSessionPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [mentor, setMentor] = useState<MentorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const state = (location.state as LocationState | null) ?? null;

  useEffect(() => {
    if (!user) {
      navigate("/login", { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    const fetchMentor = async () => {
      if (!id) return;
      setLoading(true);
      setError("");
      try {
        const data = await mentorService.getMentorById(id);
        setMentor(data);
      } catch (err: any) {
        setError(err.response?.data?.error || t.mentors.detail.notFound);
      } finally {
        setLoading(false);
      }
    };

    void fetchMentor();
  }, [id, t.mentors.detail.notFound]);

  if (loading) {
    return (
      <PageShell
        title={t.mentors.detail.bookSession}
        subtitle={t.bookings.chooseDatePickSlot}
      >
        <div className="booking-loading">
          {t.bookings.loadingAvailableSlots}
        </div>
      </PageShell>
    );
  }

  if (!mentor || !user || error) {
    return (
      <PageShell
        title={t.mentors.detail.bookSession}
        subtitle={t.bookings.chooseDatePickSlot}
      >
        <div className="booking-error">
          {error || t.mentors.detail.notFound}
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title={t.mentors.detail.bookSession}
      subtitle={`${mentor.user?.firstName} ${mentor.user?.lastName}`}
      eyebrow={t.nav.sections.main}
    >
      <BookingModal
        inline
        mentorId={mentor.id}
        mentorName={`${mentor.user?.firstName} ${mentor.user?.lastName}`}
        mentorTitle={mentor.title || ""}
        hourlyRate={mentor.hourlyRate || 0}
        currency={mentor.currency || "USD"}
        menteeId={user.id}
        initialDate={state?.initialDate}
        onClose={() => navigate(`/mentors/${mentor.id}`)}
        onSuccess={() => navigate("/bookings")}
      />
    </PageShell>
  );
};
