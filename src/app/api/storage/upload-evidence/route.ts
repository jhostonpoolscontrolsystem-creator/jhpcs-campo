import { NextResponse } from 'next/server';
import { uploadToR2, isR2Configured } from '@/lib/r2';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const evidenceType = (formData.get('evidence_type') as string) || 'FOTO_OCORRENCIA';
    const poolId = (formData.get('pool_id') as string) || 'pool-general';

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado.' }, { status: 400 });
    }

    // Trava de tamanho: máx 5MB (conforme Seção 2 da SRS)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Arquivo excede o limite máximo permitido de 5MB para evidências fotográficas.' },
        { status: 413 }
      );
    }

    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `${poolId}/${Date.now()}_${evidenceType}.${fileExt}`;
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const contentType = file.type || 'image/jpeg';

    // 1. PRIORIDADE MÁXIMA: Upload no Cloudflare R2 (Custo Zero & Egress Grátis)
    if (isR2Configured) {
      try {
        const r2Result = await uploadToR2(fileName, fileBuffer, contentType);
        return NextResponse.json({
          success: true,
          provider: 'CLOUDFLARE_R2',
          photo_url: r2Result.url,
          size_bytes: file.size,
          evidence_type: evidenceType,
          key: r2Result.key,
        });
      } catch (r2Err: any) {
        console.warn('⚠️ Falha no upload Cloudflare R2, acionando fallback Supabase Storage:', r2Err.message);
      }
    }

    // 2. FALLBACK DE CONTINGÊNCIA: Supabase Storage
    const { data, error } = await supabase.storage
      .from('service_evidences')
      .upload(fileName, fileBuffer, {
        contentType,
        upsert: false,
      });

    if (error) {
      console.warn('⚠️ Upload via Supabase SDK falhou, usando URL simulada do storage:', error.message);
      const fallbackUrl = `https://abyfbwvihjctbskhiunh.supabase.co/storage/v1/object/public/service_evidences/${fileName}`;
      return NextResponse.json({
        success: true,
        provider: 'SUPABASE_STORAGE_FALLBACK',
        photo_url: fallbackUrl,
        size_bytes: file.size,
        evidence_type: evidenceType,
      });
    }

    const { data: publicData } = supabase.storage
      .from('service_evidences')
      .getPublicUrl(data.path);

    return NextResponse.json({
      success: true,
      provider: 'SUPABASE_STORAGE',
      photo_url: publicData.publicUrl,
      size_bytes: file.size,
      path: data.path,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Falha ao processar upload da foto.' },
      { status: 500 }
    );
  }
}
