export type WeatherAlertType =
  | 'ACID_RAIN_BUFFER'          // Chuva ácida / Tempestade: exige tamponamento com Bicarbonato
  | 'ALGAE_BLOOM_PREVENTION'     // Onda de calor / UV extremo: risco de algas, exige reforço de cloro e algicida
  | 'CURING_PROTECTION';         // Período de cura 28d Jhoston: risco de lixiviação por precipitação intensa

export interface PoolWeatherAlert {
  id: string;
  pool_id: string;
  pool_name: string;
  alert_type: WeatherAlertType;
  title: string;
  severity: 'BAIXA' | 'MEDIA' | 'ALTA' | 'CRITICA';
  weather_event: string;
  forecast_time_window: string; // Ex: "Próximas 48h (Volume est: 45mm)"
  recommended_chemical_sku: string;
  recommended_chemical_name: string;
  recommended_dosage: number;
  dosage_unit: string;
  instruction_text: string;
  valid_until: string;
  acknowledged: boolean;
  acknowledged_at?: string;
  created_at: string;
}

