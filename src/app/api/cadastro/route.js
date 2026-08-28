import { NextResponse } from 'next/server';
import { criarToken, COOKIE } from '../../../lib/auth';
import { criarUsuario } from '../../../lib/usuarios';

export const dynamic = 'force-dynamic';

// POST /api/cadastro  { nome, email, senha }
export async function POST(request) {
  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ ok: false, msg: 'Corpo inválido.' }, { status: 400 }); }

  const { nome, email, senha } = body || {};
  const r = await criarUsuario(email, nome, senha);
  if (!r.ok) return NextResponse.json(r, { status: 400 });

  // Já entra logado após o cadastro.
  const token = await criarToken({ email: r.email, nome: r.nome });
  const res = NextResponse.json({ ok: true, nome: r.nome });
  res.cookies.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
