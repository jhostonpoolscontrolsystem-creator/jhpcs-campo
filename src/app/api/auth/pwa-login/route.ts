import { NextResponse } from 'next/server';
import { checkRateLimit, registerFailedAttempt, registerSuccessfulLogin } from '@/lib/security';

export async function POST(request: Request) {
  try {
    const { cpf, pin } = await request.json();

    if (!cpf || !pin) {
      return NextResponse.json(
        { error: 'CPF e PIN são obrigatórios.' },
        { status: 400 }
      );
    }
    
    // Antifraude: Proteção contra Força Bruta
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const rateLimit = checkRateLimit(ip);
    if (!rateLimit.allowed) {
      const { logAudit } = require('@/lib/audit-logger');
      await logAudit({
        user_id: 'unknown',
        user_email: `cpf-${cpf}`,
        action: 'SECURITY_ALERT',
        details: `Brute Force PWA: ${rateLimit.reason}`,
        ip_address: ip,
        user_agent: request.headers.get('user-agent') || 'unknown',
      });
      return NextResponse.json({ error: rateLimit.reason }, { status: 429 });
    }

    // Limpa pontuação do CPF
    const cleanCpf = cpf.replace(/\D/g, '');

    // Busca o usuário tratador real no Supabase
    const { supabase } = require('@/lib/supabase');
    const { data: maintainer, error: supaError } = await supabase
      .from('users')
      .select('id, name, cpf, role, password_hash, status')
      .eq('cpf', cleanCpf)
      .eq('role', 'PISCINEIRO')
      .single();

    if (supaError || !maintainer) {
      registerFailedAttempt(ip);
      return NextResponse.json({ error: 'Tratador não encontrado no sistema.' }, { status: 401 });
    }

    if (maintainer.status === 'BLOCKED') {
      registerFailedAttempt(ip);
      return NextResponse.json({ error: 'Acesso Revogado. Entre em contato com a coordenação.' }, { status: 403 });
    }

    // Validação de PIN de 4 a 6 dígitos (usaremos bcrypt no futuro, por ora PIN provisório)
    let isPinValid = false;
    if (maintainer.password_hash) {
      const bcrypt = require('bcryptjs');
      isPinValid = await bcrypt.compare(pin, maintainer.password_hash);
    } else if (pin === '1234') {
      isPinValid = true; // Provisório se não tiver hash
    }

    if (!isPinValid) {
      registerFailedAttempt(ip);
      return NextResponse.json(
        { error: 'PIN de segurança inválido. Verifique com a coordenação técnica.' },
        { status: 401 }
      );
    }

    registerSuccessfulLogin(ip);

    return NextResponse.json({
      success: true,
      user: {
        id: maintainer.id,
        name: maintainer.name,
        role: maintainer.role,
        cpf: maintainer.cpf,
      },
      token: `jwt-jhpcs-auth-${maintainer.id}-${Date.now()}`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Falha na autenticação do tratador' },
      { status: 500 }
    );
  }
}
