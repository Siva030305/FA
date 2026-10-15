import React, { useState, useRef, useEffect } from 'react';
import { api } from '../services/api';
import { Camera, Check, X, AlertCircle, Sparkles, RefreshCw, CheckCircle2 } from 'lucide-react';

const POSES = [
  { id: 0, title: 'Straight (Frontal)', instruction: 'Look directly into the camera with a neutral face.' },
  { id: 1, title: 'Turn Slight Left', instruction: 'Gently turn your head about 15° to your left.' },
  { id: 2, title: 'Turn Slight Right', instruction: 'Gently turn your head about 15° to your right.' },
  { id: 3, title: 'Tilt Head Up', instruction: 'Tilt your chin slightly upwards.' },
  { id: 4, title: 'Tilt Head Down', instruction: 'Tilt your chin slightly downwards.' },
  { id: 5, title: 'Smile / Expression', instruction: 'Smile naturally or show a pleasant expression.' },
];

export default function FaceEnrollmentModal({ employee, onClose, onSuccess }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const [currentStep, setCurrentStep] = useState(0);
  const [capturedBlobs, setCapturedBlobs] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      streamRef.current = stream;
    } catch (err) {
      setError('Camera access denied. Please allow webcam permissions to enroll faces.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
  };

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const handleCapturePose = async () => {
    if (!videoRef.current) return;
    setError('');

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

    const newBlobs = [...capturedBlobs, blob];
    setCapturedBlobs(newBlobs);

    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    } else {
      // All 6 poses captured! Upload to server
      handleUploadEmbeddings(newBlobs);
    }
  };

  const handleReset = () => {
    setCapturedBlobs([]);
    setCurrentStep(0);
    setError('');
  };

  const handleUploadEmbeddings = async (blobs) => {
    setSubmitting(true);
    setError('');
    try {
      const imageFiles = blobs.map((b, idx) => new File([b], `pose_${idx + 1}.jpg`, { type: 'image/jpeg' }));
      const res = await api.registerFaces(employee.id, imageFiles);
      setSuccessMsg(`Successfully registered 6 ArcFace vector templates for ${employee.full_name}!`);
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (err) {
      setError(err.message || 'Failed to extract ArcFace embeddings. Ensure face is clearly visible.');
      setCapturedBlobs([]);
      setCurrentStep(0);
    } finally {
      setSubmitting(false);
    }
  };

  const activePose = POSES[currentStep] || POSES[0];

  return (
    <div className="modal-overlay">
      <div className="glass-panel modal-content" style={{ maxWidth: '580px', padding: '24px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={20} color="#06b6d4" />
              Enroll Face ({employee.full_name})
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
              6 Guided Captures • SCRFD Keypoints • ArcFace 512D Embeddings
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Step Progress Bar */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '16px' }}>
          {POSES.map((p, idx) => (
            <div
              key={p.id}
              style={{
                flex: 1,
                height: '6px',
                borderRadius: '3px',
                background: idx < capturedBlobs.length ? '#10b981' : idx === currentStep ? '#6366f1' : 'rgba(255,255,255,0.1)',
                transition: 'all 0.3s'
              }}
            />
          ))}
        </div>

        {/* Pose Direction Card */}
        <div style={{
          background: 'rgba(99, 102, 241, 0.1)',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          padding: '12px 16px',
          borderRadius: 'var(--radius-md)',
          marginBottom: '14px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: '#818cf8', fontWeight: 700, textTransform: 'uppercase' }}>
              Capture {currentStep + 1} of 6: {activePose.title}
            </span>
            <p style={{ fontSize: '0.88rem', color: '#f8fafc', marginTop: '2px' }}>
              {activePose.instruction}
            </p>
          </div>
          <span style={{
            fontSize: '0.9rem',
            fontWeight: 800,
            padding: '4px 10px',
            borderRadius: '999px',
            background: 'rgba(99, 102, 241, 0.25)',
            color: '#c7d2fe'
          }}>
            {currentStep + 1}/6
          </span>
        </div>

        {/* Camera Viewport */}
        <div className="scanner-viewport" style={{ maxHeight: '340px' }}>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="scanner-video"
          />
          <div className="face-oval-guide" style={{ width: '190px', height: '250px' }} />
        </div>

        {error && (
          <div style={{
            background: 'var(--danger-bg)',
            border: '1px solid var(--danger-border)',
            color: '#fca5a5',
            padding: '10px 14px',
            borderRadius: 'var(--radius-md)',
            marginTop: '12px',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div style={{
            background: 'var(--success-bg)',
            border: '1px solid var(--success-border)',
            color: '#6ee7b7',
            padding: '10px 14px',
            borderRadius: 'var(--radius-md)',
            marginTop: '12px',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <CheckCircle2 size={16} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
          {capturedBlobs.length > 0 && !submitting && (
            <button
              onClick={handleReset}
              className="btn btn-secondary"
              title="Restart 6-pose capture"
            >
              <RefreshCw size={16} />
              <span>Reset</span>
            </button>
          )}

          <button
            onClick={handleCapturePose}
            className="btn btn-primary"
            style={{ flex: 1, padding: '12px' }}
            disabled={submitting}
          >
            <Camera size={18} />
            <span>
              {submitting
                ? 'Processing SCRFD & ArcFace...'
                : currentStep === 5
                ? 'Capture Final Pose & Save (6/6)'
                : `Capture Pose ${currentStep + 1}`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
