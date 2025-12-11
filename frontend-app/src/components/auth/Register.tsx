import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authService } from "../../services/authService";
import { UserRole } from "../../types/auth";
import '../../App.css';

export const Register: React.FC = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        firstName: '',
        lastName: '',
        role: 'MENTEE' as UserRole,
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        setLoading(true);
        try {
            const { confirmPassword, ...registerData } = formData;
            await authService.register(registerData);
            navigate('/login', { state: { message: 'Registration successful! Please login.' } });
        } catch (err: any) {
            setError(err.response?.data?.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="card-container">
            <div className="card" style={{ maxWidth: '480px', width: '100%', margin: '0' }}>
                <div style={{ textAlign: 'center', marginBottom: 'var(--space-xl)' }}>
                    <div style={{ fontSize: '48px', marginBottom: 'var(--space-md)' }}>🎓</div>
                    <h1 style={{ fontSize: 'var(--font-size-xxl)', marginBottom: 'var(--space-xs)' }}>Join MentorHub</h1>
                    <p style={{ color: 'var(--neutral-600)' }}>Create your account to get started</p>
                </div>
                <form id="registerForm" onSubmit={handleSubmit}>
                    <div className="grid grid-2">
                        <div className="form-group">
                            <label className="form-label">First Name</label>
                            <input type="text"
                                name="firstName"
                                className="form-input"
                                value={formData.firstName}
                                onChange={handleChange}
                                required
                                placeholder="Enter your first name"
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Last Name</label>
                            <input
                                type="text"
                                name="lastName"
                                className="form-input"
                                value={formData.lastName}
                                onChange={handleChange}
                                required
                                placeholder="Enter your last name"
                            />
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Email</label>
                        <input
                            type="email"
                            name="email"
                            className="form-input"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            placeholder="Enter your email"
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <input
                            type="password"
                            name="password"
                            className="form-input"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            placeholder="Enter your password"
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Confirm Password</label>
                        <input
                            type="password"
                            name="confirmPassword"
                            className="form-input"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            required
                            placeholder="Confirm your password"
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Role</label>
                        <select name="role" value={formData.role} onChange={handleChange} required
                            className="form-select">
                            <option value="MENTEE">Mentee</option>
                            <option value="MENTOR">Mentor</option>
                            <option value="ADMIN">Admin (Temporary)</option>
                        </select>
                    </div>

                    {error && <div className="error-message">{error}</div>}

                    <button type="submit" disabled={loading} className="btn btn-primary btn-lg auth-btn ">
                        {loading ? 'Registering...' : 'Register'}
                    </button>
                </form>
                <div className="auth-text-block">
                    <p className="auth-p">
                        Already have an account? <Link to="/login">Login here</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}