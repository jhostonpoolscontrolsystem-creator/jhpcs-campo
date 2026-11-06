'use client';

import React, { useState } from 'react';
import { 
  Sparkles, 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  ShieldCheck, 
  Maximize2, 
  RefreshCw, 
  Eye, 
  ArrowRight,
  Droplets,
  Layers
} from 'lucide-react';
import { SurfaceAnalysisResult } from '@/app/api/ai/surface-inspection/route';

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
  currentPh = 7.4
}: SurfaceAiInspectorModalProps) {
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<SurfaceAnalysisResult | null>(null);

  if (!isOpen) return null;

  const handleStartAnalysis = async () => {
    setAnalyzing(true);

    try {
      const res = await fetch('/api/ai/surface-inspection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_base64: imageUrl || 'data:image/jpeg;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
          current_ph: currentPh
        })
      });

      const json = await res.json();
      setTimeout(() => {
        setAnalysisResult(json.data);
        setAnalyzing(false);
      }, 1400);
    } catch (e) {
      setAnalyzing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-slate-950 border border-cyan-500/40 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl shadow-cyan-950/80 flex flex-col max-h-[92vh]">
        {/* HEADER */}
        <div className="p-5 bg-gradient-to-r from-slate-900 via-slate-950 to-cyan-950 border-b border-cyan-500/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-cyan-500/10 border border-cyan-500/30 rounded-2xl text-cyan-400">
              <Eye className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-black text-cyan-400 uppercase tracking-widest block">
                FASE 2 • IA MULTIMODAL & SCANNER MINERAL
              </span>
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                Auditoria Óptica de Superfície & Eflorescência
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl bg-slate-900 hover:bg-slate-800 transition"
          >
            ✕
          </button>
        </div>

        {/* BODY */}
        <div className="p-5 overflow-y-auto space-y-5">
          <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-3">
            <span>Piscina Analisada: <strong className="text-white">{poolName}</strong></span>
            <span>pH Atual no PWA: <strong className={currentPh < 7.0 ? 'text-rose-400 font-mono' : 'text-emerald-400 font-mono'}>{currentPh.toFixed(1)}</strong></span>
          </div>

          {/* Comparativo Visual da Foto Panorâmica */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase block">Fotografia da Evidência</span>
              <div className="rounded-2xl border border-slate-800 overflow-hidden bg-black aspect-video relative flex items-center justify-center">
                {imageUrl ? (
                  <img src={imageUrl} alt="Evidência da piscina" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center p-4 text-slate-500 text-xs">
                    <Droplets className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <span>Foto Panorâmica Registrada pelo Tratador</span>
                  </div>
                )}
                {/* HUD Scan Overlay */}
                <div className="absolute inset-0 border border-cyan-500/30 rounded-2xl pointer-events-none" />
              </div>
            </div>

            {/* Painel do Diagnóstico de IA */}
            <div className="space-y-3">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase block">Diagnóstico de Inteligência Artificial</span>

              {!analysisResult && !analyzing && (
                <div className="h-[180px] rounded-2xl border-2 border-dashed border-slate-800 bg-slate-900/40 p-4 flex flex-col items-center justify-center text-center space-y-3">
                  <Sparkles className="w-8 h-8 text-cyan-400" />
                  <p className="text-xs text-slate-300 max-w-xs">
                    Clique no botão abaixo para processar a textura do monólito e detectar se há desgaste ácido ou eflorescência cálcica.
                  </p>
                  <button
                    onClick={handleStartAnalysis}
                    className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs shadow-md shadow-cyan-500/20 transition cursor-pointer"
                  >
                    Executar Auditoria de IA
                  </button>
                </div>
              )}

              {analyzing && (
                <div className="h-[180px] rounded-2xl border border-cyan-500/30 bg-slate-900/60 p-4 flex flex-col items-center justify-center text-center space-y-2">
                  <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
                  <span className="text-xs font-bold text-white">Segmentando Textura & Matriz Mineral...</span>
                  <span className="text-[10px] font-mono text-slate-400">Verificando pontos de micro-cavitação por pH</span>
                </div>
              )}

              {analysisResult && (
                <div className="space-y-3 bg-slate-900/80 p-4 rounded-2xl border border-slate-800 text-xs animate-in fade-in">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Transparência:</span>
                    <strong className="text-emerald-400 font-mono">{analysisResult.water_clarity}</strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Risco de Eflorescência:</span>
                    <strong className={analysisResult.mineral_efflorescence_risk === 'CRITICO' ? 'text-rose-400' : 'text-emerald-400'}>
                      {analysisResult.mineral_efflorescence_risk}
                    </strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Brilho da Resina:</span>
                    <strong className="text-cyan-400">{analysisResult.resin_gloss_level}</strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Confiança do Laudo:</span>
                    <strong className="text-slate-200 font-mono">{(analysisResult.confidence * 100).toFixed(1)}%</strong>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* PARECER FINAL & RECOMENDAÇÃO DE ENGENHARIA */}
          {analysisResult && (
            <div className="p-4 rounded-2xl bg-slate-900 border border-cyan-500/30 space-y-3 text-xs">
              <div className="flex items-center gap-2 text-cyan-400 font-bold">
                <ShieldCheck className="w-4 h-4" />
                <span>Parecer Técnico do Perito Digital JHostonTec</span>
              </div>
              <p className="text-slate-300 leading-relaxed bg-slate-950 p-3 rounded-xl border border-slate-800">
                {analysisResult.prescribed_action}
              </p>
              <div className="text-[11px] text-amber-300 font-mono bg-amber-500/10 p-2.5 rounded-lg border border-amber-500/20">
                {analysisResult.golden_rules_reminder}
              </div>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white transition"
          >
            Fechar Auditoria
          </button>

          {analysisResult && (
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-cyan-500 text-slate-950 font-black text-xs flex items-center gap-2 hover:scale-105 transition"
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
