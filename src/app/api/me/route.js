import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verificarToken, COOKIE } from '../../../lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/me -> dados da sessão atual (ou 401)
export async function GET() {
  const sessao = await verificarToken(cookies().get(COOKIE)?.value);
  if (!sessao) return NextResponse.json({ ok: false }, { status: 401 });
  return NextResponse.json({ ok: true, email: sessao.email, nome: sessao.nome });
}
