import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { papelAtual, nomeDe, nomes } from '@/lib/auth';
import { hojeISO } from '@/lib/periodo';
import { validarTarefa } from '@/lib/validar';

export const dynamic = 'force-dynamic';

export async function GET() {
  const papel = await papelAtual();
  if (!papel) return NextResponse.json({ erro: 'Não autenticado' }, { status: 401 });

  try {
    const sql = await db();
    const hoje = hojeISO();
    const mes = hoje.slice(0, 7);

    // Urgentes concluídas somem do quadro depois de 7 dias.
    const tarefas = await sql`
      SELECT t.id, t.titulo, t.descricao, t.tipo,
             to_char(t.prazo, 'YYYY-MM-DD') AS prazo,
             t.dia_mes, t.grupo, t.criado_por, t.criado_em,
             c.concluido_por, c.concluido_em
      FROM tarefas t
      LEFT JOIN conclusoes c
        ON c.tarefa_id = t.id
       AND c.periodo = CASE t.tipo
                         WHEN 'diaria' THEN ${hoje}
                         WHEN 'mensal' THEN ${mes}
                         ELSE 'unico'
                       END
      WHERE NOT (t.tipo = 'urgente' AND c.concluido_em IS NOT NULL
                 AND c.concluido_em < now() - interval '7 days')
      ORDER BY t.id`;

    return NextResponse.json({ eu: { papel, nome: nomeDe(papel) }, nomes: nomes(), hoje, tarefas });
  } catch (e) {
    return NextResponse.json({ erro: e.message }, { status: 500 });
  }
}

export async function POST(req) {
  const papel = await papelAtual();
  if (!papel) return NextResponse.json({ erro: 'Não autenticado' }, { status: 401 });

  const { dados, erro } = validarTarefa(await req.json().catch(() => ({})));
  if (erro) return NextResponse.json({ erro }, { status: 400 });

  try {
    const sql = await db();
    const [nova] = await sql`
      INSERT INTO tarefas (titulo, descricao, tipo, prazo, dia_mes, grupo, criado_por)
      VALUES (${dados.titulo}, ${dados.descricao}, ${dados.tipo}, ${dados.prazo}, ${dados.dia_mes}, ${dados.grupo}, ${nomeDe(papel)})
      RETURNING id`;
    return NextResponse.json({ ok: true, id: nova.id });
  } catch (e) {
    return NextResponse.json({ erro: e.message }, { status: 500 });
  }
}
