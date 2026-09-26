import { TIPOS } from './periodo';

// Valida e normaliza os dados de uma demanda vindos do formulário.
export function validarTarefa(body) {
  const titulo = String(body?.titulo ?? '').trim();
  const descricao = String(body?.descricao ?? '').trim();
  const tipo = String(body?.tipo ?? '');
  const grupo = String(body?.grupo ?? '').trim().replace(/\s+/g, ' ');

  if (!titulo) return { erro: 'Informe o título.' };
  if (titulo.length > 200) return { erro: 'Título muito longo (máx. 200 caracteres).' };
  if (descricao.length > 2000) return { erro: 'Descrição muito longa.' };
  if (!TIPOS.includes(tipo)) return { erro: 'Tipo inválido.' };
  if (grupo.length > 120) return { erro: 'Nome do subtema muito longo.' };

  let prazo = null;
  if (tipo === 'urgente' && body?.prazo) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(body.prazo)) return { erro: 'Prazo inválido.' };
    prazo = body.prazo;
  }

  let dia_mes = null;
  if (tipo === 'mensal' && body?.dia_mes) {
    const n = Number(body.dia_mes);
    if (!Number.isInteger(n) || n < 1 || n > 31) return { erro: 'Dia do mês deve ser entre 1 e 31.' };
    dia_mes = n;
  }

  return { dados: { titulo, descricao: descricao || null, tipo, prazo, dia_mes, grupo: grupo || null } };
}
