import { NextResponse } from 'next/server';
import { mockPools } from '@/lib/mock-data';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const poolId = searchParams.get('pool_id') || 'p-2';
    const month = searchParams.get('month') || String(new Date().getMonth() + 1).padStart(2, '0');
    const year = searchParams.get('year') || String(new Date().getFullYear());

    const pool = mockPools.find((p) => p.id === poolId) || mockPools[0];

    // Mock realista de consolidação mensal do Core v6.0
    const monthlyReport = {
      poolId: pool.id,
      poolName: pool.name,
      volumeM3: pool.volume_m3,
      finishType: pool.finish_type || 'MONOLITICO_SAND',
      period: {
        month,
        year,
        label: `${month}/${year}`,
      },
      metrics: {
        totalVisits: 8,
        completedOnScheduleRate: 100, // 100% no horário
        averagePh: 7.4,
        averageChlorinePpm: 2.1,
        averageAlkalinityPpm: 105,
        averageIsl: 0.12,
        islStability: 'EQUILIBRADA_PERFEITA',
        cleanlinessScore: 98,
      },
      consumedProducts: [
        {
          sku: 'CLORO-DICLORO-ESTAB',
          name: 'Cloro Dicloro Estabilizado 60%',
          quantityUsed: 2.8,
          unit: 'kg',
          suggestedRestock: 5.0,
          urgent: false,
        },
        {
          sku: 'BARRILHA-LEVE',
          name: 'Barrilha Leve (Elevador pH)',
          quantityUsed: 4.0,
          unit: 'kg',
          suggestedRestock: 5.0,
          urgent: false,
        },
        {
          sku: 'ALGICIDA-MANUTENCAO',
          name: 'Algicida de Manutenção Sem Cobre',
          quantityUsed: 1.2,
          unit: 'L',
          suggestedRestock: 2.0,
          urgent: true,
        },
      ],
      publicDossierUrl: `https://jhpcs.vercel.app/dossie/${pool.id}?m=${month}&y=${year}`,
      anvisaBookPdfUrl: `https://jhpcs.vercel.app/api/sanitary/anvisa-book/${pool.id}?m=${month}&y=${year}`,
      generatedAt: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      report: monthlyReport,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao gerar fechamento mensal' },
      { status: 500 }
    );
  }
}

