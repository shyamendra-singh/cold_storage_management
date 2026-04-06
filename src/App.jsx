import React, { useState } from 'react';
import './index.css';
import { Dashboard } from './pages/Dashboard';
import { FarmerLedger } from './pages/FarmerLedger';
import { Settings } from './pages/Settings';
import { Login } from './pages/Login';

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [selectedFarmer, setSelectedFarmer] = useState(null);
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const handleLogin = (userData) => {
    const authUser = { email: userData.email };
    setUser(authUser);
    localStorage.setItem('user', JSON.stringify(authUser));
    setCurrentPage('dashboard');
    setSelectedFarmer(null);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
    setCurrentPage('dashboard');
    setSelectedFarmer(null);
  };

  const handleSelectFarmer = (farmer) => {
    setSelectedFarmer(farmer);
    setCurrentPage('ledger');
  };

  const handleBackToDashboard = () => {
    setCurrentPage('dashboard');
    setSelectedFarmer(null);
  };

  const handleNavigateToSettings = () => {
    setCurrentPage('settings');
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="bg-gray-100 min-h-screen">
      {currentPage === 'dashboard' && (
        <Dashboard
          onSelectFarmer={handleSelectFarmer}
          onNavigateToSettings={handleNavigateToSettings}
          onLogout={handleLogout}
        />
      )}

      {currentPage === 'ledger' && selectedFarmer && (
        <FarmerLedger
          farmer={selectedFarmer}
          onBack={handleBackToDashboard}
          onLogout={handleLogout}
        />
      )}

      {currentPage === 'settings' && (
        <Settings onBack={handleBackToDashboard} onLogout={handleLogout} />
      )}
    </div>
  );
}

export default App;
