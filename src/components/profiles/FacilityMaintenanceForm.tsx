'use client';

import React, { useState } from 'react';
import { 
  Building2, 
  AlertTriangle, 
  CheckCircle2, 
  Sparkles, 
  Sun, 
  Sunset, 
  Moon, 
  Gauge, 
  Users, 
  Droplets, 
  Camera, 
  RefreshCw,
  FileCheck2,
  Layers
} from 'lucide-react';
import { Pool } from '@/types/database';
import { PoolSubstrateType, SUBSTRATE_PROFILES } from '@/lib/substrate-rules';
import { calculateLangelierIndex } from '@/lib/chemistry/islEngine';
import { MaintenanceLogPayload } from '@/lib/offline-db';
import { NativeCameraCapture } from '@/components/NativeCameraCapture';

interface FacilityMaintenanceFormProps {
  pool: Pool;
  operatorName: string;
  currentGps: { lat: number; lng: number };
  isOnline: boolean;
  onSubmit: (log: Partial<MaintenanceLogPayload>) => Promise<void>;
  onBackToCockpit: () => void;
}

export function FacilityMaintenanceForm({
  pool,
  operatorName,
  currentGps,
  isOnline,
  onSubmit,
  onBackToCockpit,
}: FacilityMaintenanceFormProps) {
  const [substrateType, setSubstrateType] = useState<PoolSubstrateType>(
    (pool.finish_type as any) || 'PASTILHA_CERAMICA'
  );

  // NBR 10.818: Seletor de Turno
  const [shift, setShift] = useState<'MANHA' | 'TARDE' | 'NOITE'>('MANHA');

  // Parâmetros Químicos Sanitários
  const [phInput, setPhInput] = useState<number>(7.4);
  const [chlorineFreeInput, setChlorineFreeInput] = useState<number>(2.0);
  const [chlorineCombinedInput, setChlorineCombinedInput] = useState<number>(0.2);
  const [tempCInput, setTempCInput] = useState<number>(28);
  const [alkalinityInput, setAlkalinityInput] = useState<number>(100);
  const [calciumInput, setCalciumInput] = useState<number>(250);

  // Parâmetros Físicos Sanitários
  const [transparency, setTransparency] = useState<'CRISTALINA' | 'TURVA' | 'VERDE' | 'OPACA'>('CRISTALINA');
  const [bathersCount, setBathersCount] = useState<number>(15);
  const [filterPressurePsi, setFilterPressurePsi] = useState<number>(18);
  const [prefilterCleaned, setPrefilterCleaned] = useState<boolean>(true);

  // Fotos
  const [panoramicPhoto, setPanoramicPhoto] = useState<string | null>(null);
  const [chemicalPhoto, setChemicalPhoto] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submittedLog, setSubmittedLog] = useState<boolean>(false);

  // Validação Sanitária Crítica NBR 10.818 (1.0 a 3.0 ppm)
  const isChlorineCritical = chlorineFreeInput < 1.0 || chlorineFreeInput > 3.0;
  const isPhCritical = phInput < 7.2 || phInput > 7.8;
  const isCombinedChlorineHigh = chlorineCombinedInput > 0.4;

  // ISL em tempo real
  const islResult = calculateLangelierIndex(
    phInput,
    tempCInput,
    calciumInput,
    alkalinityInput,
    substrateType
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit({
        target_sector: 'HOTEL_CLUBE',
        facility_shift: shift,
        substrate_type: substrateType,
        ph: phInput,
        chlorine_ppm: chlorineFreeInput,
        chlorine_combined_ppm: chlorineCombinedInput,
        alkalinity_ppm: alkalinityInput,
        calcium_hardness: calciumInput,
        temperature_c: tempCInput,
        water_transparency: transparency,
        bathers_count: bathersCount,
        filter_pressure_psi: filterPressurePsi,
        prefilter_cleaned: prefilterCleaned,
        isl_value: islResult.isl,
        isl_status: islResult.status,
        brushed_surface: true,
        backwashed_filter: filterPressurePsi > 20,
        acid_product_used: false,
        liability_accepted: true,
        gps_lat: currentGps.lat,
        gps_lng: currentGps.lng,
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

  if (submittedLog) {
    return (
      <div className="bg-slate-900 border border-purple-800 p-6 rounded-3xl text-center space-y-4 shadow-xl">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-purple-950 border border-purple-700 flex items-center justify-center text-purple-400">
          <FileCheck2 className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-white">Boletim Sanitário NBR 10.818 Registrado!</h3>
        <p className="text-xs text-slate-300">
          Laudo do turno da <strong>{shift}</strong> para <strong>{pool.name}</strong> arquivado para auditoria sanitária da ANVISA.
        </p>

        <button
          type="button"
          onClick={onBackToCockpit}
          className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition shadow-lg shadow-purple-500/20"
        >
          Retornar ao Complexo Aquático
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-xs">
      {/* Banner de Modo Facility (NBR 10.818) */}
      <div className="bg-gradient-to-r from-purple-950 to-slate-900 border border-purple-800/80 p-3.5 rounded-2xl flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-purple-900/60 flex items-center justify-center text-purple-400">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <span>Modo Facility (Hotel & Resort)</span>
              <span className="text-[9px] bg-purple-900 text-purple-300 px-1.5 py-0.5 rounded font-mono">
                NBR 10.818 ANVISA
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">{pool.name} • Operador: {operatorName}</p>
          </div>
        </div>
      </div>

      {/* Alerta Crítico Sanitário ANVISA NBR 10.818 */}
      {isChlorineCritical && (
        <div className="p-3 bg-red-950/90 border border-red-700 rounded-2xl text-red-200 space-y-1 shadow-lg shadow-red-950/40 animate-pulse">
          <div className="flex items-center gap-2 font-bold text-xs text-red-300">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span>⚠️ ALERTA SANITÁRIO CRÍTICO: Piscina fora da faixa segura NBR 10.818</span>
          </div>
          <p className="text-[11px] leading-snug">
            Cloro Livre medido: <strong>{chlorineFreeInput.toFixed(1)} ppm</strong>. A ANVISA exige rigorosamente entre <strong>1.0 e 3.0 ppm</strong> em piscinas coletivas para evitar contaminação biológica.
          </p>
        </div>
      )}

      {/* Seletor Obrigatório de Turno */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-2.5">
        <label className="text-xs font-bold text-white uppercase tracking-wider block">
          Turno de Medição Sanitária (3x ao dia):
        </label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: 'MANHA', label: 'Manhã', icon: Sun, color: 'text-amber-400' },
            { id: 'TARDE', label: 'Tarde', icon: Sunset, color: 'text-orange-400' },
            { id: 'NOITE', label: 'Noite', icon: Moon, color: 'text-indigo-400' },
          ].map((item) => {
            const Icon = item.icon;
            const isSelected = shift === item.id;
            return (
              <button
                type="button"
                key={item.id}
                onClick={() => setShift(item.id as any)}
                className={`py-3 px-2 rounded-xl border flex flex-col items-center justify-center gap-1 transition ${
                  isSelected
                    ? 'bg-purple-950/90 border-purple-500 text-purple-200 shadow-md'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                <Icon className={`w-4 h-4 ${item.color}`} />
                <span className="font-bold text-[11px]">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Parâmetros Sanitários Específicos NBR 10.818 */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
            <Droplets className="w-3.5 h-3.5 text-cyan-400" />
            <span>Medições Físico-Químicas (ANVISA)</span>
          </label>
          <span className="text-[10px] text-slate-500 font-mono">NBR 10.818</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Cloro Livre */}
          <div>
            <div className="flex justify-between text-[11px] text-slate-400 mb-1">
              <span>Cloro Livre (1.0-3.0):</span>
              <strong className={`font-mono ${isChlorineCritical ? 'text-red-400' : 'text-emerald-400'}`}>
                {chlorineFreeInput.toFixed(1)} ppm
              </strong>
            </div>
            <input
              type="range"
              min="0.0"
              max="5.0"
              step="0.1"
              value={chlorineFreeInput}
              onChange={(e) => setChlorineFreeInput(parseFloat(e.target.value))}
              className="w-full accent-purple-500"
            />
          </div>

          {/* Cloro Combinado (Cloraminas) */}
          <div>
            <div className="flex justify-between text-[11px] text-slate-400 mb-1">
              <span>Cloro Combinado (&le;0.4):</span>
              <strong className={`font-mono ${isCombinedChlorineHigh ? 'text-amber-400' : 'text-white'}`}>
                {chlorineCombinedInput.toFixed(1)} ppm
              </strong>
            </div>
            <input
              type="range"
              min="0.0"
              max="2.0"
              step="0.1"
              value={chlorineCombinedInput}
              onChange={(e) => setChlorineCombinedInput(parseFloat(e.target.value))}
              className="w-full accent-amber-500"
            />
          </div>

          {/* pH */}
          <div>
            <div className="flex justify-between text-[11px] text-slate-400 mb-1">
              <span>pH (7.2 - 7.8):</span>
              <strong className="text-white font-mono">{phInput.toFixed(1)}</strong>
            </div>
            <input
              type="range"
              min="6.4"
              max="8.4"
              step="0.1"
              value={phInput}
              onChange={(e) => setPhInput(parseFloat(e.target.value))}
              className="w-full accent-purple-500"
            />
          </div>

          {/* Temperatura da Água */}
          <div>
            <div className="flex justify-between text-[11px] text-slate-400 mb-1">
              <span>Temperatura:</span>
              <strong className="text-white font-mono">{tempCInput} °C</strong>
            </div>
            <input
              type="range"
              min="18"
              max="38"
              step="1"
              value={tempCInput}
              onChange={(e) => setTempCInput(parseInt(e.target.value))}
              className="w-full accent-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Operação de Filtros & Banhistas */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3">
        <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
          <Gauge className="w-3.5 h-3.5 text-purple-400" />
          <span>Filtros, Pressão e Lotação de Banhistas</span>
        </label>

        <div className="grid grid-cols-2 gap-3">
          {/* Pressão do Filtro PSI */}
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Pressão Manômetro (PSI):</label>
            <input
              type="number"
              min="5"
              max="50"
              value={filterPressurePsi}
              onChange={(e) => setFilterPressurePsi(parseInt(e.target.value) || 0)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
            />
            {filterPressurePsi > 22 && (
              <span className="text-[9px] text-amber-400 font-bold block mt-1">
                ⚠️ Pressão Alta: Exige Retrolavagem!
              </span>
            )}
          </div>

          {/* Estimativa de Banhistas */}
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Banhistas no Turno:</label>
            <input
              type="number"
              min="0"
              max="500"
              value={bathersCount}
              onChange={(e) => setBathersCount(parseInt(e.target.value) || 0)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
            />
          </div>
        </div>

        {/* Transparência da Água */}
        <div>
          <label className="block text-[11px] text-slate-400 mb-1">Transparência da Água (Visibilidade do Fundo):</label>
          <div className="grid grid-cols-4 gap-1.5 text-center">
            {[
              { id: 'CRISTALINA', label: 'Cristalina' },
              { id: 'TURVA', label: 'Turva' },
              { id: 'VERDE', label: 'Verde' },
              { id: 'OPACA', label: 'Opaca' },
            ].map((t) => (
              <button
                type="button"
                key={t.id}
                onClick={() => setTransparency(t.id as any)}
                className={`py-2 rounded-lg border text-[10px] font-bold ${
                  transparency === t.id
                    ? 'bg-purple-950 border-purple-500 text-purple-200'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Pré-filtros limpos */}
        <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer">
          <input
            type="checkbox"
            checked={prefilterCleaned}
            onChange={(e) => setPrefilterCleaned(e.target.checked)}
            className="rounded accent-purple-500 w-4 h-4"
          />
          <span className="text-slate-300 font-medium">Pré-filtros das bombas limpos e desobstruídos</span>
        </label>
      </div>

      {/* Fotos com R2 */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-2.5">
        <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
          <Camera className="w-3.5 h-3.5 text-cyan-400" />
          <span>Evidências Fotográficas do Turno</span>
        </label>
        <div className="grid grid-cols-2 gap-2">
          <NativeCameraCapture
            label="Água / Fundo"
            subLabel="Visibilidade do ralo"
            capturedPhoto={panoramicPhoto}
            onPhotoCaptured={(dataUrl: string) => setPanoramicPhoto(dataUrl)}
          />
          <NativeCameraCapture
            label="Fotômetro / Fita"
            subLabel="Medição do turno"
            capturedPhoto={chemicalPhoto}
            onPhotoCaptured={(dataUrl: string) => setChemicalPhoto(dataUrl)}
          />
        </div>
      </div>

      {/* Botão de Envio Sanitário */}
      <div className="pt-2">
        <button
          type="submit"
          disabled={submitting}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-95 text-white font-extrabold text-sm shadow-xl shadow-purple-500/20 flex items-center justify-center gap-2 transition"
        >
          {submitting ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Registrando Boletim ANVISA...</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>Arquivar Boletim Sanitário NBR 10.818</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
