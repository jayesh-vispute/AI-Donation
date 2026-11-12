import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Camera as CameraIcon, X, Zap, RefreshCw, Grid, 
  CheckCircle2, Image as ImageIcon, ArrowRight, Info 
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function Camera() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  const [stream, setStream] = useState(null);
  const [error, setError] = useState('');
  const [cameraReady, setCameraReady] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [capturedFile, setCapturedFile] = useState(null);
  
  // Interactive visual controls
  const [facingMode, setFacingMode] = useState('user');
  const [videoDevices, setVideoDevices] = useState([]);
  const [currentDeviceId, setCurrentDeviceId] = useState(null);
  const [isFlipped, setIsFlipped] = useState(false);
  
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [flashTriggered, setFlashTriggered] = useState(false);
  const [gridEnabled, setGridEnabled] = useState(false);
  const [activeMode, setActiveMode] = useState('photo');
  const [statusToast, setStatusToast] = useState('');

  const triggerToast = (msg) => {
    setStatusToast(msg);
    setTimeout(() => {
      setStatusToast(prev => prev === msg ? '' : prev);
    }, 2200);
  };

  // Enumerate video input devices on mount
  useEffect(() => {
    async function getDevices() {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const vDevices = devices.filter(d => d.kind === 'videoinput');
          setVideoDevices(vDevices);
          if (vDevices.length > 0 && !currentDeviceId) {
            setCurrentDeviceId(vDevices[0].deviceId);
          }
        }
      } catch (e) {
        // Enumerate error fallback
      }
    }
    getDevices();
  }, []);

  const startCamera = useCallback(async () => {
    try {
      setError('');
      setCameraReady(false);
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      let videoConstraints = { width: { ideal: 1920 }, height: { ideal: 1080 } };
      
      if (currentDeviceId && videoDevices.length > 1) {
        videoConstraints.deviceId = { exact: currentDeviceId };
      } else {
        // Use 'ideal' facingMode to prevent OverconstrainedError on single-webcam systems
        videoConstraints.facingMode = { ideal: facingMode };
      }

      let newStream;
      try {
        newStream = await navigator.mediaDevices.getUserMedia({
          video: videoConstraints,
          audio: false,
        });
      } catch (firstErr) {
        // Fallback to plain video constraint if specific constraints fail
        newStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }

      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
        videoRef.current.onloadedmetadata = () => setCameraReady(true);
      }
    } catch (err) {
      setError(t('donor.cameraError', 'Camera access denied or unavailable. Please use the Upload from Gallery option.'));
    }
  }, [facingMode, currentDeviceId, videoDevices.length, t]);

  useEffect(() => {
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [facingMode, currentDeviceId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Helper: Convert Data URL to File object synchronously
  const dataURLtoFile = (dataurl, filename) => {
    try {
      const arr = dataurl.split(',');
      const mime = arr[0].match(/:(.*?);/)[1];
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      return new File([u8arr], filename, { type: mime });
    } catch (e) {
      return null;
    }
  };

  const handleCapture = () => {
    if (flashEnabled) {
      setFlashTriggered(true);
      setTimeout(() => setFlashTriggered(false), 250);
    }

    const video = videoRef.current;
    let canvas = canvasRef.current;
    if (!canvas) {
      canvas = document.createElement('canvas');
    }

    if (video && video.videoWidth > 0 && video.videoHeight > 0) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');

      // Handle horizontal mirror flip if enabled
      if (isFlipped) {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
      setCapturedImage(dataUrl);

      const fileObj = dataURLtoFile(dataUrl, 'camera-capture.jpg');
      setCapturedFile(fileObj);
      return;
    }

    // Fallback: If camera stream is not producing frames, open file picker
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setCapturedFile(null);
    startCamera();
  };

  const handleUseImage = () => {
    let fileToUse = capturedFile;
    if (!fileToUse && capturedImage) {
      fileToUse = dataURLtoFile(capturedImage, 'camera-capture.jpg');
    }

    if (fileToUse) {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      navigate('/results', { state: { file: fileToUse } });
    }
  };

  const handleClose = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    navigate('/donate');
  };

  const handleToggleCamera = () => {
    if (videoDevices.length > 1) {
      const currentIndex = videoDevices.findIndex(d => d.deviceId === currentDeviceId);
      const nextIndex = (currentIndex + 1) % videoDevices.length;
      const nextDev = videoDevices[nextIndex];
      setCurrentDeviceId(nextDev.deviceId);
      triggerToast(`Camera Switched: ${nextDev.label || `Camera ${nextIndex + 1}`}`);
    } else {
      const nextFacing = facingMode === 'user' ? 'environment' : 'user';
      setFacingMode(nextFacing);
      setIsFlipped(prev => !prev);
      triggerToast(nextFacing === 'environment' ? 'Camera Switched: Rear View' : 'Camera Switched: Front View');
    }
  };

  const handleToggleFlash = async () => {
    const nextState = !flashEnabled;
    setFlashEnabled(nextState);
    triggerToast(nextState ? 'Flash / Torch Enabled' : 'Flash Light Disabled');

    if (stream) {
      const track = stream.getVideoTracks()[0];
      if (track && typeof track.applyConstraints === 'function') {
        try {
          await track.applyConstraints({ advanced: [{ torch: nextState }] });
        } catch (e) {
          // Hardware torch not supported on device
        }
      }
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      navigate('/results', { state: { file } });
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: '#0F1115',
      backgroundImage: 'radial-gradient(circle at 50% 30%, #1A1D24 0%, #0D0E12 100%)',
      zIndex: 9999, overflowY: 'auto',
      display: 'flex', flexDirection: 'column', boxSizing: 'border-box',
      color: '#FFFFFF', fontFamily: 'Inter, sans-serif'
    }}>
      {/* Hidden File Input & Hidden Canvas */}
      <input 
        type="file" 
        ref={fileInputRef} 
        accept="image/*" 
        style={{ display: 'none' }} 
        onChange={handleFileSelect} 
      />
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* 1. TOP HEADER */}
      <header style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '20px 32px', width: '100%', boxSizing: 'border-box', zIndex: 20
      }}>
        {/* Left Badge & Titles */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: 44, height: 44, borderRadius: '12px',
            backgroundColor: '#C4622D', color: '#FFFFFF',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(196, 98, 45, 0.3)', flexShrink: 0
          }}>
            <CameraIcon size={22} />
          </div>
          <div>
            <h1 style={{ fontSize: '20px', fontFamily: 'Fraunces, serif', fontWeight: 700, margin: 0, color: '#FFFFFF' }}>
              {t('donor.captureItem', 'Capture Item')}
            </h1>
            <p style={{ fontSize: '13px', color: '#9CA3AF', margin: '2px 0 0 0' }}>
              {t('donor.captureSubtitle', 'Take a clear photo of the item you want to donate')}
            </p>
          </div>
        </div>

        {/* Right Close Button */}
        <button 
          onClick={handleClose}
          aria-label="Close Camera"
          style={{
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '50%', width: 40, height: 40,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#FFFFFF', cursor: 'pointer', transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)'}
        >
          <X size={20} />
        </button>
      </header>

      {/* 2. CENTER CONTENT (3-COLUMN DESKTOP GRID) */}
      <main style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: '32px', padding: '0 24px', maxWidth: '1200px', margin: '0 auto',
        width: '100%', boxSizing: 'border-box', flexWrap: 'wrap'
      }}>
        
        {/* LEFT CAMERA CONTROLS */}
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '20px', padding: '20px 14px',
          display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center',
          minWidth: '80px'
        }}>
          {/* Flash */}
          <button 
            onClick={handleToggleFlash}
            aria-label="Toggle Flash"
            style={{
              background: flashEnabled ? 'rgba(245, 158, 11, 0.15)' : 'none',
              border: flashEnabled ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid transparent',
              borderRadius: '12px', padding: '8px 12px', width: '100%',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
              cursor: 'pointer', fontSize: '11px', fontWeight: 600, transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => { if (!flashEnabled) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'; }}
            onMouseLeave={(e) => { if (!flashEnabled) e.currentTarget.style.backgroundColor = 'transparent'; }}
          >
            <Zap size={22} color={flashEnabled ? '#F59E0B' : '#FFFFFF'} />
            <span style={{ color: '#FFFFFF', marginTop: '2px' }}>Flash</span>
            <span style={{ color: flashEnabled ? '#F59E0B' : '#9CA3AF', fontSize: '10px' }}>{flashEnabled ? 'On' : 'Off'}</span>
          </button>

          {/* Switch Camera */}
          <button 
            onClick={handleToggleCamera}
            aria-label="Switch Camera"
            style={{
              background: 'none', border: '1px solid transparent',
              borderRadius: '12px', padding: '8px 12px', width: '100%',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
              cursor: 'pointer', fontSize: '11px', fontWeight: 600, transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <RefreshCw size={22} color="#FFFFFF" />
            <span style={{ color: '#FFFFFF', marginTop: '2px' }}>Switch</span>
            <span style={{ color: '#9CA3AF', fontSize: '10px' }}>Camera</span>
          </button>

          {/* Grid */}
          <button 
            onClick={() => setGridEnabled(prev => !prev)}
            aria-label="Toggle Grid"
            style={{
              background: gridEnabled ? 'rgba(196, 98, 45, 0.15)' : 'none',
              border: gridEnabled ? '1px solid rgba(196, 98, 45, 0.4)' : '1px solid transparent',
              borderRadius: '12px', padding: '8px 12px', width: '100%',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
              cursor: 'pointer', fontSize: '11px', fontWeight: 600, transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => { if (!gridEnabled) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'; }}
            onMouseLeave={(e) => { if (!gridEnabled) e.currentTarget.style.backgroundColor = 'transparent'; }}
          >
            <Grid size={22} color={gridEnabled ? '#C4622D' : '#FFFFFF'} />
            <span style={{ color: '#FFFFFF', marginTop: '2px' }}>Grid</span>
            <span style={{ color: gridEnabled ? '#C4622D' : '#9CA3AF', fontSize: '10px' }}>{gridEnabled ? 'On' : 'Off'}</span>
          </button>
        </div>

        {/* CENTER CAMERA PREVIEW & SHUTTER CONTAINER */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
          
          <div style={{
            position: 'relative', width: '340px', height: '420px',
            borderRadius: '24px', overflow: 'hidden',
            border: flashEnabled ? '2px solid rgba(245, 158, 11, 0.6)' : '1px solid rgba(255, 255, 255, 0.15)',
            boxShadow: flashEnabled 
              ? '0 0 30px rgba(245, 158, 11, 0.3), inset 0 0 40px rgba(255, 255, 255, 0.2)' 
              : '0 20px 40px rgba(0, 0, 0, 0.6)',
            backgroundColor: '#000000', display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.3s ease'
          }}>
            {/* Live Status Toast Banner */}
            {statusToast && (
              <div style={{
                position: 'absolute', top: 16, backgroundColor: 'rgba(0, 0, 0, 0.75)',
                backdropFilter: 'blur(8px)', border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#FFFFFF', padding: '6px 14px', borderRadius: '20px',
                fontSize: '12px', fontWeight: 600, zIndex: 30, pointerEvents: 'none',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
              }}>
                {statusToast}
              </div>
            )}

            {/* Screen Flash Simulation Overlay */}
            {flashTriggered && (
              <div style={{
                position: 'absolute', inset: 0, backgroundColor: '#FFFFFF',
                zIndex: 99, pointerEvents: 'none', transition: 'opacity 0.25s ease'
              }} />
            )}

            {/* Flash Constant Backlight Filter */}
            {flashEnabled && !capturedImage && (
              <div style={{
                position: 'absolute', inset: 0,
                boxShadow: 'inset 0 0 50px 15px rgba(255, 245, 220, 0.25)',
                pointerEvents: 'none', zIndex: 15
              }} />
            )}

            {capturedImage ? (
              <img src={capturedImage} alt="Captured" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <>
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  muted 
                  onLoadedMetadata={() => setCameraReady(true)}
                  onLoadedData={() => setCameraReady(true)}
                  onCanPlay={() => setCameraReady(true)}
                  onPlay={() => setCameraReady(true)}
                  style={{ 
                    width: '100%', height: '100%', objectFit: 'cover',
                    transform: isFlipped ? 'scaleX(-1)' : 'none',
                    transition: 'transform 0.3s ease'
                  }} 
                />
                
                {/* Framing Corners */}
                <div style={{ position: 'absolute', top: 16, left: 16, width: 28, height: 28, borderTop: '3px solid #FFFFFF', borderLeft: '3px solid #FFFFFF', borderRadius: '4px 0 0 0', pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', top: 16, right: 16, width: 28, height: 28, borderTop: '3px solid #FFFFFF', borderRight: '3px solid #FFFFFF', borderRadius: '0 4px 0 0', pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', bottom: 16, left: 16, width: 28, height: 28, borderBottom: '3px solid #FFFFFF', borderLeft: '3px solid #FFFFFF', borderRadius: '0 0 0 4px', pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', bottom: 16, right: 16, width: 28, height: 28, borderBottom: '3px solid #FFFFFF', borderRight: '3px solid #FFFFFF', borderRadius: '0 0 4px 0', pointerEvents: 'none' }} />

                {/* Grid Overlay */}
                {gridEnabled && (
                  <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gridTemplateRows: '1fr 1fr 1fr' }}>
                    <div style={{ borderRight: '1px solid rgba(255,255,255,0.2)', borderBottom: '1px solid rgba(255,255,255,0.2)' }} />
                    <div style={{ borderRight: '1px solid rgba(255,255,255,0.2)', borderBottom: '1px solid rgba(255,255,255,0.2)' }} />
                    <div style={{ borderBottom: '1px solid rgba(255,255,255,0.2)' }} />
                    <div style={{ borderRight: '1px solid rgba(255,255,255,0.2)', borderBottom: '1px solid rgba(255,255,255,0.2)' }} />
                    <div style={{ borderRight: '1px solid rgba(255,255,255,0.2)', borderBottom: '1px solid rgba(255,255,255,0.2)' }} />
                    <div style={{ borderBottom: '1px solid rgba(255,255,255,0.2)' }} />
                    <div style={{ borderRight: '1px solid rgba(255,255,255,0.2)' }} />
                    <div style={{ borderRight: '1px solid rgba(255,255,255,0.2)' }} />
                    <div />
                  </div>
                )}

                {error && (
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', textAlign: 'center', color: '#FFFFFF', flexDirection: 'column', backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 20 }}>
                    <p style={{ marginBottom: '16px', fontSize: '14px', lineHeight: 1.4 }}>{error}</p>
                    <button onClick={() => navigate('/donate')} style={{ padding: '10px 20px', backgroundColor: '#C4622D', color: '#FFF', border: 'none', borderRadius: '10px', fontWeight: 600, cursor: 'pointer' }}>
                      {t('donor.returnToUpload', 'Return to Upload')}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* CAPTURE SHUTTER / RETAKE CONTROLS */}
          {capturedImage ? (
            <div style={{ display: 'flex', gap: '12px', width: '100%', maxWidth: '340px' }}>
              <button 
                onClick={handleRetake} 
                style={{ 
                  flex: 1, padding: '14px', borderRadius: '14px', 
                  background: 'rgba(255,255,255,0.1)', color: '#FFFFFF', border: '1px solid rgba(255,255,255,0.2)', 
                  fontSize: '15px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer',
                  transition: 'background-color 0.2s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.18)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
              >
                <RefreshCw size={18} /> {t('donor.retake', 'Retake')}
              </button>
              <button 
                onClick={handleUseImage} 
                style={{ 
                  flex: 1.5, padding: '14px', borderRadius: '14px', 
                  background: '#C4622D', color: '#FFFFFF', border: 'none', 
                  fontSize: '15px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(196, 98, 45, 0.4)', transition: 'background-color 0.2s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#B05322'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#C4622D'}
              >
                {t('donor.usePhoto', 'Use Photo')} <ArrowRight size={18} />
              </button>
            </div>
          ) : (
            !error && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
                <button 
                  onClick={handleCapture}
                  aria-label="Capture Photo"
                  style={{
                    width: 72, height: 72, borderRadius: '50%',
                    backgroundColor: 'transparent',
                    border: '4px solid #FFFFFF',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer',
                    opacity: 1,
                    boxShadow: '0 0 24px rgba(196, 98, 45, 0.6)',
                    transition: 'transform 0.15s ease'
                  }}
                  onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.92)'}
                  onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <div style={{ width: 56, height: 56, borderRadius: '50%', backgroundColor: '#FFFFFF', pointerEvents: 'none' }} />
                </button>

                {/* MODE BADGE [ Photo ] */}
                <div style={{
                  backgroundColor: '#C4622D',
                  color: '#FFFFFF',
                  borderRadius: '100px',
                  padding: '6px 22px',
                  fontSize: '12px',
                  fontWeight: 600,
                  boxShadow: '0 2px 8px rgba(196, 98, 45, 0.3)'
                }}>
                  Photo
                </div>
              </div>
            )
          )}
        </div>

        {/* RIGHT INFORMATION PANEL */}
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '20px', padding: '24px',
          width: '260px', boxSizing: 'border-box',
          display: 'flex', flexDirection: 'column', gap: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#C4622D', fontWeight: 700, fontSize: '14px' }}>
            <Info size={18} />
            <span style={{ color: '#FFFFFF' }}>Tips for better photo</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#E5E7EB' }}>
              <CheckCircle2 size={16} color="#22C55E" style={{ flexShrink: 0 }} />
              <span>Ensure good lighting</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#E5E7EB' }}>
              <CheckCircle2 size={16} color="#22C55E" style={{ flexShrink: 0 }} />
              <span>Keep the item in focus</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#E5E7EB' }}>
              <CheckCircle2 size={16} color="#22C55E" style={{ flexShrink: 0 }} />
              <span>Capture the entire item</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#E5E7EB' }}>
              <CheckCircle2 size={16} color="#22C55E" style={{ flexShrink: 0 }} />
              <span>Avoid blurred images</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#E5E7EB' }}>
              <CheckCircle2 size={16} color="#22C55E" style={{ flexShrink: 0 }} />
              <span>Use a clean background</span>
            </div>
          </div>
        </div>

      </main>

      {/* 3. BOTTOM ACTIONS (GALLERY & CANCEL) */}
      <footer style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '20px 32px', width: '100%', boxSizing: 'border-box', zIndex: 20
      }}>
        {/* Gallery Action */}
        <button 
          onClick={() => fileInputRef.current?.click()}
          aria-label="Choose image from device gallery"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '16px', padding: '12px 20px',
            display: 'flex', alignItems: 'center', gap: '14px',
            color: '#FFFFFF', cursor: 'pointer', textAlign: 'left',
            transition: 'background-color 0.2s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.12)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'}
        >
          <div style={{
            width: 38, height: 38, borderRadius: '10px',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <ImageIcon size={20} color="#FFFFFF" />
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#FFFFFF' }}>Gallery</div>
            <div style={{ fontSize: '11px', color: '#9CA3AF' }}>Choose from device</div>
          </div>
        </button>

        {/* Cancel Action */}
        <button 
          onClick={handleClose}
          aria-label="Cancel Camera"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '16px', padding: '12px 24px',
            display: 'flex', alignItems: 'center', gap: '8px',
            color: '#FFFFFF', cursor: 'pointer', fontSize: '14px', fontWeight: 600,
            transition: 'background-color 0.2s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.12)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'}
        >
          <X size={18} /> Cancel
        </button>
      </footer>
    </div>
  );
}


