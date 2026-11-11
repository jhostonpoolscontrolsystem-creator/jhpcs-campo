/**
 * Substratos de Piscinas Suportados no Ecossistema JHPCS PoolTech
 */
export type PoolSubstrateType =
  | 'MONOLITICO_SAND'      // Revestimento Monolítico Sand & Quartzo JHoston
  | 'FIBRA_VIDRO'          // Fibra de Vidro (Gelcoat)
  | 'VINIL'                // Bolsão de Vinil
  | 'PASTILHA_CERAMICA'    // Pastilha de Vidro / Porcelana / Azulejo
  | 'ALVENARIA_PINTADA';   // Pintura Epóxi / Borracha Clorada

export interface SubstrateTolerance {
  label: string;
  warning: string;
  idealPhMin: number;
  idealPhMax: number;
  criticalPhMin: number;
  idealAlkalinityMin: number;
  idealAlkalinityMax: number;
  idealCalciumMin: number;
  idealCalciumMax: number;
  idealLsiMin: number;
  idealLsiMax: number;
  allowedAcid: boolean;
  notes: string;
}

export const SUBSTRATE_PROFILES: Record<PoolSubstrateType, SubstrateTolerance> = {
  MONOLITICO_SAND: {
    label: 'Monolítico Areia & Quartzo',
    warning: 'Proibido ácido muriático direto e pastilhas no fundo. Mantenha pH entre 7.2 e 7.6.',
    idealPhMin: 7.2,
    idealPhMax: 7.6,
    criticalPhMin: 7.0,
    idealAlkalinityMin: 80,
    idealAlkalinityMax: 120,
    idealCalciumMin: 200,
    idealCalciumMax: 400,
    idealLsiMin: -0.3,
    idealLsiMax: 0.3,
    allowedAcid: false,
    notes: 'Tolerância zero a ácidos fortes (muriático). Risco de dissolução da matriz de quartzo.',
  },
  FIBRA_VIDRO: {
    label: 'Fibra de Vidro',
    warning: 'Monitore Dureza Cálcica mínima para evitar osmose ou branqueamento do gelcoat.',
    idealPhMin: 7.2,
    idealPhMax: 7.6,
    criticalPhMin: 6.8,
    idealAlkalinityMin: 80,
    idealAlkalinityMax: 120,
    idealCalciumMin: 180,
    idealCalciumMax: 300,
    idealLsiMin: -0.4,
    idealLsiMax: 0.2,
    allowedAcid: false,
    notes: 'Exige dureza cálcica adequada para não desbotar ou branquear o gelcoat.',
  },
  VINIL: {
    label: 'Bolsão de Vinil',
    warning: 'Dilua o cloro granulado antes de aplicar. Proibido sulfato de cobre.',
    idealPhMin: 7.2,
    idealPhMax: 7.6,
    criticalPhMin: 7.0,
    idealAlkalinityMin: 100,
    idealAlkalinityMax: 150,
    idealCalciumMin: 150,
    idealCalciumMax: 250,
    idealLsiMin: -0.3,
    idealLsiMax: 0.3,
    allowedAcid: false,
    notes: 'Proibido cloro granulado não dissolvido direto no fundo para evitar descoloração e furos.',
  },
  PASTILHA_CERAMICA: {
    label: 'Pastilha Cerâmica',
    warning: 'Mantenha pH >= 7.4 para evitar corrosão do rejunte cimentício.',
    idealPhMin: 7.2,
    idealPhMax: 7.8,
    criticalPhMin: 6.8,
    idealAlkalinityMin: 80,
    idealAlkalinityMax: 120,
    idealCalciumMin: 200,
    idealCalciumMax: 400,
    idealLsiMin: -0.3,
    idealLsiMax: 0.4,
    allowedAcid: false,
    notes: 'pH ácido dissolve o rejunte cimentício causando soltura de pastilhas.',
  },
  ALVENARIA_PINTADA: {
    label: 'Alvenaria Pintada (Epóxi)',
    warning: 'Evite supercloração direta nas paredes pintadas para evitar descascamento precoce.',
    idealPhMin: 7.2,
    idealPhMax: 7.6,
    criticalPhMin: 6.8,
    idealAlkalinityMin: 80,
    idealAlkalinityMax: 120,
    idealCalciumMin: 180,
    idealCalciumMax: 350,
    idealLsiMin: -0.3,
    idealLsiMax: 0.3,
    allowedAcid: false,
    notes: 'Respeitar equilíbrio LSI para evitar descascamento prematuro da película de tinta.',
  },
};

/**
 * Calcula o Índice de Saturação de Langelier (ISL / LSI)
 */
export function calculateLSI(params: {
  ph: number;
  tempC?: number;
  alkalinityPpm?: number;
  calciumHardnessPpm?: number;
  tdsPpm?: number;
}) {
  const temp = params.tempC ?? 26;
  const alk = params.alkalinityPpm ?? 100;
  const calc = params.calciumHardnessPpm ?? 250;
  const tds = params.tdsPpm ?? 1000;

  const a = (Math.log10(tds) - 1) / 10;
  const b = -13.12 * Math.log10(temp + 273) + 34.55;
  const c = Math.log10(calc) - 0.4;
  const d = Math.log10(Math.max(1, alk));
  const phs = (9.3 + a + b) - (c + d);
  const lsi = params.ph - phs;

  let classification: 'CORROSIVO_AGRESSIVO' | 'EQUILIBRADO' | 'INCRUSTANTE' = 'EQUILIBRADO';
  if (lsi < -0.3) classification = 'CORROSIVO_AGRESSIVO';
  else if (lsi > 0.3) classification = 'INCRUSTANTE';

  return {
    lsi: Number(lsi.toFixed(2)),
    phs: Number(phs.toFixed(2)),
    classification,
    isSafe: Math.abs(lsi) <= 0.3,
  };
}

