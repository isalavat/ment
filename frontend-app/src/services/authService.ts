import api, { ACCESS_TOKEN, REFRESH_TOKEN } from './api';
import { LoginRequest, RegisterRequest, AuthResponse, User } from '../types/auth.js';

export const authService = {
    async login(credentials: LoginRequest): Promise<User> {
        const response = await api.post<AuthResponse>('/auth/login', credentials);
        const { accessToken, refreshToken } = response.data;

        localStorage.setItem(ACCESS_TOKEN, accessToken);
        localStorage.setItem(REFRESH_TOKEN, refreshToken);
        // to do make '/auth/login' return the current user immediatly
        return this.fetchCurrenUser()
    },
    async register(data: RegisterRequest): Promise<User> {
        const response = await api.post<{ user: User }>('/auth/register', data);
        return response.data.user;
    },
    async fetchCurrenUser(): Promise<User> {
        const response = await api.get<User>('profiles/me');
        const user = response.data;
        localStorage.setItem('user', JSON.stringify(user));
        return user;
    },
    logout(): void {
        localStorage.removeItem(ACCESS_TOKEN);
        localStorage.removeItem(REFRESH_TOKEN);
        localStorage.removeItem('user');
    },
    getUser(): User | null {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    },

    isAuthenticated(): boolean {
        return !!localStorage.getItem('accessToken');
    },
}