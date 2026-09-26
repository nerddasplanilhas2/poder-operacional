// Transforma a mensagem de WhatsApp em subtemas com itens de checklist.
// Roda no navegador (prévia editável antes de salvar).
//
// Formatos aceitos:
//  - Texto livre: linhas terminadas em ":" viram subtema; linhas que começam
//    com verbo ("Verificar...", "Tenho q pegar...") viram tarefa marcada.
//  - Texto estruturado:  "## Nome do subtema (01/10) (urgente)" e "- item".

const ABREVIACOES = {
  q: 'que', vc: 'você', vcs: 'vocês', msm: 'mesmo', tbm: 'também', tb: 'também',
  pq: 'porque', hj: 'hoje', td: 'tudo', tds: 'todos', ta: 'está', 'tá': 'está',
  pra: 'para', pro: 'para o', pros: 'para os', mt: 'muito', mto: 'muito',
  qnd: 'quando', cmg: 'comigo', obg: 'obrigada', vdd: 'verdade', blz: 'beleza',
  n: 'não', ñ: 'não', tmb: 'também', qto: 'quanto', agr: 'agora',
};

const NAO_VERBOS = new Set([
  'para', 'par', 'lugar', 'mar', 'bar', 'familiar', 'regular', 'popular', 'particular',
  'anterior', 'posterior', 'interior', 'exterior', 'superior', 'inferior', 'melhor',
  'pior', 'maior', 'menor', 'qualquer', 'mulher', 'colher', 'por', 'flor', 'cor',
  'dor', 'valor', 'favor', 'senhor', 'amor', 'professor', 'diretor', 'coordenador',
]);

const PREFIXOS = /^(e\s+)?(eu\s+|você\s+|a\s+gente\s+)?(também\s+)?(tenho|temos|tem|têm|preciso|precisa|precisamos|precisaria|vou|vai|vamos|devo|deve|pode|podia|poderia)\s+(que\s+|de\s+)?/i;

const MARCADOR = /^\s*(?:[-–—•*▪►➤→✅☑️☐□✔️✓]+|\d{1,2}[.)-])\s*/u;

function trocarAbreviacoes(texto) {
  return texto.replace(/[\p{L}]+/gu, (palavra) => {
    const sub = ABREVIACOES[palavra.toLowerCase()];
    return sub ?? palavra;
  });
}

function maiuscula(t) {
  return t ? t.charAt(0).toUpperCase() + t.slice(1) : t;
}

function limparItem(linha) {
  let t = trocarAbreviacoes(linha.replace(MARCADOR, '').trim());
  t = t.replace(PREFIXOS, '');
  t = t.replace(/\s+/g, ' ').replace(/[.;,\s]+$/, '');
  return maiuscula(t);
}

function pareceTarefa(texto) {
  const primeira = (texto.split(/\s+/)[0] || '').toLowerCase().replace(/[^\p{L}]/gu, '');
  if (primeira.length < 2 || NAO_VERBOS.has(primeira)) return false;
  return /(ar|er|ir|or|ár|ér|ír)$/.test(primeira);
}

function dataDe(texto, hoje = new Date()) {
  const m = texto.match(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/);
  if (!m) return null;
  const d = Number(m[1]), mes = Number(m[2]);
  if (d < 1 || d > 31 || mes < 1 || mes > 12) return null;
  let ano = m[3] ? Number(m[3].length === 2 ? '20' + m[3] : m[3]) : hoje.getFullYear();
  if (!m[3] && mes < hoje.getMonth() + 1 - 2) ano += 1; // "05/01" dito em outubro = ano que vem
  return `${ano}-${String(mes).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function tipoDe(texto) {
  const t = texto.toLowerCase();
  if (/di[aá]ri[ao]s?/.test(t)) return 'diaria';
  if (/mensa(l|is)/.test(t)) return 'mensal';
  if (/urgente/.test(t)) return 'urgente';
  return null;
}

function nomeDoCabecalho(linha) {
  let n = linha.replace(/^#+\s*/, '').replace(/:\s*$/, '');
  n = n.replace(/\((di[aá]ri[ao]s?|mensa(l|is)|urgentes?)\)/gi, '');
  n = trocarAbreviacoes(n).replace(/\s+/g, ' ').trim();
  return maiuscula(n);
}

export function analisarTexto(texto, hoje = new Date()) {
  const linhas = String(texto || '').replace(/\r/g, '').split('\n');
  const secoes = [];
  let atual = null;

  const novaSecao = (cabecalho) => {
    // Se o subtema anterior não teve nenhuma tarefa (só conversa), o nome dele
    // continua valendo: normalmente o primeiro título é o assunto de verdade.
    if (atual && !atual.itens.some((i) => i.marcado)) {
      atual.cabecalhoExtra = cabecalho;
      if (!atual.prazo) atual.prazo = dataDe(cabecalho, hoje);
      if (!atual.tipoDetectado) atual.tipoDetectado = tipoDe(cabecalho);
      return;
    }
    atual = {
      nome: nomeDoCabecalho(cabecalho),
      prazo: dataDe(cabecalho, hoje),
      tipoDetectado: tipoDe(cabecalho),
      itens: [],
    };
    secoes.push(atual);
  };

  for (const bruta of linhas) {
    const linha = bruta.trim();
    if (!linha) continue;

    const ehCabecalho = /^#{1,3}\s/.test(linha) || (/:\s*$/.test(linha) && !MARCADOR.test(linha));
    if (ehCabecalho) {
      novaSecao(linha);
      continue;
    }

    if (!atual) {
      atual = { nome: '', prazo: null, tipoDetectado: null, itens: [] };
      secoes.push(atual);
    }

    const temMarcador = MARCADOR.test(linha) && !/^\d{1,2}[.)-]\d/.test(linha);
    const texto = limparItem(linha);
    if (!texto) continue;
    atual.itens.push({ texto, original: linha, marcado: temMarcador || pareceTarefa(texto) });
  }

  return secoes
    .filter((s) => s.itens.length > 0)
    .map((s) => ({
      nome: s.nome,
      tipo: s.tipoDetectado || 'urgente',
      prazo: s.prazo || '',
      itens: s.itens,
    }));
}
