'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  ShieldCheck, 
  RefreshCw, 
  Eye, 
  ArrowRight,
  Layers,
  Cpu,
  WifiOff,
  Sliders,
  Check
} from 'lucide-react';
import { SurfaceAnalysisResult } from '@/app/api/ai/surface-inspection/route';
import { analyzeSurfaceAndGroutEdge, GroutCrackDetectionResult } from '@/lib/vision/edgeSurfaceInspector';

interface SurfaceAiInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string | null;
  poolName: string;
  currentPh?: number;
}

export default function SurfaceAiInspectorModal({
  isOpen,
  onClose,
  imageUrl,
  poolName,
  currentPh = 7.4,
}: SurfaceAiInspectorModalProps) {
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisMode, setAnalysisMode] = useState<'EDGE_LOCAL' | 'REMOTE_AI'>('EDGE_LOCAL');
  const [edgeResult, setEdgeResult] = useState<GroutCrackDetectionResult | null>(null);
  const [remoteResult, setRemoteResult] = useState<SurfaceAnalysisResult | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setEdgeResult(null);
      setRemoteResult(null);
      setAnalyzing(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Processamento 100% Offline no Edge via Canvas e Convolução Sobel
  const handleStartEdgeAnalysis = () => {
    setAnalyzing(true);
    setEdgeResult(null);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageUrl || '/mock-pool.jpg';

    img.onload = () => {
      const canvas = canvasRef.current || document.createElement('canvas');
      canvas.width = Math.min(800, img.width || 640);
      canvas.height = Math.round(canvas.width * ((img.height || 360) / (img.width || 640)));

      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (ctx) {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const result = analyzeSurfaceAndGroutEdge(canvas);

        setTimeout(() => {
          setEdgeResult(result);
          setAnalyzing(false);
        }, 600);
      } else {
        setAnalyzing(false);
      }
    };

    img.onerror = () => {
      // Fallback com canvas simulado para testes rápidos em ambiente de desenvolvimento
      const canvas = canvasRef.current || document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 300;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, 400, 300);
        // Desenha linhas simulando rejunte com microfissuras
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(50, 150);
        ctx.lineTo(350, 150);
        ctx.stroke();

        const result = analyzeSurfaceAndGroutEdge(canvas);
        setTimeout(() => {
          setEdgeResult(result);
          setAnalyzing(false);
        }, 500);
      } else {
        setAnalyzing(false);
      }
    };
  };

  // Execução Remota via API (quando houver sinal de internet)
  const handleStartRemoteAnalysis = async () => {
    setAnalyzing(true);
    setRemoteResult(null);

    try {
      const res = await fetch('/api/ai/surface-inspection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_base64: imageUrl || 'data:image/jpeg;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
          current_ph: currentPh,
        }),
      });

      const json = await res.json();
      setTimeout(() => {
        setRemoteResult(json.data);
        setAnalyzing(false);
      }, 1200);
    } catch (e) {
      setAnalyzing(false);
      // Se falhar a rede, faz fallback automático para o motor de Edge
      handleStartEdgeAnalysis();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
      <div className="bg-slate-950 border border-cyan-500/40 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        
        {/* Canvas de processamento interno */}
        <canvas ref={canvasRef} className="hidden" />

        {/* HEADER */}
        <div className="p-4 bg-gradient-to-r from-slate-900 via-slate-950 to-cyan-950 border-b border-cyan-500/20 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-cyan-400">
              <Eye className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <span className="text-[9px] font-mono font-bold text-cyan-400 uppercase tracking-widest block">
                VISÃO COMPUTACIONAL NO EDGE • OFFLINE
              </span>
              <h3 className="text-sm font-black text-white flex items-center gap-1.5">
                <span>Auditoria de Rejuntes, Trincas & Eflorescência</span>
                <span className="text-[9px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-1.5 py-0.5 rounded font-mono">
                  Sobel 3x3 Edge
                </span>
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 transition text-xs"
          >
            ✕
          </button>
        </div>

        {/* CORPO DO MODAL */}
        <div className="p-4 overflow-y-auto space-y-4 text-xs">
          
          {/* Seletor de Motor: Edge Offline vs Nuvem Remota */}
          <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-900 rounded-2xl border border-slate-800 font-bold">
            <button
              type="button"
              onClick={() => { setAnalysisMode('EDGE_LOCAL'); setEdgeResult(null); }}
              className={`py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 ${
                analysisMode === 'EDGE_LOCAL'
                  ? 'bg-cyan-500 text-slate-950 shadow-md font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>Edge Local (100% Offline)</span>
            </button>
            <button
              type="button"
              onClick={() => { setAnalysisMode('REMOTE_AI'); setRemoteResult(null); }}
              className={`py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 ${
                analysisMode === 'REMOTE_AI'
                  ? 'bg-cyan-500 text-slate-950 shadow-md font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Nuvem Remota (Gemini)</span>
            </button>
          </div>

          {/* Área da Imagem e Diagnóstico Visual */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
            
            {/* Foto Original ou Anotada com Máscara de Trincas */}
            <div className="aspect-video rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden relative flex items-center justify-center">
              {edgeResult?.annotatedCanvasDataUrl ? (
                <img
                  src={edgeResult.annotatedCanvasDataUrl}
                  alt="Análise de Bordas e Trincas"
                  className="w-full h-full object-cover"
                />
              ) : imageUrl ? (
                <img
                  src={imageUrl}
                  alt="Superfície da piscina"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-center p-4 space-y-1">
                  <Layers className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="text-[11px] text-slate-400">Nenhuma foto panorâmica recente anexada.</p>
                </div>
              )}

              {edgeResult?.crackDetected && (
                <div className="absolute top-2 left-2 bg-red-950/90 border border-red-800 text-red-300 px-2 py-0.5 rounded text-[9px] font-mono font-bold animate-pulse">
                  TRINCAS REALÇADAS (CIANO)
                </div>
              )}
            </div>

            {/* Painel de Ação / Execução */}
            <div className="space-y-2.5">
              {!analyzing && !edgeResult && !remoteResult && (
                <div className="p-4 rounded-2xl border-2 border-dashed border-slate-800 bg-slate-900/60 text-center space-y-2">
                  <Cpu className="w-6 h-6 text-cyan-400 mx-auto" />
                  <p className="text-[11px] text-slate-300">
                    {analysisMode === 'EDGE_LOCAL'
                      ? 'Processa a matriz mineral e rejuntes diretamente no navegador via Convolução Sobel.'
                      : 'Envia o frame da piscina para avaliação espectral na nuvem.'}
                  </p>
                  <button
                    type="button"
                    onClick={analysisMode === 'EDGE_LOCAL' ? handleStartEdgeAnalysis : handleStartRemoteAnalysis}
                    className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs shadow-md shadow-cyan-500/20 transition active:scale-[0.98]"
                  >
                    Iniciar Auditoria {analysisMode === 'EDGE_LOCAL' ? 'no Edge' : 'na Nuvem'}
                  </button>
                </div>
              )}

              {analyzing && (
                <div className="p-5 rounded-2xl border border-cyan-500/30 bg-slate-900/60 text-center space-y-2">
                  <RefreshCw className="w-7 h-7 text-cyan-400 animate-spin mx-auto" />
                  <p className="text-xs font-bold text-white">Analisando Descontinuidade de Matriz...</p>
                  <p className="text-[10px] font-mono text-slate-400">Extraindo gradientes e densidade de bordas</p>
                </div>
              )}

              {/* Resultado do Motor Edge (Offline) */}
              {edgeResult && (
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-2xl space-y-2 font-mono text-[11px]">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Integridade Rejunte:</span>
                    <strong className={edgeResult.crackDetected ? 'text-amber-400' : 'text-emerald-400'}>
                      {edgeResult.groutIntegrityStatus}
                    </strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Densidade de Bordas:</span>
                    <strong className="text-cyan-400">{edgeResult.edgeDensityPercent}%</strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Gravidade:</span>
                    <strong className={edgeResult.severity === 'CRITICA' ? 'text-red-400' : 'text-slate-200'}>
                      {edgeResult.severity}
                    </strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Eflorescência Cálcica:</span>
                    <strong className={edgeResult.efflorescenceDetected ? 'text-amber-400' : 'text-emerald-400'}>
                      {edgeResult.efflorescenceDetected ? 'Detectada' : 'Ausente'}
                    </strong>
                  </div>
                </div>
              )}

              {/* Resultado do Motor Remoto (Nuvem) */}
              {remoteResult && (
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-2xl space-y-2 font-mono text-[11px]">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Clareza da Água:</span>
                    <strong className="text-emerald-400">{remoteResult.water_clarity}</strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Risco Eflorescência:</span>
                    <strong className="text-cyan-400">{remoteResult.mineral_efflorescence_risk}</strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Desgaste Ácido:</span>
                    <strong className="text-slate-200">{remoteResult.resin_gloss_level}</strong>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* PARECER TÉCNICO E RECOMENDAÇÃO DE ENGENHARIA */}
          {edgeResult && (
            <div className="p-3.5 bg-slate-900 border border-cyan-500/30 rounded-2xl space-y-2">
              <div className="flex items-center gap-1.5 text-cyan-400 font-bold text-xs">
                <ShieldCheck className="w-4 h-4" />
                <span>Parecer Pericial Estrutural (Edge Vision)</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-snug">
                {edgeResult.diagnosis}
              </p>
              <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-[10px] text-slate-400 font-mono">
                <strong>Ação Prescrita:</strong> {edgeResult.recommendedAction}
              </div>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white transition"
          >
            Fechar Auditoria
          </button>

          {(edgeResult || remoteResult) && (
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-black text-xs flex items-center gap-1.5 shadow-lg shadow-cyan-500/20 hover:scale-105 active:scale-95 transition cursor-pointer"
            >
              <span>Vincular Laudo ao Prontuário</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
