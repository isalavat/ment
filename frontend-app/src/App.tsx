import React, { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { LanguageProvider } from "./i18n/LanguageContext";
import { Sidebar } from "./components/layout/Sidebar";
import { Header } from "./components/layout/Header";
import { Login } from "./components/auth/Login";
import { Dashboard } from "./components/dashboard/Dashboard";
import { ProtectedRoute } from "./components/layout/ProtectedRoute";
import { MenteeProfileForm } from "./components/profile/MenteeProfileForm";
import { MentorProfileForm } from "./components/profile/MentorProfileForm";
import { Mentors } from "./components/mentors/Mentors";
import { MentorDetail } from "./components/mentors/MentorDetail";
import { Bookings } from "./components/bookings/Bookings";
import { BookingDetail } from "./components/bookings/BookingDetail";
import { AvailabilityManager } from "./components/availability/AvailabilityManager";
import { TimeSlotManager } from "./components/availability/TimeSlotManager";
import { AdminUsers } from "./components/admin/AdminUsers";
import { AdminCreateUser } from "./components/admin/AdminCreateUser";
import { AdminUserDetail } from "./components/admin/AdminUserDetail";
import "./App.css";
import { Register } from "./components/auth/Register";

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
          <Sidebar isOpen={isMobileSidebarOpen} onClose={closeMobileSidebar} />
          {isMobileSidebarOpen && (
            <div
              className="sidebar-backdrop"
              onClick={closeMobileSidebar}
            ></div>
          )}
        </>
      )}
      <div className="main-content">
        {user && <Header onMenuToggle={toggleMobileSidebar} />}
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
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
            path="/mentors/:id"
            element={
              <ProtectedRoute>
                <MentorDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/bookings"
            element={
              <ProtectedRoute>
                <Bookings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/bookings/:id"
            element={
              <ProtectedRoute>
                <BookingDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/availability"
            element={
              <ProtectedRoute>
                <AvailabilityManager />
              </ProtectedRoute>
            }
          />
          <Route
            path="/time-slots"
            element={
              <ProtectedRoute>
                <TimeSlotManager />
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
          <Route
            path="/admin/users/:id"
            element={
              <ProtectedRoute>
                <AdminUserDetail />
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
