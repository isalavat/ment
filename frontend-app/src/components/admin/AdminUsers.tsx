import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminService, User } from '../../services/adminService';
import { useLanguage } from '../../i18n/LanguageContext';
import './AdminUsers.css';

export const AdminUsers: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    role: '',
    search: '',
    page: 1,
    limit: 20
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });

  useEffect(() => {
    loadUsers();
  }, [filters]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await adminService.getUsers(filters);
      setUsers(response.users);
      setPagination(response.pagination);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const handleDelete = async (userId: number) => {
    if (!window.confirm('Are you sure you want to delete this user?')) {
      return;
    }

    try {
      await adminService.deleteUser(userId);
      loadUsers();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete user');
    }
  };

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'badge-danger';
      case 'MENTOR':
        return 'badge-success';
      case 'MENTEE':
        return 'badge-primary';
      default:
        return '';
    }
  };

  return (
    <div className="content-area">
      <div className="page-header">
        <h1 className="page-title">User Management</h1>
        <button 
          className="btn btn-primary" 
          onClick={() => navigate('/admin/users/create')}
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
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
            </div>
            <div className="form-group">
              <select
                className="form-select"
                value={filters.role}
                onChange={(e) => handleFilterChange('role', e.target.value)}
              >
                <option value="">All Roles</option>
                <option value="MENTEE">Mentee</option>
                <option value="MENTOR">Mentor</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            <button 
              className="btn btn-outline"
              onClick={() => setFilters({ role: '', search: '', page: 1, limit: 20 })}
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger mb-md">{error}</div>
      )}

      {loading ? (
        <div className="card">
          <div className="card-body" style={{ textAlign: 'center', padding: 'var(--space-xxl)' }}>
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
                    <th>ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Profile</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td>{user.id}</td>
                      <td>
                        <div className="user-cell">
                          {user.avatarUrl && (
                            <img src={user.avatarUrl} alt="" className="user-avatar-sm" />
                          )}
                          <span>{user.firstName} {user.lastName}</span>
                        </div>
                      </td>
                      <td>{user.email}</td>
                      <td>
                        <span className={`badge ${getRoleBadgeClass(user.role)}`}>
                          {user.role}
                        </span>
                      </td>
                      <td>
                        {user.mentorProfile && (
                          <span className="profile-status success">✓ Mentor</span>
                        )}
                        {user.menteeProfile && (
                          <span className="profile-status success">✓ Mentee</span>
                        )}
                        {!user.mentorProfile && !user.menteeProfile && (
                          <span className="profile-status muted">No profile</span>
                        )}
                      </td>
                      <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="btn-icon"
                            onClick={() => navigate(`/admin/users/${user.id}`)}
                            title="View/Edit"
                          >
                            ✏️
                          </button>
                          <button
                            className="btn-icon btn-danger"
                            onClick={() => handleDelete(user.id)}
                            title="Delete"
                          >
                            🗑️
                          </button>
                        </div>
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
                onClick={() => setFilters(prev => ({ ...prev, page: prev.page - 1 }))}
              >
                Previous
              </button>
              <span className="pagination-info">
                Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
              </span>
              <button
                className="btn btn-outline btn-sm"
                disabled={pagination.page === pagination.totalPages}
                onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
