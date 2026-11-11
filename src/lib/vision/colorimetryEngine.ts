/**
 * Motor Espectral de Visão Computacional Embarcada (Edge Canvas Colorimetry)
 * Executa calibração e interpolação colorimétrica 100% offline no navegador via Canvas API.
 */

export interface ColorRgb {
  r: number;
  g: number;
  b: number;
}

export interface ColorHsv {
  h: number; // 0 a 360
  s: number; // 0 a 100
  v: number; // 0 a 100
}

export interface ColorCalibrationPoint {
  val: number;
  rgb: ColorRgb;
  hex: string;
}

// =========================================================================
// ESCALA ESPECTRAL PADRÃO DE FITAS ANALÍTICAS (4-EM-1 TÍPICAS)
// =========================================================================

// Escala de pH (Fenol Vermelho / Vermelho de Metila)
// 6.8 (Amarelo claro) -> 7.2 (Laranja) -> 7.4 (Laranja avermelhado) -> 7.6 (Vermelho claro) -> 8.2 (Vermelho púrpura/magenta)
export const PH_SPECTRAL_SCALE: ColorCalibrationPoint[] = [
  { val: 6.8, rgb: { r: 234, g: 179, b: 8 }, hex: '#eab308' },
  { val: 7.2, rgb: { r: 249, g: 115, b: 22 }, hex: '#f97316' },
  { val: 7.4, rgb: { r: 239, g: 68, b: 68 }, hex: '#ef4444' },
  { val: 7.6, rgb: { r: 225, g: 29, b: 72 }, hex: '#e11d48' },
  { val: 8.0, rgb: { r: 190, g: 24, b: 93 }, hex: '#be185d' },
  { val: 8.4, rgb: { r: 131, g: 24, b: 67 }, hex: '#831843' },
];

// =========================================================================
// ESCALA ESPECTRAL PARA ESTOJO COMPARADOR / TUBOS DE ENSAIO (CUBETA LÍQUIDA)
// Reagentes líquidos: Vermelho de Fenol (pH líquido) e Ortotolidina / DPD líquido (Cloro)
// O tubo possui volume líquido translúcido com dispersão cilíndrica de luz
// =========================================================================

// Tubo de Ensaio pH Líquido (Vermelho de Fenol Líquido em Cubeta)
export const TUBE_PH_SPECTRAL_SCALE: ColorCalibrationPoint[] = [
  { val: 6.8, rgb: { r: 254, g: 240, b: 138 }, hex: '#fef08a' }, // Amarelo brilhante
  { val: 7.0, rgb: { r: 253, g: 224, b: 71 }, hex: '#fde047' },  // Amarelo quente
  { val: 7.2, rgb: { r: 251, g: 146, b: 60 }, hex: '#fb923c' },  // Laranja suave
  { val: 7.4, rgb: { r: 248, g: 113, b: 113 }, hex: '#f87171' }, // Vermelho coral ideal
  { val: 7.6, rgb: { r: 239, g: 68, b: 68 }, hex: '#ef4444' },   // Vermelho vivo
  { val: 7.8, rgb: { r: 225, g: 29, b: 72 }, hex: '#e11d48' },   // Vermelho escuro
  { val: 8.2, rgb: { r: 190, g: 24, b: 93 }, hex: '#be185d' },   // Magenta / Púrpura
];

// Tubo de Ensaio Cloro Livre Líquido (Ortotolidina / DPD Líquido em Cubeta)
// 0.5 (Amarelo bem claro / Palha) -> 1.0 (Amarelo) -> 2.0 (Amarelo Ouro) -> 3.0 (Âmbar) -> 5.0 (Laranja escuro)
export const TUBE_CL_SPECTRAL_SCALE: ColorCalibrationPoint[] = [
  { val: 0.0, rgb: { r: 248, g: 250, b: 252 }, hex: '#f8fafc' }, // Incolor / Água
  { val: 0.5, rgb: { r: 254, g: 249, b: 195 }, hex: '#fef9c3' }, // Amarelo pálido
  { val: 1.0, rgb: { r: 253, g: 224, b: 71 }, hex: '#fde047' },  // Amarelo límpido
  { val: 1.5, rgb: { r: 250, g: 204, b: 21 }, hex: '#facc15' },  // Amarelo ouro
  { val: 2.0, rgb: { r: 234, g: 179, b: 8 }, hex: '#eab308' },   // Ouro intenso
  { val: 3.0, rgb: { r: 217, g: 119, b: 6 }, hex: '#d97706' },   // Âmbar
  { val: 5.0, rgb: { r: 180, g: 83, b: 9 }, hex: '#b45309' },    // Castanho / Marrom
];

// Escala de Cloro Livre DPD (ppm)
// 0.0 (Branco/Translúcido) -> 1.0 (Rosa claro) -> 2.0 (Rosa/Magenta) -> 3.0 (Magenta intenso) -> 5.0 (Púrpura escuro)
export const CL_SPECTRAL_SCALE: ColorCalibrationPoint[] = [
  { val: 0.0, rgb: { r: 241, g: 245, b: 249 }, hex: '#f1f5f9' },
  { val: 0.5, rgb: { r: 251, g: 207, b: 232 }, hex: '#fbcfe8' },
  { val: 1.0, rgb: { r: 244, g: 114, b: 182 }, hex: '#f472b6' },
  { val: 2.0, rgb: { r: 236, g: 72, b: 153 }, hex: '#ec4899' },
  { val: 3.0, rgb: { r: 219, g: 39, b: 119 }, hex: '#db2777' },
  { val: 5.0, rgb: { r: 157, g: 23, b: 77 }, hex: '#9d174d' },
];

