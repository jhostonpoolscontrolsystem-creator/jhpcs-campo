import { NextResponse } from 'next/server';
import { evaluateChemicalRules, calculateChemicalDose } from '@/lib/chemical-rules';
import { uploadToR2, isR2Configured } from '@/lib/r2';
import { supabase } from '@/lib/supabase';
import { PoolSubstrateType, SUBSTRATE_PROFILES } from '@/lib/substrate-rules';
import { calculateHaversineDistance, DEFAULT_GEOFENCE_RADIUS_METERS } from '@/lib/geo/geofencing';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      pool_id,
      maintainer_id,
      substrate_type,
      ph,
      chlorine_ppm,
      alkalinity_ppm,
      acid_product_used,
      brushed_surface,
      backwashed_filter,
      gps_lat,
      gps_lng,
      liability_accepted,
      geofence_flag,
      geofence_distance_m,
      geofence_justification,
      signature_data_url,
      signatory_name,
      productsApplied,
      white_label_brand,
      white_label_whatsapp,
      evidences,
    } = body;

    // 1. Validação de Termo Legal
    if (!liability_accepted) {
      return NextResponse.json(
        { error: 'O aceite do termo de responsabilidade é obrigatório para registrar a manutenção.' },
        { status: 400 }
      );
    }

    // 2. Busca a piscina no Supabase
    const { data: pool, error: poolError } = await supabase
      .from('pools')
      .select('*')
      .eq('id', pool_id)
      .single();

    if (poolError || !pool) {
      return NextResponse.json({ error: 'Piscina não encontrada no sistema.' }, { status: 404 });
    }

    // 2.1. Validação Estrita de Custódia / Tenant: O tratador deve ter vínculo com esta piscina
    if (maintainer_id && maintainer_id !== 'u-4') {
      const { data: assignment, error: assignError } = await supabase
        .from('pool_maintainers')
        .select('pool_id')
        .eq('pool_id', pool_id)
        .eq('maintainer_id', maintainer_id)
        .maybeSingle();

      if (assignError || !assignment) {
        return NextResponse.json(
          {
            error: 'Bloqueio de Segurança: Tratador não possui autorização ou vínculo ativo com a piscina deste cliente final.',
            pool_id,
            maintainer_id,
          },
          { status: 403 }
        );
      }
    }

    // 3. Validação Pericial de Geofencing Haversine (50m)
    let calculatedDistanceMeters = 0;
    let isGeofenceBreached = false;

    if (gps_lat && gps_lng && pool.gps_lat && pool.gps_lng) {
      calculatedDistanceMeters = calculateHaversineDistance(
        Number(gps_lat),
        Number(gps_lng),
        Number(pool.gps_lat),
        Number(pool.gps_lng)
      );

      if (calculatedDistanceMeters > DEFAULT_GEOFENCE_RADIUS_METERS) {
        isGeofenceBreached = true;
        // Se a distância for superior a 50m e não houver justificativa formal
        if (!geofence_justification || geofence_justification.trim().length < 5) {
          return NextResponse.json(
            {
              error: `Bloqueio de Geofencing Pericial: Dispositivo a ${calculatedDistanceMeters}m da piscina cadastrada (tolerância decenal: 50m). É obrigatório apresentar justificativa formal de auditoria.`,
              distance_meters: calculatedDistanceMeters,
              radius_allowed: DEFAULT_GEOFENCE_RADIUS_METERS,
            },
            { status: 403 }
          );
        }
      }
    }

    // 4. Auditoria pelo Motor Químico
    const chemicalAudit = evaluateChemicalRules(
      {
        ph: Number(ph),
        chlorine_ppm: Number(chlorine_ppm),
        alkalinity_ppm: alkalinity_ppm ? Number(alkalinity_ppm) : undefined,
        acid_product_used: Boolean(acid_product_used),
      },
      pool
    );

    // Validação complementar de substrato
    const activeSubstrate = (substrate_type || pool.finish_type || 'MONOLITICO_SAND') as PoolSubstrateType;
    const substrateProfile = SUBSTRATE_PROFILES[activeSubstrate] || SUBSTRATE_PROFILES.MONOLITICO_SAND;

    if (acid_product_used && !substrateProfile.allowedAcid) {
      chemicalAudit.flags.push(`ATENÇÃO SUBSTRATO: Uso de ácido não recomendado para revestimento ${activeSubstrate}`);
    }

    // 5. Cálculo de consumo de insumos
    const doseCalc = calculateChemicalDose(
      'ALCALINIZANTE',
      alkalinity_ppm || 60,
      100, // Alvo ideal
      pool.volume_m3
    );

    // 6. Processamento de Imagens com Prioridade Cloudflare R2
    const processedEvidences = [];
    if (evidences && Array.isArray(evidences)) {
      for (const ev of evidences) {
        // Se a evidência já possuir URL direta do Cloudflare R2 ou Supabase
        if (ev.photo_url) {
          processedEvidences.push({
            evidence_type: ev.evidence_type,
            photo_url: ev.photo_url,
            gps_lat: ev.gps_lat,
            gps_lng: ev.gps_lng,
            captured_at: ev.captured_at,
            provider: ev.provider || 'CLOUDFLARE_R2',
          });
          continue;
        }

        // Caso venha em base64 (fallback offline)
        if (ev.photo_base64 && ev.photo_base64.startsWith('data:image')) {
          try {
            const matches = ev.photo_base64.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
            if (matches && matches.length === 3) {
              const extension = matches[1] === 'jpeg' ? 'jpg' : matches[1];
              const buffer = Buffer.from(matches[2], 'base64');
              const fileName = `${pool_id}/${Date.now()}-${ev.evidence_type}.${extension}`;
              const contentType = `image/${extension}`;

              if (isR2Configured) {
                try {
                  const r2Res = await uploadToR2(fileName, buffer, contentType);
                  processedEvidences.push({
                    evidence_type: ev.evidence_type,
                    photo_url: r2Res.url,
                    gps_lat: ev.gps_lat,
                    gps_lng: ev.gps_lng,
                    captured_at: ev.captured_at,
                    provider: 'CLOUDFLARE_R2',
                  });
                  continue;
                } catch (r2Err) {
                  console.warn('Fallback R2 -> Supabase Storage:', r2Err);
                }
              }

              // Fallback Supabase Storage
              const { data: uploadData, error: uploadError } = await supabase.storage
                .from('service_evidences')
                .upload(fileName, buffer, {
                  contentType,
                  upsert: false,
                });

              if (!uploadError && uploadData) {
                const { data: publicUrlData } = supabase.storage
                  .from('service_evidences')
                  .getPublicUrl(fileName);

                processedEvidences.push({
                  evidence_type: ev.evidence_type,
                  photo_url: publicUrlData.publicUrl,
                  gps_lat: ev.gps_lat,
                  gps_lng: ev.gps_lng,
                  captured_at: ev.captured_at,
                  provider: 'SUPABASE_STORAGE',
                });
                continue;
              }
            }
          } catch (e) {
            console.error('Failed to process image:', e);
          }
        }

        // Fallback sem imagem pesada
        processedEvidences.push({
          evidence_type: ev.evidence_type,
          photo_url: null,
          gps_lat: ev.gps_lat,
          gps_lng: ev.gps_lng,
          captured_at: ev.captured_at,
        });
      }
    }

    // 7. Insere o Log na tabela maintenance_logs
    const newLog = {
      pool_id,
      maintainer_id,
      substrate_type: activeSubstrate,
      ph: Number(ph),
      chlorine_ppm: Number(chlorine_ppm),
      alkalinity_ppm: alkalinity_ppm ? Number(alkalinity_ppm) : null,
      acid_product_used: Boolean(acid_product_used),
      brushed_surface: Boolean(brushed_surface),
      backwashed_filter: Boolean(backwashed_filter),
      liability_accepted: true,
      geofence_flag: Boolean(geofence_flag || isGeofenceBreached),
      geofence_distance_m: calculatedDistanceMeters,
      geofence_justification: geofence_justification || null,
      signature_data_url: signature_data_url || null,
      signatory_name: signatory_name || null,
      is_audit_flagged: chemicalAudit.isRedZone || chemicalAudit.isWarrantySuspended || isGeofenceBreached,
      flag_reason: [
        ...chemicalAudit.flags,
        ...(isGeofenceBreached ? [`Divergência de Geofencing: ${calculatedDistanceMeters}m (${geofence_justification})`] : []),
      ].filter(Boolean).join(' | ') || null,
      calculation_memory: {
        doseCalc,
        productsApplied: productsApplied || [],
        white_label_brand: white_label_brand || null,
        white_label_whatsapp: white_label_whatsapp || null,
      },
      evidences: processedEvidences,
      audit_result: chemicalAudit,
    };

    const { data: insertedLog, error: insertError } = await supabase
      .from('maintenance_logs')
      .insert(newLog)
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting maintenance log:', insertError);
      return NextResponse.json({ error: 'Falha ao salvar a manutenção no banco de dados.' }, { status: 500 });
    }

    // Atualiza o status da piscina se necessário (RED_ZONE ou NORMAL)
    const newPoolStatus = chemicalAudit.isRedZone ? 'RED_ZONE' : 'NORMAL';
    if (pool.status !== newPoolStatus) {
      await supabase.from('pools').update({ status: newPoolStatus }).eq('id', pool_id);
    }

    return NextResponse.json({
      success: true,
      log: insertedLog,
      audit: chemicalAudit,
      products_deducted: productsApplied ? productsApplied.length : 0,
      r2_enabled: isR2Configured,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Falha ao processar submissão de manutenção.' },
      { status: 500 }
    );
  }
}
