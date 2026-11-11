'use client';

import React, { useState } from 'react';
import {
  Truck,
  MapPin,
  ShieldAlert,
  CheckCircle2,
  Layers,
  PenTool,
  Plus,
  Trash2,
  Camera,
  Sparkles,
  AlertTriangle,
  Package,
  Lock,
  RefreshCw
} from 'lucide-react';
import { Pool } from '@/types/database';
import { PoolSubstrateType, SUBSTRATE_PROFILES } from '@/lib/substrate-rules';
import { calculateLangelierIndex } from '@/lib/chemistry/islEngine';
import { OFFLINE_CHEMICAL_CATALOG } from '@/lib/fiscal/offlineFiscalCatalog';
import { AppliedProductPayload, MaintenanceLogPayload } from '@/lib/offline-db';
import { calculateHaversineDistance, DEFAULT_GEOFENCE_RADIUS_METERS } from '@/lib/geo/geofencing';
import { PoolWeatherAlert } from '@/types/weatherAlerts';
import { WeatherPreventiveDosingBanner } from '@/components/weather/WeatherPreventiveDosingBanner';
import { CanvasSignatureModal } from '@/components/CanvasSignatureModal';
import { NativeCameraCapture } from '@/components/NativeCameraCapture';

interface FleetMaintenanceFormProps {
  pool: Pool;
  technicianName: string;
  currentGps: { lat: number; lng: number };
  isOnline: boolean;
  activeAlert?: PoolWeatherAlert;
  onSubmit: (log: Partial<MaintenanceLogPayload>) => Promise<void>;
  onBackToCockpit: () => void;
}

