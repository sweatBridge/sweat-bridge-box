import React, { useState } from 'react';
import './App.css';
import MainLayout from './components/MainLayout';
import Login from './pages/Login';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(true); // 개발용으로 true 설정

  return (
    <div className="app">
      {isLoggedIn ? <MainLayout /> : <Login />}
    </div>
  );
}

export default App;
