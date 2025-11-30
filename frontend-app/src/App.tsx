import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Sidebar } from './components/layout/Sidebar';
import { Login } from './components/auth/Login';
import { Dashboard } from './components/dashboard/Dashboard';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import './App.css';
import { Register } from './components/auth/Register';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="App">
          <Sidebar />
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
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
