import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { redis, CHAVE } from '../../../lib/redis';
import { verificarToken, COOKIE } from '../../../lib/auth';
import { GBMS, CAMPOS } from '../../../lib/config';

export const dynamic = 'force-dynamic';

// GET /api/dados  -> exige sessao valida; devolve todos os registros
export async function GET() {
  const token = cookies().get(COOKIE)?.value;
  const sessao = await verificarToken(token);
  if (!sessao) {
    return NextResponse.json({ ok: false, msg: 'Não autorizado.' }, { status: 401 });
  }

  const mapa = (await redis.hgetall(CHAVE)) || {};
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

  return NextResponse.json({ ok: true, perfil: sessao.perfil, email: sessao.email, linhas });
}
