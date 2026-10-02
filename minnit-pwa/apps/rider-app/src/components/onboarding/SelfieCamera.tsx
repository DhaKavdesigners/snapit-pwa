'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Camera, RefreshCw, CheckCircle2, AlertCircle, Upload, Sparkles } from 'lucide-react';

import { uploadFileToSupabaseStorage } from '@/services/supabaseOrderService';

interface SelfieCameraProps {
  onPhotoCaptured: (photoUrl: string) => void;
  initialPhotoUrl?: string;
  riderPhone?: string;
}

export const SelfieCamera: React.FC<SelfieCameraProps> = ({
  onPhotoCaptured,
  initialPhotoUrl = '',
  riderPhone = '',
}) => {
  const [photoUrl, setPhotoUrl] = useState<string>(initialPhotoUrl);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isFlashing, setIsFlashing] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const nativeCameraInputRef = useRef<HTMLInputElement>(null);

  // Start live webcam stream with mobile-safe progressive fallbacks
  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access not supported on this device/browser.');
      }

      let stream: MediaStream | null = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 640 } },
          audio: false,
        });
      } catch (err1) {
        try {
          // Fallback 1: user facing mode without dimensional constraints
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'user' },
            audio: false,
          });
        } catch (err2) {
          // Fallback 2: any available camera
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
        }
      }

      if (!stream) {
        throw new Error('Could not acquire video stream.');
      }

      streamRef.current = stream;
      setIsStreaming(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.setAttribute('webkit-playsinline', 'true');
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch((e) => console.warn('Video play error:', e));
        };
        videoRef.current.play().catch(() => {});
      }
    } catch (err: any) {
      console.warn('Camera access error:', err);
      setCameraError('Unable to open live camera. You can snap a photo with your mobile camera or upload from gallery.');
      setIsStreaming(false);
    }
  };

  // Sync stream to video element whenever videoRef or stream changes
  useEffect(() => {
    if (isStreaming && streamRef.current && videoRef.current) {
      if (videoRef.current.srcObject !== streamRef.current) {
        videoRef.current.srcObject = streamRef.current;
        videoRef.current.play().catch(() => {});
      }
    }
  }, [isStreaming]);

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

  // Capture snapshot from video to canvas & upload to Supabase Storage
  const handleCapture = async () => {
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

      // Upload to Supabase Storage
      setIsUploading(true);
      const cleanPhone = (riderPhone || '').replace(/[^0-9]/g, '').slice(-10);
      const selfiePath = cleanPhone
        ? `selfies/${cleanPhone}/selfie_${Date.now()}.jpg`
        : `selfies/selfie_${Date.now()}.jpg`;

      const uploadedUrl = await uploadFileToSupabaseStorage(dataUrl, 'rider-documents', selfiePath);
      setIsUploading(false);

      onPhotoCaptured(uploadedUrl || dataUrl);
    }
  };

  // Retake photo
  const handleRetake = () => {
    setPhotoUrl('');
    startCamera();
  };

  // Handle fallback file upload or native camera capture
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const localUrl = URL.createObjectURL(file);
      setPhotoUrl(localUrl);
      stopCamera();

      setIsUploading(true);
      const cleanPhone = (riderPhone || '').replace(/[^0-9]/g, '').slice(-10);
      const cleanFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const selfiePath = cleanPhone
        ? `selfies/${cleanPhone}/selfie_${Date.now()}_${cleanFileName}`
        : `selfies/selfie_${Date.now()}_${cleanFileName}`;

      const uploadedUrl = await uploadFileToSupabaseStorage(file, 'rider-documents', selfiePath);
      setIsUploading(false);

      onPhotoCaptured(uploadedUrl || localUrl);
    }
  };

  // Use default verified sample selfie
  const useSampleSelfie = async () => {
    const sample =
      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400';
    setPhotoUrl(sample);
    stopCamera();
    onPhotoCaptured(sample);
  };

  return (
    <div className="flex flex-col items-center w-full max-w-sm mx-auto">
      {/* Hidden canvas for taking snapshot */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Hidden native camera input for direct mobile shutter capture */}
      <input
        ref={nativeCameraInputRef}
        type="file"
        accept="image/*"
        capture="user"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Screen Container */}
      <div className="relative w-full aspect-square max-w-[320px] rounded-3xl overflow-hidden bg-slate-950 border-4 border-slate-800 shadow-2xl flex items-center justify-center">
        {/* Flash Effect */}
        {isFlashing && <div className="absolute inset-0 bg-white z-50 animate-fade-in" />}

        {/* Video element is permanently mounted in DOM and laid out with physical dimensions so mobile browsers decode frames reliably */}
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          className={`absolute inset-0 w-full h-full object-cover transform -scale-x-100 transition-opacity duration-300 ${
            isStreaming && !photoUrl ? 'opacity-100 z-10' : 'opacity-0 pointer-events-none z-0'
          }`}
        />

        {photoUrl ? (
          /* Preview Mode */
          <div className="relative z-20 w-full h-full animate-scale-up">
            <img src={photoUrl} alt="Captured Selfie" className="w-full h-full object-cover" />
            <div className="absolute top-3 right-3 bg-emerald-600 text-white text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-md">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Selfie Captured</span>
            </div>
          </div>
        ) : isStreaming ? (
          /* Live Stream Overlays */
          <div className="relative z-20 w-full h-full pointer-events-none">
            {/* Facial Alignment Guide Oval */}
            <div className="absolute inset-0 flex items-center justify-center p-6">
              <div className="w-[180px] h-[230px] rounded-[50%] border-2 border-dashed border-primary shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] animate-pulse" />
            </div>

            <div className="absolute bottom-3 left-0 right-0 text-center">
              <span className="text-[11px] font-bold text-white bg-black/60 px-3 py-1 rounded-full backdrop-blur-sm">
                Position your face inside the oval
              </span>
            </div>
          </div>
        ) : (
          /* Camera Error / Standby Mode */
          <div className="relative z-20 flex flex-col items-center justify-center p-6 text-center text-slate-300 space-y-2">
            <Camera className="w-12 h-12 text-slate-500 mb-1" />
            <p className="text-xs text-slate-400 max-w-[220px] leading-relaxed">
              {cameraError || 'Camera initializing...'}
            </p>
            <div className="flex flex-col gap-2 pt-1 w-full max-w-[200px]">
              <button
                type="button"
                onClick={startCamera}
                className="text-xs font-bold text-primary bg-primary/20 hover:bg-primary/30 px-3 py-2 rounded-xl transition-colors cursor-pointer"
              >
                Retry Live Camera
              </button>
              <button
                type="button"
                onClick={() => nativeCameraInputRef.current?.click()}
                className="text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 px-3 py-2 rounded-xl transition-colors cursor-pointer shadow-sm"
              >
                📸 Open Device Camera
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Controls & Actions */}
      <div className="w-full mt-5 flex flex-col items-center gap-3">
        {photoUrl ? (
          /* When photo is captured */
          <div className="flex gap-3 w-full">
            <button
              onClick={handleRetake}
              className="flex-1 py-3.5 bg-white border border-slate-300 text-on-surface font-bold text-xs rounded-2xl hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Retake Photo</span>
            </button>
          </div>
        ) : (
          /* Live Capture Controls */
          <div className="flex flex-col items-center gap-2.5 w-full">
            <div className="flex items-center gap-4">
              <button
                onClick={handleCapture}
                disabled={!isStreaming}
                className="w-16 h-16 rounded-full bg-white border-4 border-primary shadow-lift hover:scale-105 active:scale-95 transition-transform flex items-center justify-center p-1.5 disabled:opacity-40 disabled:scale-100 cursor-pointer"
              >
                <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white">
                  <Camera className="w-5 h-5" />
                </div>
              </button>
            </div>
            <span className="text-xs font-bold text-secondary">Tap shutter to capture</span>
          </div>
        )}

        {/* Fallback Upload & Sample Buttons */}
        {!photoUrl && (
          <div className="flex items-center justify-center gap-3 pt-1 text-[11px] font-semibold text-primary">
            <button
              type="button"
              onClick={() => nativeCameraInputRef.current?.click()}
              className="hover:underline flex items-center gap-1 cursor-pointer text-emerald-700"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Take with Camera</span>
            </button>

            <span className="text-slate-300">•</span>

            <label className="cursor-pointer hover:underline flex items-center gap-1">
              <Upload className="w-3.5 h-3.5" />
              <span>Gallery</span>
              <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
            </label>

            <span className="text-slate-300">•</span>

            <button
              type="button"
              onClick={useSampleSelfie}
              className="text-secondary hover:text-primary flex items-center gap-1 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Sample</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
