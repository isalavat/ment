import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Sidebar } from './components/layout/Sidebar';
import { Login } from './components/auth/Login';
import { Dashboard } from './components/dashboard/Dashboard';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { MenteeProfileForm } from './components/profile/MenteeProfileForm';
import { MentorProfileForm } from './components/profile/MentorProfileForm';
import { Mentors } from './components/mentors/Mentors';
import './App.css';
import { Register } from './components/auth/Register';

function AppContent() {
  const { user } = useAuth();

  return (
    <div className="app-layout">
      {user && <Sidebar />}
      <div className="main-content">
        <Routes>
          <Route path='/' element={<Navigate to="/dashboard" replace />} />
          <Route path='/login' element={<Login />} />
          <Route path='/register' element={<Register />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/mentors"
            element={
              <ProtectedRoute>
                <Mentors />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile/mentee"
            element={
              <ProtectedRoute>
                <MenteeProfileForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile/mentor"
            element={
              <ProtectedRoute>
                <MentorProfileForm />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;