import { NextResponse } from 'next/server';
import { checkRateLimit, registerFailedAttempt, registerSuccessfulLogin } from '@/lib/security';
import { DEMO_ACCOUNTS, TargetSector } from '@/types/profiles';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { cpf, pin, email, password } = body;

    const ip = request.headers.get('x-forwarded-for') || 'unknown';

    // 1. Verificação de Contas Demo (teste.solo, teste.frota, teste.facility, teste.jhoston)
    if (email && password) {
      const demoAccount = DEMO_ACCOUNTS.find(
        (acc) => acc.email.toLowerCase() === email.toLowerCase() && acc.password === password
      );

      if (demoAccount) {
        return NextResponse.json({
          success: true,
          user: {
            id: `demo-${demoAccount.targetSector.toLowerCase()}`,
            name: demoAccount.name,
            email: demoAccount.email,
            cpf: demoAccount.cpf,
            role: 'PISCINEIRO',
            targetSector: demoAccount.targetSector,
            sectorLabel: demoAccount.sectorLabel,
          },
          token: `jwt-demo-${demoAccount.targetSector}-${Date.now()}`,
        });
      }
    }

    // 2. Se logar por CPF/PIN e for um dos CPFs demo
    if (cpf) {
      const cleanCpf = cpf.replace(/\D/g, '');
      const matchedDemo = DEMO_ACCOUNTS.find(
        (acc) => acc.cpf.replace(/\D/g, '') === cleanCpf
      );

      if (matchedDemo && (pin === '1234' || pin === 'teste123' || !pin)) {
        return NextResponse.json({
          success: true,
          user: {
            id: `demo-${matchedDemo.targetSector.toLowerCase()}`,
            name: matchedDemo.name,
            email: matchedDemo.email,
            cpf: matchedDemo.cpf,
            role: 'PISCINEIRO',
            targetSector: matchedDemo.targetSector,
            sectorLabel: matchedDemo.sectorLabel,
          },
          token: `jwt-demo-${matchedDemo.targetSector}-${Date.now()}`,
        });
      }
    }

    if (!cpf || !pin) {
      return NextResponse.json(
        { error: 'CPF e PIN são obrigatórios para acesso ao terminal de campo.' },
        { status: 400 }
      );
    }

    // Rate Limit Antifraude
    const rateLimit = checkRateLimit(ip);
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: rateLimit.reason }, { status: 429 });
    }

    const cleanCpf = cpf.replace(/\D/g, '');

    // Busca usuário real no Supabase
    const { supabase } = require('@/lib/supabase');
    const { data: maintainer, error: supaError } = await supabase
      .from('users')
      .select('id, name, cpf, email, role, password_hash, status, target_sector')
      .eq('cpf', cleanCpf)
      .single();

    if (supaError || !maintainer) {
      // Fallback gracioso para tratador padrão modo SOLO
      if (pin === '1234') {
        return NextResponse.json({
          success: true,
          user: {
            id: 'u-solo-default',
            name: 'Tratador Autônomo',
            cpf: cpf,
            role: 'PISCINEIRO',
            targetSector: 'AUTONOMO' as TargetSector,
            sectorLabel: 'MODO SOLO (Autônomo)',
          },
          token: `jwt-solo-default-${Date.now()}`,
        });
      }
      registerFailedAttempt(ip);
      return NextResponse.json({ error: 'Tratador não encontrado no sistema.' }, { status: 401 });
    }

    if (maintainer.status === 'BLOCKED') {
      registerFailedAttempt(ip);
      return NextResponse.json({ error: 'Acesso Revogado. Entre em contato com a coordenação.' }, { status: 403 });
    }

    let isPinValid = false;
    if (maintainer.password_hash) {
      const bcrypt = require('bcryptjs');
      isPinValid = await bcrypt.compare(pin, maintainer.password_hash);
    } else if (pin === '1234') {
      isPinValid = true;
    }

    if (!isPinValid) {
      registerFailedAttempt(ip);
      return NextResponse.json({ error: 'PIN de segurança inválido.' }, { status: 401 });
    }

    registerSuccessfulLogin(ip);

    // Mapeia targetSector do usuário
    const targetSector: TargetSector = maintainer.target_sector || 'AUTONOMO';

    return NextResponse.json({
      success: true,
      user: {
        id: maintainer.id,
        name: maintainer.name,
        email: maintainer.email,
        role: maintainer.role,
        cpf: maintainer.cpf,
        targetSector: targetSector,
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
