import { openDB, DBSchema } from 'idb';

interface JHPCSOfflineDB extends DBSchema {
  maintenance_queue: {
    key: string;
    value: {
      id: string;
      pool_id: string;
      maintainer_id: string;
      ph: number;
      chlorine_ppm: number;
      alkalinity_ppm?: number;
      acid_product_used: boolean;
      brushed_surface: boolean;
      backwashed_filter: boolean;
      liability_accepted: boolean;
      gps_lat: number;
      gps_lng: number;
      evidences: Array<{
        evidence_type: string;
        photo_base64: string;
        gps_lat: number;
        gps_lng: number;
        captured_at: string;
      }>;
      created_at: string;
      synced: boolean;
    };
  };
}

const DB_NAME = 'jhpcs-offline-store';
const DB_VERSION = 1;

export async function getOfflineDB() {
  return openDB<JHPCSOfflineDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('maintenance_queue')) {
        db.createObjectStore('maintenance_queue', { keyPath: 'id' });
      }
    },
  });
}

/**
 * Salva a coleta no IndexedDB local caso esteja offline
 */
export async function saveOfflineMaintenanceLog(log: JHPCSOfflineDB['maintenance_queue']['value']) {
  const db = await getOfflineDB();
  await db.put('maintenance_queue', log);
  console.log('[IndexedDB] Log de manutenção enfileirado para envio offline:', log.id);
}

/**
 * Retorna todos os logs pendentes na fila de envio
 */
export async function getPendingOfflineLogs() {
  const db = await getOfflineDB();
  return db.getAll('maintenance_queue');
}

/**
 * Remove o log da fila após confirmação de envio para o Supabase
 */
export async function removeOfflineLog(id: string) {
  const db = await getOfflineDB();
  await db.delete('maintenance_queue', id);
}
