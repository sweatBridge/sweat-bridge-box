import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import { AuthProvider } from './contexts/AuthContext';
import { ClassProvider } from './contexts/ClassContext';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './components/MainLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ClassReservation from './pages/ClassReservation';
import MemberManagement from './pages/MemberManagement';
import BoxSettings from './pages/BoxSettings';
import RevenueManagement from './pages/RevenueManagement';

function App() {
  return (
    <div className="app">
      <Router>
        <AuthProvider>
          <ClassProvider>
            <Routes>
              {/* 로그인 페이지 */}
              <Route path="/login" element={<Login />} />
              
              {/* 보호된 라우트 */}
              <Route path="/" element={<ProtectedRoute />}>
                <Route path="/" element={<MainLayout />}>
                  <Route index element={<Navigate to="/dashboard" replace />} />
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="wod" element={<div style={{padding: '20px'}}>와드 관리 페이지</div>} />
                  <Route path="members" element={<MemberManagement />} />
                  <Route path="classes" element={<ClassReservation />} />
                  <Route path="revenue" element={<RevenueManagement />} />
                  <Route path="settings" element={<BoxSettings />} />
                </Route>
              </Route>
              
              {/* 404 처리 */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </ClassProvider>
        </AuthProvider>
      </Router>
    </div>
  );
}

export default App;
