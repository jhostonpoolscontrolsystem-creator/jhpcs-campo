import { UserRole } from '@/types/database';

export interface RolePermissions {
  canAccessMasterSettings: boolean;
  canViewGlobalBI: boolean;
  canAuditRedZones: boolean;
  canSuspendWarranty: boolean;
  canManageMaintainers: boolean;
  canApproveChemicalPurchases: boolean;
  canInsertMaintenanceLogs: boolean;
  canViewFinancials: boolean;
  scope: 'GLOBAL' | 'CLIENT_ONLY' | 'ASSIGNED_POOLS_ONLY';
}

export const ROLE_DEFINITIONS: Record<UserRole, { label: string; description: string; permissions: RolePermissions }> = {
  MASTER: {
    label: 'Master (Administração Geral)',
    description: 'Acesso absoluto ao ecossistema. Gerencia instâncias WhatsApp, parametriza o motor químico e credenciais executivas.',
    permissions: {
      canAccessMasterSettings: true,
      canViewGlobalBI: true,
      canAuditRedZones: true,
      canSuspendWarranty: true,
      canManageMaintainers: true,
      canApproveChemicalPurchases: true,
      canInsertMaintenanceLogs: true,
      canViewFinancials: true,
      scope: 'GLOBAL',
    },
  },

  DIRETORIA_JH: {
    label: 'Diretoria JHostonTec',
    description: 'Visão executiva e analítica (Dashboards BI). Acompanha KPIs de saúde da marca, conformidade global e SLAs.',
    permissions: {
      canAccessMasterSettings: false,
      canViewGlobalBI: true,
      canAuditRedZones: true,
      canSuspendWarranty: true,
      canManageMaintainers: false,
      canApproveChemicalPurchases: false,
      canInsertMaintenanceLogs: false,
      canViewFinancials: true,
      scope: 'GLOBAL',
    },
  },

  TECNICO_JH: {
    label: 'Equipe Técnica JHostonTec',
    description: 'Visão tática e pericial. Atua nas Red Zones (piscinas em risco), emite laudos periciais e revalida/suspende garantias.',
    permissions: {
      canAccessMasterSettings: false,
      canViewGlobalBI: false,
      canAuditRedZones: true,
      canSuspendWarranty: true,
      canManageMaintainers: true,
      canApproveChemicalPurchases: false,
      canInsertMaintenanceLogs: false,
      canViewFinancials: false,
      scope: 'GLOBAL',
    },
  },

  GERENCIA_CLI: {
    label: 'Gerência do Cliente (Síndico / Dono / Gerente Geral)',
    description: 'O proprietário do ativo (B2B/B2C). Acompanha a saúde da piscina, compra insumos químicos e recebe laudos mensais de garantia.',
    permissions: {
      canAccessMasterSettings: false,
      canViewGlobalBI: false,
      canAuditRedZones: false,
      canSuspendWarranty: false,
      canManageMaintainers: true,
      canApproveChemicalPurchases: true,
      canInsertMaintenanceLogs: false,
      canViewFinancials: true,
      scope: 'CLIENT_ONLY',
    },
  },

  TECNICO_CLI: {
    label: 'Equipe Técnica do Cliente (Zelador / Chefe de Manutenção)',
    description: 'Interface operacional B2B entre a gerência do hotel e o tratador. Valida estoques físicos e autoriza intervenções na casa de máquinas.',
    permissions: {
      canAccessMasterSettings: false,
      canViewGlobalBI: false,
      canAuditRedZones: false,
      canSuspendWarranty: false,
      canManageMaintainers: false,
      canApproveChemicalPurchases: false,
      canInsertMaintenanceLogs: true,
      canViewFinancials: false,
      scope: 'CLIENT_ONLY',
    },
  },

  PISCINEIRO: {
    label: 'Piscineiro / Tratador (Prestador de Serviço)',
    description: 'Operacional restrito (PWA de Campo). Insere coletas do dia atual com câmera in-app e GPS. Sem acesso comercial ou financeiro.',
    permissions: {
      canAccessMasterSettings: false,
      canViewGlobalBI: false,
      canAuditRedZones: false,
      canSuspendWarranty: false,
      canManageMaintainers: false,
      canApproveChemicalPurchases: false,
      canInsertMaintenanceLogs: true,
      canViewFinancials: false,
      scope: 'ASSIGNED_POOLS_ONLY',
    },
  },
};
