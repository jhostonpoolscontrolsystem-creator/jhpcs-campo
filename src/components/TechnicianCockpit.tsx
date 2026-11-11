'use client';

import React, { useState, useEffect } from 'react';
import { 
  Compass, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Truck, 
  Package, 
  ChevronRight, 
  Sparkles, 
  Wifi, 
  WifiOff, 
  Calendar,
  Layers,
  ArrowRight,
  ShieldCheck,
  Search,
  FileText
} from 'lucide-react';
import { Pool } from '@/types/database';
import { TargetSector } from '@/types/profiles';
import { PoolWeatherAlert } from '@/types/weatherAlerts';
import { calculateHaversineDistance } from '@/lib/geo/geofencing';
import { OFFLINE_CHEMICAL_CATALOG } from '@/lib/fiscal/offlineFiscalCatalog';
import { getPendingOfflineLogs, getPredictiveAlertsOffline } from '@/lib/offline-db';
import { PoolRouteCard } from '@/components/pools/PoolRouteCard';

export interface TruckInventoryItem {
  sku: string;
  name: string;
  unidade: string;
  initialStock: number;
  consumedToday: number;
  currentStock: number;
  criticalThreshold: number;
}

interface TechnicianCockpitProps {
  pools: Pool[];
  currentGps: { lat: number; lng: number };
  technicianName: string;
  brandName: string;
  targetSector?: TargetSector;
  onSelectPoolToMaintain: (poolId: string) => void;
  onOpenPoolReports?: (pool: Pool) => void;
}

