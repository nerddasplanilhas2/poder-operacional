import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { papelAtual, nomeDe } from '@/lib/auth';
import { periodoDe } from '@/lib/periodo';

// Marca ou desmarca a demanda no período atual (dia, mês ou única vez).
export async function POST(req, { params }) {
  const papel = await papelAtual();
  if (!papel) return NextResponse.json({ erro: 'Não autenticado' }, { status: 401 });

  const id = Number((await params).id);
  const { feito } = await req.json().catch(() => ({}));

  try {
    const sql = await db();
    const [tarefa] = await sql`SELECT tipo FROM tarefas WHERE id = ${id}`;
    if (!tarefa) return NextResponse.json({ erro: 'Demanda não encontrada.' }, { status: 404 });

    const periodo = periodoDe(tarefa.tipo);
    if (feito) {
      await sql`
        INSERT INTO conclusoes (tarefa_id, periodo, concluido_por)
        VALUES (${id}, ${periodo}, ${nomeDe(papel)})
        ON CONFLICT (tarefa_id, periodo) DO NOTHING`;
    } else {
      await sql`DELETE FROM conclusoes WHERE tarefa_id = ${id} AND periodo = ${periodo}`;
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ erro: e.message }, { status: 500 });
  }
}
