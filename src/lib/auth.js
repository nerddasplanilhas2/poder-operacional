import { SignJWT, jwtVerify } from 'jose';

// Nome do cookie de sessao.
export const COOKIE = 'po_sessao';

const segredo = new TextEncoder().encode(
  process.env.AUTH_SECRET || 'troque-este-segredo-no-vercel'
);

// Usuarios autorizados, lidos das variaveis de ambiente.
export function getUsuarios() {
  const lista = [];
  if (process.env.COMANDANTE_EMAIL && process.env.COMANDANTE_SENHA) {
    lista.push({
      email: process.env.COMANDANTE_EMAIL.toLowerCase(),
      senha: process.env.COMANDANTE_SENHA,
      perfil: 'Comandante',
    });
  }
  if (process.env.DIRETOR_EMAIL && process.env.DIRETOR_SENHA) {
    lista.push({
      email: process.env.DIRETOR_EMAIL.toLowerCase(),
      senha: process.env.DIRETOR_SENHA,
      perfil: 'Diretor',
    });
  }
  return lista;
}

// Valida e-mail + senha; retorna o usuario (sem a senha) ou null.
export function validarLogin(email, senha) {
  const e = String(email || '').trim().toLowerCase();
  const u = getUsuarios().find((x) => x.email === e && x.senha === senha);
  return u ? { email: u.email, perfil: u.perfil } : null;
}

export async function criarToken(payload) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('8h')
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
