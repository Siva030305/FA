import React, { useState, useEffect } from 'react';
import {
  Clock,
  Home,
  Users,
  ScanFace,
  Calendar,
  Coffee,
  Settings,
  ChevronLeft,
  ChevronRight,
  Plus,
  Shield,
  FileText,
  LogOut,
  X
} from 'lucide-react';

export default function Sidebar({
  activeTab,
  onSelectTab,
  onOpenKiosk,
  onAddEmployee,
  isFounder,
  mobileOpen,
  onCloseMobile
}) {
  const [currentTime, setCurrentTime] = useState(new Date());

  // Real-time ticking digital clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeString = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateString = currentTime.toLocaleDateString([], { weekday: 'short', month: 'short', day: '2-digit', year: 'numeric' });

  const handleNavClick = (tabId) => {
    onSelectTab(tabId);
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.4)',
            backdropFilter: 'blur(4px)',
            zIndex: 45
          }}
        />
      )}

      <aside className={`dashboard-sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
        {/* Top Header & Digital Clock Widget (Inspired by SAFENod Image 2) */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div className="clock-widget" style={{ flex: 1, margin: 0 }}>
            <Clock size={16} color="#00d2d3" />
            <div style={{ lineHeight: 1.2 }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700 }}>{timeString}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{dateString}</div>
            </div>
          </div>

          {/* Close button for mobile */}
          <button
            onClick={onCloseMobile}
            className="btn btn-secondary"
            style={{
              display: mobileOpen ? 'flex' : 'none',
              marginLeft: '8px',
              padding: '6px',
              borderRadius: '8px'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Action Button: Vivid Cyan Button (Inspired by SAFENod '+ Create Record') */}
        <button
          onClick={() => {
            if (isFounder && onAddEmployee) onAddEmployee();
            else onOpenKiosk();
            if (onCloseMobile) onCloseMobile();
          }}
          className="btn btn-cyan"
          style={{
            width: '100%',
            padding: '12px 16px',
            marginBottom: '20px',
            borderRadius: '12px',
            boxShadow: '0 4px 14px rgba(0, 210, 211, 0.4)',
            fontSize: '0.92rem'
          }}
        >
          <Plus size={18} />
          <span>{isFounder ? 'Add Employee' : 'Mark Attendance'}</span>
        </button>

        {/* Navigation Sections */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {/* SECTION 1: MAIN */}
          <div className="sidebar-section-title">
            <span>MAIN</span>
            <ChevronLeft size={14} style={{ transform: 'rotate(-90deg)' }} />
          </div>

          <button
            onClick={() => handleNavClick('overview')}
            className={`sidebar-nav-item ${activeTab === 'overview' ? 'active' : ''}`}
          >
            <Home size={18} color={activeTab === 'overview' ? '#00b8b9' : '#64748b'} />
            <span>Home Overview</span>
          </button>

          <button
            onClick={() => {
              onOpenKiosk();
              if (onCloseMobile) onCloseMobile();
            }}
            className="sidebar-nav-item"
          >
            <ScanFace size={18} color="#00b8b9" />
            <span>Face Scanner Kiosk</span>
          </button>

          {/* SECTION 2: PEOPLE (Founder only) */}
          {isFounder && (
            <>
              <div className="sidebar-section-title">
                <span>PEOPLE & FACES</span>
                <ChevronLeft size={14} style={{ transform: 'rotate(-90deg)' }} />
              </div>

              <button
                onClick={() => handleNavClick('employees')}
                className={`sidebar-nav-item ${activeTab === 'employees' ? 'active' : ''}`}
              >
                <Users size={18} color={activeTab === 'employees' ? '#00b8b9' : '#64748b'} />
                <span>Staff Directory</span>
              </button>
            </>
          )}

          {/* SECTION 3: ATTENDANCE & LEAVES */}
          <div className="sidebar-section-title">
            <span>ATTENDANCE & TIME</span>
            <ChevronLeft size={14} style={{ transform: 'rotate(-90deg)' }} />
          </div>

          <button
            onClick={() => handleNavClick('attendance')}
            className={`sidebar-nav-item ${activeTab === 'attendance' ? 'active' : ''}`}
          >
            <FileText size={18} color={activeTab === 'attendance' ? '#00b8b9' : '#64748b'} />
            <span>{isFounder ? "Today's Live Logs" : 'My Attendance Logs'}</span>
          </button>

          <button
            onClick={() => handleNavClick('leaves')}
            className={`sidebar-nav-item ${activeTab === 'leaves' ? 'active' : ''}`}
          >
            <Coffee size={18} color={activeTab === 'leaves' ? '#00b8b9' : '#64748b'} />
            <span>Leave Requests</span>
          </button>

          {/* SECTION 4: ORGANIZATION & SETTINGS (Founder only) */}
          {isFounder && (
            <>
              <div className="sidebar-section-title">
                <span>ORGANIZATION</span>
                <ChevronLeft size={14} style={{ transform: 'rotate(-90deg)' }} />
              </div>

              <button
                onClick={() => handleNavClick('holidays')}
                className={`sidebar-nav-item ${activeTab === 'holidays' ? 'active' : ''}`}
              >
                <Calendar size={18} color={activeTab === 'holidays' ? '#00b8b9' : '#64748b'} />
                <span>Holiday Calendar</span>
              </button>

              <button
                onClick={() => handleNavClick('settings')}
                className={`sidebar-nav-item ${activeTab === 'settings' ? 'active' : ''}`}
              >
                <Settings size={18} color={activeTab === 'settings' ? '#00b8b9' : '#64748b'} />
                <span>Geofence & Shifts</span>
              </button>
            </>
          )}
        </div>
      </aside>
    </>
  );
}
