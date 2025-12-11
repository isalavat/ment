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
                <div className="nav-section">
                    <div className="nav-section-title">Account</div>

                   <div className="nav-item" onClick={handleLogout} style={{ cursor: 'pointer' }}>
                        <span className="nav-icon">🚪</span>
                        <span>Logout</span>
                    </div>
                </div>
                
            </nav>
        </aside>
    );
}