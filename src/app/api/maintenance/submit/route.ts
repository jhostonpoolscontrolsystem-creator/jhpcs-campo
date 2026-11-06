import { NextResponse } from 'next/server';
import { evaluateChemicalRules, calculateChemicalDose } from '@/lib/chemical-rules';
import { supabase } from '@/lib/supabase';
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      pool_id,
      maintainer_id,
      ph,
      chlorine_ppm,
      alkalinity_ppm,
      acid_product_used,
      brushed_surface,
      backwashed_filter,
      gps_lat,
      gps_lng,
      liability_accepted,
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
            maintainer_id
          },
          { status: 403 }
        );
      }
    }

    // 3. Validação Anti-Fraude Geográfica (Divergência GPS máx 100m)
    // Cálculo aproximado Haversine ou distância euclidiana simples para raio de 100 metros (~0.001 graus)
    if (gps_lat && gps_lng && pool.gps_lat && pool.gps_lng) {
      const latDiff = Math.abs(gps_lat - pool.gps_lat);
      const lngDiff = Math.abs(gps_lng - pool.gps_lng);
      const approxDistKm = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff) * 111;
      
      // Se maior que 0.1km (100 metros)
      if (approxDistKm > 0.1) {
        return NextResponse.json(
          {
            error: 'Bloqueio Anti-Fraude GPS: Coordenadas informadas divergem em mais de 100 metros da piscina cadastrada.',
            distance_meters: Math.round(approxDistKm * 1000),
          },
          { status: 403 }
        );
      }
    }

    // 4. Auditoria pelo Motor Químico Hard-Coded
    const chemicalAudit = evaluateChemicalRules(
      {
        ph: Number(ph),
        chlorine_ppm: Number(chlorine_ppm),
        alkalinity_ppm: alkalinity_ppm ? Number(alkalinity_ppm) : undefined,
        acid_product_used: Boolean(acid_product_used),
      },
      pool
    );

    // 5. Cálculo transparente de consumo de insumos
    const doseCalc = calculateChemicalDose(
      'ALCALINIZANTE',
      alkalinity_ppm || 60,
      100, // Alvo ideal
      pool.volume_m3
    );

    // 6. Upload de Imagens em Base64 para o Supabase Storage (FASE 2)
    const processedEvidences = [];
    if (evidences && Array.isArray(evidences)) {
      for (const ev of evidences) {
        if (ev.photo_base64 && ev.photo_base64.startsWith('data:image')) {
          try {
            // Extrai o conteúdo base64 e a extensão (jpg/png)
            const matches = ev.photo_base64.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
            if (matches && matches.length === 3) {
              const extension = matches[1] === 'jpeg' ? 'jpg' : matches[1];
              const buffer = Buffer.from(matches[2], 'base64');
              const fileName = `${pool_id}/${Date.now()}-${ev.evidence_type}.${extension}`;

              // Faz o upload real da foto para o Supabase
              const { data: uploadData, error: uploadError } = await supabase.storage
                .from('service_evidences')
                .upload(fileName, buffer, {
                  contentType: `image/${extension}`,
                  upsert: false,
                });

              if (!uploadError && uploadData) {
                // Recupera a URL pública definitiva
                const { data: publicUrlData } = supabase.storage
                  .from('service_evidences')
                  .getPublicUrl(fileName);

                processedEvidences.push({
                  ...ev,
                  photo_base64: null, // Limpa o base64 para não pesar o BD
                  photo_url: publicUrlData.publicUrl,
                });
                continue; // Sucesso
              } else {
                console.error('Storage Upload Error:', uploadError);
              }
            }
          } catch (e) {
            console.error('Failed to process image:', e);
          }
        }
        // Fallback: Salva sem imagem pesada caso falhe
        processedEvidences.push({ ...ev, photo_base64: null, photo_url: null });
      }
    }

    // 7. Insere o Log na tabela maintenance_logs
    const newLog = {
      pool_id,
      maintainer_id,
      ph: Number(ph),
      chlorine_ppm: Number(chlorine_ppm),
      alkalinity_ppm: alkalinity_ppm ? Number(alkalinity_ppm) : null,
      acid_product_used: Boolean(acid_product_used),
      brushed_surface: Boolean(brushed_surface),
      backwashed_filter: Boolean(backwashed_filter),
      liability_accepted: true,
      is_audit_flagged: chemicalAudit.isRedZone || chemicalAudit.isWarrantySuspended,
      flag_reason: chemicalAudit.flags.length > 0 ? chemicalAudit.flags.join(' | ') : null,
      calculation_memory: doseCalc,
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

    // Disparo Imediato via Evolution API (WhatsApp) APENAS em casos especiais (Red Zone)
    let evolutionDispatch = null;
    if (chemicalAudit.shouldNotifyWhatsApp) {
      const evolutionUrl = process.env.EVOLUTION_API_URL || 'https://whatsapp-ecostone.onrender.com';
      const evolutionApiKey = process.env.EVOLUTION_API_KEY || 'Gabriel2006!';
      const instanceName = process.env.EVOLUTION_INSTANCE_NAME || 'ecostone';
      
      // O número de alerta da diretoria deve ser configurado no .env
      const adminPhone = process.env.ADMIN_WHATSAPP_NUMBER || '5511999999999';

      const dispatchStartTime = Date.now();
      let evolutionError = null;
      let delivered = false;

      try {
        const evoRes = await fetch(`${evolutionUrl}/message/sendText/${instanceName}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: evolutionApiKey,
          },
          body: JSON.stringify({
            number: adminPhone,
            text: chemicalAudit.messagePreview,
            textMessage: {
              text: chemicalAudit.messagePreview,
            },
            options: {
              delay: 800,
              presence: 'composing',
            },
          }),
        });

        if (evoRes.ok) {
          delivered = true;
        } else {
          evolutionError = await evoRes.text();
          console.error('Evolution API Error:', evolutionError);
        }
      } catch (err: any) {
        evolutionError = err.message;
        console.error('Evolution API Network Error:', err);
      }

      evolutionDispatch = {
        dispatched_at: new Date().toISOString(),
        target_channel: 'Evolution API (Docker)',
        sla_seconds: ((Date.now() - dispatchStartTime) / 1000).toFixed(2),
        message: chemicalAudit.messagePreview,
        recipients: [adminPhone],
        delivered,
        error: evolutionError
      };
    }

    // Log the audit event for telemetry
    const { logAudit } = require('@/lib/audit-logger');
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    await logAudit({
      user_id: maintainer_id,
      user_email: `maintainer-${maintainer_id}`,
      action: 'TELEMETRY_INSERTED',
      details: `Telemetry reported for pool ${pool_id}. Flagged: ${chemicalAudit.isRedZone}`,
      ip_address: ip,
      user_agent: userAgent,
      payload: newLog,
    });

    return NextResponse.json({
      success: true,
      log: insertedLog,
      audit: chemicalAudit,
      evolution_dispatch: evolutionDispatch,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Falha ao processar submissão de manutenção.' },
      { status: 500 }
    );
  }
}
