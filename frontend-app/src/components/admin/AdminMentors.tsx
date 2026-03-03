import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { adminService, MentorProfileFull } from "../../services/adminService";
import type { VerificationStatus } from "../../types/profile";
import "./AdminUsers.css";

const STATUS_LABELS: Record<VerificationStatus, string> = {
  PENDING: "Pending",
  VERIFIED: "Verified",
  REJECTED: "Rejected",
};

const STATUS_BADGE: Record<VerificationStatus, string> = {
  PENDING: "badge-warning",
  VERIFIED: "badge-success",
  REJECTED: "badge-danger",
};

export const AdminMentors: React.FC = () => {
  const navigate = useNavigate();
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
      setError(err.response?.data?.error || "Failed to load mentors");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadMentors();
  }, [loadMentors]);

  const handleVerify = async (mentor: MentorProfileFull) => {
    if (
      !window.confirm(
        `Verify "${mentor.user.firstName} ${mentor.user.lastName}"? They will appear in search results once they set their availability.`,
      )
    ) {
      return;
    }
    try {
      setActionLoading(mentor.id);
      await adminService.verifyMentor(mentor.id, "verify");
      await loadMentors();
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to verify mentor");
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
      alert(err.response?.data?.error || "Failed to reject mentor");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="content-area">
      <div className="page-header">
        <h1 className="page-title">Mentor Verification</h1>
      </div>

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
                <option value="">All Statuses</option>
                <option value="PENDING">Pending Review</option>
                <option value="VERIFIED">Verified</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {error && <div className="alert alert-danger mb-md">{error}</div>}

      {loading ? (
        <div className="card">
          <div
            className="card-body"
            style={{ textAlign: "center", padding: "var(--space-xxl)" }}
          >
            Loading mentors...
          </div>
        </div>
      ) : mentors.length === 0 ? (
        <div className="card">
          <div
            className="card-body"
            style={{
              textAlign: "center",
              padding: "var(--space-xxl)",
              color: "var(--neutral-500)",
            }}
          >
            No mentors with status "{filter || "any"}"
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Actions</th>
                  <th>Mentor</th>
                  <th>Title</th>
                  <th>Rate</th>
                  <th>Skills</th>
                  <th>Categories</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {mentors.map((mentor) => (
                  <tr key={mentor.id}>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn-icon"
                          onClick={() =>
                            navigate(`/admin/users/${mentor.user.id}`)
                          }
                          title="Edit profile"
                        >
                          ✏️
                        </button>
                        {mentor.verificationStatus !== "VERIFIED" && (
                          <button
                            className="btn-icon"
                            onClick={() => handleVerify(mentor)}
                            disabled={actionLoading === mentor.id}
                            title="Verify"
                            style={{ color: "var(--color-success, #22c55e)" }}
                          >
                            ✓
                          </button>
                        )}
                        {mentor.verificationStatus !== "REJECTED" && (
                          <button
                            className="btn-icon btn-danger"
                            onClick={() => handleRejectOpen(mentor)}
                            disabled={actionLoading === mentor.id}
                            title="Reject"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="user-cell">
                        <span>
                          {mentor.user.firstName} {mentor.user.lastName}
                        </span>
                        <span
                          style={{
                            display: "block",
                            fontSize: "var(--font-size-sm)",
                            color: "var(--neutral-500)",
                          }}
                        >
                          {mentor.user.email}
                        </span>
                      </div>
                    </td>
                    <td>{mentor.title}</td>
                    <td>
                      {mentor.hourlyRate} {mentor.currency}
                    </td>
                    <td>
                      {mentor.skills.length > 0 ? (
                        <span className="badge badge-primary">
                          {mentor.skills.length} skill
                          {mentor.skills.length > 1 ? "s" : ""}
                        </span>
                      ) : (
                        <span style={{ color: "var(--neutral-400)" }}>—</span>
                      )}
                    </td>
                    <td>
                      {mentor.categories.length > 0 ? (
                        <span className="badge badge-primary">
                          {mentor.categories.length} categor
                          {mentor.categories.length > 1 ? "ies" : "y"}
                        </span>
                      ) : (
                        <span style={{ color: "var(--neutral-400)" }}>—</span>
                      )}
                    </td>
                    <td>
                      <span
                        className={`badge ${STATUS_BADGE[mentor.verificationStatus]}`}
                      >
                        {STATUS_LABELS[mentor.verificationStatus]}
                      </span>
                      {mentor.verificationStatus === "REJECTED" &&
                        mentor.rejectionReason && (
                          <div
                            style={{
                              fontSize: "var(--font-size-sm)",
                              color: "var(--neutral-500)",
                              marginTop: "var(--space-xs)",
                            }}
                          >
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
                Reject {rejectTarget.user.firstName}{" "}
                {rejectTarget.user.lastName}
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
                  Rejection Reason{" "}
                  <span
                    style={{ color: "var(--neutral-500)", fontWeight: 400 }}
                  >
                    (optional — shown to the mentor)
                  </span>
                </label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g. Please add at least one category and skill before resubmitting."
                />
              </div>
            </div>
            <div className="view-modal-footer">
              <button
                className="btn btn-outline"
                onClick={() => setRejectTarget(null)}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={handleRejectConfirm}
                disabled={actionLoading === rejectTarget.id}
              >
                {actionLoading === rejectTarget.id
                  ? "Rejecting..."
                  : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
