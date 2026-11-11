import { PoolSubstrateType, SUBSTRATE_PROFILES } from '../substrate-rules';

/**
 * Motor Químico de Cálculo do Índice de Saturação de Langelier (ISL)
 * 
 * Fórmula Oficial Estequiométrica:
 * ISL = pH + TF + CF + AF - 12.1
 * Onde:
 * - pH: valor medido da água
 * - TF (Fator Temperatura): baseado em °C
 * - CF (Fator Dureza Cálcica): baseado em ppm CaCO3
 * - AF (Fator Alcalinidade Total): baseado em ppm CaCO3
 * - 12.1: Constante empírica para Sólidos Dissolvidos Totais (TDS < 1000 ppm)
 */

export interface IslCalculationResult {
  isl: number;
  status: 'CORROSIVA' | 'EQUILIBRADA' | 'INCRUSTANTE';
  statusLabel: string;
  badgeColor: string;
  description: string;
  substrateAlert: string | null;
}

// Fator Temperatura (°C)
export function getTemperatureFactor(tempC: number): number {
  if (tempC <= 0) return 0.0;
  if (tempC <= 4) return 0.1;
  if (tempC <= 8) return 0.2;
  if (tempC <= 12) return 0.3;
  if (tempC <= 16) return 0.4;
  if (tempC <= 20) return 0.5;
  if (tempC <= 24) return 0.6;
  if (tempC <= 28) return 0.7;
  if (tempC <= 32) return 0.8;
  return 0.9;
}

// Fator Dureza Cálcica (ppm)
export function getCalciumFactor(calciumPpm: number): number {
  if (calciumPpm <= 25) return 1.0;
  if (calciumPpm <= 50) return 1.3;
  if (calciumPpm <= 75) return 1.5;
  if (calciumPpm <= 100) return 1.6;
  if (calciumPpm <= 150) return 1.8;
  if (calciumPpm <= 200) return 1.9;
  if (calciumPpm <= 300) return 2.1;
  if (calciumPpm <= 400) return 2.2;
  if (calciumPpm <= 600) return 2.4;
  return 2.5;
}

// Fator Alcalinidade (ppm)
export function getAlkalinityFactor(alkalinityPpm: number): number {
  if (alkalinityPpm <= 25) return 1.4;
  if (alkalinityPpm <= 50) return 1.7;
  if (alkalinityPpm <= 75) return 1.9;
  if (alkalinityPpm <= 100) return 2.0;
  if (alkalinityPpm <= 150) return 2.2;
  if (alkalinityPpm <= 200) return 2.3;
  if (alkalinityPpm <= 300) return 2.5;
  if (alkalinityPpm <= 400) return 2.6;
  return 2.7;
}

/**
 * Calcula o ISL com base nos parâmetros e avalia a compatibilidade com o substrato
 */
export function calculateLangelierIndex(
  ph: number,
  tempC: number = 26,
  calciumPpm: number = 200,
  alkalinityPpm: number = 100,
  substrate: PoolSubstrateType = 'MONOLITICO_SAND'
): IslCalculationResult {
  const tf = getTemperatureFactor(tempC);
  const cf = getCalciumFactor(calciumPpm);
  const af = getAlkalinityFactor(alkalinityPpm);

  // ISL = pH + TF + CF + AF - 12.1
  const rawIsl = ph + tf + cf + af - 12.1;
  const isl = Math.round(rawIsl * 100) / 100;

  let status: 'CORROSIVA' | 'EQUILIBRADA' | 'INCRUSTANTE';
  let statusLabel: string;
  let badgeColor: string;
  let description: string;

  if (isl < -0.3) {
    status = 'CORROSIVA';
    statusLabel = 'Água Agressiva / Corrosiva';
    badgeColor = 'bg-red-950 border-red-800 text-red-300';
    description = 'A água busca dissolver cálcio dos revestimentos, rejuntes e equipamentos metálicos.';
  } else if (isl > 0.5) {
    status = 'INCRUSTANTE';
    statusLabel = 'Água Incrustante';
    badgeColor = 'bg-amber-950 border-amber-800 text-amber-300';
    description = 'Tendência à precipitação de carbonato de cálcio, turvando a água e formando eflorescências.';
  } else {
    status = 'EQUILIBRADA';
    statusLabel = 'Água Balanceada (Ideal)';
    badgeColor = 'bg-emerald-950 border-emerald-800 text-emerald-300';
    description = 'Parâmetros ideais de conforto aos banhistas e preservação máxima do substrato.';
  }

  // Alertas específicos por substrato
  let substrateAlert: string | null = null;
  const profile = SUBSTRATE_PROFILES[substrate] || SUBSTRATE_PROFILES.MONOLITICO_SAND;

  if (substrate === 'MONOLITICO_SAND') {
    if (ph < 7.0 || isl < -0.3) {
      substrateAlert = '⚠️ CRÍTICO MONOLÍTICO: Risco de dissolução e perda de garantia decenal. Eleve pH e alcalinidade imediatamente.';
    }
  } else if (substrate === 'VINIL') {
    substrateAlert = '⚠️ DICA VINIL: Dilua sempre o cloro granulado antes de jogar na piscina. Proibido sulfato de cobre.';
  } else if (substrate === 'FIBRA_VIDRO') {
    if (calciumPpm < 180) {
      substrateAlert = 'ℹ️ DICA FIBRA: Dureza cálcica baixa (<180 ppm) provoca branqueamento e osmose no gelcoat.';
    }
  } else if (substrate === 'PASTILHA_CERAMICA') {
    if (ph < 7.4 || isl < -0.3) {
      substrateAlert = '⚠️ DICA PASTILHA: Água com pH ácido corrói o rejunte cimentício causando soltura de pastilhas.';
    }
  }

  return {
    isl,
    status,
    statusLabel,
    badgeColor,
    description,
    substrateAlert,
  };
}

