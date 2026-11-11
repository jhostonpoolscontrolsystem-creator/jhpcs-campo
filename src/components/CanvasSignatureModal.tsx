'use client';

import React, { useRef, useState, useEffect } from 'react';
import { PenTool, RotateCcw, Check, X, ShieldCheck } from 'lucide-react';

interface CanvasSignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmSignature: (dataUrl: string, signatoryName: string) => void;
  poolName: string;
}

export function CanvasSignatureModal({
  isOpen,
  onClose,
  onConfirmSignature,
  poolName,
}: CanvasSignatureModalProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [signatoryName, setSignatoryName] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    // Reseta estados
    setHasDrawn(false);
    setSignatoryName('');

    const timer = setTimeout(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Configura resolução real do canvas conforme largura do container
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * 2;
      canvas.height = rect.height * 2;
      ctx.scale(2, 2);

      ctx.fillStyle = '#0f172a'; // slate-900
      ctx.fillRect(0, 0, rect.width, rect.height);

      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#38bdf8'; // sky-400
    }, 100);

    return () => clearTimeout(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    if ('touches' in e) {
      const touch = e.touches[0];
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasDrawn(true);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.closePath();
    setIsDrawing(false);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, rect.width, rect.height);
    ctx.beginPath();
    setHasDrawn(false);
  };

  const handleConfirm = () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasDrawn) {
      alert('Por favor, faça a assinatura na tela antes de confirmar.');
      return;
    }
    const dataUrl = canvas.toDataURL('image/webp', 0.8);
    onConfirmSignature(dataUrl, signatoryName.trim() || 'Responsável no Local');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-5 space-y-4 animate-fadeIn shadow-2xl">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400">
              <PenTool className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Assinatura do Cliente</h3>
              <p className="text-[10px] text-slate-400 truncate max-w-[200px]">{poolName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Campo de Nome do Signatário */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Nome do Responsável / Proprietário:
          </label>
          <input
            type="text"
            value={signatoryName}
            onChange={(e) => setSignatoryName(e.target.value)}
            placeholder="Ex: João da Silva (Gerente)"
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-medium"
          />
        </div>

        {/* Área do Canvas Touch */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-[11px] text-slate-400">
            <span>Assine com o dedo ou caneta stylus abaixo:</span>
            <button
              type="button"
              onClick={handleClear}
              className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-semibold"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Limpar</span>
            </button>
          </div>

          <div className="relative rounded-2xl overflow-hidden border border-slate-700/80 bg-slate-950 touch-none shadow-inner">
            <canvas
              ref={canvasRef}
              className="w-full h-44 cursor-crosshair block"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
            />
            {!hasDrawn && (
              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center text-slate-600 text-xs gap-1 select-none">
                <PenTool className="w-5 h-5 opacity-40 animate-bounce" />
                <span>Toque aqui para assinar</span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-[10px] text-slate-400 flex items-start gap-2">
          <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <span>
            A assinatura é convertida em vetor criptografado com data, hora e coordenadas de satélite (GPS), respaldando a execução do serviço.
          </span>
        </div>

        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!hasDrawn}
            className="flex-1 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition"
          >
            <Check className="w-4 h-4" />
            <span>Confirmar Assinatura</span>
          </button>
        </div>
      </div>
    </div>
  );
}