export function FleetMaintenanceForm({
  pool,
  technicianName,
  currentGps,
  isOnline,
  activeAlert,
  onSubmit,
  onBackToCockpit,
}: FleetMaintenanceFormProps) {
  const [substrateType, setSubstrateType] = useState<PoolSubstrateType>(
    (pool.finish_type as any) || 'MONOLITICO_SAND'
  );

  // Alerta Climático Preditivo (48h)
  const [preventiveApplied, setPreventiveApplied] = useState<boolean>(false);

  // Parâmetros Químicos
  const [phInput, setPhInput] = useState<number>(7.4);
  const [chlorineInput, setChlorineInput] = useState<number>(2.0);
  const [alkalinityInput, setAlkalinityInput] = useState<number>(100);
  const [calciumInput, setCalciumInput] = useState<number>(250);
  const [tempCInput, setTempCInput] = useState<number>(26);

  // Cuidados físicos
  const [brushedSurface, setBrushedSurface] = useState<boolean>(true);
  const [backwashedFilter, setBackwashedFilter] = useState<boolean>(true);
  const [acidUsed, setAcidUsed] = useState<boolean>(false);

  // Baixa Estequiométrica de Estoque da Caminhonete
  const [productsApplied, setProductsApplied] = useState<AppliedProductPayload[]>([
    { sku: 'CLORO-DICLORO-ESTAB', name: 'Dicloro Estabilizado 60%', quantityUsed: 0.3, unidade: 'KG', precoPadraoBrl: 44.90 },
    { sku: 'BARRILHA-LEVE', name: 'Barrilha Leve (Carbonato de Sódio)', quantityUsed: 0.5, unidade: 'KG', precoPadraoBrl: 16.50 },
  ]);
  const [selectedSku, setSelectedSku] = useState<string>(OFFLINE_CHEMICAL_CATALOG[0].sku);
  const [qtyInput, setQtyInput] = useState<string>('0.5');

  // Assinatura Digital Touch
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState<boolean>(false);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [signatoryName, setSignatoryName] = useState<string>('');

  // Fotos
  const [panoramicPhoto, setPanoramicPhoto] = useState<string | null>(null);
  const [chemicalPhoto, setChemicalPhoto] = useState<string | null>(null);

  // Justificativa de Geofencing caso ultrapasse 50m
  const [geofenceJustification, setGeofenceJustification] = useState<string>('');

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submittedLog, setSubmittedLog] = useState<boolean>(false);

  // Distância Haversine em tempo real
  const geofenceDistance = calculateHaversineDistance(
    currentGps.lat,
    currentGps.lng,
    pool.gps_lat,
    pool.gps_lng
  );
  const isGeofenceBreached = geofenceDistance > DEFAULT_GEOFENCE_RADIUS_METERS;

  // ISL em tempo real
  const islResult = calculateLangelierIndex(
    phInput,
    tempCInput,
    calciumInput,
    alkalinityInput,
    substrateType
  );
  const profile = SUBSTRATE_PROFILES[substrateType] || SUBSTRATE_PROFILES.MONOLITICO_SAND;

  const handleAddProduct = () => {
    const item = OFFLINE_CHEMICAL_CATALOG.find((i) => i.sku === selectedSku);
    const qty = parseFloat(qtyInput);
    if (!item || isNaN(qty) || qty <= 0) return;

    const idx = productsApplied.findIndex((p) => p.sku === item.sku);
    if (idx >= 0) {
      const copy = [...productsApplied];
      copy[idx].quantityUsed += qty;
      setProductsApplied(copy);
    } else {
      setProductsApplied([
        ...productsApplied,
        {
          sku: item.sku,
          name: item.name,
          quantityUsed: qty,
          unidade: item.unidade,
          precoPadraoBrl: item.precoPadraoBrl,
        },
      ]);
    }
    setQtyInput('0.5');
  };

  const handleRemoveProduct = (sku: string) => {
    setProductsApplied(productsApplied.filter((p) => p.sku !== sku));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // TRAVA RÍGIDA DE GEOFENCING 50M
    if (isGeofenceBreached && (!geofenceJustification || geofenceJustification.trim().length < 5)) {
      alert(
        `🚨 BLOQUEIO DE GEOFENCING:\nVocê está a ${geofenceDistance} metros da borda da piscina cadastrada.\nA tolerância máxima permitida para o Modo Frota é ${DEFAULT_GEOFENCE_RADIUS_METERS} metros.\n\nAproxime-se da piscina ou preencha a justificativa formal de auditoria pericial para continuar.`
      );
      return;
    }

    // Se aplicação preventiva climática foi confirmada, incluir automaticamente na baixa estequiométrica da caminhonete
    let finalProductsApplied = [...productsApplied];
    if (activeAlert && preventiveApplied) {
      const alreadyIncluded = finalProductsApplied.some(
        (p) => p.sku === activeAlert.recommended_chemical_sku
      );
      if (alreadyIncluded) {
        finalProductsApplied = finalProductsApplied.map((p) =>
          p.sku === activeAlert.recommended_chemical_sku
            ? { ...p, quantityUsed: p.quantityUsed + activeAlert.recommended_dosage }
            : p
        );
      } else {
        const catalogItem = OFFLINE_CHEMICAL_CATALOG.find(
          (c) => c.sku === activeAlert.recommended_chemical_sku
        );
        finalProductsApplied.push({
          sku: activeAlert.recommended_chemical_sku,
          name: activeAlert.recommended_chemical_name,
          quantityUsed: activeAlert.recommended_dosage,
          unidade: (catalogItem?.unidade || activeAlert.dosage_unit || 'KG') as 'KG' | 'L' | 'UN',
          precoPadraoBrl: catalogItem?.precoPadraoBrl || 20.0,
        });
      }
    }

    setSubmitting(true);
    try {
      await onSubmit({
        target_sector: 'FROTA',
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
        acid_product_used: acidUsed,
        liability_accepted: true,
        gps_lat: currentGps.lat,
        gps_lng: currentGps.lng,
        geofence_flag: isGeofenceBreached,
        geofence_distance_m: geofenceDistance,
        geofence_justification: geofenceJustification || undefined,
        signature_data_url: signatureDataUrl || undefined,
        signatory_name: signatoryName || undefined,
        productsApplied: finalProductsApplied,
        acknowledgedAlertId: activeAlert?.id,
        preventiveApplicationDone: activeAlert ? preventiveApplied : undefined,
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
      <div className="bg-slate-900 border border-blue-800 p-6 rounded-3xl text-center space-y-4 shadow-xl">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-950 border border-blue-700 flex items-center justify-center text-blue-400">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-white">Vistoria e Baixa de Estoque Concluídas!</h3>
        <p className="text-xs text-slate-300">
          Atendimento registrado para <strong>{pool.name}</strong>. Os insumos químicos foram debitados da sua caminhonete.
        </p>

        <button
          type="button"
          onClick={onBackToCockpit}
          className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition shadow-lg shadow-blue-500/20"
        >
          Retornar ao Roteiro da Frota
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-xs">
      {/* Banner de Modo Frota & Geofencing Status */}
      <div className="bg-gradient-to-r from-blue-950 to-slate-900 border border-blue-800/80 p-3.5 rounded-2xl space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-900/60 flex items-center justify-center text-blue-400">
              <Truck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <span>Modo Fleet (Frota Comercial)</span>
                <span className="text-[9px] bg-blue-900 text-blue-300 px-1.5 py-0.5 rounded font-mono">
                  Trava 50m Ativa
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">Técnico: {technicianName}</p>
            </div>
          </div>
          <div className="text-right font-mono">
            <span className={`text-[11px] font-bold ${isGeofenceBreached ? 'text-red-400' : 'text-emerald-400'}`}>
              {geofenceDistance}m
            </span>
            <p className="text-[9px] text-slate-500">Distância Pool</p>
          </div>
        </div>

        {/* Alerta de Geofencing caso ultrapasse 50m */}
        {isGeofenceBreached ? (
          <div className="p-2.5 bg-red-950/80 border border-red-800 rounded-xl space-y-2 text-red-200">
            <div className="flex items-center gap-1.5 font-bold text-xs text-red-300">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span>Fora do Raio de 50 Metros ({geofenceDistance}m medidos)</span>
            </div>
            <p className="text-[11px] leading-snug">
              Aproxime-se da piscina para liberar o check-in automático ou insira a justificativa operacional abaixo:
            </p>
            <input
              type="text"
              required
              value={geofenceJustification}
              onChange={(e) => setGeofenceJustification(e.target.value)}
              placeholder="Ex: Portão trancado, vistoria remota autorizada..."
              className="w-full bg-slate-950 border border-red-700/80 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-red-400/50"
            />
          </div>
        ) : (
          <div className="p-2 bg-emerald-950/50 border border-emerald-800/80 rounded-xl flex items-center gap-1.5 text-emerald-300 text-[11px]">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Posicionamento validado dentro da cerca eletrônica (50m OK).</span>
          </div>
        )}
      </div>

      {/* Card Preditivo Meteorológico 48h (se houver alerta ativo) */}
      {activeAlert && !activeAlert.acknowledged && (
        <WeatherPreventiveDosingBanner
          alert={activeAlert}
          isApplied={preventiveApplied}
          onToggleApplied={setPreventiveApplied}
        />
      )}

      {/* Substrato da Piscina */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-2.5">
        <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-blue-400" />
          <span>Substrato da Piscina</span>
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
                className={`p-2.5 rounded-xl border text-left transition ${isSelected
                    ? 'bg-blue-950/80 border-blue-500 text-blue-200'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
              >
                <div className="font-bold text-[11px]">{p.label}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Parâmetros Químicos */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Medições de Campo & ISL</span>
          </label>
          <span className="text-[10px] text-slate-500 font-mono">ISL: {islResult.isl}</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="flex justify-between text-[11px] text-slate-400 mb-1">
              <span>pH:</span>
              <strong className="text-white font-mono">{phInput.toFixed(1)}</strong>
            </div>
            <input
              type="range"
              min="6.4"
              max="8.4"
              step="0.1"
              value={phInput}
              onChange={(e) => setPhInput(parseFloat(e.target.value))}
              className="w-full accent-blue-500"
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
              max="6.0"
              step="0.2"
              value={chlorineInput}
              onChange={(e) => setChlorineInput(parseFloat(e.target.value))}
              className="w-full accent-cyan-500"
            />
          </div>
        </div>

        {/* Diagnóstico ISL */}
        <div className={`p-2.5 rounded-xl border text-xs font-bold ${islResult.badgeColor}`}>
          {islResult.statusLabel} ({islResult.isl > 0 ? `+${islResult.isl}` : islResult.isl})
        </div>
      </div>

      {/* Baixa Estequiométrica do Estoque da Caminhonete */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
            <Package className="w-3.5 h-3.5 text-amber-400" />
            <span>Baixa de Estoque Volante (Caminhonete)</span>
          </label>
          <span className="text-[10px] text-amber-400 font-mono font-bold">Débito Real</span>
        </div>

        <div className="flex gap-2">
          <select
            value={selectedSku}
            onChange={(e) => setSelectedSku(e.target.value)}
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-white"
          >
            {OFFLINE_CHEMICAL_CATALOG.map((item) => (
              <option key={item.sku} value={item.sku}>
                {item.name} ({item.unidade})
              </option>
            ))}
          </select>
          <input
            type="number"
            step="0.1"
            min="0.1"
            value={qtyInput}
            onChange={(e) => setQtyInput(e.target.value)}
            className="w-20 bg-slate-950 border border-slate-800 rounded-xl px-2 text-center text-xs text-white font-mono"
            placeholder="Qtd"
          />
          <button
            type="button"
            onClick={handleAddProduct}
            className="px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold flex items-center justify-center transition"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Lista de Produtos Adicionados para Baixa */}
        <div className="space-y-1.5">
          {productsApplied.map((p) => (
            <div
              key={p.sku}
              className="flex items-center justify-between p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300"
            >
              <div>
                <span className="font-semibold text-white">{p.name}</span>
                <span className="text-[10px] text-slate-500 ml-2 font-mono">
                  {p.quantityUsed} {p.unidade}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleRemoveProduct(p.sku)}
                className="text-red-400 hover:text-red-300 p-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Assinatura Digital Touch do Cliente / Encarregado */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-2.5">
        <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
          <PenTool className="w-3.5 h-3.5 text-cyan-400" />
          <span>Assinatura Digital Touch no Local</span>
        </label>

        {signatureDataUrl ? (
          <div className="p-3 bg-slate-950 border border-emerald-800 rounded-xl space-y-2 text-center">
            <span className="text-[10px] text-emerald-400 font-bold uppercase">
              Assinatura Coletada: {signatoryName || 'Cliente'}
            </span>
            <img
              src={signatureDataUrl}
              alt="Assinatura"
              className="max-h-16 mx-auto bg-white rounded p-1"
            />
            <button
              type="button"
              onClick={() => setIsSignatureModalOpen(true)}
              className="text-[10px] text-cyan-400 underline font-bold"
            >
              Refazer Assinatura
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsSignatureModalOpen(true)}
            className="w-full py-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-cyan-500 text-slate-300 hover:text-white flex items-center justify-center gap-2 font-bold transition"
          >
            <PenTool className="w-4 h-4 text-cyan-400" />
            <span>Coletar Assinatura do Cliente</span>
          </button>
        )}
      </div>

      {/* Fotos com R2 */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-2.5">
        <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
          <Camera className="w-3.5 h-3.5 text-cyan-400" />
          <span>Evidências Fotográficas (R2 Egress-Free)</span>
        </label>
        <div className="grid grid-cols-2 gap-2">
          <NativeCameraCapture
            label="Panorâmica"
            subLabel="Visão geral"
            capturedPhoto={panoramicPhoto}
            onPhotoCaptured={(dataUrl: string) => setPanoramicPhoto(dataUrl)}
          />
          <NativeCameraCapture
            label="Teste Químico"
            subLabel="Reagente / Fita"
            capturedPhoto={chemicalPhoto}
            onPhotoCaptured={(dataUrl: string) => setChemicalPhoto(dataUrl)}
          />
        </div>
      </div>

      {/* Botão de Submissão com Trava 50m */}
      <div className="pt-2">
        <button
          type="submit"
          disabled={submitting || (isGeofenceBreached && !geofenceJustification)}
          className={`w-full py-4 rounded-2xl font-extrabold text-sm shadow-xl flex items-center justify-center gap-2 transition ${isGeofenceBreached && !geofenceJustification
              ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-blue-500/20 hover:opacity-95'
            }`}
        >
          {submitting ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Sincronizando com Core v6.0...</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>Concluir Vistoria & Baixar Estoque</span>
            </>
          )}
        </button>
      </div>

      {/* Modal de Assinatura */}
      {isSignatureModalOpen && (
        <CanvasSignatureModal
          isOpen={isSignatureModalOpen}
          onClose={() => setIsSignatureModalOpen(false)}
          poolName={pool.name}
          onConfirmSignature={(dataUrl: string, name: string) => {
            setSignatureDataUrl(dataUrl);
            setSignatoryName(name);
            setIsSignatureModalOpen(false);
          }}
        />
      )}
    </form>
  );
}
