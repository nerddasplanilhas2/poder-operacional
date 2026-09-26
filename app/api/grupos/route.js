import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { papelAtual, nomeDe } from '@/lib/auth';
import { TIPOS } from '@/lib/periodo';

function ler(body) {
  const grupo = String(body?.grupo ?? '').trim();
  const tipo = String(body?.tipo ?? '');
  if (!grupo || !TIPOS.includes(tipo)) return null;
  return { grupo, tipo };
}

// Duplicar um subtema (ex.: checklist de evento para outro curso/data)
export async function POST(req) {
  const papel = await papelAtual();
  if (!papel) return NextResponse.json({ erro: 'Não autenticado' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const origem = ler(body);
  const novo = String(body?.novo ?? '').trim().replace(/\s+/g, ' ');
  const prazo = /^\d{4}-\d{2}-\d{2}$/.test(body?.prazo ?? '') ? body.prazo : null;
  if (!origem || !novo || novo.length > 120) {
    return NextResponse.json({ erro: 'Informe o nome do novo subtema.' }, { status: 400 });
  }

  try {
    const sql = await db();
    const r = await sql`
      INSERT INTO tarefas (titulo, descricao, tipo, prazo, dia_mes, grupo, criado_por)
      SELECT titulo, descricao, tipo, COALESCE(${prazo}::date, prazo), dia_mes, ${novo}, ${nomeDe(papel)}
      FROM tarefas
      WHERE grupo = ${origem.grupo} AND tipo = ${origem.tipo}
      ORDER BY id
      RETURNING id`;
    return NextResponse.json({ ok: true, criadas: r.length });
  } catch (e) {
    return NextResponse.json({ erro: e.message }, { status: 500 });
  }
}

// Renomear um subtema, ou definir a data do evento para todos os itens de uma vez
export async function PATCH(req) {
  if (!(await papelAtual())) return NextResponse.json({ erro: 'Não autenticado' }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const origem = ler(body);

  if (body?.acao === 'data') {
    if (!origem) return NextResponse.json({ erro: 'Subtema inválido.' }, { status: 400 });
    const prazo = /^\d{4}-\d{2}-\d{2}$/.test(body?.prazo ?? '') ? body.prazo : null;
    try {
      const sql = await db();
      await sql`UPDATE tarefas SET prazo = ${prazo}::date WHERE grupo = ${origem.grupo} AND tipo = ${origem.tipo}`;
      return NextResponse.json({ ok: true });
    } catch (e) {
      return NextResponse.json({ erro: e.message }, { status: 500 });
    }
  }

  const novo = String(body?.novo ?? '').trim().replace(/\s+/g, ' ');
  if (!origem || !novo || novo.length > 120) return NextResponse.json({ erro: 'Nome inválido.' }, { status: 400 });
  try {
    const sql = await db();
    await sql`UPDATE tarefas SET grupo = ${novo} WHERE grupo = ${origem.grupo} AND tipo = ${origem.tipo}`;
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ erro: e.message }, { status: 500 });
  }
}

// Excluir o subtema inteiro
export async function DELETE(req) {
  if (!(await papelAtual())) return NextResponse.json({ erro: 'Não autenticado' }, { status: 401 });
  const origem = ler(await req.json().catch(() => ({})));
  if (!origem) return NextResponse.json({ erro: 'Subtema inválido.' }, { status: 400 });
  try {
    const sql = await db();
    await sql`DELETE FROM tarefas WHERE grupo = ${origem.grupo} AND tipo = ${origem.tipo}`;
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ erro: e.message }, { status: 500 });
  }
}
