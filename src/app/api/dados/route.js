import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { redis, chaveDia } from '../../../lib/redis';
import { verificarToken, COOKIE } from '../../../lib/auth';
import { GBMS, CAMPOS } from '../../../lib/config';
import { agoraBR } from '../../../lib/tempo';

export const dynamic = 'force-dynamic';

// GET /api/dados?data=YYYY-MM-DD  -> exige sessao; devolve os registros do dia
export async function GET(request) {
  const token = cookies().get(COOKIE)?.value;
  const sessao = await verificarToken(token);
  if (!sessao) {
    return NextResponse.json({ ok: false, msg: 'Não autorizado.' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const data = searchParams.get('data') || agoraBR().data;

  const mapa = (await redis.hgetall(chaveDia(data))) || {};
  const linhas = GBMS.map((gbm) => {
    const r = mapa[gbm] || {};
    const valores = {};
    CAMPOS.forEach((c) => { valores[c.rotulo] = r[c.col] ? String(r[c.col]) : ''; });
    return {
      gbm,
      valores,
      responsavel: r.responsavel || '',
      atualizado: r.atualizado_em || '',
    };
  });

  return NextResponse.json({ ok: true, nome: sessao.nome, email: sessao.email, data, hoje: agoraBR().data, linhas });
}
