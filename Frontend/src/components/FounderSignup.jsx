import React, { useState } from 'react';
import { api } from '../services/api';
import { ShieldCheck, Lock, Mail, KeyRound, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';

export default function FounderSignup({ onSignupSuccess }) {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    confirm_password: '',
    founder_setup_code: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirm_password) {
      setError('Passwords do not match');
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await api.founderSignup(formData);
      setSuccess('Founder account registered successfully! Initializing workspace...');
      if (res.access_token) {
        localStorage.setItem('access_token', res.access_token);
        localStorage.setItem('user_profile', JSON.stringify(res.user));
      }
      setTimeout(() => {
        onSignupSuccess(res.user);
      }, 1200);
    } catch (err) {
      setError(err.message || 'Founder setup failed. Check your setup code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
      position: 'relative',
      background: 'radial-gradient(circle at 10% 20%, #e8f9f5 0%, #edfbf7 60%, #e0f6f0 100%)',
    }}>
      {/* 2-Column Split Card matching Theme */}
      <div className="app-card auth-split-card" style={{
        display: 'flex',
        maxWidth: '920px',
        width: '100%',
        borderRadius: '28px',
        overflow: 'hidden',
        boxShadow: '0 20px 45px rgba(0, 196, 180, 0.12), 0 4px 16px rgba(0,0,0,0.04)',
        border: '1.5px solid var(--border-light)',
        background: '#ffffff'
      }}>
        {/* LEFT COLUMN: Peach Mascot Card */}
        <div className="auth-split-left" style={{
          flex: '1',
          background: 'linear-gradient(145deg, #ffece5 0%, #fff4ef 100%)',
          padding: '44px 36px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center'
        }}>
          <div style={{
            width: '90px',
            height: '90px',
            borderRadius: '24px',
            background: '#ffffff',
            boxShadow: '0 12px 25px rgba(239,68,68,0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ef4444',
            marginBottom: '20px'
          }}>
            <ShieldCheck size={48} />
          </div>

          <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
            First-Time Setup
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', maxWidth: '280px', marginBottom: '24px' }}>
            No boss account exists yet. Create your single Founder profile to manage employee faces, shifts, and geofencing.
          </p>

          <div style={{
            background: '#ffffff',
            padding: '8px 18px',
            borderRadius: '999px',
            fontSize: '0.8rem',
            fontWeight: 700,
            color: '#334155',
            boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
            border: '1px solid #fed7aa'
          }}>
            🔒 Only 1 Boss Account Allowed
          </div>
        </div>

        {/* RIGHT COLUMN: Clean Registration Form */}
        <div className="auth-split-right" style={{
          flex: '1.3',
          padding: '44px 38px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          background: '#ffffff'
        }}>
          {/* Brand Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <span style={{
              width: '16px',
              height: '16px',
              background: '#00d2d3',
              borderRadius: '4px',
              transform: 'rotate(45deg)',
              display: 'inline-block'
            }} />
            <span style={{ fontWeight: 800, fontSize: '1.05rem', color: '#042f2e' }}>
              FaceNod AI
            </span>
          </div>

          <h2 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a', marginBottom: '4px' }}>
            Initialize Organization
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '20px' }}>
            Fill in your Founder credentials and setup authorization code.
          </p>

          {error && (
            <div style={{
              background: 'var(--accent-rose-light)',
              border: '1px solid var(--accent-rose-border)',
              color: 'var(--accent-rose)',
              padding: '10px 14px',
              borderRadius: '12px',
              marginBottom: '16px',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div style={{
              background: 'var(--accent-green-light)',
              border: '1px solid var(--accent-green-border)',
              color: 'var(--accent-green)',
              padding: '10px 14px',
              borderRadius: '12px',
              marginBottom: '16px',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <CheckCircle2 size={16} />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Founder Full Name</label>
              <input
                type="text"
                name="full_name"
                className="form-input-pill"
                placeholder="e.g. Siva Balan"
                value={formData.full_name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Official Email</label>
              <input
                type="email"
                name="email"
                className="form-input-pill"
                placeholder="founder@company.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">Password</label>
                <input
                  type="password"
                  name="password"
                  className="form-input-pill"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Confirm Password</label>
                <input
                  type="password"
                  name="confirm_password"
                  className="form-input-pill"
                  placeholder="••••••••"
                  value={formData.confirm_password}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '22px' }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <KeyRound size={15} color="#00d2d3" />
                <span>Founder Setup Code</span>
              </label>
              <input
                type="password"
                name="founder_setup_code"
                className="form-input-pill"
                placeholder="Enter secret code from .env"
                value={formData.founder_setup_code}
                onChange={handleChange}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-coral"
              style={{ width: '100%', padding: '14px', fontSize: '1rem', borderRadius: 'var(--radius-pill)' }}
              disabled={loading}
            >
              <span>{loading ? 'Registering Boss...' : 'Complete Founder Setup'}</span>
              <ArrowRight size={18} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
