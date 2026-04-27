import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  BadgeCheck,
  CirclePlus,
  Eye,
  Pencil,
  Star,
  Trash2,
} from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import { adminService, User } from "../../services/adminService";
import { PageShell } from "../common/PageShell";
import "./AdminUsers.css";

export const AdminUsers: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    role: "",
    search: "",
    page: 1,
    limit: 20,
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  const [viewTarget, setViewTarget] = useState<{
    userId: string;
    role: string;
  } | null>(null);
  const [viewData, setViewData] = useState<User | null>(null);
  const [viewLoading, setViewLoading] = useState(false);

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const response = await adminService.getUsers({
        role: filters.role || undefined,
        search: filters.search || undefined,
        page: filters.page,
        limit: filters.limit,
      });
      setUsers(response.users);
      setPagination(response.pagination);
    } catch (err: any) {
      setError(err.response?.data?.error || t.admin.users.loadFailed);
    } finally {
      setLoading(false);
    }
  }, [filters, t.admin.users.loadFailed]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const handleDelete = async (userId: string, fullName: string) => {
    if (
      !window.confirm(
        `${t.admin.users.deletePromptPrefix} "${fullName}"? ${t.admin.users.deletePromptSuffix}`,
      )
    ) {
      return;
    }

    try {
      await adminService.deleteUser(userId);
      void loadUsers();
    } catch (err: any) {
      alert(err.response?.data?.error || t.admin.users.deleteFailed);
    }
  };

  const handleView = async (userId: string, role: string) => {
    setViewData(null);
    setViewTarget({ userId, role });
    setViewLoading(true);
    try {
      const data = await adminService.getUser(userId);
      setViewData(data);
    } catch (err: any) {
      alert(err.response?.data?.error || t.admin.users.loadProfileFailed);
      setViewTarget(null);
    } finally {
      setViewLoading(false);
    }
  };

  const closeView = () => {
    setViewTarget(null);
    setViewData(null);
  };

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "badge-danger";
      case "MENTOR":
        return "badge-success";
      case "USER":
        return "badge-primary";
      default:
        return "";
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "ADMIN":
        return t.common.roles.admin;
      case "MENTOR":
        return t.common.roles.mentor;
      case "USER":
        return t.common.roles.learner;
      default:
        return role;
    }
  };

  return (
    <PageShell
      title={t.admin.users.title}
      actions={
        <button
          className="btn btn-primary"
          onClick={() => navigate("/admin/users/create")}
        >
          <CirclePlus size={16} aria-hidden="true" /> {t.admin.users.createUser}
        </button>
      }
    >
      {/* Filters */}
      <div className="card mb-lg">
        <div className="card-body">
          <div className="admin-filters">
            <div className="form-group">
              <input
                type="text"
                className="form-input"
                placeholder={t.admin.users.searchPlaceholder}
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
              />
            </div>
            <div className="form-group">
              <select
                className="form-select"
                value={filters.role}
                onChange={(e) => handleFilterChange("role", e.target.value)}
              >
                <option value="">{t.admin.shared.allRoles}</option>
                <option value="USER">{t.common.roles.learner}</option>
                <option value="MENTOR">{t.common.roles.mentor}</option>
                <option value="ADMIN">{t.common.roles.admin}</option>
              </select>
            </div>
            <button
              className="btn btn-outline"
              onClick={() =>
                setFilters({ role: "", search: "", page: 1, limit: 20 })
              }
            >
              {t.admin.shared.clearFilters}
            </button>
          </div>
        </div>
      </div>

      {error && <div className="alert alert-danger mb-md">{error}</div>}

      {loading ? (
        <div className="card">
          <div className="card-body admin-center-state">
            {t.admin.users.loadingUsers}
          </div>
        </div>
      ) : (
        <>
          <div className="card">
            <div className="table-container">
              <table className="table admin-table admin-table-users">
                <thead>
                  <tr>
                    <th className="admin-column-actions">
                      {t.admin.shared.actions}
                    </th>
                    <th className="admin-column-name">{t.common.name}</th>
                    <th className="admin-column-email">{t.common.email}</th>
                    <th className="admin-column-role">{t.admin.shared.role}</th>
                    <th className="admin-column-profile">
                      {t.admin.shared.profile}
                    </th>
                    <th className="admin-column-created">
                      {t.admin.shared.created}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td className="admin-column-actions">
                        <div className="action-buttons">
                          <button
                            className="btn-icon"
                            onClick={() => handleView(user.id, user.role)}
                            title={t.admin.users.viewProfile}
                          >
                            <Eye size={16} aria-hidden="true" />
                          </button>
                          <button
                            className="btn-icon"
                            onClick={() =>
                              navigate(`/admin/users/${user.id}`, {
                                state: { role: user.role },
                              })
                            }
                            title={t.admin.users.editUser}
                          >
                            <Pencil size={16} aria-hidden="true" />
                          </button>
                          <button
                            className="btn-icon btn-danger"
                            onClick={() =>
                              handleDelete(
                                user.id,
                                `${user.firstName} ${user.lastName}`,
                              )
                            }
                            title={t.admin.users.deleteUser}
                          >
                            <Trash2 size={16} aria-hidden="true" />
                          </button>
                        </div>
                      </td>
                      <td className="admin-column-name">
                        <div className="user-cell">
                          {user.avatarUrl && (
                            <img
                              src={user.avatarUrl}
                              alt=""
                              className="user-avatar-sm"
                            />
                          )}
                          <div className="admin-user-copy">
                            <span className="admin-user-name">
                              {user.firstName} {user.lastName}
                            </span>
                            <span className="admin-user-email admin-mobile-email">
                              {user.email}
                            </span>
                            <div
                              className="admin-mobile-meta"
                              aria-hidden="true"
                            >
                              <span className="admin-meta-chip">
                                {t.admin.shared.role}: {getRoleLabel(user.role)}
                              </span>
                              <span className="admin-meta-chip">
                                {t.admin.shared.profile}:{" "}
                                {user.mentorProfile
                                  ? t.admin.users.mentorBadge
                                  : t.admin.shared.noProfile}
                              </span>
                              <span className="admin-meta-chip">
                                {t.admin.shared.created}:{" "}
                                {new Date(user.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="admin-column-email">{user.email}</td>
                      <td className="admin-column-role">
                        <span
                          className={`badge ${getRoleBadgeClass(user.role)}`}
                        >
                          {getRoleLabel(user.role)}
                        </span>
                      </td>
                      <td className="admin-column-profile">
                        {user.mentorProfile && (
                          <span className="profile-status success">
                            <BadgeCheck size={14} aria-hidden="true" />{" "}
                            {t.admin.users.mentorBadge}
                          </span>
                        )}
                        {!user.mentorProfile && (
                          <span className="profile-status muted">
                            {t.admin.shared.noProfile}
                          </span>
                        )}
                      </td>
                      <td className="admin-column-created">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="pagination mt-md">
              <button
                className="btn btn-outline btn-sm"
                disabled={pagination.page === 1}
                onClick={() =>
                  setFilters((prev) => ({ ...prev, page: prev.page - 1 }))
                }
              >
                {t.admin.users.previous}
              </button>
              <span className="pagination-info">
                {t.admin.users.page} {pagination.page} {t.admin.users.of}{" "}
                {pagination.totalPages} ({pagination.total}{" "}
                {t.admin.users.total})
              </span>
              <button
                className="btn btn-outline btn-sm"
                disabled={pagination.page === pagination.totalPages}
                onClick={() =>
                  setFilters((prev) => ({ ...prev, page: prev.page + 1 }))
                }
              >
                {t.admin.users.next}
              </button>
            </div>
          )}
        </>
      )}

      {/* View Profile Modal */}
      {viewTarget && (
        <div className="view-modal-overlay" onClick={closeView}>
          <div className="view-modal" onClick={(e) => e.stopPropagation()}>
            <div className="view-modal-header">
              <h2>
                {viewData
                  ? `${viewData.firstName} ${viewData.lastName}`
                  : t.common.loading}
              </h2>
              <button className="view-modal-close" onClick={closeView}>
                ×
              </button>
            </div>

            <div className="view-modal-body">
              {viewLoading ? (
                <div className="admin-center-state">
                  {t.admin.shared.loadingProfile}
                </div>
              ) : viewData ? (
                <>
                  {/* User info */}
                  <div className="view-section">
                    <h3 className="view-section-title">
                      {t.admin.users.userInfo}
                    </h3>
                    <div className="view-user-header">
                      {viewData.avatarUrl && (
                        <img
                          src={viewData.avatarUrl}
                          alt=""
                          className="view-avatar"
                        />
                      )}
                      <div>
                        <div className="view-name">
                          {viewData.firstName} {viewData.lastName}
                        </div>
                        <div className="view-email">{viewData.email}</div>
                        <span
                          className={`badge ${getRoleBadgeClass(
                            viewData.role,
                          )}`}
                        >
                          {getRoleLabel(viewData.role)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Mentor profile */}
                  {viewData.mentorProfile && (
                    <>
                      <div className="view-section">
                        <h3 className="view-section-title">
                          {t.admin.shared.mentorProfile}
                        </h3>
                        <div className="view-grid">
                          <div className="view-field">
                            <span className="view-label">
                              {t.admin.shared.title}
                            </span>
                            <span className="view-value">
                              {(viewData.mentorProfile as any).title || "—"}
                            </span>
                          </div>
                          <div className="view-field">
                            <span className="view-label">
                              {t.admin.shared.experience}
                            </span>
                            <span className="view-value">
                              {(viewData.mentorProfile as any)
                                .yearsExperience ?? "—"}{" "}
                              {t.admin.shared.yearsShort}
                            </span>
                          </div>
                          <div className="view-field">
                            <span className="view-label">
                              {t.admin.shared.hourlyRate}
                            </span>
                            <span className="view-value">
                              {(viewData.mentorProfile as any).hourlyRate}{" "}
                              {(viewData.mentorProfile as any).currency}
                            </span>
                          </div>
                          <div className="view-field">
                            <span className="view-label">
                              {t.admin.shared.rating}
                            </span>
                            <span className="view-value admin-rating-value">
                              <Star size={14} aria-hidden="true" />
                              {(viewData.mentorProfile as any).avgRating ??
                                t.admin.shared.notAvailable}{" "}
                              (
                              {(viewData.mentorProfile as any).totalReviews ??
                                0}{" "}
                              {t.mentors.reviews})
                            </span>
                          </div>
                        </div>
                        {(viewData.mentorProfile as any).bio && (
                          <div className="view-field mt-md">
                            <span className="view-label">
                              {t.admin.shared.bio}
                            </span>
                            <p className="view-bio">
                              {(viewData.mentorProfile as any).bio}
                            </p>
                          </div>
                        )}
                      </div>

                      {(viewData.mentorProfile as any).skills?.length > 0 && (
                        <div className="view-section">
                          <h3 className="view-section-title">
                            {t.admin.users.skillsSection}
                          </h3>
                          <div className="skills-list">
                            {(viewData.mentorProfile as any).skills.map(
                              (ms: any) => (
                                <span
                                  key={ms.skill.id}
                                  className="skill-chip-view"
                                >
                                  {ms.skill.name}
                                </span>
                              ),
                            )}
                          </div>
                        </div>
                      )}

                      {(viewData.mentorProfile as any).categories?.length >
                        0 && (
                        <div className="view-section">
                          <h3 className="view-section-title">
                            {t.admin.users.categoriesSection}
                          </h3>
                          <div className="skills-list">
                            {(viewData.mentorProfile as any).categories.map(
                              (mc: any) => (
                                <span
                                  key={mc.category.id}
                                  className="skill-chip-view skill-chip-category"
                                >
                                  {mc.category.name}
                                </span>
                              ),
                            )}
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* User bio/goals */}
                  {(viewData.bio || viewData.goals) && (
                    <div className="view-section">
                      <h3 className="view-section-title">
                        {t.admin.users.profileSection}
                      </h3>
                      {viewData.bio && (
                        <div className="view-field">
                          <span className="view-label">
                            {t.admin.shared.bio}
                          </span>
                          <p className="view-bio">{viewData.bio}</p>
                        </div>
                      )}
                      {viewData.goals && (
                        <div className="view-field mt-md">
                          <span className="view-label">
                            {t.admin.shared.learningGoals}
                          </span>
                          <p className="view-bio">{viewData.goals}</p>
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : null}
            </div>

            <div className="view-modal-footer">
              <button className="btn btn-outline" onClick={closeView}>
                {t.admin.shared.close}
              </button>
              {viewData && (
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    closeView();
                    navigate(`/admin/users/${viewData.id}`, {
                      state: { role: viewTarget.role },
                    });
                  }}
                >
                  {t.admin.users.edit}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
};
