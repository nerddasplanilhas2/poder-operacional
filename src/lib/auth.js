import { SignJWT, jwtVerify } from 'jose';

// Nome do cookie de sessão.
export const COOKIE = 'po_sessao';

const segredo = new TextEncoder().encode(
  process.env.AUTH_SECRET || 'troque-este-segredo-no-vercel'
);

export async function criarToken(payload) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(segredo);
}

export async function verificarToken(token) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, segredo);
    return payload;
  } catch {
    return null;
  }
}
