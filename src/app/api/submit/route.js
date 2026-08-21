import { NextResponse } from 'next/server';
import { redis, chaveDia } from '../../../lib/redis';
import { GBMS, CAMPOS, FECHA_HORA } from '../../../lib/config';
import { agoraBR, janelaAberta } from '../../../lib/tempo';

export const dynamic = 'force-dynamic';

// GET /api/submit?gbm=1º GBM  -> valores de HOJE (para pre-preencher) + status da janela
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const gbm = searchParams.get('gbm');
  const t = agoraBR();
  const aberto = janelaAberta(t);
  if (!gbm) return NextResponse.json({ ok: true, aberto, data: t.data });

  const registro = (await redis.hget(chaveDia(t.data), gbm)) || {};
  const valores = {};
  CAMPOS.forEach((c) => { valores[c.rotulo] = registro[c.col] ? String(registro[c.col]) : ''; });
  return NextResponse.json({ ok: true, gbm, valores, aberto, data: t.data, jaEnviado: !!registro.responsavel });
}

// POST /api/submit  { nome, gbm, valores }
export async function POST(request) {
  const t = agoraBR();
  if (!janelaAberta(t)) {
    return NextResponse.json({ ok: false, msg: `Preenchimento encerrado às ${FECHA_HORA}h. Volte amanhã a partir da meia-noite.` });
  }

  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ ok: false, msg: 'Corpo inválido.' }, { status: 400 }); }

  const { nome, gbm, valores } = body || {};
  if (!nome) return NextResponse.json({ ok: false, msg: 'Informe o nome do responsável.' });
  if (!gbm || !GBMS.includes(gbm)) return NextResponse.json({ ok: false, msg: 'GBM inválido.' });

  const registro = {};
  CAMPOS.forEach((c) => {
    const v = valores && valores[c.rotulo];
    registro[c.col] = (v === undefined || v === null) ? '' : String(v).trim();
  });
  registro.responsavel = String(nome).trim();
  registro.atualizado_em = new Date().toISOString();

  await redis.hset(chaveDia(t.data), { [gbm]: registro });

  return NextResponse.json({ ok: true, msg: `Dados do ${gbm} salvos com sucesso!` });
}
