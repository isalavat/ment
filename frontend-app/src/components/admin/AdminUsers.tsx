import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { adminService, User } from "../../services/adminService";
import { useLanguage } from "../../i18n/LanguageContext";
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

  useEffect(() => {
    loadUsers();
  }, [filters]);

  const loadUsers = async () => {
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
      setError(err.response?.data?.error || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const handleDelete = async (userId: string, fullName: string) => {
    if (
      !window.confirm(
        `Are you sure you want to delete "${fullName}"? This cannot be undone.`,
      )
    ) {
      return;
    }

    try {
      await adminService.deleteUser(userId);
      loadUsers();
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to delete user");
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
      alert(err.response?.data?.error || "Failed to load profile");
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

  return (
    <div className="content-area">
      <div className="page-header">
        <h1 className="page-title">User Management</h1>
        <button
          className="btn btn-primary"
          onClick={() => navigate("/admin/users/create")}
        >
          + Create User
        </button>
      </div>

      {/* Filters */}
      <div className="card mb-lg">
        <div className="card-body">
          <div className="admin-filters">
            <div className="form-group">
              <input
                type="text"
                className="form-input"
                placeholder="Search by email or name..."
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
                <option value="">All Roles</option>
                <option value="USER">User</option>
                <option value="MENTOR">Mentor</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            <button
              className="btn btn-outline"
              onClick={() =>
                setFilters({ role: "", search: "", page: 1, limit: 20 })
              }
            >
              Clear Filters
            </button>
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
            Loading users...
          </div>
        </div>
      ) : (
        <>
          <div className="card">
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Actions</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Profile</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="btn-icon"
                            onClick={() => handleView(user.id, user.role)}
                            title="View profile"
                          >
                            👁️
                          </button>
                          <button
                            className="btn-icon"
                            onClick={() =>
                              navigate(`/admin/users/${user.id}`, {
                                state: { role: user.role },
                              })
                            }
                            title="Edit"
                          >
                            ✏️
                          </button>
                          <button
                            className="btn-icon btn-danger"
                            onClick={() =>
                              handleDelete(
                                user.id,
                                `${user.firstName} ${user.lastName}`,
                              )
                            }
                            title="Delete"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                      <td>
                        <div className="user-cell">
                          {user.avatarUrl && (
                            <img
                              src={user.avatarUrl}
                              alt=""
                              className="user-avatar-sm"
                            />
                          )}
                          <span>
                            {user.firstName} {user.lastName}
                          </span>
                        </div>
                      </td>
                      <td>{user.email}</td>
                      <td>
                        <span
                          className={`badge ${getRoleBadgeClass(user.role)}`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td>
                        {user.mentorProfile && (
                          <span className="profile-status success">
                            ✓ Mentor
                          </span>
                        )}
                        {!user.mentorProfile && (
                          <span className="profile-status muted">
                            No profile
                          </span>
                        )}
                      </td>
                      <td>{new Date(user.createdAt).toLocaleDateString()}</td>
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
                Previous
              </button>
              <span className="pagination-info">
                Page {pagination.page} of {pagination.totalPages} (
                {pagination.total} total)
              </span>
              <button
                className="btn btn-outline btn-sm"
                disabled={pagination.page === pagination.totalPages}
                onClick={() =>
                  setFilters((prev) => ({ ...prev, page: prev.page + 1 }))
                }
              >
                Next
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
                  : "Loading..."}
              </h2>
              <button className="view-modal-close" onClick={closeView}>
                ×
              </button>
            </div>

            <div className="view-modal-body">
              {viewLoading ? (
                <div
                  style={{ textAlign: "center", padding: "var(--space-xxl)" }}
                >
                  Loading profile...
                </div>
              ) : viewData ? (
                <>
                  {/* User info */}
                  <div className="view-section">
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
                          {viewData.role}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Mentor profile */}
                  {viewData.mentorProfile && (
                    <>
                      <div className="view-section">
                        <h3 className="view-section-title">Mentor Profile</h3>
                        <div className="view-grid">
                          <div className="view-field">
                            <span className="view-label">Title</span>
                            <span className="view-value">
                              {(viewData.mentorProfile as any).title || "—"}
                            </span>
                          </div>
                          <div className="view-field">
                            <span className="view-label">Experience</span>
                            <span className="view-value">
                              {(viewData.mentorProfile as any)
                                .yearsExperience ?? "—"}{" "}
                              yrs
                            </span>
                          </div>
                          <div className="view-field">
                            <span className="view-label">Hourly Rate</span>
                            <span className="view-value">
                              {(viewData.mentorProfile as any).hourlyRate}{" "}
                              {(viewData.mentorProfile as any).currency}
                            </span>
                          </div>
                          <div className="view-field">
                            <span className="view-label">Rating</span>
                            <span className="view-value">
                              ⭐{" "}
                              {(viewData.mentorProfile as any).avgRating ??
                                "N/A"}{" "}
                              (
                              {(viewData.mentorProfile as any).totalReviews ??
                                0}{" "}
                              reviews)
                            </span>
                          </div>
                        </div>
                        {(viewData.mentorProfile as any).bio && (
                          <div className="view-field mt-md">
                            <span className="view-label">Bio</span>
                            <p className="view-bio">
                              {(viewData.mentorProfile as any).bio}
                            </p>
                          </div>
                        )}
                      </div>

                      {(viewData.mentorProfile as any).skills?.length > 0 && (
                        <div className="view-section">
                          <h3 className="view-section-title">Skills</h3>
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
                          <h3 className="view-section-title">Categories</h3>
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
                      <h3 className="view-section-title">Profile</h3>
                      {viewData.bio && (
                        <div className="view-field">
                          <span className="view-label">Bio</span>
                          <p className="view-bio">{viewData.bio}</p>
                        </div>
                      )}
                      {viewData.goals && (
                        <div className="view-field mt-md">
                          <span className="view-label">Learning Goals</span>
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
                Close
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
                  Edit
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
