'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Camera, RefreshCw, CheckCircle2, AlertCircle, Upload, Sparkles } from 'lucide-react';

interface SelfieCameraProps {
  onPhotoCaptured: (photoUrl: string) => void;
  initialPhotoUrl?: string;
}

export const SelfieCamera: React.FC<SelfieCameraProps> = ({
  onPhotoCaptured,
  initialPhotoUrl = '',
}) => {
  const [photoUrl, setPhotoUrl] = useState<string>(initialPhotoUrl);
  const [isStreaming, setIsStreaming] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isFlashing, setIsFlashing] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Start live webcam stream
  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access not supported on this device/browser.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 640 } },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsStreaming(true);
      }
    } catch (err: any) {
      console.warn('Camera access error:', err);
      setCameraError('Unable to open live camera. You can also upload a photo file.');
      setIsStreaming(false);
    }
  };

  // Stop camera stream
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsStreaming(false);
  };

  useEffect(() => {
    if (!photoUrl) {
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, []);

  // Capture snapshot from video to canvas
  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;

    // Trigger flash animation
    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 200);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 400;
    canvas.height = video.videoHeight || 400;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Mirror image for selfie feel
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setPhotoUrl(dataUrl);
      stopCamera();
      onPhotoCaptured(dataUrl);
    }
  };

  // Retake photo
  const handleRetake = () => {
    setPhotoUrl('');
    startCamera();
  };

  // Handle fallback file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        if (uploadEvent.target?.result) {
          const resultUrl = uploadEvent.target.result as string;
          setPhotoUrl(resultUrl);
          stopCamera();
          onPhotoCaptured(resultUrl);
        }
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  // Use default verified sample selfie
  const useSampleSelfie = () => {
    const sample =
      'https://lh3.googleusercontent.com/aida-public/AB6AXuC-PEiTgWViD1ovXWhH1B1TQbMaWamoTZBv9VbCDabgGy61BlhUVTtyCaQqeI5WbDHOFao2v1A6tBhc7gUUm_4Kw7IjE4g7U93BvPxpBCwFcpkL3WKodfrio1p1RyKPuUw3qMZ3ehzSz5_NUemOI3BVvFqRDj3EdyCQfpGH2eWP1FbJCAvX16Yy7ZGqOdSYHx44o2sVTKEs0VZ56ZU7EjUIFOEJHw_qX6azzfjVcPoCJ7EDvRR1lx43EA';
    setPhotoUrl(sample);
    stopCamera();
    onPhotoCaptured(sample);
  };

  return (
    <div className="flex flex-col items-center w-full max-w-sm mx-auto">
      {/* Hidden canvas for taking snapshot */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Screen Container */}
      <div className="relative w-full aspect-square max-w-[320px] rounded-3xl overflow-hidden bg-slate-950 border-4 border-slate-800 shadow-2xl flex items-center justify-center">
        {/* Flash Effect */}
        {isFlashing && <div className="absolute inset-0 bg-white z-50 animate-fade-in" />}

        {photoUrl ? (
          /* Preview Mode */
          <div className="relative w-full h-full animate-scale-up">
            <img src={photoUrl} alt="Captured Selfie" className="w-full h-full object-cover" />
            <div className="absolute top-3 right-3 bg-emerald-600 text-white text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-md">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Selfie Verified</span>
            </div>
          </div>
        ) : isStreaming ? (
          /* Live Stream Mode */
          <div className="relative w-full h-full flex items-center justify-center">
            <video
              ref={videoRef}
              playsInline
              muted
              autoPlay
              className="w-full h-full object-cover transform -scale-x-100"
            />

            {/* Facial Alignment Guide Oval */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-6">
              <div className="w-[180px] h-[230px] rounded-[50%] border-2 border-dashed border-primary shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] animate-pulse" />
            </div>

            <div className="absolute bottom-3 left-0 right-0 text-center pointer-events-none">
              <span className="text-[11px] font-bold text-white bg-black/60 px-3 py-1 rounded-full backdrop-blur-sm">
                Position your face inside the oval
              </span>
            </div>
          </div>
        ) : (
          /* Camera Error / Standby Mode */
          <div className="flex flex-col items-center justify-center p-6 text-center text-slate-300">
            <Camera className="w-12 h-12 text-slate-500 mb-2" />
            <p className="text-xs text-slate-400 max-w-[200px] mb-3">
              {cameraError || 'Camera initializing...'}
            </p>
            <button
              onClick={startCamera}
              className="text-xs font-bold text-primary bg-primary/20 hover:bg-primary/30 px-3 py-1.5 rounded-full transition-colors"
            >
              Retry Camera
            </button>
          </div>
        )}
      </div>

      {/* Controls & Actions */}
      <div className="w-full mt-6 flex flex-col items-center gap-3">
        {photoUrl ? (
          /* When photo is captured */
          <div className="flex gap-3 w-full">
            <button
              onClick={handleRetake}
              className="flex-1 py-3.5 bg-white border border-slate-300 text-on-surface font-bold text-xs rounded-2xl hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5 shadow-sm"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Retake Photo</span>
            </button>
          </div>
        ) : (
          /* Live Capture Controls */
          <div className="flex flex-col items-center gap-4 w-full">
            <button
              onClick={handleCapture}
              disabled={!isStreaming}
              className="w-18 h-18 rounded-full bg-white border-4 border-primary shadow-lift hover:scale-105 active:scale-95 transition-transform flex items-center justify-center p-1.5 disabled:opacity-40 disabled:scale-100"
            >
              <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center text-white">
                <Camera className="w-6 h-6" />
              </div>
            </button>
            <span className="text-xs font-bold text-secondary">Tap shutter to capture</span>
          </div>
        )}

        {/* Fallback Upload & Sample Buttons */}
        {!photoUrl && (
          <div className="flex items-center justify-center gap-4 pt-2">
            <label className="cursor-pointer text-[11px] font-semibold text-primary hover:underline flex items-center gap-1">
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Photo from gallery</span>
              <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
            </label>

            <span className="text-slate-300">•</span>

            <button
              type="button"
              onClick={useSampleSelfie}
              className="text-[11px] font-semibold text-secondary hover:text-primary flex items-center gap-1"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Use sample photo</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
