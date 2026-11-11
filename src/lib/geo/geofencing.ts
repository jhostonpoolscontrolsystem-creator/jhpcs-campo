/**
 * Motor Pericial de Geofencing para Validação de Presença de Campo
 * Utiliza a fórmula matemática de Haversine para calcular a distância esférica exata em metros.
 * Aplica trava pericial rígida de 50 metros da coordenada cadastrada da piscina.
 */

export interface GpsCoordinates {
  lat: number;
  lng: number;
}

export interface GeofenceValidationResult {
  isWithinGeofence: boolean;
  distanceMeters: number;
  radiusAllowedMeters: number;
  message: string;
}

/**
 * Raio de tolerância canônico da Garantia Decenal: 50 metros da borda
 */
export const DEFAULT_GEOFENCE_RADIUS_METERS = 50;

/**
 * Calcula a distância em metros entre duas coordenadas geográficas usando Haversine
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Raio médio da Terra em metros
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

/**
 * Validação rigorosa de presença na piscina
 */
export function validateGeofencePresence(
  technicianGps: GpsCoordinates,
  poolGps: GpsCoordinates,
  radiusAllowedMeters: number = DEFAULT_GEOFENCE_RADIUS_METERS
): GeofenceValidationResult {
  const distance = calculateHaversineDistance(
    technicianGps.lat,
    technicianGps.lng,
    poolGps.lat,
    poolGps.lng
  );
  const isWithin = distance <= radiusAllowedMeters;

  return {
    isWithinGeofence: isWithin,
    distanceMeters: distance,
    radiusAllowedMeters,
    message: isWithin
      ? `Presença física pericial validada: ${distance}m da piscina (dentro do raio de ${radiusAllowedMeters}m).`
      : `Bloqueio de Geofencing: O dispositivo está a ${distance}m da piscina cadastrada (limite máximo permitido: ${radiusAllowedMeters}m).`,
  };
}

