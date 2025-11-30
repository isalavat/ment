import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../../services/authService';
import { useAuth } from '../../contexts/AuthContext';
import './Auth.css';

export const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();
    const { login } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const user = await authService.login({ email, password });
            login(user);
            navigate('/dashboard');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className='card-container'>
            <div className="card" style={{ maxWidth: '480px', width: '100%', margin: '0' }}>
                <div style={{ textAlign: 'center', marginBottom: 'var(--space-xl)' }}>
                    <div style={{ fontSize: '48px', marginBottom: 'var(--space-md)' }}>🎓</div>
                    <h1 style={{ fontSize: 'var(--font-size-xxl)', marginBottom: 'var(--space-xs)' }}>MentorHub</h1>
                    <p style={{ color: 'var(--neutral-600)' }}>Sign in to your account</p>
                </div>
                <form id="loginForm" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Email</label>
                        <input
                            type="email"
                            value={email}
                            className="form-input"
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder='Enter your email' />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <input
                            type="password"
                            value={password}
                            className="form-input"
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder="Enter your password"
                        />
                    </div>

                    {error && <div className="error-message">{error}</div>}

                    <button type="submit" disabled={loading} className="btn btn-primary btn-lg auth-btn ">
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                </form>
                <div className="auth-text-block">
                    <p className="auth-p">
                        Don't have an account? <Link to="/register">Register here</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
