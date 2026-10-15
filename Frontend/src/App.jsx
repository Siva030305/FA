import React, { useState, useEffect } from 'react';
import { api } from './services/api';
import FounderSignup from './components/FounderSignup';
import Login from './components/Login';
import OwnerDashboard from './components/OwnerDashboard';
import EmployeeDashboard from './components/EmployeeDashboard';
import AttendanceScanner from './components/AttendanceScanner';
import { Shield, Sparkles, Loader2 } from 'lucide-react';

export default function App() {
  const [founderExists, setFounderExists] = useState(null); // null = loading, true/false
  const [companyName, setCompanyName] = useState('Face Attendance Portal');
  const [currentUser, setCurrentUser] = useState(null);
  const [kioskMode, setKioskMode] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkStatusAndSession = async () => {
    setLoading(true);
    try {
      // 1. Check if boss/founder exists in database
      const statusRes = await api.getFounderStatus();
      setFounderExists(statusRes.founder_exists);
      if (statusRes.company_name) {
        setCompanyName(statusRes.company_name);
      }

      // 2. If token exists in storage, verify active session
      const token = localStorage.getItem('access_token');
      if (token && statusRes.founder_exists) {
        try {
          const profile = await api.getMe();
          setCurrentUser(profile);
        } catch {
          localStorage.removeItem('access_token');
          localStorage.removeItem('user_profile');
          setCurrentUser(null);
        }
      }
    } catch (err) {
      console.error('Failed to check founder status:', err);
      // Default to false so Founder Signup page is always shown if no boss is confirmed
      setFounderExists(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkStatusAndSession();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_profile');
    setCurrentUser(null);
    setKioskMode(false);
  };

  // Loading spinner while checking initial founder status
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px'
      }}>
        <Loader2 size={40} className="animate-spin" color="#6366f1" style={{ animation: 'spin 1s linear infinite' }} />
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          Connecting to AI Facial Verification Portal...
        </p>
        <style>{`
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  // 1. STRICT RULE: If no boss is present in DB -> Show Founder Signup Page
  if (!founderExists) {
    return (
      <FounderSignup
        onSignupSuccess={(newUser) => {
          setFounderExists(true);
          setCurrentUser(newUser);
        }}
      />
    );
  }

  // 2. Kiosk Mode (Face scanner open for checking attendance)
  if (kioskMode) {
    return (
      <div style={{ minHeight: '100vh', padding: '20px 0', background: 'var(--bg-page)' }}>
        <AttendanceScanner
          currentUser={currentUser}
          onBack={() => setKioskMode(false)}
        />
      </div>
    );
  }

  // 3. Authenticated: Founder / Boss Dashboard
  if (currentUser && currentUser.role === 'founder') {
    return (
      <OwnerDashboard
        user={currentUser}
        onLogout={handleLogout}
        onOpenKiosk={() => setKioskMode(true)}
      />
    );
  }

  // 4. Authenticated: Employee Dashboard
  if (currentUser && currentUser.role === 'employee') {
    return (
      <EmployeeDashboard
        user={currentUser}
        onLogout={handleLogout}
        onOpenKiosk={() => setKioskMode(true)}
      />
    );
  }

  // 5. Unauthenticated: Regular Login Page (Matching Sprout Reference)
  return (
    <Login
      companyName={companyName}
      onLoginSuccess={(user) => setCurrentUser(user)}
      onOpenKiosk={() => setKioskMode(true)}
    />
  );
}
