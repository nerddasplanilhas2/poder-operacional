import { NextResponse } from 'next/server';
import { COOKIE } from '../../../lib/auth';

export const dynamic = 'force-dynamic';

// POST /api/logout  -> apaga o cookie de sessao
export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 });
  return res;
}
