import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { redis, chaveDia } from '../../../lib/redis';
import { verificarToken, COOKIE } from '../../../lib/auth';
import { GBMS, CAMPOS } from '../../../lib/config';
import { agoraBR } from '../../../lib/tempo';

export const dynamic = 'force-dynamic';

async function sessaoAtual() {
  return verificarToken(cookies().get(COOKIE)?.value);
}

// GET /api/submit?gbm=1º GBM  -> valores de HOJE para pré-preencher
export async function GET(request) {
  const sessao = await sessaoAtual();
  if (!sessao) return NextResponse.json({ ok: false, msg: 'Não autorizado.' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const gbm = searchParams.get('gbm');
  const t = agoraBR();
  if (!gbm) return NextResponse.json({ ok: true, data: t.data });

  const registro = (await redis.hget(chaveDia(t.data), gbm)) || {};
  const valores = {};
  CAMPOS.forEach((c) => { valores[c.rotulo] = registro[c.col] ? String(registro[c.col]) : ''; });
  return NextResponse.json({ ok: true, gbm, valores, data: t.data, jaEnviado: !!registro.responsavel });
}

// POST /api/submit  { gbm, valores }
export async function POST(request) {
  const sessao = await sessaoAtual();
  if (!sessao) return NextResponse.json({ ok: false, msg: 'Não autorizado.' }, { status: 401 });

  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ ok: false, msg: 'Corpo inválido.' }, { status: 400 }); }

  const { gbm, valores } = body || {};
  if (!gbm || !GBMS.includes(gbm)) return NextResponse.json({ ok: false, msg: 'GBM inválido.' });

  const registro = {};
  CAMPOS.forEach((c) => {
    const v = valores && valores[c.rotulo];
    registro[c.col] = (v === undefined || v === null) ? '' : String(v).trim();
  });
  registro.responsavel = sessao.nome || sessao.email;
  registro.email = sessao.email;
  registro.atualizado_em = new Date().toISOString();

  const t = agoraBR();
  await redis.hset(chaveDia(t.data), { [gbm]: registro });

  return NextResponse.json({ ok: true, msg: `Dados do ${gbm} salvos com sucesso!` });
}
