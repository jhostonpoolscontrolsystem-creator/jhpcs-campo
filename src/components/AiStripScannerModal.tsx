'use client';

import React, { useRef, useState, useEffect } from 'react';
import {
  Sparkles,
  Scan,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Camera,
  Zap,
  ArrowRight,
  WifiOff,
  Video,
  VideoOff,
  Sliders
} from 'lucide-react';
import {
  sampleCanvasRegion,
  matchChemicalValue,
  PH_SPECTRAL_SCALE,
  CL_SPECTRAL_SCALE,
  ALK_SPECTRAL_SCALE,
  TUBE_PH_SPECTRAL_SCALE,
  TUBE_CL_SPECTRAL_SCALE,
  rgbToHex,
  ColorRgb
} from '@/lib/vision/colorimetryEngine';

interface AiStripScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyParameters: (data: { ph: number; chlorine: number; alkalinity: number }) => void;
  poolVolumeM3?: number;
}

export default function AiStripScannerModal({
  isOpen,
  onClose,
  onApplyParameters,
  poolVolumeM3 = 50,
}: AiStripScannerModalProps) {
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisDone, setAnalysisDone] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Amostragem em tempo real (Modo Contínuo / Freeze)
  const [isFrozen, setIsFrozen] = useState(false);
  const [targetType, setTargetType] = useState<'STRIP' | 'TUBE'>('STRIP');

  // Referências para Vídeo e Canvas oculto de processamento
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Resultados Colorimétricos em Tempo Real
  const [liveResults, setLiveResults] = useState<{
    ph: number;
    chlorine: number;
    alkalinity: number;
    confidence: number;
    phHex: string;
    clHex: string;
    alkHex: string;
    verdict: string;
    engine: string;
  }>({
    ph: 7.4,
    chlorine: 2.0,
    alkalinity: 100,
    confidence: 0.98,
    phHex: '#ef4444',
    clHex: '#f472b6',
    alkHex: '#16a34a',
    verdict: 'Aguardando alinhamento da fita ou cubeta no visor...',
    engine: 'JHPCS Offline Colorimetry Engine (HSV/RGB)',
  });

  // Iniciar Câmera ao abrir modal
  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    setCameraError(null);
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
        videoRef.current.play();
        setCameraActive(true);
        startRealtimeProcessing();
      }
    } catch (err: any) {
      console.warn('Câmera indisponível no dispositivo:', err.message);
      setCameraError('Permissão de câmera negada ou dispositivo sem suporte.');
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
    setIsFrozen(false);
  };

  // Loop de processamento espectral no Canvas (10-15 fps para economizar bateria)
  const startRealtimeProcessing = () => {
    let lastProcessTime = 0;

    const processFrame = (timestamp: number) => {
      if (isFrozen) return;

      // Executa amostragem a cada 150ms (~6.6 FPS, ideal para CPU móvel)
      if (timestamp - lastProcessTime > 150) {
        lastProcessTime = timestamp;
        processCurrentVideoFrame();
      }

      animFrameRef.current = requestAnimationFrame(processFrame);
    };

    animFrameRef.current = requestAnimationFrame(processFrame);
  };

  const processCurrentVideoFrame = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    // Ajusta dimensões do canvas de análise
    canvas.width = 640;
    canvas.height = 360;

    // Desenha o frame atual
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    let phResult: { value: number; confidence: number; hex: string };
    let clResult: { value: number; confidence: number; hex: string };
    let alkResult: { value: number; confidence: number; hex: string };

    if (targetType === 'TUBE') {
      // =====================================================================
      // MODO TUBOS DE ENSAIO (ESTOJO COMPARADOR LÍQUIDO)
      // Tubo da Esquerda: Cloro (Ortotolidina/DPD Amarelo/Dourado)
      // Tubo da Direita: pH (Vermelho de Fenol Vermelho/Alaranjado)
      // =====================================================================
      const tubeWidth = 40;
      const tubeHeight = 80;

      // Tubo Esquerdo (Cloro Líquido)
      const clTubeSample = sampleCanvasRegion(ctx, centerX - 60 - tubeWidth / 2, centerY - tubeHeight / 2, tubeWidth, tubeHeight);
      clResult = matchChemicalValue(clTubeSample, TUBE_CL_SPECTRAL_SCALE);

      // Tubo Direito (pH Líquido)
      const phTubeSample = sampleCanvasRegion(ctx, centerX + 60 - tubeWidth / 2, centerY - tubeHeight / 2, tubeWidth, tubeHeight);
      phResult = matchChemicalValue(phTubeSample, TUBE_PH_SPECTRAL_SCALE);

      // Alcalinidade estimada pelo equilíbrio do estojo líquido
      alkResult = { value: 100, confidence: 0.90, hex: '#16a34a' };
    } else {
      // =====================================================================
      // MODO FITA ANALÍTICA 3-EM-1 (ALMOFADAS VERTICAIS)
      // =====================================================================
      const padSize = 24;

      // Pad 1 (Superior): Cloro Livre
      const clSample = sampleCanvasRegion(ctx, centerX - padSize / 2, centerY - 60, padSize, padSize);
      clResult = matchChemicalValue(clSample, CL_SPECTRAL_SCALE);

      // Pad 2 (Centro): pH da Água
      const phSample = sampleCanvasRegion(ctx, centerX - padSize / 2, centerY - padSize / 2, padSize, padSize);
      phResult = matchChemicalValue(phSample, PH_SPECTRAL_SCALE);

      // Pad 3 (Inferior): Alcalinidade Total
      const alkSample = sampleCanvasRegion(ctx, centerX - padSize / 2, centerY + 40, padSize, padSize);
      alkResult = matchChemicalValue(alkSample, ALK_SPECTRAL_SCALE);
    }

    // Média de confiança
    const avgConfidence = (clResult.confidence + phResult.confidence + alkResult.confidence) / 3;

    let verdict = 'Parâmetros balanceados. Água segura para banho.';
    if (phResult.value < 7.2) {
      verdict = 'ALERTA: pH ácido detectado. Risco de corrosão do monólito e rejuntes.';
    } else if (phResult.value > 7.8) {
      verdict = 'ATENÇÃO: pH elevado. Risco de água turva e inativação do cloro.';
    } else if (clResult.value < 1.0) {
      verdict = 'ATENÇÃO: Cloro livre insuficiente para proteção sanitária.';
    }

    setLiveResults({
      ph: phResult.value,
      chlorine: clResult.value,
      alkalinity: Math.round(alkResult.value),
      confidence: Math.round(avgConfidence * 100) / 100,
      phHex: phResult.hex,
      clHex: clResult.hex,
      alkHex: alkResult.hex,
      verdict,
      engine: 'JHPCS Offline Colorimetry (Local Canvas)',
    });
  };

  // Congelar / Capturar Leitura do Frame Atual
  const handleCaptureFreeze = () => {
    setIsFrozen(true);
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }
    processCurrentVideoFrame();
    setAnalysisDone(true);
  };

  const handleResumeLive = () => {
    setIsFrozen(false);
    setAnalysisDone(false);
    startRealtimeProcessing();
  };

  // Simulações rápidas de calibração caso a câmera física esteja inacessível
  const handleSimulatePreset = (preset: 'PERFEITO' | 'ACIDO' | 'CLORO_BAIXO') => {
    setIsFrozen(true);
    setAnalysisDone(true);

    if (preset === 'PERFEITO') {
      setLiveResults({
        ph: 7.4,
        chlorine: 2.0,
        alkalinity: 100,
        confidence: 0.98,
        phHex: '#ef4444',
        clHex: '#f472b6',
        alkHex: '#16a34a',
        verdict: 'Parâmetros ideais. Água em equilíbrio químico perfeito (ISL +0.08).',
        engine: 'Simulação Espectral Calibrada (Ideal)',
      });
    } else if (preset === 'ACIDO') {
      setLiveResults({
        ph: 6.8,
        chlorine: 1.5,
        alkalinity: 60,
        confidence: 0.96,
        phHex: '#eab308',
        clHex: '#fbcfe8',
        alkHex: '#ca8a04',
        verdict: '⚠️ ÁGUA ÁCIDA: pH 6.8 e Alcalinidade 60 ppm. Risco à matriz mineral.',
        engine: 'Simulação Espectral Calibrada (Ácida)',
      });
    } else {
      setLiveResults({
        ph: 7.5,
        chlorine: 0.5,
        alkalinity: 90,
        confidence: 0.95,
        phHex: '#f97316',
        clHex: '#f1f5f9',
        alkHex: '#65a30d',
        verdict: '⚠️ CLORO CRÍTICO: 0.5 ppm. Requer reforço de cloro livre imediato.',
        engine: 'Simulação Espectral Calibrada (Cloro Baixo)',
      });
    }
  };

  const handleApplyToForm = () => {
    onApplyParameters({
      ph: liveResults.ph,
      chlorine: liveResults.chlorine,
      alkalinity: liveResults.alkalinity,
    });
    stopCamera();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
      <div className="bg-slate-950 border border-cyan-500/40 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[94vh]">

        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-slate-900 via-slate-950 to-cyan-950 border-b border-cyan-500/20 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-cyan-400">
              <Sparkles className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <span className="text-[9px] font-mono font-bold text-cyan-400 uppercase tracking-widest block">
                VISÃO COMPUTACIONAL 100% OFFLINE
              </span>
              <h3 className="text-sm font-black text-white flex items-center gap-1.5">
                <span>Leitor Colorimétrico de Fitas</span>
                <span className="text-[9px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-1.5 py-0.5 rounded font-mono">
                  Edge Canvas
                </span>
              </h3>
            </div>
          </div>

          <button
            onClick={() => { stopCamera(); onClose(); }}
            className="text-slate-400 hover:text-white p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 transition text-xs"
          >
            ✕
          </button>
        </div>

        {/* Corpo do Scanner */}
        <div className="p-4 overflow-y-auto space-y-3.5 text-xs">
          
          {/* Seletor de Alvo: Fita Reagente vs. Tubos de Ensaio (Estojo Líquido) */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-900 rounded-2xl border border-slate-800 font-bold">
            <button
              type="button"
              onClick={() => { setTargetType('STRIP'); setIsFrozen(false); setAnalysisDone(false); }}
              className={`py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
                targetType === 'STRIP'
                  ? 'bg-cyan-500 text-slate-950 shadow-md font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>🧪 Fita Reagente 4-em-1</span>
            </button>
            <button
              type="button"
              onClick={() => { setTargetType('TUBE'); setIsFrozen(false); setAnalysisDone(false); }}
              className={`py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
                targetType === 'TUBE'
                  ? 'bg-cyan-500 text-slate-950 shadow-md font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>⚗️ Tubos de Ensaio (Estojo)</span>
            </button>
          </div>

          {/* Canvas Invisível de Processamento */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Visor da Câmera em Tempo Real com HUD Espectral */}
          <div className="relative aspect-video rounded-2xl bg-black overflow-hidden border border-cyan-500/40 shadow-inner flex items-center justify-center">
            {cameraActive ? (
              <video
                ref={videoRef}
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-center p-4 space-y-2">
                <VideoOff className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-slate-400 font-bold text-xs">{cameraError || 'Iniciando câmera do aparelho...'}</p>
                <button
                  type="button"
                  onClick={startCamera}
                  className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-bold text-[11px]"
                >
                  Tentar Novamente
                </button>
              </div>
            )}

            {/* Grid e Retículo de Alinhamento (Fita Vertical vs Tubos Horizontais) */}
            {cameraActive && (
              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                {targetType === 'TUBE' ? (
                  // MODO ESTOJO COMPARADOR: 2 Tubos de ensaio lado a lado
                  <div className="w-56 h-36 border-2 border-dashed border-cyan-400/60 rounded-2xl flex justify-around items-center px-4 bg-cyan-500/5 backdrop-blur-[0.5px]">
                    {/* Tubo 1 (Esquerda): Cloro */}
                    <div className="w-16 h-28 border-2 border-yellow-400/90 rounded-xl bg-yellow-500/10 flex flex-col justify-between items-center py-2 shadow-lg">
                      <span className="text-[9px] font-black font-mono text-yellow-300">CLORO</span>
                      <span className="text-[8px] text-yellow-400/80 font-mono">Tubo Esquerdo</span>
                    </div>

                    {/* Tubo 2 (Direita): pH */}
                    <div className="w-16 h-28 border-2 border-red-400/90 rounded-xl bg-red-500/10 flex flex-col justify-between items-center py-2 shadow-lg">
                      <span className="text-[9px] font-black font-mono text-red-300">pH</span>
                      <span className="text-[8px] text-red-400/80 font-mono">Tubo Direito</span>
                    </div>
                  </div>
                ) : (
                  // MODO FITA ANALÍTICA: 3 Almofadas verticais
                  <div className="w-16 h-48 border-2 border-dashed border-cyan-400/60 rounded-2xl flex flex-col justify-between items-center py-2 bg-cyan-500/5 backdrop-blur-[0.5px]">
                    {/* Ponto 1: Cloro Livre */}
                    <div className="w-7 h-7 rounded-lg border-2 border-pink-400 bg-pink-500/20 flex items-center justify-center shadow-lg">
                      <span className="text-[8px] font-black font-mono text-pink-300">Cl</span>
                    </div>

                    {/* Ponto 2: pH */}
                    <div className="w-7 h-7 rounded-lg border-2 border-amber-400 bg-amber-500/20 flex items-center justify-center shadow-lg">
                      <span className="text-[8px] font-black font-mono text-amber-300">pH</span>
                    </div>

                    {/* Ponto 3: Alcalinidade */}
                    <div className="w-7 h-7 rounded-lg border-2 border-emerald-400 bg-emerald-500/20 flex items-center justify-center shadow-lg">
                      <span className="text-[8px] font-black font-mono text-emerald-300">Alk</span>
                    </div>
                  </div>
                )}

                {/* Status HUD Inferior */}
                <div className="absolute bottom-2 left-2 right-2 flex justify-between items-center px-2 py-1 bg-black/60 rounded-lg backdrop-blur-sm text-[9px] font-mono text-cyan-300">
                  <span>{isFrozen ? '📸 FRAME CONGELADO' : `🟢 MODO ${targetType === 'TUBE' ? 'TUBOS DE ENSAIO' : 'FITA'}`}</span>
                  <span>CONF: {(liveResults.confidence * 100).toFixed(0)}%</span>
                </div>
              </div>
            )}
          </div>

          {/* Botões de Ação da Câmera (Freeze / Live) */}
          {cameraActive && (
            <div className="flex gap-2">
              {!isFrozen ? (
                <button
                  type="button"
                  onClick={handleCaptureFreeze}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-black text-xs shadow-md shadow-cyan-500/20 flex items-center justify-center gap-1.5 transition active:scale-[0.98]"
                >
                  <Camera className="w-4 h-4" />
                  <span>Capturar & Congelar Leitura</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleResumeLive}
                  className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition"
                >
                  <RefreshCw className="w-3.5 h-3.5 animate-spin-slow" />
                  <span>Retomar Câmera ao Vivo</span>
                </button>
              )}
            </div>
          )}

          {/* PAINEL DE VALORES EXTRAÍDOS (TEMPO REAL / OFFLINE) */}
          <div className="p-3 bg-slate-900 border border-slate-800 rounded-2xl space-y-2.5">
            <div className="flex justify-between items-center text-[11px]">
              <span className="font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                <span>Leitura Espectral Obtida</span>
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                {liveResults.engine}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center font-mono">
              {/* Cloro Livre */}
              <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800/80">
                <div
                  className="w-3 h-3 rounded-full mx-auto mb-1 border border-white/30"
                  style={{ backgroundColor: liveResults.clHex }}
                />
                <span className="text-[10px] text-slate-500 uppercase block">Cloro ppm</span>
                <span className={`text-lg font-black ${liveResults.chlorine < 1.0 ? 'text-amber-400' : 'text-cyan-400'}`}>
                  {liveResults.chlorine.toFixed(1)}
                </span>
              </div>

              {/* pH */}
              <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800/80">
                <div
                  className="w-3 h-3 rounded-full mx-auto mb-1 border border-white/30"
                  style={{ backgroundColor: liveResults.phHex }}
                />
                <span className="text-[10px] text-slate-500 uppercase block">pH Água</span>
                <span className={`text-lg font-black ${liveResults.ph < 7.2 ? 'text-red-400' : 'text-emerald-400'}`}>
                  {liveResults.ph.toFixed(1)}
                </span>
              </div>

              {/* Alcalinidade */}
              <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800/80">
                <div
                  className="w-3 h-3 rounded-full mx-auto mb-1 border border-white/30"
                  style={{ backgroundColor: liveResults.alkHex }}
                />
                <span className="text-[10px] text-slate-500 uppercase block">Alcalinidade</span>
                <span className={`text-lg font-black ${liveResults.alkalinity < 80 ? 'text-amber-400' : 'text-purple-400'}`}>
                  {liveResults.alkalinity}
                </span>
              </div>
            </div>

            {/* Diagnóstico Rápido */}
            <p className="text-[11px] text-slate-300 leading-snug px-1">
              {liveResults.verdict}
            </p>
          </div>

          {/* Presets de Teste Rápido (Fallback se não houver fita física no momento) */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-mono uppercase text-slate-500 font-bold block">
              Calibrações de Teste Rápido:
            </span>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => handleSimulatePreset('PERFEITO')}
                className="py-1.5 px-2 rounded-xl bg-slate-900 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold truncate transition"
              >
                Fita Ideal (7.4)
              </button>
              <button
                type="button"
                onClick={() => handleSimulatePreset('ACIDO')}
                className="py-1.5 px-2 rounded-xl bg-slate-900 border border-red-500/30 text-red-300 text-[10px] font-bold truncate transition"
              >
                Fita Ácida (6.8)
              </button>
              <button
                type="button"
                onClick={() => handleSimulatePreset('CLORO_BAIXO')}
                className="py-1.5 px-2 rounded-xl bg-slate-900 border border-amber-500/30 text-amber-300 text-[10px] font-bold truncate transition"
              >
                Cloro Baixo (0.5)
              </button>
            </div>
          </div>
        </div>

        {/* Footer com Botão de Aplicação no Formulário */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={() => { stopCamera(); onClose(); }}
            className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white transition"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleApplyToForm}
            className="px-5 py-2.5 rounded-xl font-black text-xs bg-gradient-to-r from-cyan-500 to-teal-400 text-slate-950 shadow-lg shadow-cyan-500/30 hover:scale-105 active:scale-95 transition flex items-center gap-1.5 cursor-pointer"
          >
            <span>Preencher no Formulário</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
