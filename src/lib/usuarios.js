import crypto from 'crypto';
import { redis } from './redis';

// Todos os usuários ficam num hash: campo = e-mail, valor = { nome, salt, hash }.
const CHAVE = 'usuarios';

function gerarHash(senha, salt) {
  const s = salt || crypto.randomBytes(16).toString('hex');
  const h = crypto.pbkdf2Sync(String(senha), s, 100000, 32, 'sha256').toString('hex');
  return { salt: s, hash: h };
}

// Cria um novo usuário. Retorna {ok, ...} ou {ok:false, msg}.
export async function criarUsuario(email, nome, senha) {
  email = String(email || '').trim().toLowerCase();
  nome = String(nome || '').trim();
  if (!nome || !email || !senha) return { ok: false, msg: 'Preencha nome, e-mail e senha.' };
  if (String(senha).length < 4) return { ok: false, msg: 'A senha deve ter ao menos 4 caracteres.' };

  const existe = await redis.hget(CHAVE, email);
  if (existe) return { ok: false, msg: 'Este e-mail já tem cadastro. Faça login.' };

  const { salt, hash } = gerarHash(senha);
  await redis.hset(CHAVE, { [email]: { nome, salt, hash } });
  return { ok: true, email, nome };
}

// Valida e-mail + senha. Retorna { email, nome } ou null.
export async function validarUsuario(email, senha) {
  email = String(email || '').trim().toLowerCase();
  const u = await redis.hget(CHAVE, email);
  if (!u || !u.salt) return null;
  const { hash } = gerarHash(senha, u.salt);
  if (hash !== u.hash) return null;
  return { email, nome: u.nome };
}
