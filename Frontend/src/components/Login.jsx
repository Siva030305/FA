import React, { useState } from 'react';
import { api } from '../services/api';
import { Eye, EyeOff, ScanFace, Sparkles, Lock, X, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';

export default function Login({ onLoginSuccess, onOpenKiosk, companyName }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Forgot password modal
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMsg, setForgotMsg] = useState('');
  const [forgotErr, setForgotErr] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await api.login({ email, password });
      if (res.access_token) {
        localStorage.setItem('access_token', res.access_token);
        localStorage.setItem('user_profile', JSON.stringify(res.user));
      }
      onLoginSuccess(res.user);
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setForgotLoading(true);
    setForgotMsg('');
    setForgotErr('');

    try {
      const res = await api.founderForgotPassword(forgotEmail);
      setForgotMsg(res.message || 'Password reset link sent to Founder email.');
    } catch (err) {
      setForgotErr(err.message || 'Reset request failed. Only founder can reset password.');
    } finally {
      setForgotLoading(false);
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
      {/* Decorative Pastel Organic Circles in Background */}
      <div style={{
        position: 'absolute',
        top: '5%',
        right: '8%',
        width: '160px',
        height: '160px',
        borderRadius: '50%',
        background: '#d6f0ff',
        opacity: 0.6,
        zIndex: 0,
        pointerEvents: 'none'
      }} />

      {/* 2-Column Split Card (Inspired by reference Image 1) */}
      <div className="app-card auth-split-card" style={{
        display: 'flex',
        maxWidth: '860px',
        width: '100%',
        borderRadius: '28px',
        overflow: 'hidden',
        boxShadow: '0 20px 45px rgba(0, 196, 180, 0.12), 0 4px 16px rgba(0,0,0,0.04)',
        border: '1.5px solid var(--border-light)',
        zIndex: 1,
        background: '#ffffff'
      }}>
        {/* LEFT COLUMN: Peach Mascot Card */}
        <div className="auth-split-left" style={{
          flex: '1.1',
          background: 'linear-gradient(145deg, #ffece5 0%, #fff4ef 100%)',
          padding: '44px 36px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          textAlign: 'center'
        }}>
          {/* Sunny Mascot Art */}
          <div style={{
            position: 'relative',
            width: '200px',
            height: '220px',
            margin: '0 auto 20px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {/* Sun */}
            <div style={{
              position: 'absolute',
              top: '10px',
              right: '15px',
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              background: '#fcd34d',
              boxShadow: '0 0 20px #fde68a',
            }} />
            
            {/* Cloud */}
            <div style={{
              position: 'absolute',
              top: '40px',
              left: '10px',
              width: '50px',
              height: '24px',
              background: '#ffffff',
              borderRadius: '20px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
            }} />

            {/* Cute Plant Mascot with smiling face */}
            <div style={{
              position: 'relative',
              width: '130px',
              height: '110px',
              background: 'linear-gradient(180deg, #f87171 0%, #ef4444 100%)',
              borderRadius: '16px 16px 28px 28px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 10px 20px rgba(239,68,68,0.25)',
              marginTop: '40px'
            }}>
              {/* Leaves sprouting */}
              <div style={{
                position: 'absolute',
                top: '-42px',
                width: '16px',
                height: '46px',
                background: '#10b981',
                borderRadius: '50% 50% 0 0',
                transform: 'rotate(-20deg)',
                left: '44px'
              }} />
              <div style={{
                position: 'absolute',
                top: '-46px',
                width: '18px',
                height: '50px',
                background: '#059669',
                borderRadius: '50% 50% 0 0',
              }} />
              <div style={{
                position: 'absolute',
                top: '-42px',
                width: '16px',
                height: '46px',
                background: '#10b981',
                borderRadius: '50% 50% 0 0',
                transform: 'rotate(20deg)',
                right: '44px'
              }} />

              {/* Eyes & Smile */}
              <div style={{ display: 'flex', gap: '30px', marginBottom: '8px' }}>
                <div style={{ width: '8px', height: '8px', background: '#0f172a', borderRadius: '50%' }} />
                <div style={{ width: '8px', height: '8px', background: '#0f172a', borderRadius: '50%' }} />
              </div>
              <div style={{
                width: '20px',
                height: '10px',
                borderBottom: '3px solid #0f172a',
                borderRadius: '0 0 12px 12px'
              }} />
            </div>

            {/* Little Watering Can */}
            <div style={{
              position: 'absolute',
              bottom: '12px',
              left: '12px',
              width: '36px',
              height: '32px',
              background: '#3b82f6',
              borderRadius: '8px',
              boxShadow: '0 4px 10px rgba(59,130,246,0.3)'
            }} />
          </div>

          {/* Pill Badge */}
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
            🌟 Staff checked in on time today
          </div>
        </div>

        {/* RIGHT COLUMN: Clean White Login Form */}
        <div className="auth-split-right" style={{
          flex: '1.2',
          padding: '44px 38px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          background: '#ffffff'
        }}>
          {/* Brand Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <span style={{
              width: '16px',
              height: '16px',
              background: '#00d2d3',
              borderRadius: '4px',
              transform: 'rotate(45deg)',
              display: 'inline-block'
            }} />
            <span style={{ fontWeight: 800, fontSize: '1.05rem', color: '#042f2e' }}>
              {companyName || 'FaceNod'}
            </span>
          </div>

          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', marginBottom: '4px' }}>
            Hello again, team!
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '24px' }}>
            Your colleagues have been asking about you.
          </p>

          {error && (
            <div style={{
              background: 'var(--accent-rose-light)',
              border: '1px solid var(--accent-rose-border)',
              color: 'var(--accent-rose)',
              padding: '11px 16px',
              borderRadius: '12px',
              marginBottom: '18px',
              fontSize: '0.86rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <AlertCircle size={17} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label">Email or username</label>
              <input
                type="email"
                className="form-input-pill"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: '12px' }}>
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-input-pill"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ paddingRight: '48px' }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '16px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-dim)',
                    padding: 0
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '22px',
              fontSize: '0.85rem'
            }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: 'var(--text-body)' }}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={{ width: '16px', height: '16px', accentColor: '#00d2d3' }}
                />
                <span>Remember me</span>
              </label>

              <button
                type="button"
                onClick={() => {
                  setForgotEmail(email);
                  setForgotMsg('');
                  setForgotErr('');
                  setShowForgotModal(true);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#2563eb',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                Forgot password?
              </button>
            </div>

            {/* Terracotta / Coral CTA Button matching Image 1 */}
            <button
              type="submit"
              className="btn btn-coral"
              style={{ width: '100%', padding: '14px', fontSize: '1rem', borderRadius: 'var(--radius-pill)' }}
              disabled={loading}
            >
              <span>{loading ? 'Signing in...' : 'Let’s check in'}</span>
              <ArrowRight size={18} />
            </button>
          </form>

          {/* Quick Switch to Live Face Attendance Scanner */}
          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onOpenKiosk}
              style={{ width: '100%', gap: '8px', padding: '12px' }}
            >
              <ScanFace size={18} color="#00d2d3" />
              <span>Face Check-In Kiosk</span>
            </button>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal (Strict: Founder only) */}
      {showForgotModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ padding: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px', color: '#0f172a' }}>
                <Lock size={20} color="#00d2d3" />
                Founder Password Reset
              </h3>
              <button
                onClick={() => setShowForgotModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '18px' }}>
              Password recovery is reserved exclusively for the company Founder account. If you are an employee, please contact your Founder.
            </p>

            {forgotErr && (
              <div style={{
                background: 'var(--accent-rose-light)',
                border: '1px solid var(--accent-rose-border)',
                color: 'var(--accent-rose)',
                padding: '10px 14px',
                borderRadius: '10px',
                marginBottom: '14px',
                fontSize: '0.84rem'
              }}>
                {forgotErr}
              </div>
            )}

            {forgotMsg && (
              <div style={{
                background: 'var(--accent-green-light)',
                border: '1px solid var(--accent-green-border)',
                color: 'var(--accent-green)',
                padding: '10px 14px',
                borderRadius: '10px',
                marginBottom: '14px',
                fontSize: '0.84rem'
              }}>
                {forgotMsg}
              </div>
            )}

            <form onSubmit={handleForgotPassword}>
              <div className="form-group">
                <label className="form-label">Founder Email Address</label>
                <input
                  type="email"
                  className="form-input-pill"
                  placeholder="founder@company.com"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowForgotModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-cyan"
                  disabled={forgotLoading}
                >
                  {forgotLoading ? 'Verifying...' : 'Send Reset Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
