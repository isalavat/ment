import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import './Dashboard.css'

export const Dashboard: React.FC = () => {
    const { user } = useAuth();

    return (
        <div className="dashboard-container">
            <div className="dashboard-card">
                <h1>Welcome to Dashboard</h1>
                <div className="user-details">
                    <h2>Your Profile</h2>
                    <p><strong>Name:</strong> {user?.firstName} {user?.lastName}</p>
                    <p><strong>Email:</strong> {user?.email}</p>
                    <p><strong>Role:</strong> {user?.role}</p>
                    <p><strong>User ID:</strong> {user?.id}</p>
                </div>
                <div className="dashboard-content">
                    {user?.role === 'MENTOR' && (
                        <div className="role-section">
                            <h3>Mentor Features</h3>
                            <p>Access your mentees, schedule sessions, and manage your availability.</p>
                        </div>
                    )}

                    {user?.role === 'MENTEE' && (
                        <div className="role-section">
                            <h3>Mentee Features</h3>
                            <p>Find mentors, book sessions, and track your progress.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}