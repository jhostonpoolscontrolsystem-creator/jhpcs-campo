import { ChemicalAuditResult, MaintenanceLog, Pool } from '@/types/database';

/**
 * Motor de Regras Químicas Hard-Coded da JHostonTec
 * 
 * Regras estritas:
 * 1. Proibição de Ácidos / Limpa Pedras: Regra letal -> muda status para WARRANTY_SUSPENDED
 * 2. pH Ideal (7.4 - 7.6): Se < 7.0 -> FLAG de Red Zone imediato (Risco de Corrosão do Revestimento Monolítico)
 * 3. Notificação via WhatsApp em menos de 10s para JHostonTec e Cliente
 */
export function evaluateChemicalRules(
  log: Pick<MaintenanceLog, 'ph' | 'chlorine_ppm' | 'alkalinity_ppm' | 'acid_product_used'>,
  pool: Pick<Pool, 'name' | 'volume_m3' | 'status'>
): ChemicalAuditResult {
  const flags: string[] = [];
  let isRedZone = false;
  let isWarrantySuspended = false;
  let newStatus = pool.status;
  let recommendedAction = 'Parâmetros dentro do padrão estipulado pela JHostonTec.';

  // Regra Letal 1: Uso de Ácido / Limpa Pedras
  if (log.acid_product_used) {
    isWarrantySuspended = true;
    newStatus = 'WARRANTY_SUSPENDED';
    flags.push('VIOLAÇÃO GRAVE: Utilização de produto ácido / limpa-pedras detectada.');
    recommendedAction = 'GARANTIA SUSPENSA IMEDIATAMENTE. Interromper banho e enviar vistoria técnica da JHostonTec.';
  }

  // Regra Crítica 2: Risco de Corrosão por pH Ácido (< 7.0)
  if (log.ph < 7.0) {
    isRedZone = true;
    if (!isWarrantySuspended) {
      newStatus = 'RED_ZONE';
    }
    flags.push(`pH CRÍTICO (${log.ph.toFixed(1)}): Risco de ataque químico e dissolução do revestimento monolítico.`);
    recommendedAction = 'Elevação emergencial da alcalinidade e pH com dosagem calculada de Bicarbonato de Sódio / Barrilha leve.';
  } else if (log.ph > 7.8) {
    flags.push(`pH Elevado (${log.ph.toFixed(1)}): Risco de incrustação e perda de eficiência do cloro.`);
  }

  // Regra 3: Cloro Livre (Ideal 1.0 a 3.0 ppm)
  if (log.chlorine_ppm < 1.0) {
    flags.push(`Cloro abaixo do mínimo (${log.chlorine_ppm.toFixed(1)} ppm): Risco de contaminação biológica.`);
  } else if (log.chlorine_ppm > 5.0) {
    flags.push(`Supercloração (${log.chlorine_ppm.toFixed(1)} ppm): Monitorar descoloração superficial.`);
  }

  // Regra 4: Alcalinidade Total (Ideal 80 - 120 ppm)
  if (log.alkalinity_ppm !== undefined) {
    if (log.alkalinity_ppm < 80) {
      flags.push(`Alcalinidade baixa (${log.alkalinity_ppm} ppm): Instabilidade do pH (efeito rebote).`);
    } else if (log.alkalinity_ppm > 140) {
      flags.push(`Alcalinidade alta (${log.alkalinity_ppm} ppm): Risco de eflorescência e água turva.`);
    }
  }

  const shouldNotifyWhatsApp = isRedZone || isWarrantySuspended;
  let messagePreview: string | undefined;

  if (isWarrantySuspended) {
    messagePreview = `🚨 RED ZONE: ${pool.name} | Falha: Check-in de Limpa Pedras / Ácido. Garantia Suspensa. Analisar perda de garantia.`;
  } else if (isRedZone) {
    messagePreview = `🚨 JHoston Pools Informa: Detectamos pH de risco (${log.ph.toFixed(1)}) na piscina ${pool.name}. Orientamos intervenção imediata para proteção do revestimento.`;
  }

  return {
    isRedZone,
    isWarrantySuspended,
    newStatus,
    flags,
    recommendedAction,
    shouldNotifyWhatsApp,
    messagePreview,
  };
}

/**
 * Memória de Cálculo de Insumos (Dedução transparente de estoque)
 */
export function calculateChemicalDose(
  productCategory: 'SANITIZANTE' | 'ALCALINIZANTE' | 'REDUTOR_PH',
  currentValue: number,
  targetValue: number,
  volumeM3: number
) {
  let standardDosePerM3 = 0;
  let unit = 'g';

  switch (productCategory) {
    case 'ALCALINIZANTE':
      // Ex: Cada 17g/m³ eleva a alcalinidade em 10 ppm
      const diffAlkalinity = Math.max(0, targetValue - currentValue);
      standardDosePerM3 = (diffAlkalinity / 10) * 17;
      unit = 'g';
      break;
    case 'SANITIZANTE':
      // Ex: 4g/m³ de cloro granulado 65% eleva em ~2.6 ppm
      const diffChlorine = Math.max(0, targetValue - currentValue);
      standardDosePerM3 = diffChlorine * 2;
      unit = 'g';
      break;
    case 'REDUTOR_PH':
      const diffPh = Math.max(0, currentValue - targetValue);
      standardDosePerM3 = diffPh * 10; // 10 ml/m³ para cada 0.1 de redução
      unit = 'ml';
      break;
  }

  const totalDose = Math.round(standardDosePerM3 * volumeM3);

  return {
    formula: `[Dose Padrão (${standardDosePerM3.toFixed(2)}${unit}/m³)] × [Volume (${volumeM3}m³)]`,
    dosePerM3: standardDosePerM3,
    volumeM3,
    totalDebited: totalDose,
    unit,
  };
}
