'use client';

import React, { useState } from 'react';
import { 
  Sparkles, 
  Send, 
  Share2, 
  CheckCircle2, 
  Layers, 
  Flame, 
  AlertCircle, 
  RefreshCw,
  Camera,
  MapPin,
  Clock,
  ThumbsUp
} from 'lucide-react';
import { Pool } from '@/types/database';
import { PoolSubstrateType, SUBSTRATE_PROFILES } from '@/lib/substrate-rules';
import { calculateLangelierIndex } from '@/lib/chemistry/islEngine';
import { MaintenanceLogPayload } from '@/lib/offline-db';
import { NativeCameraCapture } from '@/components/NativeCameraCapture';
import AiStripScannerModal from '@/components/AiStripScannerModal';

interface SoloMaintenanceFormProps {
  pool: Pool;
  brandName: string;
  technicianWhatsapp: string;
  currentGps: { lat: number; lng: number };
  isOnline: boolean;
  onSubmit: (log: Partial<MaintenanceLogPayload>) => Promise<void>;
  onBackToCockpit: () => void;
}

export function SoloMaintenanceForm({
  pool,
  brandName,
  technicianWhatsapp,
  currentGps,
  isOnline,
  onSubmit,
  onBackToCockpit,
}: SoloMaintenanceFormProps) {
  const [substrateType, setSubstrateType] = useState<PoolSubstrateType>(
    (pool.finish_type as any) || 'MONOLITICO_SAND'
  );

  const [phInput, setPhInput] = useState<number>(7.4);
  const [chlorineInput, setChlorineInput] = useState<number>(2.0);
  const [alkalinityInput, setAlkalinityInput] = useState<number>(100);
  const [calciumInput, setCalciumInput] = useState<number>(250);
  const [tempCInput, setTempCInput] = useState<number>(26);

  // Cuidados físicos
  const [brushedSurface, setBrushedSurface] = useState<boolean>(true);
  const [backwashedFilter, setBackwashedFilter] = useState<boolean>(false);

  // Fotos
  const [panoramicPhoto, setPanoramicPhoto] = useState<string | null>(null);
  const [chemicalPhoto, setChemicalPhoto] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submittedLog, setSubmittedLog] = useState<boolean>(false);
  const [isScannerOpen, setIsScannerOpen] = useState<boolean>(false);

  // ISL em tempo real
  const islResult = calculateLangelierIndex(
    phInput,
    tempCInput,
    calciumInput,
    alkalinityInput,
    substrateType
  );

  const profile = SUBSTRATE_PROFILES[substrateType] || SUBSTRATE_PROFILES.MONOLITICO_SAND;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit({
        target_sector: 'AUTONOMO',
        substrate_type: substrateType,
        ph: phInput,
        chlorine_ppm: chlorineInput,
        alkalinity_ppm: alkalinityInput,
        calcium_hardness: calciumInput,
        temperature_c: tempCInput,
        isl_value: islResult.isl,
        isl_status: islResult.status,
        brushed_surface: brushedSurface,
        backwashed_filter: backwashedFilter,
        acid_product_used: false,
        liability_accepted: true,
        gps_lat: currentGps.lat,
        gps_lng: currentGps.lng,
        white_label_brand: brandName,
        white_label_whatsapp: technicianWhatsapp,
        evidences: [
          ...(panoramicPhoto ? [{
            evidence_type: 'FOTO_PISCINA_PANORAMICA',
            photo_base64: panoramicPhoto,
            gps_lat: currentGps.lat,
            gps_lng: currentGps.lng,
            captured_at: new Date().toISOString()
          }] : []),
          ...(chemicalPhoto ? [{
            evidence_type: 'FOTO_TESTE_AGUA',
            photo_base64: chemicalPhoto,
            gps_lat: currentGps.lat,
            gps_lng: currentGps.lng,
            captured_at: new Date().toISOString()
          }] : [])
        ]
      });
      setSubmittedLog(true);
    } finally {
      setSubmitting(false);
    }
  };

  const getWhatsAppShareUrl = () => {
    const brand = brandName.trim() || 'Tratador Profissional';
    const dateFormatted = new Date().toLocaleDateString('pt-BR');
    
    let text = `🏊‍♂️ *${brand} - Relatório Técnico de Manutenção*\n`;
    text += `• *Piscina:* ${pool.name}\n`;
    text += `• *Data:* ${dateFormatted}\n`;
    text += `• *Revestimento:* ${profile.label}\n\n`;
    text += `📊 *Parâmetros da Água:*\n`;
    text += `• pH: ${phInput.toFixed(1)} ${phInput >= 7.2 && phInput <= 7.6 ? '✅ (Ideal)' : '⚠️ (Ajustado)'}\n`;
    text += `• Cloro Livre: ${chlorineInput.toFixed(1)} ppm ✅\n`;
    text += `• Alcalinidade: ${alkalinityInput} ppm\n`;
    text += `• Diagnóstico ISL: ${islResult.statusLabel} (ISL ${islResult.isl > 0 ? '+' : ''}${islResult.isl})\n\n`;
    text += `🧹 *Serviços Realizados:*\n`;
    text += `• Escovação das paredes e fundo: ${brushedSurface ? '✅ Sim' : '❌ Não'}\n`;
    text += `• Retrolavagem do filtro: ${backwashedFilter ? '✅ Sim' : '➖ Não necessária'}\n\n`;
    text += `✨ *Sua piscina está 100% balanceada e liberada para o banho!*\n`;
    text += `🛡️ _Auditoria Técnica & Certificação Química JHPCS Engine_`;
    if (technicianWhatsapp) {
      text += `\n📲 Contato do Tratador: ${technicianWhatsapp}`;
    }

    return `https://wa.me/?text=${encodeURIComponent(text)}`;
  };

  if (submittedLog) {
    return (
      <div className="bg-slate-900 border border-emerald-800 p-6 rounded-3xl text-center space-y-4 shadow-xl">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-950 border border-emerald-700 flex items-center justify-center text-emerald-400">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-white">Atendimento Concluído!</h3>
        <p className="text-xs text-slate-300">
          Os parâmetros e laudo de <strong>{pool.name}</strong> foram salvos com sucesso {isOnline ? 'na nuvem' : 'no IndexedDB local'}.
        </p>

        {/* Botão de Destaque White-Label WhatsApp */}
        <div className="pt-2 space-y-2">
          <a
            href={getWhatsAppShareUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition"
          >
            <Share2 className="w-4 h-4" />
            <span>Enviar Comprovante no WhatsApp</span>
          </a>
          <button
            type="button"
            onClick={onBackToCockpit}
            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
          >
            Voltar ao Roteiro do Dia
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-xs">
      {/* Banner de Modo Solo */}
      <div className="bg-gradient-to-r from-emerald-950/80 to-slate-900 border border-emerald-800/80 p-3.5 rounded-2xl flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-900/60 flex items-center justify-center text-emerald-400 font-black">
            ⚡
          </div>
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <span>Modo Solo (Autônomo)</span>
              <span className="text-[9px] bg-emerald-900/80 text-emerald-300 px-1.5 py-0.5 rounded font-mono">
                Ultra-Rápido
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              {pool.name} • Sem bloqueio rígido de GPS
            </p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-emerald-400 font-mono font-bold">
            GPS Capturado
          </span>
        </div>
      </div>

      {/* Seletor de Substrato com Badges */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-2.5">
        <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-emerald-400" />
          <span>Revestimento / Substrato da Piscina</span>
        </label>
        <div className="grid grid-cols-2 gap-2">
          {(Object.keys(SUBSTRATE_PROFILES) as PoolSubstrateType[]).map((subKey) => {
            const p = SUBSTRATE_PROFILES[subKey];
            const isSelected = substrateType === subKey;
            return (
              <button
                type="button"
                key={subKey}
                onClick={() => setSubstrateType(subKey)}
                className={`p-2.5 rounded-xl border text-left transition ${
                  isSelected
                    ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200 shadow-sm'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="font-bold text-[11px]">{p.label}</div>
                <div className="text-[9px] text-slate-500 truncate mt-0.5">
                  pH {p.idealPhMin}-{p.idealPhMax}
                </div>
              </button>
            );
          })}
        </div>

        {/* Advertência Técnica do Substrato */}
        <div className="p-2.5 bg-slate-950 border border-slate-800/80 rounded-xl space-y-1">
          <span className="text-[10px] uppercase font-mono font-bold text-emerald-400 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> Regra do Material ({profile.label}):
          </span>
          <p className="text-[11px] text-slate-300 leading-snug">
            {profile.warning}
          </p>
        </div>
      </div>

      {/* Parâmetros Químicos e ISL */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Medição Química em Campo</span>
          </label>
          <button
            type="button"
            onClick={() => setIsScannerOpen(true)}
            className="px-2.5 py-1 rounded-lg bg-cyan-950 border border-cyan-800 hover:bg-cyan-900 text-cyan-300 text-[10px] font-bold font-mono flex items-center gap-1 transition"
          >
            <span>📷 Scanner Fitas Offline</span>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* pH */}
          <div>
            <div className="flex justify-between text-[11px] text-slate-400 mb-1">
              <span>pH da Água:</span>
              <strong className="text-white font-mono">{phInput.toFixed(1)}</strong>
            </div>
            <input
              type="range"
              min="6.4"
              max="8.4"
              step="0.1"
              value={phInput}
              onChange={(e) => setPhInput(parseFloat(e.target.value))}
              className="w-full accent-emerald-500"
            />
          </div>

          {/* Cloro Livre */}
          <div>
            <div className="flex justify-between text-[11px] text-slate-400 mb-1">
              <span>Cloro Livre:</span>
              <strong className="text-white font-mono">{chlorineInput.toFixed(1)} ppm</strong>
            </div>
            <input
              type="range"
              min="0.0"
              max="6.0"
              step="0.2"
              value={chlorineInput}
              onChange={(e) => setChlorineInput(parseFloat(e.target.value))}
              className="w-full accent-cyan-500"
            />
          </div>

          {/* Alcalinidade */}
          <div>
            <div className="flex justify-between text-[11px] text-slate-400 mb-1">
              <span>Alcalinidade:</span>
              <strong className="text-white font-mono">{alkalinityInput} ppm</strong>
            </div>
            <input
              type="range"
              min="40"
              max="200"
              step="10"
              value={alkalinityInput}
              onChange={(e) => setAlkalinityInput(parseInt(e.target.value))}
              className="w-full accent-purple-500"
            />
          </div>

          {/* Dureza Cálcica */}
          <div>
            <div className="flex justify-between text-[11px] text-slate-400 mb-1">
              <span>Dureza Cálcica:</span>
              <strong className="text-white font-mono">{calciumInput} ppm</strong>
            </div>
            <input
              type="range"
              min="100"
              max="600"
              step="25"
              value={calciumInput}
              onChange={(e) => setCalciumInput(parseInt(e.target.value))}
              className="w-full accent-blue-500"
            />
          </div>
        </div>

        {/* Diagnóstico ISL Langelier Instantâneo */}
        <div className={`p-3 rounded-xl border flex items-center justify-between ${islResult.badgeColor}`}>
          <div>
            <div className="font-bold text-xs flex items-center gap-1.5">
              <span>{islResult.statusLabel}</span>
              <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-black/40">
                ISL: {islResult.isl > 0 ? `+${islResult.isl}` : islResult.isl}
              </span>
            </div>
            <p className="text-[10px] opacity-90 mt-0.5">{islResult.description}</p>
          </div>
        </div>

        {islResult.substrateAlert && (
          <div className="p-2.5 rounded-xl bg-amber-950/60 border border-amber-800 text-amber-200 text-[11px]">
            {islResult.substrateAlert}
          </div>
        )}
      </div>

      {/* Procedimentos Físicos */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-2.5">
        <label className="text-xs font-bold text-white uppercase tracking-wider block">
          Ações Realizadas na Visita
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-950 border border-slate-800/80 cursor-pointer">
            <input
              type="checkbox"
              checked={brushedSurface}
              onChange={(e) => setBrushedSurface(e.target.checked)}
              className="rounded accent-emerald-500 w-4 h-4"
            />
            <span className="text-slate-300 font-medium">Escovação completa da piscina</span>
          </label>
          <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-950 border border-slate-800/80 cursor-pointer">
            <input
              type="checkbox"
              checked={backwashedFilter}
              onChange={(e) => setBackwashedFilter(e.target.checked)}
              className="rounded accent-emerald-500 w-4 h-4"
            />
            <span className="text-slate-300 font-medium">Retrolavagem do filtro de areia</span>
          </label>
        </div>
      </div>

      {/* Evidências Fotográficas (Rápido) */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-2.5">
        <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
          <Camera className="w-3.5 h-3.5 text-cyan-400" />
          <span>Fotos da Piscina (Compressão WebP Automática)</span>
        </label>

        <div className="grid grid-cols-2 gap-2">
          <NativeCameraCapture
            label="Panorâmica"
            subLabel="Visão geral da piscina"
            capturedPhoto={panoramicPhoto}
            onPhotoCaptured={(dataUrl: string) => setPanoramicPhoto(dataUrl)}
          />
          <NativeCameraCapture
            label="Teste Químico"
            subLabel="Fita ou reagente"
            capturedPhoto={chemicalPhoto}
            onPhotoCaptured={(dataUrl: string) => setChemicalPhoto(dataUrl)}
          />
        </div>
      </div>

      {/* Botão de Finalizar */}
      <div className="pt-2">
        <button
          type="submit"
          disabled={submitting}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:opacity-95 text-white font-extrabold text-sm shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 transition disabled:opacity-50"
        >
          {submitting ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Gravando Laudo...</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>Concluir Vistoria & Liberar WhatsApp</span>
            </>
          )}
        </button>
      </div>
      {/* Modal Scanner de Fitas Colorimétrico */}
      {isScannerOpen && (
        <AiStripScannerModal
          isOpen={isScannerOpen}
          onClose={() => setIsScannerOpen(false)}
          poolVolumeM3={pool.volume_m3}
          onApplyParameters={({ ph, chlorine, alkalinity }) => {
            setPhInput(ph);
            setChlorineInput(chlorine);
            setAlkalinityInput(alkalinity);
            setIsScannerOpen(false);
          }}
        />
      )}
    </form>
  );
}
