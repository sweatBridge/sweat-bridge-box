import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import { ClassProvider } from './contexts/ClassContext';
import MainLayout from './components/MainLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ClassReservation from './pages/ClassReservation';

function App() {
  const [isLoggedIn] = useState(true); // 개발용으로 true 설정

  if (!isLoggedIn) {
    return (
      <div className="app">
        <Login />
      </div>
    );
  }

  return (
    <div className="app">
      <ClassProvider>
        <Router>
          <Routes>
            <Route path="/" element={<MainLayout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="wod" element={<div style={{padding: '20px'}}>와드 관리 페이지</div>} />
              <Route path="members" element={<div style={{padding: '20px'}}>회원 관리 페이지 </div>} />
              <Route path="classes" element={<ClassReservation />} />
            </Route>
          </Routes>
        </Router>
      </ClassProvider>
    </div>
  );
}

export default App;
