import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './Sidebar.css'

export const Sidebar: React.FC = () => {
    const { user, logout, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <aside id='sidebar' className="sidebar">
            <div className="sidebar-header">
                <div className="sidebar-logo">
                    <span>🎓</span>
                    <span>MentorHub</span>
                </div>
            </div>
            <nav className="sidebar-nav">
                <div className="nav-section">
                    <div className="nav-section-title">Main</div>
                    <Link to="/" className="nav-item">
                        <span className="nav-icon">👨‍🎓</span>
                        <span>MentorHub</span>
                    </Link>

                </div>
            </nav>
            <nav className="sidebar-nav">
                <div className="nav-section">
                    <div className="nav-section-title">Main</div>
                    <Link to="/" className="nav-item">
                        <span className="nav-icon">👨‍🎓</span>
                        <span>MentorHub</span>
                    </Link>
                    <Link to="/dashboard" className="nav-item">
                        <span className="nav-icon">📊</span>
                        <span>Dashboard</span>
                    </Link>

                </div>
            </nav>
            <nav className="sidebar-nav">
                {isAuthenticated ? (
                    <>
                        <span className="user-info">
                            Hello, {user?.firstName} ({user?.role})
                        </span>

                        <Link to="/dashboard" className="nav-link">Dashboard</Link>
                        <button onClick={handleLogout} className='btn-logout'>
                            Logout
                        </button>
                    </>
                ) : (
                    <>
                        <Link to="/login" className="nav-link">Login</Link>
                        <Link to="/register" className="nav-link">Register</Link>
                    </>
                )}
            </nav>
        </aside>
    );
}