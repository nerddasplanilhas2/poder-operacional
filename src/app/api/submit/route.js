import { NextResponse } from 'next/server';
import { redis, CHAVE } from '../../../lib/redis';
import { GBMS, CAMPOS } from '../../../lib/config';

export const dynamic = 'force-dynamic';

// GET /api/submit?gbm=1º GBM  -> valores atuais para pre-preencher o form
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const gbm = searchParams.get('gbm');
  if (!gbm) return NextResponse.json({ ok: false, msg: 'GBM não informado.' }, { status: 400 });

  const registro = (await redis.hget(CHAVE, gbm)) || {};
  const valores = {};
  CAMPOS.forEach((c) => { valores[c.rotulo] = registro[c.col] ? String(registro[c.col]) : ''; });
  return NextResponse.json({ ok: true, gbm, valores });
}

// POST /api/submit  { nome, gbm, valores:{ 'ABT': '...', ... } }
export async function POST(request) {
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

  // Grava o registro no campo do GBM (um por unidade).
  await redis.hset(CHAVE, { [gbm]: registro });

  return NextResponse.json({ ok: true, msg: `Dados do ${gbm} salvos com sucesso!` });
}