export function TechnicianCockpit({
  pools,
  currentGps,
  technicianName,
  brandName,
  targetSector = 'AUTONOMO',
  onSelectPoolToMaintain,
  onOpenPoolReports,
}: TechnicianCockpitProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'TODOS' | 'PENDENTE' | 'CONCLUIDA' | 'RISCO'>('TODOS');
  const [completedPoolIds, setCompletedPoolIds] = useState<string[]>(['p-1']); // Ex: 1 já feita no dia
  const [activeWeatherAlerts, setActiveWeatherAlerts] = useState<PoolWeatherAlert[]>([]);

  // Estoque da Caminhonete em Tempo Real
  const [truckInventory, setTruckInventory] = useState<TruckInventoryItem[]>([
    {
      sku: 'CLORO-DICLORO-ESTAB',
      name: 'Dicloro Estabilizado 60%',
      unidade: 'kg',
      initialStock: 15.0,
      consumedToday: 3.2,
      currentStock: 11.8,
      criticalThreshold: 3.0,
    },
    {
      sku: 'BARRILHA-LEVE',
      name: 'Barrilha Leve (Elevador pH)',
      unidade: 'kg',
      initialStock: 25.0,
      consumedToday: 5.5,
      currentStock: 19.5,
      criticalThreshold: 5.0,
    },
    {
      sku: 'BICARBONATO-SODIO',
      name: 'Bicarbonato de Sódio',
      unidade: 'kg',
      initialStock: 20.0,
      consumedToday: 4.0,
      currentStock: 16.0,
      criticalThreshold: 4.0,
    },
    {
      sku: 'ALGICIDA-MANUTENCAO',
      name: 'Algicida de Manutenção',
      unidade: 'L',
      initialStock: 10.0,
      consumedToday: 1.5,
      currentStock: 8.5,
      criticalThreshold: 2.0,
    },
  ]);

  // Recalcula o consumo baseado nos logs pendentes e carrega alertas climáticos preditivos do IndexedDB
  useEffect(() => {
    getPendingOfflineLogs().then((logs) => {
      if (logs.length > 0) {
        // Marca as piscinas dos logs locais como concluídas
        const offlineCompletedIds = logs.map((l) => l.pool_id);
        setCompletedPoolIds((prev) => Array.from(new Set([...prev, ...offlineCompletedIds])));
      }
    });

    getPredictiveAlertsOffline().then((alerts) => {
      setActiveWeatherAlerts(alerts);
    });
  }, []);

  // Ordena as piscinas pela distância geográfica (Haversine)
  const poolsWithDistance = pools.map((pool) => {
    const distanceMeters = calculateHaversineDistance(
      currentGps.lat,
      currentGps.lng,
      pool.gps_lat,
      pool.gps_lng
    );

    const isCompleted = completedPoolIds.includes(pool.id);
    const isRisk = pool.status === 'RED_ZONE' || pool.status === 'WARRANTY_SUSPENDED';

    let visitStatus: 'CONCLUIDA' | 'RISCO' | 'PENDENTE' = 'PENDENTE';
    if (isCompleted) visitStatus = 'CONCLUIDA';
    else if (isRisk) visitStatus = 'RISCO';

    return {
      ...pool,
      distanceMeters,
      visitStatus,
    };
  });

  // Ordenação: primeiro as mais próximas que ainda não foram concluídas
  const sortedPools = poolsWithDistance.sort((a, b) => {
    if (a.visitStatus === 'CONCLUIDA' && b.visitStatus !== 'CONCLUIDA') return 1;
    if (a.visitStatus !== 'CONCLUIDA' && b.visitStatus === 'CONCLUIDA') return -1;
    return a.distanceMeters - b.distanceMeters;
  });

  const filteredPools = sortedPools.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (filterStatus === 'TODOS') return matchesSearch;
    return matchesSearch && p.visitStatus === filterStatus;
  });

  const totalPools = pools.length;
  const completedCount = sortedPools.filter((p) => p.visitStatus === 'CONCLUIDA').length;
  const riskCount = sortedPools.filter((p) => p.visitStatus === 'RISCO').length;
  const pendingCount = totalPools - completedCount;

  return (
    <div className="space-y-4 max-w-md mx-auto animate-fadeIn pb-8">
      {/* Banner de Boas-Vindas do Roteiro */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 p-4 rounded-3xl shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-500/20">
              <Compass className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
                <span>Roteiro de Campo</span>
                <span className="text-[10px] bg-cyan-950 text-cyan-400 px-1.5 py-0.5 rounded font-mono border border-cyan-800/40">
                  GPS Live
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                {technicianName} • <strong className="text-slate-300">{brandName}</strong>
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs font-mono font-bold text-cyan-400">
              {completedCount}/{totalPools}
            </span>
            <p className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">Concluídas</p>
          </div>
        </div>

        {/* Métricas do Dia */}
        <div className="grid grid-cols-3 gap-2 pt-1 text-center font-mono">
          <div className="bg-slate-950/80 p-2 rounded-xl border border-slate-800/80">
            <p className="text-[10px] text-slate-500">Pendentes</p>
            <p className="text-sm font-bold text-amber-400">{pendingCount} ⏳</p>
          </div>
          <div className="bg-slate-950/80 p-2 rounded-xl border border-slate-800/80">
            <p className="text-[10px] text-slate-500">Realizadas</p>
            <p className="text-sm font-bold text-emerald-400">{completedCount} ✅</p>
          </div>
          <div className="bg-slate-950/80 p-2 rounded-xl border border-slate-800/80">
            <p className="text-[10px] text-slate-500">Em Risco</p>
            <p className="text-sm font-bold text-red-400">{riskCount} 🚨</p>
          </div>
        </div>
      </div>

      {/* Saldo Atual da Caminhonete (Estoque Móvel) - Exibido apenas no Modo FROTA */}
      {targetSector === 'FROTA' && (
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-3xl space-y-2.5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-cyan-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Estoque da Caminhonete (Hoje)
              </h3>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">Baixa Estequiométrica</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            {truckInventory.map((item) => {
              const isLow = item.currentStock <= item.criticalThreshold;
              return (
                <div
                  key={item.sku}
                  className={`p-2.5 rounded-xl border flex flex-col justify-between ${
                    isLow
                      ? 'bg-red-950/30 border-red-800/80 text-red-200'
                      : 'bg-slate-950 border-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-1">
                    <span className="font-semibold truncate text-[11px] text-white" title={item.name}>
                      {item.name}
                    </span>
                    {isLow && <span className="text-[9px] text-red-400 font-bold shrink-0">Baixo</span>}
                  </div>

                  <div className="mt-1 flex items-baseline justify-between font-mono">
                    <span className="text-[10px] text-slate-500">Saldo:</span>
                    <span className={`text-xs font-bold ${isLow ? 'text-red-400' : 'text-cyan-400'}`}>
                      {item.currentStock.toFixed(1)} {item.unidade}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Roteiro Inteligente com Busca e Filtros */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-cyan-400" />
            <span>Roteiro por Proximidade (Haversine)</span>
          </h3>
        </div>

        {/* Input de Busca */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por hotel, condomínio ou cliente..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Filtros de Status */}
        <div className="flex gap-1.5 text-xs overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: 'TODOS', label: 'Todas' },
            { id: 'PENDENTE', label: 'Pendentes ⏳' },
            { id: 'RISCO', label: 'Em Risco 🚨' },
            { id: 'CONCLUIDA', label: 'Concluídas ✅' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl whitespace-nowrap font-bold text-[11px] transition border ${
                filterStatus === tab.id
                  ? 'bg-cyan-500/20 border-cyan-500/60 text-cyan-300 shadow-sm'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Lista de Cards de Piscinas com Alertas Preditivos Integrados */}
        <div className="space-y-2.5 pt-1">
          {filteredPools.map((pool, idx) => {
            const isNext = idx === 0 && pool.visitStatus !== 'CONCLUIDA';
            const distFormatted = pool.distanceMeters >= 1000
              ? `${(pool.distanceMeters / 1000).toFixed(1)} km`
              : `${pool.distanceMeters} m`;

            const activeAlert = activeWeatherAlerts.find((a) => a.pool_id === pool.id);

            return (
              <PoolRouteCard
                key={pool.id}
                pool={pool}
                isNext={isNext}
                distFormatted={distFormatted}
                activeAlert={activeAlert}
                onSelectPoolToMaintain={onSelectPoolToMaintain}
                onOpenPoolReports={onOpenPoolReports}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

