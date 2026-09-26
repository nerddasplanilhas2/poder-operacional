import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { papelAtual, nomeDe } from '@/lib/auth';
import { validarTarefa } from '@/lib/validar';

// Recebe vários subtemas com itens (vindos do "Colar do WhatsApp") e cria tudo de uma vez.
export async function POST(req) {
  const papel = await papelAtual();
  if (!papel) return NextResponse.json({ erro: 'Não autenticado' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const grupos = Array.isArray(body?.grupos) ? body.grupos : [];

  const linhas = [];
  for (const g of grupos) {
    for (const titulo of Array.isArray(g.itens) ? g.itens : []) {
      const { dados, erro } = validarTarefa({ ...g, titulo });
      if (erro) return NextResponse.json({ erro: `"${titulo}": ${erro}` }, { status: 400 });
      linhas.push(dados);
    }
  }
  if (!linhas.length) return NextResponse.json({ erro: 'Nenhum item selecionado.' }, { status: 400 });
  if (linhas.length > 200) return NextResponse.json({ erro: 'Máximo de 200 itens por vez.' }, { status: 400 });

  try {
    const sql = await db();
    const col = (k) => linhas.map((l) => l[k]);
    await sql`
      INSERT INTO tarefas (titulo, tipo, prazo, dia_mes, grupo, criado_por)
      SELECT titulo, tipo, prazo, dia_mes, grupo, ${nomeDe(papel)}
      FROM unnest(
        ${col('titulo')}::text[], ${col('tipo')}::text[], ${col('prazo')}::date[],
        ${col('dia_mes')}::smallint[], ${col('grupo')}::text[]
      ) WITH ORDINALITY AS x(titulo, tipo, prazo, dia_mes, grupo, n)
      ORDER BY n`;
    return NextResponse.json({ ok: true, criadas: linhas.length });
  } catch (e) {
    return NextResponse.json({ erro: e.message }, { status: 500 });
  }
}
