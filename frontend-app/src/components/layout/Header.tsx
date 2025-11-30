import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export const Header: React.FC = () => {
    const { user, logout, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <header className="header">
            <div className="header-content">
                <Link to="/" className="logo">
                    Mentor App
                </Link>
                <nav className="nav">
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
            </div>
        </header>
    );
}