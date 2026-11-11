import { openDB, DBSchema } from 'idb';
import { PoolSubstrateType } from './substrate-rules';
import { PoolWeatherAlert } from '@/types/weatherAlerts';

export interface AppliedProductPayload {
  sku: string;
  name?: string;
  quantityUsed: number;
  unidade?: string;
  precoPadraoBrl?: number;
}

export interface MaintenanceLogPayload {
  id: string;
  pool_id: string;
  maintainer_id: string;
  target_sector?: string; // 'AUTONOMO' | 'FROTA' | 'HOTEL_CLUBE' | 'FABRICANTE'
  substrate_type?: PoolSubstrateType;
  ph: number;
  chlorine_ppm: number;
  alkalinity_ppm?: number;
  calcium_hardness?: number;
  temperature_c?: number;
  isl_value?: number;
  isl_status?: string;

  // NBR 10.818 / ANVISA (Modo Facility)
  facility_shift?: 'MANHA' | 'TARDE' | 'NOITE';
  chlorine_combined_ppm?: number;
  water_transparency?: 'CRISTALINA' | 'TURVA' | 'VERDE' | 'OPACA';
  bathers_count?: number;
  filter_pressure_psi?: number;
  prefilter_cleaned?: boolean;

  // Alerta Meteorológico Preditivo 48h
  acknowledgedAlertId?: string;
  preventiveApplicationDone?: boolean;

  // Modo Fabricante / Garantia Jhoston
  machine_room_tag?: string;
  cure_days?: number;
  cure_status?: 'CURING_28D' | 'WARRANTY_ACTIVE' | 'EXPIRED';
  monolith_integrity?: 'PERFEITA' | 'FISSURA_LEVE' | 'REQUER_PERICIA';

  acid_product_used: boolean;
  brushed_surface: boolean;
  backwashed_filter: boolean;
  liability_accepted: boolean;
  gps_lat: number;
  gps_lng: number;
  geofence_flag?: boolean;
  geofence_distance_m?: number;
  geofence_justification?: string;
  signature_data_url?: string;
  signatory_name?: string;
  productsApplied?: AppliedProductPayload[];
  white_label_brand?: string;
  white_label_whatsapp?: string;
  evidences: Array<{
    evidence_type: string;
    photo_url?: string;
    photo_base64?: string;
    gps_lat: number;
    gps_lng: number;
    captured_at: string;
    provider?: string;
  }>;
  created_at: string;
  synced: boolean;
}

interface JHPCSOfflineDB extends DBSchema {
  maintenance_queue: {
    key: string;
    value: MaintenanceLogPayload;
  };
  technician_profile: {
    key: string;
    value: {
      key: string;
      brandName: string;
      whatsapp: string;
      pixKey?: string;
      monthlyPriceBrl?: number;
      updated_at: string;
    };
  };
  predictive_alerts: {
    key: string;
    value: PoolWeatherAlert;
  };
}

const DB_NAME = 'jhpcs-offline-store';
const DB_VERSION = 3;

export async function getOfflineDB() {
  return openDB<JHPCSOfflineDB>(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion) {
      if (!db.objectStoreNames.contains('maintenance_queue')) {
        db.createObjectStore('maintenance_queue', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('technician_profile')) {
        db.createObjectStore('technician_profile', { keyPath: 'key' });
      }
      if (!db.objectStoreNames.contains('predictive_alerts')) {
        db.createObjectStore('predictive_alerts', { keyPath: 'id' });
      }
    },
  });
}

/**
 * Salva a coleta no IndexedDB local caso esteja offline
 */
export async function saveOfflineMaintenanceLog(log: MaintenanceLogPayload) {
  const db = await getOfflineDB();
  await db.put('maintenance_queue', log);
  console.log('[IndexedDB] Log de manutenção enfileirado para envio offline:', log.id);
}

/**
 * Retorna todos os logs pendentes na fila de envio
 */
export async function getPendingOfflineLogs(): Promise<MaintenanceLogPayload[]> {
  const db = await getOfflineDB();
  return db.getAll('maintenance_queue');
}

/**
 * Remove o log da fila após confirmação de envio para o servidor
 */
export async function removeOfflineLog(id: string) {
  const db = await getOfflineDB();
  await db.delete('maintenance_queue', id);
}

