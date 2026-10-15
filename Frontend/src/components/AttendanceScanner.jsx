import React, { useState, useRef, useEffect } from 'react';
import { api } from '../services/api';
import {
  Camera,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  ArrowLeft,
  Shield,
  Clock
} from 'lucide-react';

export default function AttendanceScanner({ currentUser, onBack }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const [coords, setCoords] = useState(null);
  const [geoError, setGeoError] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const fetchLocation = () => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: Math.round(pos.coords.accuracy),
        });
        setGeoError('');
      },
      (err) => {
        setGeoError('GPS permission denied. Location is required for geofence validation.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      streamRef.current = stream;
      setCameraActive(true);
      setError('');
    } catch (err) {
      setError('Unable to access camera. Please allow camera permissions.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
    setCameraActive(false);
  };

  useEffect(() => {
    fetchLocation();
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const handleCaptureAndCheckIn = async () => {
    if (!coords) {
      setError('Acquiring GPS location. Please wait a moment or enable location access.');
      fetchLocation();
      return;
    }
    if (!videoRef.current) return;

    setCapturing(true);
    setError('');
    setResult(null);

    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const blob = await new Promise((resolve) =>
        canvas.toBlob(resolve, 'image/jpeg', 0.95)
      );

      const payload = {
        imageBlob: blob,
        latitude: coords.latitude,
        longitude: coords.longitude,
        userId: currentUser?.id || null,
      };

      const res = await api.checkIn(payload);
      setResult(res);
    } catch (err) {
      setError(err.message || 'Verification failed. Please try again.');
    } finally {
      setCapturing(false);
    }
  };

  return (
    <div style={{ maxWidth: '640px', width: '100%', margin: '20px auto', padding: '0 16px' }}>
      <div className="app-card" style={{ padding: '24px 20px', background: '#ffffff' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {onBack && (
              <button
                onClick={onBack}
                className="btn btn-secondary"
                style={{ padding: '8px 12px' }}
              >
                <ArrowLeft size={16} />
              </button>
            )}
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                Face Attendance Check-In
              </h2>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                SCRFD Detection • ArcFace 512D • Anti-Spoofing • Geofenced
              </span>
            </div>
          </div>
          <button
            onClick={fetchLocation}
            className="btn btn-secondary"
            title="Refresh GPS Location"
            style={{ padding: '8px' }}
          >
            <RotateCcw size={16} />
          </button>
        </div>

        {/* GPS Geofence Status Pill Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: coords ? 'var(--accent-green-light)' : 'var(--accent-rose-light)',
          border: `1px solid ${coords ? 'var(--accent-green-border)' : 'var(--accent-rose-border)'}`,
          padding: '10px 16px',
          borderRadius: 'var(--radius-pill)',
          marginBottom: '16px',
          fontSize: '0.85rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MapPin size={17} color={coords ? '#059669' : '#dc2626'} />
            <div style={{ fontSize: '0.82rem', fontWeight: 600, color: coords ? '#065f46' : '#991b1b' }}>
              {coords ? (
                <span>GPS Ready: {coords.latitude.toFixed(4)}, {coords.longitude.toFixed(4)} (±{coords.accuracy}m)</span>
              ) : (
                <span>{geoError || 'Acquiring GPS location...'}</span>
              )}
            </div>
          </div>
          <span style={{
            fontSize: '0.72rem',
            padding: '3px 10px',
            borderRadius: '999px',
            background: coords ? '#059669' : '#dc2626',
            color: '#ffffff',
            fontWeight: 800
          }}>
            {coords ? 'GEOFENCE OK' : 'LOCATING'}
          </span>
        </div>

        {/* Camera Scanner Viewport */}
        <div className="scanner-viewport">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="scanner-video"
          />
          <div className="face-oval-guide" />
          <div className="scanner-laser" />
        </div>

        {/* Status Messages */}
        {error && (
          <div style={{
            background: 'var(--accent-rose-light)',
            border: '1px solid var(--accent-rose-border)',
            color: 'var(--accent-rose)',
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            marginTop: '16px',
            fontSize: '0.86rem',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <AlertTriangle size={18} />
            <span>{error}</span>
          </div>
        )}

        {result && (
          <div style={{
            background: result.is_late ? 'var(--accent-amber-light)' : 'var(--accent-green-light)',
            border: `1px solid ${result.is_late ? 'var(--accent-amber-border)' : 'var(--accent-green-border)'}`,
            padding: '16px 20px',
            borderRadius: 'var(--radius-md)',
            marginTop: '16px',
            textAlign: 'left'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={22} color={result.is_late ? '#d97706' : '#059669'} />
                <h3 style={{ fontSize: '1.1rem', color: result.is_late ? '#92400e' : '#065f46' }}>
                  {result.message}
                </h3>
              </div>
              <span className={`badge ${result.is_late ? 'badge-late' : 'badge-present'}`}>
                {result.status}
              </span>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
              gap: '10px',
              marginTop: '12px',
              fontSize: '0.82rem',
              color: 'var(--text-muted)'
            }}>
              <div>
                <strong style={{ color: '#0f172a', display: 'block' }}>Staff Name:</strong>
                {result.employee?.full_name || 'Verified User'} ({result.employee?.employee_code || 'EMP'})
              </div>
              <div>
                <strong style={{ color: '#0f172a', display: 'block' }}>Distance:</strong>
                {result.distance_meters} meters
              </div>
              <div>
                <strong style={{ color: '#0f172a', display: 'block' }}>Anti-Spoofing:</strong>
                {(result.liveness_score * 100).toFixed(0)}% Live
              </div>
              <div>
                <strong style={{ color: '#0f172a', display: 'block' }}>ArcFace Match:</strong>
                {(result.match_similarity * 100).toFixed(0)}% Confidence
              </div>
            </div>
          </div>
        )}

        {/* Check-In Action Button */}
        <div style={{ marginTop: '20px' }}>
          <button
            onClick={handleCaptureAndCheckIn}
            className="btn btn-cyan"
            style={{ width: '100%', padding: '14px', fontSize: '1rem', borderRadius: 'var(--radius-pill)' }}
            disabled={capturing || !coords}
          >
            <Camera size={20} />
            <span>{capturing ? 'Verifying SCRFD & ArcFace...' : 'Capture Face & Mark Attendance'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
