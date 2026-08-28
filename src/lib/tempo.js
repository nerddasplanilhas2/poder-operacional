import { TIMEZONE } from './config';

// Retorna a data/hora atual no fuso de Brasília (independente do servidor).
export function agoraBR() {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE, hourCycle: 'h23',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
  const p = Object.fromEntries(fmt.formatToParts(new Date()).map((x) => [x.type, x.value]));
  return {
    data: `${p.year}-${p.month}-${p.day}`,     // YYYY-MM-DD
    hora: parseInt(p.hour, 10),
    min: parseInt(p.minute, 10),
    horaStr: `${p.hour}:${p.minute}`,
  };
}

// Formata YYYY-MM-DD para DD/MM/AAAA.
export function fmtDataBR(iso) {
  if (!iso) return '';
  const [a, m, dd] = iso.split('-');
  return `${dd}/${m}/${a}`;
}
