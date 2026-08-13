import { NextResponse } from 'next/server';
import { verificarToken, COOKIE } from './lib/auth';

// Protege as paginas do painel: sem sessao valida, redireciona ao login.
export async function middleware(request) {
  const token = request.cookies.get(COOKIE)?.value;
  const sessao = await verificarToken(token);
  if (!sessao) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
