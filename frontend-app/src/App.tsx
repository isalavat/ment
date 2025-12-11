import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LanguageProvider } from './i18n/LanguageContext';
import { Sidebar } from './components/layout/Sidebar';
import { Login } from './components/auth/Login';
import { Dashboard } from './components/dashboard/Dashboard';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { MenteeProfileForm } from './components/profile/MenteeProfileForm';
import { MentorProfileForm } from './components/profile/MentorProfileForm';
import { Mentors } from './components/mentors/Mentors';
import { AdminUsers } from './components/admin/AdminUsers';
import { AdminCreateUser } from './components/admin/AdminCreateUser';
import './App.css';
import { Register } from './components/auth/Register';

function AppContent() {
  const { user } = useAuth();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  const closeMobileSidebar = () => {
    setIsMobileSidebarOpen(false);
  };

  return (
    <div className="app-layout">
      {user && (
        <>
          <Sidebar 
            isOpen={isMobileSidebarOpen} 
            onClose={closeMobileSidebar} 
          />
          {isMobileSidebarOpen && (
            <div className="sidebar-backdrop" onClick={closeMobileSidebar}></div>
          )}
        </>
      )}
      <div className="main-content">
        {user && (
          <button className="mobile-menu-toggle" onClick={toggleMobileSidebar}>
            <span></span>
            <span></span>
            <span></span>
          </button>
        )}
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
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute>
                <AdminUsers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users/create"
            element={
              <ProtectedRoute>
                <AdminCreateUser />
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
      <LanguageProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
}

export default App;