// Escala de Alcalinidade Total (ppm)
// 40 (Amarelo ocre) -> 80 (Verde oliva) -> 100 (Verde folha) -> 120 (Verde esmeralda) -> 180 (Verde azulado/turquesa)
export const ALK_SPECTRAL_SCALE: ColorCalibrationPoint[] = [
  { val: 40, rgb: { r: 202, g: 138, b: 4 }, hex: '#ca8a04' },
  { val: 80, rgb: { r: 101, g: 163, b: 13 }, hex: '#65a30d' },
  { val: 100, rgb: { r: 22, g: 163, b: 74 }, hex: '#16a34a' },
  { val: 120, rgb: { r: 13, g: 148, b: 136 }, hex: '#0d9488' },
  { val: 180, rgb: { r: 14, g: 116, b: 144 }, hex: '#0e7490' },
  { val: 240, rgb: { r: 3, g: 105, b: 161 }, hex: '#0369a1' },
];

// =========================================================================
// CONVERSÕES MATEMÁTICAS RGB <-> HSV & DISTÂNCIA DELTA-E (CIEDE / EUCLIDIANA)
// =========================================================================

export function rgbToHsv(r: number, g: number, b: number): ColorHsv {
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;

  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  const delta = max - min;

  let h = 0;
  if (delta !== 0) {
    if (max === rNorm) {
      h = ((gNorm - bNorm) / delta) % 6;
    } else if (max === gNorm) {
      h = (bNorm - rNorm) / delta + 2;
    } else {
      h = (rNorm - gNorm) / delta + 4;
    }
    h = Math.round(h * 60);
    if (h < 0) h += 360;
  }

  const s = max === 0 ? 0 : Math.round((delta / max) * 100);
  const v = Math.round(max * 100);

  return { h, s, v };
}

export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => Math.min(255, Math.max(0, Math.round(n))).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Calcula distância euclidiana ponderada para percepção humana do olho (Red-mean)
 */
export function calculateColorDistance(c1: ColorRgb, c2: ColorRgb): number {
  const rMean = (c1.r + c2.r) / 2;
  const deltaR = c1.r - c2.r;
  const deltaG = c1.g - c2.g;
  const deltaB = c1.b - c2.b;

  const weightR = 2 + rMean / 256;
  const weightG = 4.0;
  const weightB = 2 + (255 - rMean) / 256;

  return Math.sqrt(weightR * deltaR * deltaR + weightG * deltaG * deltaG + weightB * deltaB * deltaB);
}

/**
 * Interpola o valor químico baseado na escala espectral padrão
 */
export function matchChemicalValue(
  sampleRgb: ColorRgb,
  scale: ColorCalibrationPoint[]
): { value: number; confidence: number; hex: string } {
  // Encontra os 2 pontos mais próximos na escala espectral
  const distances = scale.map((point) => ({
    point,
    distance: calculateColorDistance(sampleRgb, point.rgb),
  }));

  distances.sort((a, b) => a.distance - b.distance);

  const best = distances[0];
  const second = distances[1];

  // Distância máxima perceptível considerada ~ 765
  const maxPossibleDist = 765;
  const confidence = Math.max(0.75, Math.min(0.99, 1 - best.distance / maxPossibleDist));

  // Se muito próximo do melhor ponto, usa direto
  if (!second || best.distance < 15) {
    return {
      value: best.point.val,
      confidence: Math.round(confidence * 100) / 100,
      hex: rgbToHex(sampleRgb.r, sampleRgb.g, sampleRgb.b),
    };
  }

  // Interpolação linear inversa de pesos de distância
  const totalWeight = 1 / (best.distance + 0.001) + 1 / (second.distance + 0.001);
  const w1 = (1 / (best.distance + 0.001)) / totalWeight;
  const w2 = (1 / (second.distance + 0.001)) / totalWeight;

  const interpolatedVal = best.point.val * w1 + second.point.val * w2;
  const roundedVal = Math.round(interpolatedVal * 10) / 10;

  return {
    value: roundedVal,
    confidence: Math.round(confidence * 100) / 100,
    hex: rgbToHex(sampleRgb.r, sampleRgb.g, sampleRgb.b),
  };
}

/**
 * Amostra uma região retangular do Canvas e extrai a média RGB (com rejeição de ruído/brilho especular)
 */
export function sampleCanvasRegion(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number
): ColorRgb {
  const imgData = ctx.getImageData(Math.floor(x), Math.floor(y), Math.floor(width), Math.floor(height));
  const data = imgData.data;

  let rSum = 0;
  let gSum = 0;
  let bSum = 0;
  let validCount = 0;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    // Ignora reflexos especulares extremos (brancos saturados > 250) e sombras profundas (< 15)
    const brightness = (r + g + b) / 3;
    if (brightness > 15 && brightness < 250) {
      rSum += r;
      gSum += g;
      bSum += b;
      validCount++;
    }
  }

  if (validCount === 0) {
    return { r: 128, g: 128, b: 128 };
  }

  return {
    r: Math.round(rSum / validCount),
    g: Math.round(gSum / validCount),
    b: Math.round(bSum / validCount),
  };
}

