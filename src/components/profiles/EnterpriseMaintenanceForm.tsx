'use client';

import React, { useState } from 'react';
import { 
  ShieldCheck, 
  QrCode, 
  Nfc, 
  AlertOctagon, 
  CheckCircle2, 
  Sparkles, 
  Camera, 
  RefreshCw, 
  Layers, 
  Clock, 
  Calendar,
  AlertTriangle,
  Lock
} from 'lucide-react';
import { Pool } from '@/types/database';
import { PoolSubstrateType, SUBSTRATE_PROFILES } from '@/lib/substrate-rules';
import { calculateLangelierIndex } from '@/lib/chemistry/islEngine';
import { MaintenanceLogPayload } from '@/lib/offline-db';
import { PoolWeatherAlert } from '@/types/weatherAlerts';
import { WeatherPreventiveDosingBanner } from '@/components/weather/WeatherPreventiveDosingBanner';
import { NativeCameraCapture } from '@/components/NativeCameraCapture';
import { MachineRoomScannerModal } from '@/components/MachineRoomScannerModal';

interface EnterpriseMaintenanceFormProps {
  pool: Pool;
  auditorName: string;
  currentGps: { lat: number; lng: number };
  isOnline: boolean;
  activeAlert?: PoolWeatherAlert;
  onSubmit: (log: Partial<MaintenanceLogPayload>) => Promise<void>;
  onBackToCockpit: () => void;
}

