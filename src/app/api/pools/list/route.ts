import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const maintainerId = searchParams.get('maintainer_id');
    const clientId = searchParams.get('client_id');

    // 1. Se for um piscineiro específico, busca somente as piscinas vinculadas a ele
    if (maintainerId) {
      const { data: assignments, error: assignError } = await supabase
        .from('pool_maintainers')
        .select('pool_id')
        .eq('maintainer_id', maintainerId);

      if (!assignError && assignments && assignments.length > 0) {
        const poolIds = assignments.map(a => a.pool_id);
        const { data: pools, error: poolsError } = await supabase
          .from('pools')
          .select('*')
          .in('id', poolIds)
          .order('created_at', { ascending: false });

        if (!poolsError && pools) {
          return NextResponse.json({ success: true, pools, source: 'supabase_scoped_maintainer' });
        }
      }
    }

    // 2. Se for filtrado por cliente (estabelecimento)
    let query = supabase.from('pools').select('*').order('created_at', { ascending: false });
    if (clientId) {
      query = query.eq('client_id', clientId);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, pools: data, source: 'supabase_live' }, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300'
      }
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
