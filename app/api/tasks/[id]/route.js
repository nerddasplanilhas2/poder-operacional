import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { papelAtual } from '@/lib/auth';
import { validarTarefa } from '@/lib/validar';

export async function PATCH(req, { params }) {
  if (!(await papelAtual())) return NextResponse.json({ erro: 'Não autenticado' }, { status: 401 });
  const id = Number((await params).id);

  const { dados, erro } = validarTarefa(await req.json().catch(() => ({})));
  if (erro) return NextResponse.json({ erro }, { status: 400 });

  try {
    const sql = await db();
    await sql`
      UPDATE tarefas
         SET titulo = ${dados.titulo}, descricao = ${dados.descricao}, tipo = ${dados.tipo},
             prazo = ${dados.prazo}, dia_mes = ${dados.dia_mes}, grupo = ${dados.grupo}
       WHERE id = ${id}`;
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ erro: e.message }, { status: 500 });
  }
}

export async function DELETE(_req, { params }) {
  if (!(await papelAtual())) return NextResponse.json({ erro: 'Não autenticado' }, { status: 401 });
  const id = Number((await params).id);
  try {
    const sql = await db();
    await sql`DELETE FROM tarefas WHERE id = ${id}`;
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ erro: e.message }, { status: 500 });
  }
}
