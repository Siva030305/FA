import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import Sidebar from './Sidebar';
import {
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  ScanFace,
  Plus,
  LogOut,
  User,
  Coffee,
  Check,
  Menu,
  Sun
} from 'lucide-react';

export default function EmployeeDashboard({ user, onLogout, onOpenKiosk }) {
  const [activeTab, setActiveTab] = useState('attendance');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [history, setHistory] = useState([]);
  const [todayRecord, setTodayRecord] = useState(null);
  const [leaveBalance, setLeaveBalance] = useState(null);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showApplyLeaveModal, setShowApplyLeaveModal] = useState(false);
  const [newLeave, setNewLeave] = useState({
    leave_type: 'casual',
    start_date: '',
    end_date: '',
    reason: '',
  });

  const [toast, setToast] = useState('');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [histData, todayData, balData, reqData] = await Promise.all([
        api.getAttendanceHistory().catch(() => []),
        api.getTodayAttendance().catch(() => []),
        api.getLeaveBalance().catch(() => null),
        api.getLeaveRequests().catch(() => []),
      ]);

      setHistory(histData || []);
      if (todayData && todayData.length > 0) {
        setTodayRecord(todayData[0]);
      }
      setLeaveBalance(balData);
      setLeaveRequests(reqData || []);
    } catch (err) {
      console.error('Error loading employee data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApplyLeave = async (e) => {
    e.preventDefault();
    try {
      await api.applyLeave(newLeave);
      showToast('Leave request submitted!');
      setShowApplyLeaveModal(false);
      setNewLeave({ leave_type: 'casual', start_date: '', end_date: '', reason: '' });
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to submit leave');
    }
  };

  const presentDays = history.filter((h) => h.status === 'present').length;
  const lateDays = history.filter((h) => h.status === 'late').length;
  const absentDays = history.filter((h) => h.status === 'absent').length;

  return (
    <div className="dashboard-layout">
      {toast && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          background: 'rgba(16, 185, 129, 0.95)',
          color: '#ffffff',
          padding: '12px 20px',
          borderRadius: 'var(--radius-pill)',
          boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
          zIndex: 1000,
          fontWeight: 700
        }}>
          {toast}
        </div>
      )}

      {/* LEFT SIDEBAR */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenKiosk={onOpenKiosk}
        isFounder={false}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* MAIN CONTENT AREA */}
      <div className="dashboard-main">
        {/* Top Header Bar */}
        <header style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          paddingBottom: '16px',
          borderBottom: '1.5px solid var(--border-light)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="btn btn-secondary"
              style={{ padding: '8px', display: 'flex' }}
            >
              <Menu size={20} />
            </button>

            <div>
              <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#042f2e', margin: 0 }}>
                Employee Portal
              </h1>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                Code: {user?.employee_code || 'EMP'} • {user?.department || 'Staff'}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button onClick={onOpenKiosk} className="btn btn-cyan" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
              <ScanFace size={16} />
              <span>Face Check-In</span>
            </button>

            <button onClick={onLogout} className="btn btn-secondary" title="Sign Out" style={{ padding: '8px 12px' }}>
              <LogOut size={16} />
            </button>

            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #00d2d3 0%, #10b981 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800
            }}>
              {user?.full_name ? user.full_name[0].toUpperCase() : 'E'}
            </div>
          </div>
        </header>

        {/* Top Greeting Card */}
        <div className="top-greeting-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: '#ffffff',
              boxShadow: '0 4px 14px rgba(0, 210, 211, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#00d2d3'
            }}>
              <User size={28} />
            </div>
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#065f46', marginBottom: '2px' }}>
                Employee Dashboard
              </div>
              <h2 style={{ fontSize: '1.7rem', fontWeight: 800, color: '#0f172a' }}>
                Good day, {user?.full_name}
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                {todayRecord
                  ? `You are checked in today as ${todayRecord.status.toUpperCase()}`
                  : 'Check in with face recognition before shift start + grace period.'}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Sun size={28} color="#f59e0b" />
            <div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a' }}>Shift Open</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Location Verified</div>
            </div>
          </div>
        </div>

        {/* Today's Status Banner */}
        <div className="app-card" style={{
          padding: '20px 24px',
          marginBottom: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: todayRecord
            ? (todayRecord.status === 'present' ? 'var(--accent-green-light)' : todayRecord.status === 'late' ? 'var(--accent-amber-light)' : 'var(--accent-rose-light)')
            : '#ffffff',
          borderLeft: `5px solid ${todayRecord ? (todayRecord.status === 'present' ? '#10b981' : todayRecord.status === 'late' ? '#f59e0b' : '#ef4444') : '#00d2d3'}`
        }}>
          <div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800 }}>
              Today's Attendance Status
            </span>
            <h3 style={{ fontSize: '1.25rem', marginTop: '2px', color: '#0f172a' }}>
              {todayRecord ? (
                todayRecord.status === 'present' ? 'Marked Present (On Time)' :
                todayRecord.status === 'late' ? 'Marked Late' :
                todayRecord.status === 'on_leave' ? 'On Approved Leave' : 'Auto-marked Absent (Pending check-in)'
              ) : 'Pending Verification'}
            </h3>
            {todayRecord?.check_in_time && (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: '4px' }}>
                Checked in at {new Date(todayRecord.check_in_time).toLocaleTimeString()}
              </p>
            )}
          </div>

          <button onClick={onOpenKiosk} className="btn btn-cyan">
            <ScanFace size={18} />
            <span>{todayRecord?.check_in_time ? 'Re-Verify Face' : 'Check In Now'}</span>
          </button>
        </div>

        {/* TAB 1: ATTENDANCE */}
        {activeTab === 'attendance' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              <div className="app-card" style={{ padding: '20px', borderLeft: '4px solid #10b981' }}>
                <span style={{ color: '#065f46', fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 800 }}>Days Present</span>
                <h3 style={{ fontSize: '2rem', marginTop: '4px', color: '#10b981' }}>{presentDays}</h3>
              </div>

              <div className="app-card" style={{ padding: '20px', borderLeft: '4px solid #f59e0b' }}>
                <span style={{ color: '#92400e', fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 800 }}>Days Late</span>
                <h3 style={{ fontSize: '2rem', marginTop: '4px', color: '#f59e0b' }}>{lateDays}</h3>
              </div>

              <div className="app-card" style={{ padding: '20px', borderLeft: '4px solid #ef4444' }}>
                <span style={{ color: '#991b1b', fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 800 }}>Days Absent</span>
                <h3 style={{ fontSize: '2rem', marginTop: '4px', color: '#ef4444' }}>{absentDays}</h3>
              </div>
            </div>

            <div className="app-card" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '16px' }}>My Attendance Log</h3>
              <div className="data-table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Status</th>
                      <th>Check-In Time</th>
                      <th>Office Distance</th>
                      <th>Anti-Spoofing</th>
                      <th>Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.length === 0 ? (
                      <tr>
                        <td colSpan="6" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-dim)' }}>
                          No past records found.
                        </td>
                      </tr>
                    ) : (
                      history.map((rec) => (
                        <tr key={rec.id}>
                          <td><strong>{rec.attendance_date}</strong></td>
                          <td>
                            <span className={`badge badge-${rec.status}`}>
                              {rec.status}
                            </span>
                          </td>
                          <td>{rec.check_in_time ? new Date(rec.check_in_time).toLocaleTimeString() : '—'}</td>
                          <td>{rec.distance_from_office_meters !== null ? `${rec.distance_from_office_meters} m` : '—'}</td>
                          <td>{rec.liveness_score !== null ? `${(rec.liveness_score * 100).toFixed(0)}%` : '—'}</td>
                          <td style={{ color: 'var(--text-muted)' }}>{rec.remarks || '—'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: LEAVES */}
        {activeTab === 'leaves' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              <div className="app-card" style={{ padding: '20px' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 800 }}>Annual Leave</span>
                <h3 style={{ fontSize: '2rem', marginTop: '4px', color: '#0f172a' }}>
                  {(leaveBalance?.annual_leave_total || 12) - (leaveBalance?.annual_leave_used || 0)}
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-dim)', fontWeight: 400 }}> / 12 left</span>
                </h3>
              </div>

              <div className="app-card" style={{ padding: '20px' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 800 }}>Sick Leave</span>
                <h3 style={{ fontSize: '2rem', marginTop: '4px', color: '#0f172a' }}>
                  {(leaveBalance?.sick_leave_total || 6) - (leaveBalance?.sick_leave_used || 0)}
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-dim)', fontWeight: 400 }}> / 6 left</span>
                </h3>
              </div>

              <div className="app-card" style={{ padding: '20px' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 800 }}>Casual Leave</span>
                <h3 style={{ fontSize: '2rem', marginTop: '4px', color: '#0f172a' }}>
                  {(leaveBalance?.casual_leave_total || 6) - (leaveBalance?.casual_leave_used || 0)}
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-dim)', fontWeight: 400 }}> / 6 left</span>
                </h3>
              </div>
            </div>

            <div className="app-card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>My Leave Requests</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    Approved leaves exempt you from morning absence marking.
                  </p>
                </div>
                <button onClick={() => setShowApplyLeaveModal(true)} className="btn btn-cyan">
                  <Plus size={18} />
                  <span>Apply for Leave</span>
                </button>
              </div>

              <div className="data-table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Dates</th>
                      <th>Days</th>
                      <th>Reason</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaveRequests.length === 0 ? (
                      <tr>
                        <td colSpan="5" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-dim)' }}>
                          No leave applications filed.
                        </td>
                      </tr>
                    ) : (
                      leaveRequests.map((req) => (
                        <tr key={req.id}>
                          <td><strong style={{ textTransform: 'capitalize' }}>{req.leave_type}</strong></td>
                          <td>{req.start_date} to {req.end_date}</td>
                          <td>{req.days_count}d</td>
                          <td style={{ color: 'var(--text-muted)' }}>{req.reason}</td>
                          <td>
                            <span className={`badge badge-${req.status === 'approved' ? 'present' : req.status === 'rejected' ? 'absent' : 'leave'}`}>
                              {req.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODAL: APPLY LEAVE */}
      {showApplyLeaveModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ padding: '32px' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '18px' }}>Apply for Leave</h3>
            <form onSubmit={handleApplyLeave}>
              <div className="form-group">
                <label className="form-label">Leave Type</label>
                <select
                  className="form-input-pill"
                  value={newLeave.leave_type}
                  onChange={(e) => setNewLeave({ ...newLeave, leave_type: e.target.value })}
                >
                  <option value="casual">Casual Leave</option>
                  <option value="sick">Sick Leave</option>
                  <option value="annual">Annual Leave</option>
                  <option value="unpaid">Unpaid Leave</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Start Date</label>
                  <input
                    type="date"
                    className="form-input-pill"
                    value={newLeave.start_date}
                    onChange={(e) => setNewLeave({ ...newLeave, start_date: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">End Date</label>
                  <input
                    type="date"
                    className="form-input-pill"
                    value={newLeave.end_date}
                    onChange={(e) => setNewLeave({ ...newLeave, end_date: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Reason</label>
                <textarea
                  className="form-input-pill"
                  rows={3}
                  style={{ borderRadius: '16px' }}
                  placeholder="Reason for taking leave"
                  value={newLeave.reason}
                  onChange={(e) => setNewLeave({ ...newLeave, reason: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" onClick={() => setShowApplyLeaveModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-cyan">
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
