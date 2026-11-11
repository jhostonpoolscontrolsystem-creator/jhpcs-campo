import { NextResponse } from 'next/server';
import { PoolWeatherAlert } from '@/types/weatherAlerts';

export async function GET(request: Request) {
  try {
    const now = new Date();
    const validUntil48h = new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString();

    // Mock realista dos alertas preditivos meteorológicos gerados pelo Core v6.0
    // Integrados a partir das previsões OpenWeather processadas pelo motor estequiométrico
    const predictiveAlerts: PoolWeatherAlert[] = [
      {
        id: 'w-alert-p2-01',
        pool_id: 'p-2',
        pool_name: 'Piscina Principal Resort Terravista',
        alert_type: 'ACID_RAIN_BUFFER',
        title: 'Alerta Chuva Ácida & Queda Brusca de Alcalinidade (48h)',
        severity: 'ALTA',
        weather_event: 'Precipitação acumulada prevista de 48mm com pH da chuva 5.2',
        forecast_time_window: 'Próximas 48 horas',
        recommended_chemical_sku: 'BICARBONATO-SODIO',
        recommended_chemical_name: 'Bicarbonato de Sódio (Buffer Alcalinidade)',
        recommended_dosage: 0.9,
        dosage_unit: 'kg',
        instruction_text: 'Aplicar preventivamente +900g de Bicarbonato de Sódio para blindar a alcalinidade contra a chuva ácida.',
        valid_until: validUntil48h,
        acknowledged: false,
        created_at: now.toISOString(),
      },
      {
        id: 'w-alert-p1-02',
        pool_id: 'p-1',
        pool_name: 'Piscina Residencial Dr. Roberto',
        alert_type: 'ALGAE_BLOOM_PREVENTION',
        title: 'Risco de Algas por Onda de Calor e Radiação UV (48h)',
        severity: 'MEDIA',
        weather_event: 'Temperatura máxima prevista de 35°C com índice UV 11+ (Extremo)',
        forecast_time_window: 'Próximas 48 horas',
        recommended_chemical_sku: 'ALGICIDA-MANUTENCAO',
        recommended_chemical_name: 'Algicida de Manutenção Sem Cobre',
        recommended_dosage: 0.5,
        dosage_unit: 'L',
        instruction_text: 'Aplicar preventivamente 500ml de Algicida de Manutenção para impedir proliferação de algas verdes pelo calor.',
        valid_until: validUntil48h,
        acknowledged: false,
        created_at: now.toISOString(),
      },
      {
        id: 'w-alert-p3-03',
        pool_id: 'p-3',
        pool_name: 'Piscina Infinity Casa da Praia (Obra Recente)',
        alert_type: 'CURING_PROTECTION',
        title: 'Proteção de Cura Jhoston (28 Dias) Contra Tempestade',
        severity: 'CRITICA',
        weather_event: 'Frente fria com granizo leve e chuva forte em monólito em processo de cura química',
        forecast_time_window: 'Próximas 24 horas',
        recommended_chemical_sku: 'BARRILHA-LEVE',
        recommended_chemical_name: 'Barrilha Leve (Neutralizador)',
        recommended_dosage: 0.6,
        dosage_unit: 'kg',
        instruction_text: 'Manter tamponamento rigoroso (pH 7.4-7.6) para evitar desmineralização e perda da garantia decenal.',
        valid_until: validUntil48h,
        acknowledged: false,
        created_at: now.toISOString(),
      },
    ];

    return NextResponse.json({
      success: true,
      alerts: predictiveAlerts,
      generated_at: now.toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao sincronizar alertas climáticos' },
      { status: 500 }
    );
  }
}

