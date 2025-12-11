import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { LanguageSwitcher } from '../language/LanguageSwitcher';
import { useLanguage } from '../../i18n/LanguageContext';
import './Sidebar.css'

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
    const { user, logout } = useAuth();
    const { t } = useLanguage();
    const navigate = useNavigate();
    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleLinkClick = () => {
        // Close sidebar on mobile when clicking a link
        onClose();
    };

    return (
        <aside id='sidebar' className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
            <div className="sidebar-header">
                <LanguageSwitcher />
                <button className="sidebar-close" onClick={onClose} aria-label="Close menu">
                    ✕
                </button>
            </div>
            <nav className="sidebar-nav">
                <div className="nav-section">
                    <div className="nav-section-title">{t.nav.sections.main}</div>
                    <Link to="/" className="nav-item" onClick={handleLinkClick}>
                        <span className="nav-icon">👨‍🎓</span>
                        <span>{t.nav.home}</span>
                    </Link>
                    <Link to="/dashboard" className="nav-item" onClick={handleLinkClick}>
                        <span className="nav-icon">📊</span>
                        <span>{t.nav.dashboard}</span>
                    </Link>
                    <Link to="/mentors" className="nav-item" onClick={handleLinkClick}>
                        <span className="nav-icon">👥</span>
                        <span>{t.nav.mentors}</span>
                    </Link>

                </div>
            </nav>
            
            {user?.role === 'ADMIN' && (
                <nav className="sidebar-nav">
                    <div className="nav-section">
                        <div className="nav-section-title">{t.nav.sections.admin}</div>
                        <Link to="/admin/users" className="nav-item" onClick={handleLinkClick}>
                            <span className="nav-icon">⚙️</span>
                            <span>{t.nav.admin.userManagement}</span>
                        </Link>
                    </div>
                </nav>
            )}
            
            <nav className="sidebar-nav">
                <div className="nav-section">
                    <div className="nav-section-title">{t.nav.profile}</div>
                    
                    {user?.role === 'MENTEE' && (
                        <Link to="/profile/mentee" className="nav-item" onClick={handleLinkClick}>
                            <span className="nav-icon">👤</span>
                            <span>{t.nav.profile}</span>
                        </Link>
                    )}
                    
                    {user?.role === 'MENTOR' && (
                        <Link to="/profile/mentor" className="nav-item" onClick={handleLinkClick}>
                            <span className="nav-icon">👤</span>
                            <span>{t.nav.profile}</span>
                        </Link>
                    )}
                </div>
            </nav>
            <nav className="sidebar-nav">
                <div className="nav-section">
                    <div className="nav-section-title">{t.nav.sections.account}</div>

                   <div className="nav-item" onClick={handleLogout} style={{ cursor: 'pointer' }}>
                        <span className="nav-icon">🚪</span>
                        <span>{t.nav.logout}</span>
                    </div>
                </div>
                
            </nav>
        </aside>
    );
}