const FUSO = process.env.FUSO_HORARIO || 'America/Belem';

// Data de hoje no fuso configurado, formato AAAA-MM-DD
export function hojeISO() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: FUSO,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

// Diárias zeram a cada dia, mensais a cada mês, urgentes só uma vez.
export function periodoDe(tipo, hoje = hojeISO()) {
  if (tipo === 'diaria') return hoje;
  if (tipo === 'mensal') return hoje.slice(0, 7);
  return 'unico';
}

export const TIPOS = ['diaria', 'urgente', 'mensal'];
