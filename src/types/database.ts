export type UserRole =
  | 'MASTER'
  | 'DIRETORIA_JH'
  | 'TECNICO_JH'
  | 'GERENCIA_CLI'
  | 'TECNICO_CLI'
  | 'PISCINEIRO';

export type FacilityType = 'PESSOA_FISICA' | 'HOTEL' | 'RESORT';

export type PoolStatus =
  | 'DRY_CURE'             // Cura a seco (primeiros 7 dias)
  | 'STARTUP'              // Processo de inicialização e abastecimento
  | 'SUBMERGED_CURE'       // Cura submersa (28 dias)
  | 'NORMAL'               // Parâmetros ideais e garantia ativa
  | 'RED_ZONE'             // Risco crítico de corrosão ou desequilíbrio grave
  | 'WARRANTY_SUSPENDED';  // Violação fatal das diretrizes (ex: uso de ácido/limpa pedras)

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  cpf?: string;
  role: UserRole;
  created_at: string;
}

export type SubscriptionTier = 'STANDARD' | 'PRO_EXECUTIVE' | 'BLACK_ELITE';
export type SubscriptionStatus = 'TRIAL_ACTIVE' | 'TRIAL_ENDING' | 'ACTIVE_PAID' | 'EXTENSION_REQUESTED' | 'STANDARD_FREE';

export interface Pool {
  id: string;
  name: string;
  owner_id: string;
  facility_type: FacilityType;
  volume_m3: number;
  pump_flow_m3_h: number;
  gps_lat: number;
  gps_lng: number;
  application_date: string;
  status: PoolStatus;
  created_at: string;
  finish_type?: string;
  substrate_type?: string;
  owner?: User;
  // Campos de Assinatura & Degustação VIP
  subscription_tier?: SubscriptionTier;
  subscription_status?: SubscriptionStatus;
  trial_started_at?: string;
  trial_ends_at?: string;
  trial_extension_months?: number; // 0 a 3 meses
  trial_extension_reason?: string;
  trial_approved_by_director?: boolean;
  client_choice_plan?: SubscriptionTier;
  client_choice_at?: string;
  // Campos de Garantia & Extensão Bienal (02 Anos)
  warranty_years?: number; // Padrão: 2 anos
  warranty_extended_years?: number; // Extensões adicionais (ex: +1 ou +2 anos)
  warranty_extension_status?: 'STANDARD_ACTIVE' | 'EXTENSION_AVAILABLE' | 'EXTENSION_REQUESTED' | 'EXTENSION_ACTIVE' | 'EXPIRED';
  warranty_extension_requested_at?: string;
}

export interface Product {
  id: string;
  name: string;
  category: 'SANITIZANTE' | 'ALCALINIZANTE' | 'REDUTOR_PH' | 'SEQUESTRANTE_METAL' | 'LIMPA_BORDA';
  unit_of_measure: 'KG' | 'LITROS';
  estimated_dose_per_m3: number;
}

export interface PoolInventory {
  pool_id: string;
  product_id: string;
  current_balance: number;
  projected_days_remaining: number;
  min_alert_threshold: number;
  last_updated: string;
  product?: Product;
}

export interface MaintenanceLog {
  id: string;
  pool_id: string;
  maintainer_id?: string;
  log_date: string;
  ph: number;
  chlorine_ppm: number;
  alkalinity_ppm?: number;
  calcium_hardness_ppm?: number;
  brushed_surface: boolean;
  backwashed_filter: boolean;
  acid_product_used: boolean;
  weather_condition_at_log?: string;
  calculation_memory?: {
    formula: string;
    volume_m3: number;
    dose_used: number;
    total_debited: number;
    unit: string;
  };
  liability_accepted: boolean;
  is_audit_flagged: boolean;
  flag_reason?: string;
  created_at: string;
  pool?: Pool;
  maintainer?: User;
  evidences?: ServiceEvidence[];
}

export interface ServiceEvidence {
  id: string;
  log_id: string;
  evidence_type: 'FOTO_PISCINA_PANORAMICA' | 'FOTO_TESTE_AGUA' | 'OCORRENCIA_GERAL';
  photo_url: string;
  gps_lat: number;
  gps_lng: number;
  captured_at: string;
}

export interface Task {
  id: string;
  pool_id: string;
  assigned_to_user_id?: string;
  task_type: 'FOLLOW_UP_MENSAL' | 'TRATAR_RED_ZONE' | 'COMPRA_INSUMOS';
  title: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELED';
  due_date: string;
  completed_at?: string;
  resolution_notes?: string;
  created_at: string;
  pool?: Pool;
  assigned_to?: User;
}

export interface ChemicalAuditResult {
  isRedZone: boolean;
  isWarrantySuspended: boolean;
  newStatus: PoolStatus;
  flags: string[];
  recommendedAction: string;
  shouldNotifyWhatsApp: boolean;
  messagePreview?: string;
}
