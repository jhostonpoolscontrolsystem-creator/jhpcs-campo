'use client';

import React from 'react';
import { 
  CloudRain, 
  Sun, 
  ShieldAlert, 
  CheckSquare, 
  Square, 
  AlertTriangle,
  Beaker,
  Sparkles
} from 'lucide-react';
import { PoolWeatherAlert } from '@/types/weatherAlerts';

interface WeatherPreventiveDosingBannerProps {
  alert: PoolWeatherAlert;
  isApplied: boolean;
  onToggleApplied: (applied: boolean) => void;
  disabled?: boolean;
}

export function WeatherPreventiveDosingBanner({
  alert,
  isApplied,
  onToggleApplied,
  disabled = false,
}: WeatherPreventiveDosingBannerProps) {
  const getBadgeStyle = () => {
    switch (alert.alert_type) {
      case 'ACID_RAIN_BUFFER':
        return {
          icon: CloudRain,
          badgeLabel: '⛈️ Alerta Chuva Ácida (48h)',
          bannerBg: 'bg-gradient-to-r from-amber-950/80 via-slate-900 to-amber-950/40 border-amber-800/80 text-amber-200',
          accentColor: 'text-amber-400',
          boxBg: 'bg-amber-950/50 border-amber-800/60',
          checkColor: 'text-amber-400 bg-amber-500/20 border-amber-500',
        };
      case 'ALGAE_BLOOM_PREVENTION':
        return {
          icon: Sun,
          badgeLabel: '🦠 Risco de Algas / Calor (48h)',
          bannerBg: 'bg-gradient-to-r from-lime-950/80 via-slate-900 to-lime-950/40 border-lime-800/80 text-lime-200',
          accentColor: 'text-lime-400',
          boxBg: 'bg-lime-950/50 border-lime-800/60',
          checkColor: 'text-lime-400 bg-lime-500/20 border-lime-500',
        };
      case 'CURING_PROTECTION':
      default:
        return {
          icon: ShieldAlert,
          badgeLabel: '🛡️ Proteção de Cura Jhoston',
          bannerBg: 'bg-gradient-to-r from-rose-950/80 via-slate-900 to-rose-950/40 border-rose-800/80 text-rose-200',
          accentColor: 'text-rose-400',
          boxBg: 'bg-rose-950/50 border-rose-800/60',
          checkColor: 'text-rose-400 bg-rose-500/20 border-rose-500',
        };
    }
  };

  const style = getBadgeStyle();
  const IconComponent = style.icon;

  return (
    <div className={`p-4 rounded-2xl border shadow-xl transition space-y-3 ${style.bannerBg}`}>
      {/* Top Header */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-700/60 text-white shadow-inner">
            <IconComponent className={`w-5 h-5 ${style.accentColor}`} />
          </div>
          <div>
            <span className="text-[11px] font-black uppercase tracking-wider block">
              {style.badgeLabel}
            </span>
            <p className="text-[10px] text-slate-300 font-mono">
              Previsão: {alert.forecast_time_window}
            </p>
          </div>
        </div>

        <span className="px-2 py-0.5 rounded-full text-[9px] font-black tracking-wider uppercase bg-slate-900 border border-slate-700 text-slate-300">
          Gravidade {alert.severity}
        </span>
      </div>

      {/* Instrução Estequiométrica do Core */}
      <div className={`p-3 rounded-xl border flex items-start gap-3 ${style.boxBg}`}>
        <Beaker className={`w-5 h-5 mt-0.5 shrink-0 ${style.accentColor}`} />
        <div className="space-y-1 text-xs">
          <p className="font-bold text-white leading-snug">
            {alert.instruction_text}
          </p>
          <p className="text-[11px] text-slate-300">
            Dosagem calculada: <strong>{alert.recommended_dosage}{alert.dosage_unit}</strong> de{' '}
            <span className="underline decoration-dotted">{alert.recommended_chemical_name}</span>.
          </p>
        </div>
      </div>

      {/* Checkbox de Aplicação Preventiva Realizada */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => onToggleApplied(!isApplied)}
        className={`w-full flex items-center justify-between gap-3 p-3 rounded-xl border text-left transition ${
          isApplied
            ? 'bg-slate-900/95 border-emerald-500/80 text-emerald-300 ring-2 ring-emerald-500/30'
            : 'bg-slate-950/60 border-slate-700/80 text-slate-300 hover:border-slate-500'
        } ${disabled ? 'opacity-60 cursor-not-allowed' : 'active:scale-[0.99]'}`}
      >
        <div className="flex items-center gap-2.5">
          <div className={`w-5 h-5 rounded flex items-center justify-center transition border ${
            isApplied ? 'bg-emerald-600 border-emerald-400 text-white' : 'border-slate-600 bg-slate-800'
          }`}>
            {isApplied ? (
              <CheckSquare className="w-4 h-4" />
            ) : (
              <Square className="w-4 h-4 text-transparent" />
            )}
          </div>
          <div>
            <span className="text-xs font-black block">
              Aplicação preventiva climática realizada
            </span>
            <span className="text-[10px] text-slate-400">
              {isApplied
                ? `Dosagem de ${alert.recommended_dosage}${alert.dosage_unit} confirmada no laudo técnico`
                : 'Marque após dosar o produto para dar baixa e debitar'}
            </span>
          </div>
        </div>

        {isApplied && (
          <span className="text-[10px] font-bold bg-emerald-950 border border-emerald-800 text-emerald-400 px-2 py-0.5 rounded-full">
            Pronto
          </span>
        )}
      </button>
    </div>
  );
}

