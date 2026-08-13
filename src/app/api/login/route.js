import { NextResponse } from 'next/server';
import { validarLogin, criarToken, COOKIE } from '../../../lib/auth';

export const dynamic = 'force-dynamic';

// POST /api/login  { email, senha }
export async function POST(request) {
  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ ok: false, msg: 'Corpo inválido.' }, { status: 400 }); }

  const { email, senha } = body || {};
  const usuario = validarLogin(email, senha);
  if (!usuario) {
    return NextResponse.json({ ok: false, msg: 'E-mail ou senha inválidos.' }, { status: 401 });
  }

  const token = await criarToken({ email: usuario.email, perfil: usuario.perfil });
  const res = NextResponse.json({ ok: true, perfil: usuario.perfil });
  res.cookies.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 8, // 8 horas
  });
  return res;
}
