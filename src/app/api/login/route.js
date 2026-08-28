import { NextResponse } from 'next/server';
import { criarToken, COOKIE } from '../../../lib/auth';
import { validarUsuario } from '../../../lib/usuarios';

export const dynamic = 'force-dynamic';

// POST /api/login  { email, senha }
export async function POST(request) {
  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ ok: false, msg: 'Corpo inválido.' }, { status: 400 }); }

  const { email, senha } = body || {};
  const usuario = await validarUsuario(email, senha);
  if (!usuario) {
    return NextResponse.json({ ok: false, msg: 'E-mail ou senha inválidos.' }, { status: 401 });
  }

  const token = await criarToken({ email: usuario.email, nome: usuario.nome });
  const res = NextResponse.json({ ok: true, nome: usuario.nome });
  res.cookies.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 dias
  });
  return res;
}
