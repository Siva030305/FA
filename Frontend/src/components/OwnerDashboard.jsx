import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import Sidebar from './Sidebar';
import FaceEnrollmentModal from './FaceEnrollmentModal';
import {
  Users,
  Calendar,
  Clock,
  Settings as SettingsIcon,
  CheckCircle,
  AlertTriangle,
  XCircle,
  UserPlus,
  ScanFace,
  Plus,
  Trash2,
  MapPin,
  RefreshCw,
  LogOut,
  Sparkles,
  Shield,
  Coffee,
  Check,
  X,
  Menu,
  Sun,
  Bell
} from 'lucide-react';

export default function OwnerDashboard({ user, onLogout, onOpenKiosk }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [attendanceToday, setAttendanceToday] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [companySettings, setCompanySettings] = useState(null);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false);
  const [enrollTargetEmployee, setEnrollTargetEmployee] = useState(null);
  const [showAddHolidayModal, setShowAddHolidayModal] = useState(false);

  // Forms
  const [newEmployee, setNewEmployee] = useState({
    full_name: '',
    email: '',
    password: '',
    employee_code: '',
    department: 'Engineering',
    designation: 'Developer',
    phone: '',
  });

  const [newHoliday, setNewHoliday] = useState({
    holiday_date: '',
    title: '',
    description: '',
  });

  const [settingsForm, setSettingsForm] = useState({
    company_name: '',
    office_name: '',
    office_latitude: 12.9716,
    office_longitude: 77.5946,
    geofence_radius_meters: 100,
    work_start_time: '09:00:00',
    work_end_time: '18:00:00',
    grace_period_minutes: 15,
  });

  const [toast, setToast] = useState('');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [empData, attData, holData, setts, lvs] = await Promise.all([
        api.getEmployees().catch(() => []),
        api.getTodayAttendance().catch(() => []),
        api.getHolidays().catch(() => []),
        api.getSettings().catch(() => null),
        api.getLeaveRequests().catch(() => []),
      ]);

      setEmployees(empData || []);
      setAttendanceToday(attData || []);
      setHolidays(holData || []);
      setLeaveRequests(lvs || []);
      if (setts) {
        setCompanySettings(setts);
        setSettingsForm({
          company_name: setts.company_name || 'My Company',
          office_name: setts.office_name || 'Headquarters',
          office_latitude: setts.office_latitude,
          office_longitude: setts.office_longitude,
          geofence_radius_meters: setts.geofence_radius_meters,
          work_start_time: setts.work_start_time || '09:00:00',
          work_end_time: setts.work_end_time || '18:00:00',
          grace_period_minutes: setts.grace_period_minutes || 15,
        });
      }
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleCreateEmployee = async (e) => {
    e.preventDefault();
    try {
      await api.createEmployee(newEmployee);
      showToast(`Employee ${newEmployee.full_name} created successfully!`);
      setShowAddEmployeeModal(false);
      setNewEmployee({
        full_name: '',
        email: '',
        password: '',
        employee_code: '',
        department: 'Engineering',
        designation: 'Developer',
        phone: '',
      });
      loadAllData();
    } catch (err) {
      alert(err.message || 'Failed to create employee');
    }
  };

  const handleAddHoliday = async (e) => {
    e.preventDefault();
    try {
      await api.addHoliday(newHoliday);
      showToast(`Holiday added for ${newHoliday.holiday_date}`);
      setShowAddHolidayModal(false);
      setNewHoliday({ holiday_date: '', title: '', description: '' });
      loadAllData();
    } catch (err) {
      alert(err.message || 'Failed to add holiday');
    }
  };

  const handleDeleteHoliday = async (id) => {
    if (!confirm('Remove this holiday?')) return;
    try {
      await api.deleteHoliday(id);
      showToast('Holiday removed');
      loadAllData();
    } catch (err) {
      alert(err.message || 'Failed to delete holiday');
    }
  };

  const handleUpdateSettings = async (e) => {
    e.preventDefault();
    try {
      await api.updateSettings(settingsForm);
      showToast('Settings & Geofence updated!');
      loadAllData();
    } catch (err) {
      alert(err.message || 'Failed to update settings');
    }
  };

  const handleTriggerMorningRoutine = async () => {
    try {
      const res = await api.triggerMorningAbsenceRoutine();
      showToast(`Morning check finished: ${res.records_processed} records updated`);
      loadAllData();
    } catch (err) {
      alert(err.message || 'Error executing routine');
    }
  };

  const handleReviewLeave = async (id, status) => {
    try {
      await api.reviewLeave(id, { status });
      showToast(`Leave request ${status}`);
      loadAllData();
    } catch (err) {
      alert(err.message || 'Error reviewing leave');
    }
  };

  const useCurrentLocationForOffice = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setSettingsForm((prev) => ({
          ...prev,
          office_latitude: parseFloat(pos.coords.latitude.toFixed(6)),
          office_longitude: parseFloat(pos.coords.longitude.toFixed(6)),
        }));
        showToast('Office GPS location updated!');
      });
    }
  };

  // Metrics
  const totalEmployees = employees.length;
  const presentToday = attendanceToday.filter((a) => a.status === 'present').length;
  const lateToday = attendanceToday.filter((a) => a.status === 'late').length;
  const absentToday = attendanceToday.filter((a) => a.status === 'absent').length;
  const onLeaveToday = attendanceToday.filter((a) => a.status === 'on_leave').length;

  return (
    <div className="dashboard-layout">
      {/* Toast Notification */}
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
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <CheckCircle size={18} />
          <span>{toast}</span>
        </div>
      )}

      {/* LEFT SIDEBAR (SAFENod Reference) */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenKiosk={onOpenKiosk}
        onAddEmployee={() => setShowAddEmployeeModal(true)}
        isFounder={true}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* MAIN CONTENT AREA */}
      <div className="dashboard-main">
        {/* Top Header Bar (Matching SAFENod Image 3) */}
        <header style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          paddingBottom: '16px',
          borderBottom: '1.5px solid var(--border-light)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Mobile Hamburger Menu Toggle */}
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="btn btn-secondary"
              style={{ padding: '8px', display: 'flex' }}
            >
              <Menu size={20} />
            </button>

            {/* Brand Logo Header */}
            <div>
              <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#042f2e', margin: 0 }}>
                {companySettings?.company_name || 'FaceNod'}
              </h1>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                AI Facial Recognition & Geofencing System
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={() => setActiveTab('settings')}
              className="btn btn-secondary"
              style={{ fontSize: '0.85rem', padding: '8px 16px' }}
            >
              <SettingsIcon size={16} />
              <span>Admin Settings</span>
            </button>

            <button
              onClick={onLogout}
              className="btn btn-secondary"
              title="Sign Out"
              style={{ padding: '8px 12px' }}
            >
              <LogOut size={16} />
            </button>

            {/* User Avatar */}
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #00d2d3 0%, #10b981 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '0.95rem'
            }}>
              {user?.full_name ? user.full_name[0].toUpperCase() : 'B'}
            </div>
          </div>
        </header>

        {/* Top Greeting Banner (Inspired by SAFENod Image 3) */}
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
              <Shield size={28} />
            </div>
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#065f46', marginBottom: '2px' }}>
                Need help? 🤖 AI Assistant active
              </div>
              <h2 style={{ fontSize: '1.7rem', fontWeight: 800, color: '#0f172a' }}>
                Good to see you, {user?.full_name || 'Boss'}
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                Here is your staff attendance overview for today. Stay safe, stay sharp.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', textAlign: 'right' }}>
            <Sun size={28} color="#f59e0b" />
            <div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a' }}>29°C</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Work Shift Active</div>
            </div>
          </div>
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div>
            {/* Metric Cards Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              <div className="app-card" style={{ padding: '22px' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 800 }}>Total Staff</span>
                <h3 style={{ fontSize: '2.2rem', marginTop: '4px', color: '#0f172a' }}>{totalEmployees}</h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>Registered team members</span>
              </div>

              <div className="app-card" style={{ padding: '22px', borderLeft: '4px solid #10b981' }}>
                <span style={{ color: '#065f46', fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 800 }}>Present Today</span>
                <h3 style={{ fontSize: '2.2rem', marginTop: '4px', color: '#10b981' }}>{presentToday}</h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>On-time arrivals</span>
              </div>

              <div className="app-card" style={{ padding: '22px', borderLeft: '4px solid #f59e0b' }}>
                <span style={{ color: '#92400e', fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 800 }}>Late Today</span>
                <h3 style={{ fontSize: '2.2rem', marginTop: '4px', color: '#f59e0b' }}>{lateToday}</h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>Past grace period</span>
              </div>

              <div className="app-card" style={{ padding: '22px', borderLeft: '4px solid #ef4444' }}>
                <span style={{ color: '#991b1b', fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 800 }}>Absent Today</span>
                <h3 style={{ fontSize: '2.2rem', marginTop: '4px', color: '#ef4444' }}>{absentToday}</h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>Morning auto-marked</span>
              </div>
            </div>

            {/* Recent Activity Stream (Inspired by SAFENod Image 3) */}
            <div className="app-card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Recent Attendance Activity</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    Live verification events across all employee face scans today
                  </p>
                </div>
                <button onClick={handleTriggerMorningRoutine} className="btn btn-secondary" style={{ fontSize: '0.85rem' }}>
                  <RefreshCw size={15} />
                  <span>Run Morning Check</span>
                </button>
              </div>

              {attendanceToday.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '36px', color: 'var(--text-dim)' }}>
                  No check-ins recorded yet for today. Use the scanner to mark attendance.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {attendanceToday.map((att) => (
                    <div
                      key={att.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '14px 18px',
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--bg-page-soft)',
                        border: '1px solid var(--border-light)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div style={{
                          width: '42px',
                          height: '42px',
                          borderRadius: '50%',
                          background: '#00d2d3',
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700
                        }}>
                          {att.profiles?.full_name ? att.profiles.full_name[0] : 'U'}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem' }}>
                            {att.profiles?.full_name || 'Staff Member'} ({att.profiles?.employee_code || 'EMP'})
                          </div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            {att.profiles?.department || 'Department'} • {att.check_in_time ? new Date(att.check_in_time).toLocaleTimeString() : 'Pending'}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {att.distance_from_office_meters !== null && (
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            📍 {att.distance_from_office_meters}m
                          </span>
                        )}
                        <span className={`badge badge-${att.status}`}>
                          {att.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: EMPLOYEES */}
        {activeTab === 'employees' && (
          <div className="app-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Staff Directory</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  Manage employee accounts and register their 6 facial recognition vectors.
                </p>
              </div>
              <button onClick={() => setShowAddEmployeeModal(true)} className="btn btn-cyan">
                <UserPlus size={18} />
                <span>Add Employee</span>
              </button>
            </div>

            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Full Name</th>
                    <th>Department</th>
                    <th>Email</th>
                    <th>Face Vectors</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-dim)' }}>
                        No employees registered yet.
                      </td>
                    </tr>
                  ) : (
                    employees.map((emp) => (
                      <tr key={emp.id}>
                        <td><strong>{emp.employee_code || 'EMP'}</strong></td>
                        <td>{emp.full_name}</td>
                        <td>{emp.department} • {emp.designation}</td>
                        <td>{emp.email}</td>
                        <td>
                          {emp.face_enrolled ? (
                            <span className="badge badge-present">
                              <CheckCircle size={12} />
                              Enrolled (6 Poses)
                            </span>
                          ) : (
                            <span className="badge badge-absent">
                              <XCircle size={12} />
                              Pending Face
                            </span>
                          )}
                        </td>
                        <td>
                          <span style={{ color: emp.is_active ? '#059669' : '#dc2626', fontWeight: 700, fontSize: '0.85rem' }}>
                            {emp.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td>
                          <button
                            onClick={() => setEnrollTargetEmployee(emp)}
                            className="btn btn-secondary"
                            style={{ padding: '6px 14px', fontSize: '0.82rem', gap: '6px' }}
                          >
                            <ScanFace size={15} color="#00d2d3" />
                            <span>{emp.face_enrolled ? 'Re-Enroll (6)' : 'Enroll 6 Photos'}</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: ATTENDANCE MONITOR */}
        {activeTab === 'attendance' && (
          <div className="app-card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '6px' }}>Today's Full Attendance Ledger</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '20px' }}>
              Detailed GPS geofence distances, ArcFace cosine similarity, and anti-spoofing scores.
            </p>

            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Status</th>
                    <th>Check-In Time</th>
                    <th>Geofence Distance</th>
                    <th>Anti-Spoofing</th>
                    <th>ArcFace Match</th>
                    <th>Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceToday.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-dim)' }}>
                        No records for today.
                      </td>
                    </tr>
                  ) : (
                    attendanceToday.map((att) => (
                      <tr key={att.id}>
                        <td>
                          <strong>{att.profiles?.full_name || 'Staff'}</strong>
                          <span style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                            {att.profiles?.employee_code} • {att.profiles?.department}
                          </span>
                        </td>
                        <td>
                          <span className={`badge badge-${att.status}`}>
                            {att.status}
                          </span>
                        </td>
                        <td>
                          {att.check_in_time ? new Date(att.check_in_time).toLocaleTimeString() : '—'}
                        </td>
                        <td>{att.distance_from_office_meters !== null ? `${att.distance_from_office_meters} m` : '—'}</td>
                        <td>{att.liveness_score !== null ? `${(att.liveness_score * 100).toFixed(0)}%` : '—'}</td>
                        <td>{att.match_similarity !== null ? `${(att.match_similarity * 100).toFixed(0)}%` : '—'}</td>
                        <td style={{ color: 'var(--text-muted)', fontSize: '0.84rem' }}>{att.remarks || '—'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: HOLIDAY CALENDAR */}
        {activeTab === 'holidays' && (
          <div className="app-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Company Holidays</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  Employees will not be marked absent on configured holidays.
                </p>
              </div>
              <button onClick={() => setShowAddHolidayModal(true)} className="btn btn-cyan">
                <Plus size={18} />
                <span>Add Holiday</span>
              </button>
            </div>

            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Title</th>
                    <th>Description</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {holidays.length === 0 ? (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-dim)' }}>
                        No holidays added yet.
                      </td>
                    </tr>
                  ) : (
                    holidays.map((h) => (
                      <tr key={h.id}>
                        <td><strong>{h.holiday_date}</strong></td>
                        <td>{h.title}</td>
                        <td style={{ color: 'var(--text-muted)' }}>{h.description || '—'}</td>
                        <td>
                          <button onClick={() => handleDeleteHoliday(h.id)} className="btn btn-danger" style={{ padding: '6px 12px' }}>
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: LEAVES */}
        {activeTab === 'leaves' && (
          <div className="app-card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '6px' }}>Leave Requests</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '20px' }}>
              Approved leaves exempt employees from automated morning absence marking.
            </p>

            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Type</th>
                    <th>Duration</th>
                    <th>Reason</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {leaveRequests.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-dim)' }}>
                        No leave requests.
                      </td>
                    </tr>
                  ) : (
                    leaveRequests.map((req) => (
                      <tr key={req.id}>
                        <td>
                          <strong>{req.profiles?.full_name || 'Staff'}</strong>
                          <span style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                            {req.profiles?.department}
                          </span>
                        </td>
                        <td><strong style={{ textTransform: 'capitalize' }}>{req.leave_type}</strong></td>
                        <td>{req.start_date} to {req.end_date} ({req.days_count}d)</td>
                        <td style={{ color: 'var(--text-muted)' }}>{req.reason}</td>
                        <td>
                          <span className={`badge badge-${req.status === 'approved' ? 'present' : req.status === 'rejected' ? 'absent' : 'leave'}`}>
                            {req.status}
                          </span>
                        </td>
                        <td>
                          {req.status === 'pending' ? (
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button onClick={() => handleReviewLeave(req.id, 'approved')} className="btn btn-cyan" style={{ padding: '6px 10px' }}>
                                <Check size={14} />
                              </button>
                              <button onClick={() => handleReviewLeave(req.id, 'rejected')} className="btn btn-danger" style={{ padding: '6px 10px' }}>
                                <X size={14} />
                              </button>
                            </div>
                          ) : (
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Reviewed</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 6: SETTINGS */}
        {activeTab === 'settings' && (
          <div className="app-card" style={{ padding: '32px', maxWidth: '720px' }}>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '6px' }}>Office Geofencing & Shift Times</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '24px' }}>
              Attendance is strictly accepted within this office geofence radius.
            </p>

            <form onSubmit={handleUpdateSettings}>
              <div className="form-group">
                <label className="form-label">Company Name</label>
                <input
                  type="text"
                  className="form-input-pill"
                  value={settingsForm.company_name}
                  onChange={(e) => setSettingsForm({ ...settingsForm, company_name: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Office Latitude</label>
                  <input
                    type="number"
                    step="any"
                    className="form-input-pill"
                    value={settingsForm.office_latitude}
                    onChange={(e) => setSettingsForm({ ...settingsForm, office_latitude: parseFloat(e.target.value) })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Office Longitude</label>
                  <input
                    type="number"
                    step="any"
                    className="form-input-pill"
                    value={settingsForm.office_longitude}
                    onChange={(e) => setSettingsForm({ ...settingsForm, office_longitude: parseFloat(e.target.value) })}
                    required
                  />
                </div>
              </div>

              <div style={{ marginBottom: '18px' }}>
                <button
                  type="button"
                  onClick={useCurrentLocationForOffice}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.85rem' }}
                >
                  <MapPin size={16} color="#00d2d3" />
                  <span>Use My Current Location as Office Center</span>
                </button>
              </div>

              <div className="form-group">
                <label className="form-label">Geofence Radius (Meters)</label>
                <input
                  type="number"
                  className="form-input-pill"
                  value={settingsForm.geofence_radius_meters}
                  onChange={(e) => setSettingsForm({ ...settingsForm, geofence_radius_meters: parseFloat(e.target.value) })}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Shift Start</label>
                  <input
                    type="text"
                    className="form-input-pill"
                    value={settingsForm.work_start_time}
                    onChange={(e) => setSettingsForm({ ...settingsForm, work_start_time: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Shift End</label>
                  <input
                    type="text"
                    className="form-input-pill"
                    value={settingsForm.work_end_time}
                    onChange={(e) => setSettingsForm({ ...settingsForm, work_end_time: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Grace (Mins)</label>
                  <input
                    type="number"
                    className="form-input-pill"
                    value={settingsForm.grace_period_minutes}
                    onChange={(e) => setSettingsForm({ ...settingsForm, grace_period_minutes: parseInt(e.target.value) })}
                    required
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-cyan" style={{ width: '100%', marginTop: '16px', padding: '14px' }}>
                Save Geofence & Shift Configuration
              </button>
            </form>
          </div>
        )}
      </div>

      {/* MODAL: ADD EMPLOYEE */}
      {showAddEmployeeModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ padding: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Add New Employee</h3>
              <button onClick={() => setShowAddEmployeeModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateEmployee}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    className="form-input-pill"
                    value={newEmployee.full_name}
                    onChange={(e) => setNewEmployee({ ...newEmployee, full_name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Employee Code</label>
                  <input
                    type="text"
                    className="form-input-pill"
                    placeholder="EMP001"
                    value={newEmployee.employee_code}
                    onChange={(e) => setNewEmployee({ ...newEmployee, employee_code: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Official Email</label>
                <input
                  type="email"
                  className="form-input-pill"
                  value={newEmployee.email}
                  onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Temporary Password</label>
                <input
                  type="password"
                  className="form-input-pill"
                  placeholder="Min 6 characters"
                  value={newEmployee.password}
                  onChange={(e) => setNewEmployee({ ...newEmployee, password: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Department</label>
                  <input
                    type="text"
                    className="form-input-pill"
                    value={newEmployee.department}
                    onChange={(e) => setNewEmployee({ ...newEmployee, department: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Designation</label>
                  <input
                    type="text"
                    className="form-input-pill"
                    value={newEmployee.designation}
                    onChange={(e) => setNewEmployee({ ...newEmployee, designation: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" onClick={() => setShowAddEmployeeModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-cyan">
                  Register Employee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD HOLIDAY */}
      {showAddHolidayModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ padding: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Add Company Holiday</h3>
              <button onClick={() => setShowAddHolidayModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddHoliday}>
              <div className="form-group">
                <label className="form-label">Holiday Date</label>
                <input
                  type="date"
                  className="form-input-pill"
                  value={newHoliday.holiday_date}
                  onChange={(e) => setNewHoliday({ ...newHoliday, holiday_date: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Holiday Title</label>
                <input
                  type="text"
                  className="form-input-pill"
                  placeholder="e.g. Festival / National Day"
                  value={newHoliday.title}
                  onChange={(e) => setNewHoliday({ ...newHoliday, title: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description (Optional)</label>
                <input
                  type="text"
                  className="form-input-pill"
                  value={newHoliday.description}
                  onChange={(e) => setNewHoliday({ ...newHoliday, description: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" onClick={() => setShowAddHolidayModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-cyan">
                  Save Holiday
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: 6-PHOTO FACE ENROLLMENT */}
      {enrollTargetEmployee && (
        <FaceEnrollmentModal
          employee={enrollTargetEmployee}
          onClose={() => setEnrollTargetEmployee(null)}
          onSuccess={() => {
            setEnrollTargetEmployee(null);
            showToast(`6 ArcFace vector templates enrolled for ${enrollTargetEmployee.full_name}!`);
            loadAllData();
          }}
        />
      )}
    </div>
  );
}
