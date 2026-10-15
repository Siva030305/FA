const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('access_token');
  const headers = {
    ...(options.headers || {}),
  };

  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Do not set Content-Type if sending FormData (browser handles boundary automatically)
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.detail || data.message || 'Request failed';
    throw new Error(errorMsg);
  }

  return data;
}

export const api = {
  // Auth & Founder Setup
  getFounderStatus: () => request('/auth/founder-status'),
  founderSignup: (payload) =>
    request('/auth/founder/signup', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  login: (payload) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  founderForgotPassword: (email) =>
    request('/auth/founder/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),
  getMe: () => request('/auth/me'),

  // Employees Management (Founder)
  getEmployees: () => request('/employees'),
  createEmployee: (payload) =>
    request('/employees', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateEmployee: (id, payload) =>
    request(`/employees/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  // Face Enrollment (6 Images)
  registerFaces: (employeeId, imageFiles) => {
    const formData = new FormData();
    formData.append('employee_id', employeeId);
    imageFiles.forEach((file) => {
      formData.append('images', file);
    });
    return request('/enrollment/register-faces', {
      method: 'POST',
      body: formData,
    });
  },

  // Attendance & Verification
  checkIn: ({ imageBlob, latitude, longitude, userId }) => {
    const formData = new FormData();
    formData.append('image', imageBlob, 'checkin.jpg');
    formData.append('latitude', latitude);
    formData.append('longitude', longitude);
    if (userId) {
      formData.append('user_id', userId);
    }
    return request('/attendance/check-in', {
      method: 'POST',
      body: formData,
    });
  },
  getTodayAttendance: () => request('/attendance/today'),
  getAttendanceHistory: (startDate, endDate) => {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    return request(`/attendance/history?${params.toString()}`);
  },
  triggerMorningAbsenceRoutine: () =>
    request('/attendance/run-morning-routine', { method: 'POST' }),

  // Settings & Geofence
  getSettings: () => request('/settings'),
  updateSettings: (payload) =>
    request('/settings', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  getHolidays: () => request('/settings/holidays'),
  addHoliday: (payload) =>
    request('/settings/holidays', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  deleteHoliday: (id) =>
    request(`/settings/holidays/${id}`, { method: 'DELETE' }),

  // Leaves
  getLeaveBalance: () => request('/leaves/balance'),
  getLeaveRequests: () => request('/leaves/requests'),
  applyLeave: (payload) =>
    request('/leaves/request', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  reviewLeave: (id, payload) =>
    request(`/leaves/request/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
};
