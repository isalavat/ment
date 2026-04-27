import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../../services/authService';
import { useAuth } from '../../contexts/AuthContext';
import './Auth.css';

type QuickLoginOption = {
    value: string;
    label: string;
    email: string;
};

const QUICK_LOGIN_OPTIONS: QuickLoginOption[] = [
    { value: 'dev.user@mentorhub.local', label: 'Demo Learner (USER)', email: 'dev.user@mentorhub.local' },
    { value: 'dev.mentor@mentorhub.local', label: 'Demo Mentor (VERIFIED)', email: 'dev.mentor@mentorhub.local' },
    { value: 'dev.mentor.pending@mentorhub.local', label: 'Demo Mentor (PENDING PROFILE)', email: 'dev.mentor.pending@mentorhub.local' },
    { value: 'dev.mentor.noprofile@mentorhub.local', label: 'Demo Mentor (NO PROFILE)', email: 'dev.mentor.noprofile@mentorhub.local' },
    { value: 'dev.admin@mentorhub.local', label: 'Demo Admin (ADMIN)', email: 'dev.admin@mentorhub.local' },
];

const QUICK_LOGIN_PASSWORD = process.env.REACT_APP_TEST_USERS_PASSWORD || 'Test@1234';
const QUICK_LOGIN_ENABLED = process.env.NODE_ENV !== 'production';

export const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [quickLoginSelection, setQuickLoginSelection] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();
    const { login } = useAuth();

    const loginWithCredentials = async (loginEmail: string, loginPassword: string) => {
        setError('');
        setLoading(true);

        try {
            const user = await authService.login({ email: loginEmail, password: loginPassword });
            login(user);
            navigate('/dashboard');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await loginWithCredentials(email, password);
    }

    const handleQuickLoginSelect = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedValue = e.target.value;
        setQuickLoginSelection(selectedValue);

        if (!selectedValue || loading) {
            return;
        }

        const option = QUICK_LOGIN_OPTIONS.find((item) => item.value === selectedValue);
        if (!option) {
            return;
        }

        setEmail(option.email);
        setPassword(QUICK_LOGIN_PASSWORD);
        await loginWithCredentials(option.email, QUICK_LOGIN_PASSWORD);
    };

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

                    {QUICK_LOGIN_ENABLED && (
                        <div className="form-group">
                            <label className="form-label">Quick test login</label>
                            <select
                                value={quickLoginSelection}
                                onChange={handleQuickLoginSelect}
                                className="form-select"
                                disabled={loading}
                            >
                                <option value="">Select a demo account...</option>
                                {QUICK_LOGIN_OPTIONS.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                            <p className="auth-helper-text">Available only in development and test builds.</p>
                        </div>
                    )}

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