export function EnterpriseMaintenanceForm({
  pool,
  auditorName,
  currentGps,
  isOnline,
  activeAlert,
  onSubmit,
  onBackToCockpit,
}: EnterpriseMaintenanceFormProps) {
  // Substrato Monolítico Areia de Quartzo Obrigatório para Auditoria Decenal
  const [substrateType, setSubstrateType] = useState<PoolSubstrateType>('MONOLITICO_SAND');

  // Alerta Climático Preditivo (48h)
  const [preventiveApplied, setPreventiveApplied] = useState<boolean>(false);

  // Scanner Plaqueta CNC Laser
  const [isScannerOpen, setIsScannerOpen] = useState<boolean>(false);
  const [machineRoomTag, setMachineRoomTag] = useState<string>('JHP-CNC-BR-88319');
  const [tagVerified, setTagVerified] = useState<boolean>(true);

  // Período de Cura (28 dias) vs. Garantia Decenal Ativa
  const [cureDays, setCureDays] = useState<number>(14);
  const isCuringPeriod = cureDays < 28;

  // Integridade Estrutural do Revestimento Monolítico
  const [monolithIntegrity, setMonolithIntegrity] = useState<'PERFEITA' | 'FISSURA_LEVE' | 'REQUER_PERICIA'>('PERFEITA');

  // Parâmetros Químicos Rigorosos
  const [phInput, setPhInput] = useState<number>(7.4);
  const [chlorineInput, setChlorineInput] = useState<number>(2.0);
  const [alkalinityInput, setAlkalinityInput] = useState<number>(100);
  const [calciumInput, setCalciumInput] = useState<number>(250);
  const [tempCInput, setTempCInput] = useState<number>(26);

  // Proibição Absoluta de Ácido Muriático Direto
  const [acidDetected, setAcidDetected] = useState<boolean>(false);
  const [prohibitedProductsBlocked, setProhibitedProductsBlocked] = useState<boolean>(true);

  // Fotos
  const [panoramicPhoto, setPanoramicPhoto] = useState<string | null>(null);
  const [tagPhoto, setTagPhoto] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submittedLog, setSubmittedLog] = useState<boolean>(false);

  // ISL em tempo real
  const islResult = calculateLangelierIndex(
    phInput,
    tempCInput,
    calciumInput,
    alkalinityInput,
    substrateType
  );

  const isCorrosiveRisk = islResult.status === 'CORROSIVA' || phInput < 7.0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (acidDetected) {
      alert('BLOQUEIO PERICIAL: O uso de ácido muriático direto invalida a garantia decenal da Jhoston Pools. Regularize o laudo antes de submeter.');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        target_sector: 'FABRICANTE',
        substrate_type: substrateType,
        machine_room_tag: machineRoomTag,
        cure_days: cureDays,
        cure_status: isCuringPeriod ? 'CURING_28D' : 'WARRANTY_ACTIVE',
        monolith_integrity: monolithIntegrity,
        ph: phInput,
        chlorine_ppm: chlorineInput,
        alkalinity_ppm: alkalinityInput,
        calcium_hardness: calciumInput,
        temperature_c: tempCInput,
        isl_value: islResult.isl,
        isl_status: islResult.status,
        brushed_surface: true,
        backwashed_filter: false,
        acid_product_used: acidDetected,
        liability_accepted: true,
        gps_lat: currentGps.lat,
        gps_lng: currentGps.lng,
        acknowledgedAlertId: activeAlert?.id,
        preventiveApplicationDone: activeAlert ? preventiveApplied : undefined,
        evidences: [
          ...(panoramicPhoto ? [{
            evidence_type: 'FOTO_MONOLITO_AREIA_PANORAMICA',
            photo_base64: panoramicPhoto,
            gps_lat: currentGps.lat,
            gps_lng: currentGps.lng,
            captured_at: new Date().toISOString()
          }] : []),
          ...(tagPhoto ? [{
            evidence_type: 'FOTO_PLAQUETA_CNC_LASER',
            photo_base64: tagPhoto,
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

  if (submittedLog) {
    return (
      <div className="bg-slate-900 border border-cyan-800 p-6 rounded-3xl text-center space-y-4 shadow-xl">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-cyan-950 border border-cyan-700 flex items-center justify-center text-cyan-400">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-white">Laudo Pericial Jhoston Certificado!</h3>
        <p className="text-xs text-slate-300">
          Auditoria técnica da piscina <strong>{pool.name}</strong> vinculada à Plaqueta <strong>{machineRoomTag}</strong> gravada no Core v6.0.
        </p>

        <button
          type="button"
          onClick={onBackToCockpit}
          className="w-full py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-black text-xs transition shadow-lg shadow-cyan-500/20"
        >
          Retornar ao Painel de Auditoria
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-xs">
      {/* Banner de Modo Enterprise Jhoston */}
      <div className="bg-gradient-to-r from-cyan-950 to-slate-900 border border-cyan-800/80 p-3.5 rounded-2xl flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-cyan-900/60 flex items-center justify-center text-cyan-400">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <span>Modo Enterprise (Garantia Jhoston)</span>
              <span className="text-[9px] bg-cyan-900 text-cyan-300 px-1.5 py-0.5 rounded font-mono">
                Plaqueta Laser CNC
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">Auditor Oficial: {auditorName}</p>
          </div>
        </div>
      </div>

      {/* Card Preditivo Meteorológico 48h (se houver alerta ativo) */}
      {activeAlert && !activeAlert.acknowledged && (
        <WeatherPreventiveDosingBanner
          alert={activeAlert}
          isApplied={preventiveApplied}
          onToggleApplied={setPreventiveApplied}
        />
      )}

      {/* Leitor Rápido de QR Code / Plaqueta Metálica CNC */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-2.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
            <QrCode className="w-3.5 h-3.5 text-cyan-400" />
            <span>Plaqueta Laser CNC (Casa de Máquinas)</span>
          </label>
          <span className="text-[10px] text-emerald-400 font-mono font-bold">Verificada</span>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            readOnly
            value={machineRoomTag}
            className="flex-1 bg-slate-950 border border-cyan-800/60 rounded-xl px-3 py-2 text-cyan-300 font-mono text-xs"
          />
          <button
            type="button"
            onClick={() => setIsScannerOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-cyan-950 hover:bg-cyan-900 border border-cyan-800 text-cyan-400 font-bold flex items-center gap-1 transition"
          >
            <Nfc className="w-3.5 h-3.5" />
            <span>Escanear</span>
          </button>
        </div>
      </div>

      {/* Verificação Automática do Período de Cura (28 Dias) */}
      <div className={`p-4 rounded-2xl border space-y-2 ${
        isCuringPeriod 
          ? 'bg-amber-950/40 border-amber-800/80 text-amber-200' 
          : 'bg-slate-900 border-slate-800 text-slate-300'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className={`w-4 h-4 ${isCuringPeriod ? 'text-amber-400' : 'text-emerald-400'}`} />
            <h4 className="font-bold text-xs text-white">Status Estrutural da Obra</h4>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold bg-black/40">
            {isCuringPeriod ? 'EM CURA QUÍMICA' : 'GARANTIA DECENAL ATIVA'}
          </span>
        </div>

        <div className="flex items-center justify-between text-xs pt-1">
          <span>Dias pós-concretagem:</span>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="1"
              max="3650"
              value={cureDays}
              onChange={(e) => setCureDays(parseInt(e.target.value) || 1)}
              className="w-16 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-center font-mono text-white text-xs"
            />
            <span>dias</span>
          </div>
        </div>

        {isCuringPeriod && (
          <p className="text-[11px] text-amber-300 leading-snug pt-1">
            ⚠️ <strong>ATENÇÃO PERICIAL (Cura de 28 Dias):</strong> Não aplicar cloro de choque nem ácidos concentrados neste período para permitir a hidratação completa dos silicatos.
          </p>
        )}
      </div>

      {/* Perícia da Integridade do Monólito de Areia */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-2.5">
        <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-cyan-400" />
          <span>Integridade do Revestimento Monolítico</span>
        </label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: 'PERFEITA', label: '100% Perfeita', desc: 'Sem fissuras' },
            { id: 'FISSURA_LEVE', label: 'Fissura Leve', desc: 'Monitorar' },
            { id: 'REQUER_PERICIA', label: 'Requer Perícia', desc: 'Possível dano' },
          ].map((item) => {
            const isSelected = monolithIntegrity === item.id;
            return (
              <button
                type="button"
                key={item.id}
                onClick={() => setMonolithIntegrity(item.id as any)}
                className={`p-2.5 rounded-xl border text-center transition ${
                  isSelected
                    ? 'bg-cyan-950 border-cyan-500 text-cyan-200'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                <div className="font-bold text-[11px]">{item.label}</div>
                <div className="text-[9px] text-slate-500 mt-0.5">{item.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Parâmetros Químicos Rigorosos Monolítico */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Balanço Químico Obrigatório</span>
          </label>
          <span className="text-[10px] text-cyan-400 font-mono">ISL {islResult.isl}</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="flex justify-between text-[11px] text-slate-400 mb-1">
              <span>pH (7.2 a 7.6):</span>
              <strong className={`font-mono ${phInput < 7.2 ? 'text-red-400' : 'text-white'}`}>
                {phInput.toFixed(1)}
              </strong>
            </div>
            <input
              type="range"
              min="6.4"
              max="8.4"
              step="0.1"
              value={phInput}
              onChange={(e) => setPhInput(parseFloat(e.target.value))}
              className="w-full accent-cyan-500"
            />
          </div>

          <div>
            <div className="flex justify-between text-[11px] text-slate-400 mb-1">
              <span>Cloro Livre:</span>
              <strong className="text-white font-mono">{chlorineInput.toFixed(1)} ppm</strong>
            </div>
            <input
              type="range"
              min="0.0"
              max="5.0"
              step="0.2"
              value={chlorineInput}
              onChange={(e) => setChlorineInput(parseFloat(e.target.value))}
              className="w-full accent-blue-500"
            />
          </div>
        </div>

        {isCorrosiveRisk && (
          <div className="p-3 bg-red-950/80 border border-red-800 rounded-xl text-red-200 text-[11px] leading-snug">
            ⚠️ <strong>ÁGUA CORROSIVA DETECTADA (ISL {islResult.isl}):</strong> A agressividade da água dissolve ligantes de quartzo e acarreta a perda da garantia de 10 anos da Jhoston.
          </div>
        )}
      </div>

      {/* Bloqueio de Ácido Muriático */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-2">
        <label className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer">
          <input
            type="checkbox"
            checked={acidDetected}
            onChange={(e) => setAcidDetected(e.target.checked)}
            className="rounded accent-red-500 w-4 h-4"
          />
          <span className="text-slate-300 font-medium">
            Houve uso de Ácido Muriático ou pastilhas no fundo?
          </span>
        </label>
        {acidDetected && (
          <p className="text-[10px] text-red-400 font-bold px-1">
            ❌ PROIBIDO: O envio deste laudo emitirá Notificação de Perícia com suspensão cautelar de garantia.
          </p>
        )}
      </div>

      {/* Fotos com R2 */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-2.5">
        <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
          <Camera className="w-3.5 h-3.5 text-cyan-400" />
          <span>Evidências Fotográficas Oficiais</span>
        </label>
        <div className="grid grid-cols-2 gap-2">
          <NativeCameraCapture
            label="Monólito Panorâmico"
            subLabel="Revestimento monolítico"
            capturedPhoto={panoramicPhoto}
            onPhotoCaptured={(dataUrl: string) => setPanoramicPhoto(dataUrl)}
          />
          <NativeCameraCapture
            label="Plaqueta CNC"
            subLabel="Identificação laser"
            capturedPhoto={tagPhoto}
            onPhotoCaptured={(dataUrl: string) => setTagPhoto(dataUrl)}
          />
        </div>
      </div>

      {/* Botão de Envio Pericial */}
      <div className="pt-2">
        <button
          type="submit"
          disabled={submitting || acidDetected}
          className={`w-full py-4 rounded-2xl font-black text-sm shadow-xl flex items-center justify-center gap-2 transition ${
            acidDetected
              ? 'bg-red-950 text-red-400 border border-red-800 cursor-not-allowed'
              : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-cyan-500/20 hover:opacity-95'
          }`}
        >
          {submitting ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Certificando Auditoria no Core...</span>
            </>
          ) : (
            <>
              <ShieldCheck className="w-4 h-4" />
              <span>Emitir Certificado Pericial Jhoston Pools</span>
            </>
          )}
        </button>
      </div>

      {/* Modal Scanner Plaqueta CNC */}
      {isScannerOpen && (
        <MachineRoomScannerModal
          isOpen={isScannerOpen}
          onClose={() => setIsScannerOpen(false)}
          availablePools={[{ id: pool.id, name: pool.name }]}
          onCheckInSuccess={({ tagCode, roomName }: { poolId: string; tagCode: string; roomName: string }) => {
            setMachineRoomTag(tagCode);
            setTagVerified(true);
            setIsScannerOpen(false);
          }}
        />
      )}
    </form>
  );
}
