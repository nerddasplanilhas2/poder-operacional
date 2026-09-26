import { NextResponse } from 'next/server';
import { papelPelaSenha, iniciarSessao, encerrarSessao } from '@/lib/auth';

export async function POST(req) {
  const { senha } = await req.json().catch(() => ({}));
  const papel = papelPelaSenha(senha);
  if (!papel) {
    return NextResponse.json({ erro: 'Senha incorreta.' }, { status: 401 });
  }
  await iniciarSessao(papel);
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  await encerrarSessao();
  return NextResponse.json({ ok: true });
}
