/**
 * Motor de Sincronização Offline do PWA (Sync Engine)
 * Sincroniza laudos pendentes, busca atualizações de rotas e baixa os
 * Alertas Meteorológicos Preditivos (48h) gerados pelo Core v6.0.
 */

import { 
  getPendingOfflineLogs, 
  removeOfflineLog, 
  savePredictiveAlertsOffline,
  getPredictiveAlertsOffline,
  MaintenanceLogPayload 
} from '@/lib/offline-db';
import { PoolWeatherAlert } from '@/types/weatherAlerts';

export interface SyncEngineResult {
  success: boolean;
  syncedLogsCount: number;
  weatherAlertsCount: number;
  lastSyncTimestamp: string;
  error?: string;
}

/**
 * Executa a sincronização completa matinal ou sob demanda
 */
export async function runFullOfflineSync(): Promise<SyncEngineResult> {
  const result: SyncEngineResult = {
    success: true,
    syncedLogsCount: 0,
    weatherAlertsCount: 0,
    lastSyncTimestamp: new Date().toISOString(),
  };

  if (!navigator.onLine) {
    result.success = false;
    result.error = 'Aparelho sem conexão com a internet.';
    return result;
  }

  // 1. TRANSMISSÃO DE LAUDOS PENDENTES NA FILA
  try {
    const pendingLogs = await getPendingOfflineLogs();
    if (pendingLogs.length > 0) {
      console.log(`[Sync Engine] Transmitindo ${pendingLogs.length} laudos locais ao Core...`);
      for (const log of pendingLogs) {
        const res = await fetch('/api/maintenance/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(log),
        });

        if (res.ok) {
          await removeOfflineLog(log.id);
          result.syncedLogsCount++;
        }
      }
    }
  } catch (err: any) {
    console.warn('[Sync Engine] Falha parcial na submissão de laudos:', err.message);
  }

  // 2. SINCRONIZAÇÃO DE ALERTAS METEOROLÓGICOS PREDITIVOS (48H) DO CORE
  try {
    console.log('[Sync Engine] Baixando alertas meteorológicos preditivos (48h)...');
    const res = await fetch('/api/v1/pwa/weather-alerts');
    const data = await res.json();

    if (data.success && Array.isArray(data.alerts)) {
      await savePredictiveAlertsOffline(data.alerts);
      result.weatherAlertsCount = data.alerts.length;
      console.log(`[Sync Engine] ${data.alerts.length} alertas climáticos gravados no IndexedDB.`);
    }
  } catch (err: any) {
    console.warn('[Sync Engine] Falha ao sincronizar alertas climáticos:', err.message);
  }

  return result;
}

