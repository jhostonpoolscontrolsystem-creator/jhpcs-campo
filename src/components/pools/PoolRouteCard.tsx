'use client';

import React from 'react';
import { 
  CloudRain, 
  Sun, 
  ShieldAlert, 
  MapPin, 
  ArrowRight, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  FileText,
  Navigation,
  Compass
} from 'lucide-react';
import { Pool } from '@/types/database';
import { PoolWeatherAlert } from '@/types/weatherAlerts';
import { triggerHaptic } from '@/lib/ui/haptics';

interface PoolRouteCardProps {
  pool: Pool & { distanceMeters: number; visitStatus: 'CONCLUIDA' | 'RISCO' | 'PENDENTE' };
  isNext: boolean;
  distFormatted: string;
  activeAlert?: PoolWeatherAlert;
  onSelectPoolToMaintain: (poolId: string) => void;
  onOpenPoolReports?: (pool: Pool) => void;
}

export function PoolRouteCard({
  pool,
  isNext,
  distFormatted,
  activeAlert,
  onSelectPoolToMaintain,
  onOpenPoolReports,
}: PoolRouteCardProps) {
  // Configuração visual do Badge Preditivo Climático (48h)
  const getAlertBadgeConfig = (alert: PoolWeatherAlert) => {
    switch (alert.alert_type) {
      case 'ACID_RAIN_BUFFER':
        return {
          icon: CloudRain,
          label: '⛈️ Alerta Chuva Ácida (48h)',
          badgeColor: 'bg-amber-950 border-amber-800 text-amber-300',
          desc: 'Tamponamento preventivo de alcalinidade necessário',
        };
      case 'ALGAE_BLOOM_PREVENTION':
        return {
          icon: Sun,
          label: '🦠 Risco de Algas / Calor (48h)',
          badgeColor: 'bg-lime-950 border-lime-800 text-lime-300',
          desc: 'Reforço preventivo de desinfecção sob UV extremo',
        };
      case 'CURING_PROTECTION':
        return {
          icon: ShieldAlert,
          label: '🛡️ Proteção de Cura Jhoston',
          badgeColor: 'bg-red-950 border-red-800 text-red-300',
          desc: 'Obra em cura química: evitar lixiviação ácida',
        };
      default:
        return {
          icon: AlertTriangle,
          label: '⚠️ Alerta Climático Preditivo',
          badgeColor: 'bg-slate-900 border-slate-700 text-slate-300',
          desc: alert.title,
        };
    }
  };

  const alertBadge = activeAlert ? getAlertBadgeConfig(activeAlert) : null;
  const AlertIcon = alertBadge?.icon;

  return (
    <div
      className={`bg-slate-900/90 border rounded-2xl p-4 transition-all shadow-sm space-y-3 ${
        activeAlert?.severity === 'CRITICA' || pool.visitStatus === 'RISCO'
          ? 'border-red-800/80 bg-red-950/20'
          : activeAlert
          ? 'border-amber-500/50 bg-slate-900'
          : isNext
          ? 'border-cyan-500/70 shadow-lg shadow-cyan-500/10'
          : 'border-slate-800'
      }`}
    >
      {/* Header do Card */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-semibold text-slate-400">
              {pool.facility_type || 'PISCINA'}
            </span>
            {isNext && (
              <span className="text-[9px] bg-cyan-500 text-slate-950 font-black px-1.5 py-0.5 rounded animate-pulse">
                Mais Próxima
              </span>
            )}
          </div>
          <h4 className="text-sm font-bold text-white mt-1 leading-snug">{pool.name}</h4>
        </div>

        {/* Badge de Status da Visita */}
        <div>
          {pool.visitStatus === 'CONCLUIDA' && (
            <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-emerald-950 border border-emerald-800 text-emerald-300 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Concluída
            </span>
          )}
          {pool.visitStatus === 'RISCO' && (
            <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-red-950 border border-red-800 text-red-300 flex items-center gap-1 animate-pulse">
              <AlertTriangle className="w-3 h-3" /> Em Risco
            </span>
          )}
          {pool.visitStatus === 'PENDENTE' && (
            <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-slate-950 border border-slate-800 text-amber-400 flex items-center gap-1">
              <Clock className="w-3 h-3" /> Pendente
            </span>
          )}
        </div>
      </div>

      {/* BADGE DE ALERTA CLIMÁTICO PREDITIVO (48H) */}
      {activeAlert && alertBadge && AlertIcon && (
        <div className={`p-2.5 rounded-xl border text-xs space-y-1 ${alertBadge.badgeColor}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-bold">
              <AlertIcon className="w-4 h-4 shrink-0" />
              <span>{alertBadge.label}</span>
            </div>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-black/40">
              {activeAlert.forecast_time_window}
            </span>
          </div>
          <p className="text-[11px] opacity-90 leading-tight">
            💡 <strong>Recomendação:</strong> {activeAlert.instruction_text}
          </p>
        </div>
      )}

      {/* Dados Técnicos e Distância */}
      <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-slate-800/80 font-mono">
        <div className="flex items-center gap-1.5 text-cyan-400">
          <MapPin className="w-3.5 h-3.5" />
          <span>Distância: <strong>{distFormatted}</strong></span>
        </div>
        <div>
          <span>Volume: <strong>{pool.volume_m3} m³</strong></span>
        </div>
      </div>

      {/* Botões de Ação: Iniciar Atendimento e Relatórios */}
      <div className="grid grid-cols-3 gap-2 pt-1">
        <button
          type="button"
          onClick={() => {
            triggerHaptic('medium');
            onSelectPoolToMaintain(pool.id);
          }}
          className={`col-span-2 min-h-[52px] py-3 rounded-2xl font-black text-xs uppercase tracking-tight flex items-center justify-center gap-2 transition active:scale-[0.98] ${
            pool.visitStatus === 'CONCLUIDA'
              ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-2 border-slate-700'
              : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:opacity-95 text-white shadow-lg shadow-cyan-500/25 border-2 border-cyan-400/40'
          }`}
        >
          <span>{pool.visitStatus === 'CONCLUIDA' ? 'Revisar Laudo' : 'Iniciar Atendimento'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => {
            triggerHaptic('light');
            if (onOpenPoolReports) onOpenPoolReports(pool);
          }}
          className="min-h-[52px] py-3 rounded-2xl bg-slate-950 hover:bg-slate-850 border-2 border-slate-800 hover:border-cyan-700 text-cyan-300 font-black text-xs uppercase tracking-tight flex items-center justify-center gap-1.5 transition active:scale-[0.98]"
          title="Central de Relatórios & Fechamento Mensal"
        >
          <FileText className="w-4 h-4 text-cyan-400" />
          <span>Relatórios</span>
        </button>
      </div>
    </div>
  );
}

