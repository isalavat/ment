import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { BadgeCheck, CircleX, Pencil } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import { adminService, MentorProfileFull } from "../../services/adminService";
import type { VerificationStatus } from "../../types/profile";
import { PageShell } from "../common/PageShell";
import "./AdminUsers.css";

const STATUS_BADGE: Record<VerificationStatus, string> = {
  PENDING: "badge-warning",
  VERIFIED: "badge-success",
  REJECTED: "badge-danger",
};

export const AdminMentors: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [mentors, setMentors] = useState<MentorProfileFull[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<VerificationStatus | "">("PENDING");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<MentorProfileFull | null>(
    null,
  );
  const [rejectionReason, setRejectionReason] = useState("");

  const loadMentors = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const data = await adminService.getMentorProfiles(filter || undefined);
      setMentors(data);
    } catch (err: any) {
      setError(err.response?.data?.error || t.admin.mentors.loadFailed);
    } finally {
      setLoading(false);
    }
  }, [filter, t.admin.mentors.loadFailed]);

  useEffect(() => {
    loadMentors();
  }, [loadMentors]);

  const handleVerify = async (mentor: MentorProfileFull) => {
    if (
      !window.confirm(
        `${t.admin.mentors.verifyPromptPrefix} "${mentor.user.firstName} ${mentor.user.lastName}"? ${t.admin.mentors.verifyPromptSuffix}`,
      )
    ) {
      return;
    }
    try {
      setActionLoading(mentor.id);
      await adminService.verifyMentor(mentor.id, "verify");
      await loadMentors();
    } catch (err: any) {
      alert(err.response?.data?.error || t.admin.mentors.verifyFailed);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectOpen = (mentor: MentorProfileFull) => {
    setRejectTarget(mentor);
    setRejectionReason("");
  };

  const handleRejectConfirm = async () => {
    if (!rejectTarget) return;
    try {
      setActionLoading(rejectTarget.id);
      await adminService.verifyMentor(
        rejectTarget.id,
        "reject",
        rejectionReason || undefined,
      );
      setRejectTarget(null);
      await loadMentors();
    } catch (err: any) {
      alert(err.response?.data?.error || t.admin.mentors.rejectFailed);
    } finally {
      setActionLoading(null);
    }
  };

  const statusLabels: Record<VerificationStatus, string> = {
    PENDING: t.admin.mentors.pending,
    VERIFIED: t.admin.mentors.verified,
    REJECTED: t.admin.mentors.rejected,
  };

  const formatCount = (count: number, singular: string, plural: string) =>
    `${count} ${count === 1 ? singular : plural}`;

  return (
    <PageShell title={t.admin.mentors.title}>
      {/* Filter */}
      <div className="card mb-lg">
        <div className="card-body">
          <div className="admin-filters">
            <div className="form-group">
              <select
                className="form-select"
                value={filter}
                onChange={(e) =>
                  setFilter(e.target.value as VerificationStatus | "")
                }
              >
                <option value="">{t.admin.shared.allStatuses}</option>
                <option value="PENDING">{t.admin.mentors.pendingReview}</option>
                <option value="VERIFIED">{t.admin.mentors.verified}</option>
                <option value="REJECTED">{t.admin.mentors.rejected}</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {error && <div className="alert alert-danger mb-md">{error}</div>}

      {loading ? (
        <div className="card">
          <div className="card-body admin-center-state">
            {t.admin.mentors.loadingMentors}
          </div>
        </div>
      ) : mentors.length === 0 ? (
        <div className="card">
          <div className="card-body admin-center-muted">
            {t.admin.mentors.emptyPrefix} "
            {filter ? statusLabels[filter] : t.admin.mentors.anyStatus}"
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="table-container">
            <table className="table admin-table admin-table-mentors">
              <thead>
                <tr>
                  <th className="admin-column-actions">
                    {t.admin.shared.actions}
                  </th>
                  <th className="admin-column-mentor">
                    {t.admin.mentors.mentor}
                  </th>
                  <th className="admin-column-title">{t.admin.shared.title}</th>
                  <th className="admin-column-rate">{t.admin.mentors.rate}</th>
                  <th className="admin-column-skills">
                    {t.admin.shared.skills}
                  </th>
                  <th className="admin-column-categories">
                    {t.admin.shared.categories}
                  </th>
                  <th className="admin-column-status">
                    {t.admin.shared.status}
                  </th>
                </tr>
              </thead>
              <tbody>
                {mentors.map((mentor) => (
                  <tr key={mentor.id}>
                    <td className="admin-column-actions">
                      <div className="action-buttons">
                        <button
                          className="btn-icon"
                          onClick={() =>
                            navigate(`/admin/users/${mentor.user.id}`)
                          }
                          title={t.admin.mentors.editProfile}
                        >
                          <Pencil size={16} aria-hidden="true" />
                        </button>
                        {mentor.verificationStatus !== "VERIFIED" && (
                          <button
                            onClick={() => handleVerify(mentor)}
                            disabled={actionLoading === mentor.id}
                            title={t.admin.mentors.verify}
                            className="btn-icon admin-verify-btn"
                          >
                            <BadgeCheck size={16} aria-hidden="true" />
                          </button>
                        )}
                        {mentor.verificationStatus !== "REJECTED" && (
                          <button
                            className="btn-icon btn-danger"
                            onClick={() => handleRejectOpen(mentor)}
                            disabled={actionLoading === mentor.id}
                            title={t.admin.mentors.reject}
                          >
                            <CircleX size={16} aria-hidden="true" />
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="admin-column-mentor">
                      <div className="user-cell">
                        <div className="admin-user-copy">
                          <span className="admin-user-name">
                            {mentor.user.firstName} {mentor.user.lastName}
                          </span>
                          <span className="admin-user-email">
                            {mentor.user.email}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="admin-column-title">{mentor.title}</td>
                    <td className="admin-column-rate">
                      {mentor.hourlyRate} {mentor.currency}
                    </td>
                    <td className="admin-column-skills">
                      {mentor.skills.length > 0 ? (
                        <span className="badge badge-primary">
                          {formatCount(
                            mentor.skills.length,
                            t.admin.mentors.skill,
                            t.admin.mentors.skills,
                          )}
                        </span>
                      ) : (
                        <span className="admin-muted-symbol">—</span>
                      )}
                    </td>
                    <td className="admin-column-categories">
                      {mentor.categories.length > 0 ? (
                        <span className="badge badge-primary">
                          {formatCount(
                            mentor.categories.length,
                            t.admin.mentors.category,
                            t.admin.mentors.categories,
                          )}
                        </span>
                      ) : (
                        <span className="admin-muted-symbol">—</span>
                      )}
                    </td>
                    <td className="admin-column-status">
                      <span
                        className={`badge ${STATUS_BADGE[mentor.verificationStatus]}`}
                      >
                        {statusLabels[mentor.verificationStatus]}
                      </span>
                      {mentor.verificationStatus === "REJECTED" &&
                        mentor.rejectionReason && (
                          <div className="admin-rejection-reason">
                            {mentor.rejectionReason}
                          </div>
                        )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectTarget && (
        <div
          className="view-modal-overlay"
          onClick={() => setRejectTarget(null)}
        >
          <div className="view-modal" onClick={(e) => e.stopPropagation()}>
            <div className="view-modal-header">
              <h2>
                {t.admin.mentors.rejectTitlePrefix}{" "}
                {rejectTarget.user.firstName} {rejectTarget.user.lastName}
              </h2>
              <button
                className="view-modal-close"
                onClick={() => setRejectTarget(null)}
              >
                ×
              </button>
            </div>
            <div className="view-modal-body">
              <div className="form-group">
                <label className="form-label">
                  {t.admin.mentors.rejectionReason}{" "}
                  <span className="admin-inline-note">
                    ({t.admin.mentors.rejectionReasonHelp})
                  </span>
                </label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder={t.admin.mentors.rejectionPlaceholder}
                />
              </div>
            </div>
            <div className="view-modal-footer">
              <button
                className="btn btn-outline"
                onClick={() => setRejectTarget(null)}
              >
                {t.common.cancel}
              </button>
              <button
                className="btn btn-danger"
                onClick={handleRejectConfirm}
                disabled={actionLoading === rejectTarget.id}
              >
                {actionLoading === rejectTarget.id
                  ? t.admin.mentors.rejecting
                  : t.admin.mentors.confirmRejection}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
};
