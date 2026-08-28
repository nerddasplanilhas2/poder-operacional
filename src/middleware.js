import { NextResponse } from 'next/server';
import { verificarToken, COOKIE } from './lib/auth';

// Protege o formulário (/) e o painel (/dashboard): sem sessão, vai ao login.
export async function middleware(request) {
  const sessao = await verificarToken(request.cookies.get(COOKIE)?.value);
  if (!sessao) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/dashboard/:path*'],
};
