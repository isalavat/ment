import React, { useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import "./App.css";
import "./styles/tokens.css";
import "./styles/layout.css";
import "./styles/utilities.css";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { LanguageProvider } from "./i18n/LanguageContext";
import { Sidebar } from "./components/layout/Sidebar";
import { Header } from "./components/layout/Header";
import { MobileBottomNav } from "./components/layout/MobileBottomNav";
import { LanguageSwitcher } from "./components/language/LanguageSwitcher";
import { Login } from "./components/auth/Login";
import { Dashboard } from "./components/dashboard/Dashboard";
import { ProtectedRoute } from "./components/layout/ProtectedRoute";
import { MenteeProfileForm } from "./components/profile/MenteeProfileForm";
import { MentorProfileForm } from "./components/profile/MentorProfileForm";
import { Mentors } from "./components/mentors/Mentors";
import { MentorDetail } from "./components/mentors/MentorDetail";
import { Bookings } from "./components/bookings/Bookings";
import { BookingDetail } from "./components/bookings/BookingDetail";
import { BookSessionPage } from "./components/bookings/BookSessionPage";
import { AvailabilityManager } from "./components/availability/AvailabilityManager";
import { TimeSlotManager } from "./components/availability/TimeSlotManager";
import { AdminUsers } from "./components/admin/AdminUsers";
import { AdminCreateUser } from "./components/admin/AdminCreateUser";
import { AdminUserDetail } from "./components/admin/AdminUserDetail";
import { AdminMentors } from "./components/admin/AdminMentors";
import { Register } from "./components/auth/Register";
import { HomePage } from "./components/home/HomePage";
import { UIProvider } from "./contexts/UIContext";

function AppContent() {
  const { user, isHydrating } = useAuth();
  const location = useLocation();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  const closeMobileSidebar = () => {
    setIsMobileSidebarOpen(false);
  };

  const appLayoutClassName = user
    ? "app-layout app-layout-shell"
    : "app-layout app-layout-auth";
  const mainContentClassName = user
    ? "main-content main-content-shell"
    : "main-content main-content-auth";
  const showAuthLanguageSwitcher =
    !user &&
    (location.pathname === "/login" || location.pathname === "/register");

  if (isHydrating) {
    return null;
  }

  return (
    <div className={appLayoutClassName}>
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
      <div className={mainContentClassName}>
        {user && <Header onMenuToggle={toggleMobileSidebar} />}
        {showAuthLanguageSwitcher && (
          <div className="auth-language-switcher">
            <LanguageSwitcher />
          </div>
        )}
        <Routes>
          <Route
            path="/"
            element={user ? <Navigate to="/dashboard" replace /> : <HomePage />}
          />
          <Route
            path="/login"
            element={user ? <Navigate to="/dashboard" replace /> : <Login />}
          />
          <Route
            path="/register"
            element={user ? <Navigate to="/dashboard" replace /> : <Register />}
          />
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
            path="/mentors/:id/book"
            element={
              <ProtectedRoute>
                <BookSessionPage />
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
            path="/profile/me"
            element={
              <ProtectedRoute>
                <MenteeProfileForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile/mentee"
            element={<Navigate to="/profile/me" replace />}
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
          <Route
            path="/admin/mentors"
            element={
              <ProtectedRoute>
                <AdminMentors />
              </ProtectedRoute>
            }
          />
        </Routes>
        {user && <MobileBottomNav />}
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <UIProvider>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </UIProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
}

export default App;
