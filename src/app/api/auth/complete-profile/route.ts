import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import bcrypt from 'bcryptjs';
import { logAudit } from '@/lib/audit-logger';

export async function POST(request: Request) {
  try {
    const { userId, name, phone, newPassword, token } = await request.json();

    if (!userId || !newPassword || !token || !phone) {
      return NextResponse.json({ error: 'Dados incompletos para completar o cadastro.' }, { status: 400 });
    }

    // Hash da nova senha
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(newPassword, salt);

    // 1. Atualiza no Supabase
    const { data: updatedUser, error } = await supabase
      .from('users')
      .update({
        name,
        phone,
        password_hash
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: 'Erro ao atualizar cadastro: ' + error.message }, { status: 500 });
    }

    // 2. Grava auditoria (Aceite do Termo)
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    await logAudit({
      user_id: userId,
      user_email: updatedUser?.email || 'unknown',
      action: 'SYSTEM_CONFIG_CHANGED',
      details: `Usuário ${name} completou o cadastro de primeiro acesso, definiu senha forte e aceitou o Termo de Responsabilidade. Telefone atualizado: ${phone}.`,
      ip_address: ip,
      user_agent: userAgent,
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Falha ao completar cadastro.' }, { status: 500 });
  }
}
