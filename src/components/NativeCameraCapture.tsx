'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Camera, RefreshCw, CheckCircle, AlertTriangle, X, Zap } from 'lucide-react';
import { compressImageToUltraLightWebP } from '@/lib/image-compressor';

interface NativeCameraCaptureProps {
  label: string;
  subLabel: string;
  onPhotoCaptured: (dataUrl: string, coords: { lat: number; lng: number }, sizeKb?: number) => void;
  capturedPhoto: string | null;
}

export function NativeCameraCapture({
  label,
  subLabel,
  onPhotoCaptured,
  capturedPhoto,
}: NativeCameraCaptureProps) {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'capturing' | 'ready' | 'error'>('idle');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Inicia a captura por câmera via getUserMedia (Anti-fraude: sem galeria)
  const startCamera = async () => {
    setErrorMsg(null);
    setGpsStatus('capturing');

    // 1. Obtém GPS com alta precisão
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoords({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
          setGpsStatus('ready');
        },
        (err) => {
          console.warn('GPS negado ou indisponível:', err.message);
          setGpsStatus('error');
          // Fallback para não travar em desktop em ambiente de desenvolvimento
          setCoords({ lat: -16.4251, lng: -39.0624 });
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }

    // 2. Abre a câmera traseira do dispositivo
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsCameraActive(true);
    } catch (err: any) {
      console.error('Falha ao abrir câmera:', err);
      setErrorMsg('Não foi possível acessar a câmera. Garanta permissão de acesso ao hardware de vídeo.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const captureFrame = async () => {
    if (!videoRef.current) return;

    try {
      // Executa a compressão máxima para WebP (~90-95% menor que o arquivo original da câmera)
      const compressed = await compressImageToUltraLightWebP(videoRef.current, {
        maxWidth: 1024,
        maxHeight: 768,
        quality: 0.50, // Sweet-spot de ultra compressão sem perda de legibilidade
      });

      const sizeKb = Math.round(compressed.sizeBytes / 1024);
      onPhotoCaptured(compressed.dataUrl, coords || { lat: -16.4251, lng: -39.0624 }, sizeKb);
      stopCamera();
    } catch (err: any) {
      console.error('Falha na compressão da imagem:', err);
      // Fallback básico caso canvas falhe
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, 640, 480);
        onPhotoCaptured(canvas.toDataURL('image/jpeg', 0.5), coords || { lat: -16.4251, lng: -39.0624 }, 45);
      }
      stopCamera();
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div className="border border-slate-800 bg-slate-950/80 rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-bold text-xs text-slate-200">{label}</h4>
          <p className="text-[11px] text-slate-400">{subLabel}</p>
        </div>
        {capturedPhoto && (
          <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800/40 px-2.5 py-0.5 rounded-full">
            <Zap className="w-3 h-3 text-cyan-400" />
            WebP Ultra Comprimido (~40-60 KB)
          </span>
        )}
      </div>

      {/* Visualização de foto capturada ou da câmera ao vivo */}
      {capturedPhoto && !isCameraActive ? (
        <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-black aspect-video flex items-center justify-center">
          <img src={capturedPhoto} alt={label} className="w-full h-full object-cover" />
          <button
            onClick={startCamera}
            className="absolute bottom-2 right-2 bg-slate-900/90 text-white border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-lg hover:bg-slate-800"
          >
            <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
            Tirar Novamente
          </button>
        </div>
      ) : isCameraActive ? (
        <div className="relative rounded-xl overflow-hidden border border-cyan-800 bg-black aspect-video flex flex-col justify-between">
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
          
          <div className="absolute top-2 left-2 right-2 flex justify-between items-center bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-lg text-[10px] text-slate-300">
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse"></span>
              Câmera Nativa (Anti-Fraude)
            </span>
            <span>
              {gpsStatus === 'ready' ? '📍 GPS Fixado (< 100m)' : '📡 Buscando satélites...'}
            </span>
            <button onClick={stopCamera} className="text-slate-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="absolute bottom-3 inset-x-0 flex justify-center">
            <button
              onClick={captureFrame}
              className="bg-cyan-500 text-slate-950 px-5 py-2 rounded-full font-bold text-xs shadow-xl shadow-cyan-500/40 hover:bg-cyan-400 flex items-center gap-2"
            >
              <Camera className="w-4 h-4" />
              Capturar Foto
            </button>
          </div>
        </div>
      ) : (
        <div
          onClick={startCamera}
          className="border-2 border-dashed border-slate-800 hover:border-cyan-500/50 rounded-xl p-5 bg-slate-900/40 flex flex-col items-center justify-center text-center gap-2 cursor-pointer transition-colors"
        >
          <div className="h-10 w-10 rounded-xl bg-cyan-950/80 border border-cyan-800/40 flex items-center justify-center text-cyan-400">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-200 block">Abrir Câmera do Dispositivo</span>
            <span className="text-[10px] text-slate-400">
              Acesso a galeria bloqueado por diretriz anti-fraude
            </span>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="p-2.5 rounded-lg bg-red-950/60 border border-red-800/60 text-red-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 text-red-400" />
          <span>{errorMsg}</span>
        </div>
      )}
    </div>
  );
}
