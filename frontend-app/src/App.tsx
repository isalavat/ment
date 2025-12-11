import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Sidebar } from './components/layout/Sidebar';
import { Login } from './components/auth/Login';
import { Dashboard } from './components/dashboard/Dashboard';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import './App.css';
import { Register } from './components/auth/Register';

function AppContent() {
  const { user } = useAuth();

  return (
    <div className="App">
      {user && <Sidebar />} 
      <Routes>
        <Route path='/' element={< Navigate to="/dashboard" replace />} />
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
      </Routes>
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