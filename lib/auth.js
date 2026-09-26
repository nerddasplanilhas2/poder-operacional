import { headers } from 'next/headers';

// Sem login: o aparelho informa quem está usando (escolhido uma vez no topo da página)
// só para registrar "por Fulana" e "✓ Fulano". Qualquer pessoa com o link pode usar.
export async function papelAtual() {
  const h = await headers();
  const q = h.get('x-quem');
  return q === 'professora' || q === 'aluno' ? q : 'anonimo';
}

export function nomes() {
  return {
    professora: process.env.NOME_PROFESSORA || 'Professora',
    aluno: process.env.NOME_ALUNO || 'Aluno',
  };
}

export function nomeDe(papel) {
  return nomes()[papel] ?? null;
}
