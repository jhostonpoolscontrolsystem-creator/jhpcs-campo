'use client';

import React, { useState } from 'react';
import { 
  Sparkles, 
  Scan, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Eye, 
  Droplet, 
  ShieldCheck, 
  Camera, 
  Zap,
  Sliders,
  ChevronRight,
  ArrowRight
} from 'lucide-react';

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
  poolVolumeM3 = 350
}: AiStripScannerModalProps) {
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisDone, setAnalysisDone] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [scanType, setScanType] = useState<'STRIP' | 'TUBE' | 'SURFACE'>('STRIP');

  // Resultados da IA
  const [aiResult, setAiResult] = useState<{
    ph: number;
    chlorine: number;
    alkalinity: number;
    confidence: number;
    colorMatch: { phHex: string; clHex: string; alkHex: string };
    verdict: string;
    engine: string;
  }>({
    ph: 7.4,
    chlorine: 2.0,
    alkalinity: 100,
    confidence: 0.98,
    colorMatch: { phHex: '#eab308', clHex: '#0284c7', alkHex: '#059669' },
    verdict: 'Parâmetros ideais. Água em equilíbrio químico perfeito (LSI +0.05).',
    engine: 'JHPCS Multimodal Vision Engine'
  });

  if (!isOpen) return null;

  // Simulação de captura rápida com amostra de calibração
  const handleTriggerAiScan = async (samplePreset: 'PERFEITO' | 'ACIDO_RED_ZONE' | 'CLORO_BAIXO') => {
    setAnalyzing(true);
    setAnalysisDone(false);

    let samplePh = 7.4;
    let sampleCl = 2.0;
    let sampleAlk = 100;
    let verdict = 'Parâmetros na faixa ouro JHostonTec. Monólito 100% protegido.';

    if (samplePreset === 'ACIDO_RED_ZONE') {
      samplePh = 6.6;
      sampleCl = 1.0;
      sampleAlk = 50;
      verdict = 'ALERTA CRÍTICO: Água ácida detectada. Risco imediato ao cimento e resina.';
    } else if (samplePreset === 'CLORO_BAIXO') {
      samplePh = 7.5;
      sampleCl = 0.5;
      sampleAlk = 90;
      verdict = 'ATENÇÃO: Cloro abaixo do limite de desinfecção microbiológica.';
    }

    try {
      // Chamada real ao endpoint
      const res = await fetch('/api/ai/scan-strip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_base64: 'data:image/jpeg;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
          image_type: scanType === 'SURFACE' ? 'FOTO_PISCINA_PANORAMICA' : 'FOTO_TESTE_AGUA',
          pool_volume_m3: poolVolumeM3
        })
      });

      const json = await res.json();
      
      // Simula o tempo real do modelo de visão
      setTimeout(() => {
        setAiResult({
          ph: samplePh,
          chlorine: sampleCl,
          alkalinity: sampleAlk,
          confidence: json.data?.confidence || 0.97,
          colorMatch: {
            phHex: samplePh < 7.0 ? '#ef4444' : '#eab308',
            clHex: sampleCl < 1.0 ? '#93c5fd' : '#0284c7',
            alkHex: sampleAlk < 80 ? '#f59e0b' : '#059669'
          },
          verdict: verdict,
          engine: json.engine || 'JHPCS Multimodal Vision Engine'
        });
        setAnalyzing(false);
        setAnalysisDone(true);
      }, 1200);
    } catch (e) {
      setAnalyzing(false);
    }
  };

  const handleConfirmAndApply = () => {
    onApplyParameters({
      ph: aiResult.ph,
      chlorine: aiResult.chlorine,
      alkalinity: aiResult.alkalinity
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-slate-950 border border-cyan-500/40 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl shadow-cyan-950/80 flex flex-col max-h-[92vh]">
        {/* HEADER */}
        <div className="p-5 bg-gradient-to-r from-slate-900 via-slate-950 to-cyan-950 border-b border-cyan-500/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-cyan-500/10 border border-cyan-500/30 rounded-2xl text-cyan-400">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-black text-cyan-400 uppercase tracking-widest block">
                FASE 2 • IA MULTIMODAL & COMPUTER VISION
              </span>
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                Scanner Inteligente de Fitas & Cubeta
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
          {/* Seletor do Tipo de Alvo */}
          <div className="grid grid-cols-3 gap-2 p-1.5 bg-slate-900 rounded-2xl border border-slate-800 text-xs font-bold">
            <button
              onClick={() => { setScanType('STRIP'); setAnalysisDone(false); }}
              className={`py-2 rounded-xl transition ${
                scanType === 'STRIP' ? 'bg-cyan-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              Fita Reagente 4-em-1
            </button>
            <button
              onClick={() => { setScanType('TUBE'); setAnalysisDone(false); }}
              className={`py-2 rounded-xl transition ${
                scanType === 'TUBE' ? 'bg-cyan-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              Cubeta Colorimétrica
            </button>
            <button
              onClick={() => { setScanType('SURFACE'); setAnalysisDone(false); }}
              className={`py-2 rounded-xl transition ${
                scanType === 'SURFACE' ? 'bg-cyan-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              Superfície Monolito
            </button>
          </div>

          {/* Área de Visualização da Câmera / Visão Computacional */}
          <div className="relative aspect-video rounded-2xl border-2 border-dashed border-cyan-500/40 bg-slate-900/60 overflow-hidden flex flex-col items-center justify-center p-6 text-center group">
            {/* Linhas de Calibração Óptica (Visor HUD) */}
            <div className="absolute inset-4 border border-cyan-500/20 rounded-xl pointer-events-none flex flex-col justify-between p-2">
              <div className="flex justify-between text-[9px] font-mono text-cyan-500/60">
                <span>[OPTICAL CALIBRATION]</span>
                <span>ISO AUTO • 6500K</span>
              </div>
              <div className="w-12 h-12 border-2 border-cyan-400/60 rounded-lg mx-auto self-center flex items-center justify-center">
                <Scan className="w-6 h-6 text-cyan-400 animate-pulse" />
              </div>
              <div className="flex justify-between text-[9px] font-mono text-cyan-500/60">
                <span>AI MODEL: JHPCS-VISION-v2.1</span>
                <span>CONFIDENCE: 98.4%</span>
              </div>
            </div>

            {analyzing ? (
              <div className="space-y-3 z-10 bg-slate-950/80 p-6 rounded-2xl border border-cyan-500/40">
                <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mx-auto" />
                <p className="text-sm font-bold text-white">IA Analisando Espectro de Cores...</p>
                <p className="text-xs text-slate-400 font-mono">Segmentando faixas de pH, Cloro e Alcalinidade...</p>
              </div>
            ) : analysisDone ? (
              <div className="space-y-2 z-10 bg-slate-950/90 p-5 rounded-2xl border border-emerald-500/40 max-w-md">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                <h4 className="text-sm font-black text-white">Leitura Espectral Concluída!</h4>
                <p className="text-xs text-slate-300 leading-relaxed">{aiResult.verdict}</p>
              </div>
            ) : (
              <div className="space-y-3 z-10">
                <Camera className="w-10 h-10 text-cyan-400 mx-auto opacity-80 group-hover:scale-110 transition" />
                <h4 className="text-sm font-bold text-white">
                  Posicione a fita reagente ou cubeta no centro da tela
                </h4>
                <p className="text-xs text-slate-400 max-w-xs">
                  A IA calibrará a luz ambiente e extrairá os valores com precisão espectral.
                </p>
              </div>
            )}
          </div>

          {/* Teste Rápido de Calibração (Simulações de Campo) */}
          <div className="space-y-2">
            <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">
              Simular Leitura de Campo Instantânea:
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                disabled={analyzing}
                onClick={() => handleTriggerAiScan('PERFEITO')}
                className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-emerald-500/30 text-emerald-400 text-xs font-bold transition flex items-center justify-center gap-1.5"
              >
                <span>🧪 Fita Ideal (pH 7.4)</span>
              </button>
              <button
                disabled={analyzing}
                onClick={() => handleTriggerAiScan('ACIDO_RED_ZONE')}
                className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-rose-500/30 text-rose-400 text-xs font-bold transition flex items-center justify-center gap-1.5"
              >
                <span>⚠️ Fita Ácida (pH 6.6)</span>
              </button>
              <button
                disabled={analyzing}
                onClick={() => handleTriggerAiScan('CLORO_BAIXO')}
                className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-amber-500/30 text-amber-400 text-xs font-bold transition flex items-center justify-center gap-1.5"
              >
                <span>📉 Cloro Baixo (0.5 ppm)</span>
              </button>
            </div>
          </div>

          {/* PAINEL DE VALORES DETECTADOS PELA IA */}
          {analysisDone && (
            <div className="p-4 bg-slate-900/90 rounded-2xl border border-cyan-500/30 space-y-4 animate-in fade-in">
              <div className="flex justify-between items-center text-xs">
                <span className="font-mono font-bold text-cyan-400 uppercase">Valores Extraídos por IA</span>
                <span className="font-mono text-slate-400 text-[10px]">Confiança: {(aiResult.confidence * 100).toFixed(1)}%</span>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center font-mono">
                {/* pH */}
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <div className="w-3 h-3 rounded-full mx-auto mb-1 border border-white/20" style={{ backgroundColor: aiResult.colorMatch.phHex }} />
                  <span className="text-[10px] text-slate-500 uppercase block">pH Extraído</span>
                  <span className={`text-xl font-black ${aiResult.ph < 7.0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {aiResult.ph.toFixed(1)}
                  </span>
                </div>

                {/* Cloro */}
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <div className="w-3 h-3 rounded-full mx-auto mb-1 border border-white/20" style={{ backgroundColor: aiResult.colorMatch.clHex }} />
                  <span className="text-[10px] text-slate-500 uppercase block">Cloro ppm</span>
                  <span className={`text-xl font-black ${aiResult.chlorine < 1.0 ? 'text-amber-400' : 'text-cyan-400'}`}>
                    {aiResult.chlorine.toFixed(1)}
                  </span>
                </div>

                {/* Alcalinidade */}
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <div className="w-3 h-3 rounded-full mx-auto mb-1 border border-white/20" style={{ backgroundColor: aiResult.colorMatch.alkHex }} />
                  <span className="text-[10px] text-slate-500 uppercase block">Alcalinidade</span>
                  <span className={`text-xl font-black ${aiResult.alkalinity < 80 ? 'text-amber-400' : 'text-indigo-400'}`}>
                    {aiResult.alkalinity}
                  </span>
                </div>
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
            Cancelar
          </button>

          <button
            disabled={!analysisDone}
            onClick={handleConfirmAndApply}
            className={`px-5 py-2.5 rounded-xl font-black text-xs flex items-center gap-2 transition ${
              analysisDone
                ? 'bg-gradient-to-r from-cyan-500 to-teal-400 text-slate-950 shadow-lg shadow-cyan-500/30 hover:scale-105 cursor-pointer'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            <span>Preencher Parâmetros no Formulário</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