/**
 * Salva alertas meteorológicos preditivos no IndexedDB
 */
export async function savePredictiveAlertsOffline(alerts: PoolWeatherAlert[]) {
  const db = await getOfflineDB();
  const tx = db.transaction('predictive_alerts', 'readwrite');
  for (const alert of alerts) {
    await tx.store.put(alert);
  }
  await tx.done;
}

/**
 * Retorna todos os alertas meteorológicos preditivos válidos armazenados no IndexedDB
 */
export async function getPredictiveAlertsOffline(poolId?: string): Promise<PoolWeatherAlert[]> {
  try {
    const db = await getOfflineDB();
    const allAlerts = await db.getAll('predictive_alerts');
    const now = new Date();

    return allAlerts.filter((a) => {
      const isValid = new Date(a.valid_until) > now && !a.acknowledged;
      if (poolId) {
        return isValid && a.pool_id === poolId;
      }
      return isValid;
    });
  } catch (err) {
    console.warn('Erro ao ler alertas preditivos do IndexedDB:', err);
    return [];
  }
}

/**
 * Marca um alerta como concluído/reconhecido localmente após vistoria
 */
export async function acknowledgeAlertOffline(alertId: string) {
  try {
    const db = await getOfflineDB();
    const alert = await db.get('predictive_alerts', alertId);
    if (alert) {
      alert.acknowledged = true;
      alert.acknowledged_at = new Date().toISOString();
      await db.put('predictive_alerts', alert);
    }
  } catch (err) {
    console.warn('Erro ao marcar alerta offline como concluído:', err);
  }
}
export async function saveTechnicianProfile(brandName: string, whatsapp: string, pixKey?: string, monthlyPriceBrl?: number) {
  try {
    const db = await getOfflineDB();
    await db.put('technician_profile', {
      key: 'current_profile',
      brandName,
      whatsapp,
      pixKey,
      monthlyPriceBrl,
      updated_at: new Date().toISOString(),
    });
    if (typeof window !== 'undefined') {
      localStorage.setItem('jhpcs_tech_brand', brandName);
      localStorage.setItem('jhpcs_tech_whatsapp', whatsapp);
      if (pixKey !== undefined) localStorage.setItem('jhpcs_tech_pix', pixKey);
      if (monthlyPriceBrl !== undefined) localStorage.setItem('jhpcs_tech_price', String(monthlyPriceBrl));
    }
  } catch (err) {
    console.warn('Erro ao salvar no IndexedDB, usando localStorage:', err);
    if (typeof window !== 'undefined') {
      localStorage.setItem('jhpcs_tech_brand', brandName);
      localStorage.setItem('jhpcs_tech_whatsapp', whatsapp);
      if (pixKey !== undefined) localStorage.setItem('jhpcs_tech_pix', pixKey);
      if (monthlyPriceBrl !== undefined) localStorage.setItem('jhpcs_tech_price', String(monthlyPriceBrl));
    }
  }
}

/**
 * Carrega o perfil comercial do tratador (White-Label)
 */
export async function getTechnicianProfile(): Promise<{ brandName: string; whatsapp: string; pixKey?: string; monthlyPriceBrl?: number }> {
  try {
    const db = await getOfflineDB();
    const profile = await db.get('technician_profile', 'current_profile');
    if (profile) {
      return { 
        brandName: profile.brandName, 
        whatsapp: profile.whatsapp,
        pixKey: profile.pixKey,
        monthlyPriceBrl: profile.monthlyPriceBrl
      };
    }
  } catch (err) {
    console.warn('Fallback para localStorage ao ler perfil:', err);
  }

  if (typeof window !== 'undefined') {
    const brandName = localStorage.getItem('jhpcs_tech_brand') || 'JHoston Pools Care';
    const whatsapp = localStorage.getItem('jhpcs_tech_whatsapp') || '';
    const pixKey = localStorage.getItem('jhpcs_tech_pix') || '';
    const priceStr = localStorage.getItem('jhpcs_tech_price');
    const monthlyPriceBrl = priceStr ? parseFloat(priceStr) : undefined;
    return { brandName, whatsapp, pixKey, monthlyPriceBrl };
  }

  return { brandName: 'JHoston Pools Care', whatsapp: '' };
}
