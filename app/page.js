'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { analisarTexto } from '@/lib/parser';

const COLUNAS = [
  { tipo: 'diaria', nome: 'Diárias', dica: 'Zera todo dia', cor: 'violeta' },
  { tipo: 'urgente', nome: 'Urgentes', dica: 'Até concluir', cor: 'magenta' },
  { tipo: 'mensal', nome: 'Mensais', dica: 'Zera todo mês', cor: 'indigo' },
];

const VAZIO = { titulo: '', descricao: '', tipo: 'diaria', prazo: '', dia_mes: '', grupo: '' };

/* ---------------- utilitários ---------------- */

function fmtData(iso) {
  const [a, m, d] = iso.split('-');
  return `${d}/${m}${a !== String(new Date().getFullYear()) ? '/' + a : ''}`;
}

function dataExtenso(iso) {
  const t = new Date(iso + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
  return t.charAt(0).toUpperCase() + t.slice(1);
}

function fmtHora(ts) {
  return new Date(ts).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function fmtQuando(ts, tipo) {
  if (tipo === 'diaria') return fmtHora(ts);
  return new Date(ts).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) + ' ' + fmtHora(ts);
}

let quemAtual = '';

function lerQuem() {
  try { return localStorage.getItem('planner-quem') || ''; } catch { return ''; }
}

function salvarQuem(q) {
  quemAtual = q;
  try { localStorage.setItem('planner-quem', q); } catch {}
}

function dataCurta(iso) {
  const d = new Date(iso + 'T12:00:00');
  const sem = d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
  return `${sem} ${fmtData(iso)}`;
}

async function api(url, metodo = 'GET', corpo) {
  const cab = { 'x-quem': quemAtual };
  if (corpo) cab['Content-Type'] = 'application/json';
  const r = await fetch(url, {
    method: metodo,
    headers: cab,
    body: corpo ? JSON.stringify(corpo) : undefined,
    cache: 'no-store',
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) {
    const e = new Error(j.erro || 'Algo deu errado.');
    e.status = r.status;
    throw e;
  }
  return j;
}

// Separa as demandas da coluna em "avulsas" + subtemas, na ordem certa.
function agrupar(tarefas) {
  const avulsas = [];
  const mapa = new Map();
  for (const t of tarefas) {
    if (!t.grupo) avulsas.push(t);
    else {
      if (!mapa.has(t.grupo)) mapa.set(t.grupo, []);
      mapa.get(t.grupo).push(t);
    }
  }
  const grupos = [...mapa.entries()].map(([nome, itens]) => {
    const prazos = itens.map((i) => i.prazo).filter(Boolean).sort();
    return {
      nome,
      itens,
      feitas: itens.filter((i) => i.concluido_em).length,
      prazo: prazos[0] || null,
      primeiro: Math.min(...itens.map((i) => i.id)),
    };
  });
  grupos.sort((a, b) => {
    const ca = a.feitas === a.itens.length, cb = b.feitas === b.itens.length;
    if (ca !== cb) return ca - cb;
    if (a.prazo !== b.prazo) return !a.prazo ? 1 : !b.prazo ? -1 : a.prazo.localeCompare(b.prazo);
    return a.primeiro - b.primeiro;
  });
  return { avulsas, grupos };
}

// Ajusta a altura do campo ao texto (itens longos aparecem inteiros).
function crescer(el) {
  if (!el) return;
  el.style.height = 'auto';
  el.style.height = el.scrollHeight + 'px';
}

const porConclusao = (a, b) => Boolean(a.concluido_em) - Boolean(b.concluido_em);

/* ---------------- ícones ---------------- */

const Icone = {
  check: <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>,
  lapis: <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16v4zM13.5 6.5l4 4" /></svg>,
  lixo: <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7h14M10 7V5h4v2M7 7l1 12h8l1-12" /></svg>,
  copiar: <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V6a2 2 0 00-2-2H6a2 2 0 00-2 2v8a2 2 0 002 2h2" /></svg>,
  seta: <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>,
  zap: <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16v11H8l-4 4V5z" /><path d="M8 9h8M8 12h5" /></svg>,
  mais: <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>,
  calendario: <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M4 10h16M9 3v4M15 3v4" /></svg>,
  baixar: <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v11M7 10l5 5 5-5M5 20h14" /></svg>,
};

/* ---------------- página ---------------- */

export default function Pagina() {
  const [estado, setEstado] = useState('carregando'); // carregando | pronto
  const [quem, setQuem] = useState(null);
  const [dados, setDados] = useState(null);
  const [erro, setErro] = useState('');
  const [form, setForm] = useState(null);
  const [importar, setImportar] = useState(false);
  const [acaoGrupo, setAcaoGrupo] = useState(null); // { modo, grupo, tipo }
  const [aba, setAba] = useState('urgente');
  const [instalar, setInstalar] = useState(null);

  const carregar = useCallback(async () => {
    try {
      const j = await api('/api/tasks');
      setDados(j);
      setErro('');
      setEstado('pronto');
    } catch (e) {
      setErro(e.message);
      setEstado((s) => (s === 'carregando' ? 'pronto' : s));
    }
  }, []);

  useEffect(() => {
    const q = lerQuem();
    quemAtual = q;
    setQuem(q);
    carregar();
    const t = setInterval(carregar, 30000);
    const foco = () => document.visibilityState === 'visible' && carregar();
    document.addEventListener('visibilitychange', foco);

    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});
    const aoOferecer = (e) => { e.preventDefault(); setInstalar(e); };
    window.addEventListener('beforeinstallprompt', aoOferecer);

    return () => {
      clearInterval(t);
      document.removeEventListener('visibilitychange', foco);
      window.removeEventListener('beforeinstallprompt', aoOferecer);
    };
  }, [carregar]);

  const tentar = async (fn) => {
    try { await fn(); } catch (e) { setErro(e.message); }
    carregar();
  };

  function marcar(t) {
    const feito = !t.concluido_em;
    setDados((d) => ({
      ...d,
      tarefas: d.tarefas.map((x) =>
        x.id === t.id
          ? { ...x, concluido_em: feito ? new Date().toISOString() : null, concluido_por: feito ? (d.nomes?.[quemAtual] ?? null) : null }
          : x
      ),
    }));
    tentar(() => api(`/api/tasks/${t.id}/check`, 'POST', { feito }));
  }

  function excluir(t) {
    setDados((d) => ({ ...d, tarefas: d.tarefas.filter((x) => x.id !== t.id) }));
    tentar(() => api(`/api/tasks/${t.id}`, 'DELETE'));
  }

  function excluirGrupo(g, tipo) {
    setDados((d) => ({ ...d, tarefas: d.tarefas.filter((x) => !(x.grupo === g && x.tipo === tipo)) }));
    tentar(() => api('/api/grupos', 'DELETE', { grupo: g, tipo }));
  }

  function escolherQuem(q) {
    salvarQuem(q);
    setQuem(q);
  }

  const nomesGrupos = useMemo(
    () => [...new Set((dados?.tarefas ?? []).map((t) => t.grupo).filter(Boolean))],
    [dados]
  );

  if (estado === 'carregando') return <div className="tela-cheia"><div className="spinner" /></div>;

  const tarefas = dados?.tarefas ?? [];
  const total = tarefas.length;
  const feitas = tarefas.filter((t) => t.concluido_em).length;

  return (
    <main>
      <header className="topo">
        <div className="topo-inner">
          <div>
            <p className="topo-data">{dados && dataExtenso(dados.hoje)}</p>
            <h1>Planner de Demandas</h1>
          </div>
          <div className="topo-dir">
            {instalar && (
              <button className="chip-user botao" onClick={async () => { instalar.prompt(); await instalar.userChoice; setInstalar(null); }}>
                <span className="ico-inline">{Icone.baixar}</span> Instalar app
              </button>
            )}
            {quem && dados && (
              <div className="quem" role="group" aria-label="Quem está usando">
                {['professora', 'aluno'].map((q) => (
                  <button key={q} className={quem === q ? 'ativo' : ''} onClick={() => escolherQuem(q)}>
                    {dados.nomes[q]}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="topo-inner resumo">
          <div className="resumo-num"><strong>{feitas}</strong> de {total} concluídas</div>
          <div className="barra grande"><span style={{ width: total ? `${(feitas / total) * 100}%` : 0 }} /></div>
          <div className="topo-botoes">
            <button className="btn-vidro" onClick={() => setForm({ ...VAZIO, tipo: aba })}>
              <span className="ico-inline">{Icone.mais}</span> Nova
            </button>
            <button className="btn-primario" onClick={() => setImportar(true)}>
              <span className="ico-inline">{Icone.zap}</span> Colar do WhatsApp
            </button>
          </div>
        </div>
      </header>

      {!quem && dados && (
        <div className="boas-vindas">
          <span>Quem está usando este aparelho?</span>
          <div>
            <button className="btn-primario" onClick={() => escolherQuem('professora')}>{dados.nomes.professora}</button>
            <button className="btn-primario" onClick={() => escolherQuem('aluno')}>{dados.nomes.aluno}</button>
          </div>
        </div>
      )}

      {erro && <div className="alerta" onClick={() => setErro('')}>{erro}</div>}

      <nav className="abas">
        {COLUNAS.map((c) => {
          const n = tarefas.filter((t) => t.tipo === c.tipo && !t.concluido_em).length;
          return (
            <button key={c.tipo} className={`aba ${aba === c.tipo ? 'ativa' : ''}`} onClick={() => setAba(c.tipo)}>
              {c.nome} {n > 0 && <span className="aba-n">{n}</span>}
            </button>
          );
        })}
      </nav>

      <section className="quadro">
        {COLUNAS.map((c) => (
          <Coluna
            key={c.tipo}
            coluna={c}
            visivel={aba === c.tipo}
            hoje={dados?.hoje}
            tarefas={tarefas.filter((t) => t.tipo === c.tipo)}
            onMarcar={marcar}
            onEditar={(t) => setForm({ ...t, prazo: t.prazo || '', dia_mes: t.dia_mes || '', descricao: t.descricao || '', grupo: t.grupo || '' })}
            onExcluir={excluir}
            onNova={(grupo, prazo) => setForm({ ...VAZIO, tipo: c.tipo, grupo: grupo || '', prazo: prazo || '' })}
            onGrupo={(modo, grupo, prazo) => (modo === 'excluir' ? excluirGrupo(grupo, c.tipo) : setAcaoGrupo({ modo, grupo, tipo: c.tipo, prazoAtual: prazo || '' }))}
          />
        ))}
      </section>

      {form && (
        <Formulario
          inicial={form}
          grupos={nomesGrupos}
          onFechar={() => setForm(null)}
          onSalvo={() => { setForm(null); carregar(); }}
        />
      )}
      {importar && (
        <Importar
          onFechar={() => setImportar(false)}
          onSalvo={(tipo) => { setImportar(false); setAba(tipo); carregar(); }}
        />
      )}
      {acaoGrupo && (
        <AcaoGrupo
          {...acaoGrupo}
          onFechar={() => setAcaoGrupo(null)}
          onSalvo={() => { setAcaoGrupo(null); carregar(); }}
        />
      )}
    </main>
  );
}

/* ---------------- coluna e subtemas ---------------- */

function Coluna({ coluna, visivel, hoje, tarefas, onMarcar, onEditar, onExcluir, onNova, onGrupo }) {
  const { avulsas, grupos } = useMemo(() => agrupar(tarefas), [tarefas]);
  const feitas = tarefas.filter((t) => t.concluido_em).length;
  const props = { hoje, onMarcar, onEditar, onExcluir };

  return (
    <div className={`coluna cor-${coluna.cor} ${visivel ? 'visivel' : ''}`}>
      <div className="coluna-topo">
        <div>
          <h2>{coluna.nome}</h2>
          <p>{coluna.dica}</p>
        </div>
        <span className="contador">{feitas}/{tarefas.length}</span>
      </div>
      <div className="barra"><span style={{ width: tarefas.length ? `${(feitas / tarefas.length) * 100}%` : 0 }} /></div>

      {avulsas.length > 0 && (
        <ul className="lista">
          {[...avulsas].sort(porConclusao).map((t) => <Cartao key={t.id} t={t} {...props} />)}
        </ul>
      )}

      {grupos.map((g) => (
        <Grupo key={g.nome} g={g} hoje={hoje} props={props} comData={coluna.tipo === 'urgente'} onNova={() => onNova(g.nome, g.prazo)} onGrupo={onGrupo} />
      ))}

      {tarefas.length === 0 && <p className="vazio">Nenhuma demanda aqui.</p>}

      <button className="btn-add" onClick={() => onNova('')}>+ Adicionar</button>
    </div>
  );
}

function Grupo({ g, hoje, props, comData, onNova, onGrupo }) {
  const completo = g.feitas === g.itens.length;
  const [aberto, setAberto] = useState(!completo);
  const [confirmar, setConfirmar] = useState(false);

  useEffect(() => { if (completo) setAberto(false); }, [completo]);

  let classeData = '';
  if (g.prazo && !completo) classeData = g.prazo < hoje ? 'atrasado' : g.prazo === hoje ? 'hoje' : '';
  const selo = comData ? (
    <button
      className={`data-evento ${g.prazo ? '' : 'vazia'} ${classeData}`}
      title="Definir a data do evento para todos os itens"
      onClick={() => onGrupo('data', g.nome, g.prazo)}
    >
      <span className="ico-inline">{Icone.calendario}</span>
      {g.prazo ? (g.prazo === hoje && !completo ? 'Hoje' : dataCurta(g.prazo)) : 'Data'}
    </button>
  ) : null;

  return (
    <div className={`grupo ${completo ? 'completo' : ''}`}>
      <div className="grupo-topo">
        <button className={`grupo-titulo ${aberto ? 'aberto' : ''}`} onClick={() => setAberto(!aberto)} aria-expanded={aberto}>
          <span className="seta">{Icone.seta}</span>
          <span className="grupo-nome">{g.nome}</span>
        </button>
        {selo}
        <span className="grupo-n">{completo ? '✓' : `${g.feitas}/${g.itens.length}`}</span>
      </div>
      <div className="barra fina"><span style={{ width: `${(g.feitas / g.itens.length) * 100}%` }} /></div>

      {aberto && (
        <>
          <ul className="lista">
            {[...g.itens].sort(porConclusao).map((t) => <Cartao key={t.id} t={t} {...props} semPrazo={Boolean(g.prazo) && t.prazo === g.prazo} compacto />)}
          </ul>
          <div className="grupo-acoes">
            <button onClick={onNova}>+ Item</button>
            <span className="grupo-acoes-dir">
              {confirmar ? (
                <>
                  <button className="perigo" onClick={() => onGrupo('excluir', g.nome)}>Excluir {g.itens.length} itens?</button>
                  <button onClick={() => setConfirmar(false)}>Não</button>
                </>
              ) : (
                <>
                  <button className="so-icone" title="Duplicar (ex.: mesmo checklist para outro evento)" aria-label="Duplicar subtema" onClick={() => onGrupo('duplicar', g.nome)}>{Icone.copiar}</button>
                  <button className="so-icone" title="Renomear" aria-label="Renomear subtema" onClick={() => onGrupo('renomear', g.nome)}>{Icone.lapis}</button>
                  <button className="so-icone" title="Excluir subtema" aria-label="Excluir subtema" onClick={() => setConfirmar(true)}>{Icone.lixo}</button>
                </>
              )}
            </span>
          </div>
        </>
      )}
    </div>
  );
}

function Cartao({ t, hoje, onMarcar, onEditar, onExcluir, semPrazo, compacto }) {
  const [confirmar, setConfirmar] = useState(false);
  const feito = Boolean(t.concluido_em);

  let selo = null;
  if (t.tipo === 'urgente' && t.prazo && !feito && !semPrazo) {
    if (t.prazo < hoje) selo = <span className="selo atrasado">Atrasada · {fmtData(t.prazo)}</span>;
    else if (t.prazo === hoje) selo = <span className="selo hoje">Vence hoje</span>;
    else selo = <span className="selo">Até {fmtData(t.prazo)}</span>;
  }
  if (t.tipo === 'mensal' && t.dia_mes && !feito) {
    const diaHoje = Number(hoje?.slice(8, 10));
    selo = <span className={`selo ${diaHoje > t.dia_mes ? 'atrasado' : ''}`}>Todo dia {t.dia_mes}</span>;
  }

  const meta = feito
    ? <span className="meta-feito">✓ {t.concluido_por} · {fmtQuando(t.concluido_em, t.tipo)}</span>
    : !compacto && t.criado_por ? <span className="meta">por {t.criado_por}</span> : null;

  return (
    <li className={`cartao ${feito ? 'feito' : ''} ${compacto ? 'compacto' : ''}`}>
      <button className="check" aria-label={feito ? 'Desmarcar' : 'Marcar como concluída'} aria-pressed={feito} onClick={() => onMarcar(t)}>
        {Icone.check}
      </button>
      <div className="cartao-corpo">
        <p className="cartao-titulo">{t.titulo}</p>
        {t.descricao && <p className="cartao-desc">{t.descricao}</p>}
        {(selo || meta) && <div className="cartao-meta">{selo}{meta}</div>}
      </div>
      <div className="cartao-acoes">
        {confirmar ? (
          <>
            <button className="acao perigo" onClick={() => onExcluir(t)}>Excluir</button>
            <button className="acao" onClick={() => setConfirmar(false)}>Não</button>
          </>
        ) : (
          <>
            <button className="icone" aria-label="Editar" onClick={() => onEditar(t)}>{Icone.lapis}</button>
            <button className="icone" aria-label="Excluir" onClick={() => setConfirmar(true)}>{Icone.lixo}</button>
          </>
        )}
      </div>
    </li>
  );
}

/* ---------------- modais ---------------- */

function Modal({ onFechar, largo, children }) {
  useEffect(() => {
    const esc = (e) => e.key === 'Escape' && onFechar();
    window.addEventListener('keydown', esc);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', esc);
      document.body.style.overflow = '';
    };
  }, [onFechar]);

  return (
    <div className="modal-fundo" onMouseDown={(e) => e.target === e.currentTarget && onFechar()}>
      <div className={`modal ${largo ? 'largo' : ''}`}>{children}</div>
    </div>
  );
}

function SeletorTipo({ valor, onChange, nome = 'tipo' }) {
  return (
    <div className="tipos">
      {COLUNAS.map((c) => (
        <label key={c.tipo} className={`tipo cor-${c.cor} ${valor === c.tipo ? 'sel' : ''}`}>
          <input type="radio" name={nome} value={c.tipo} checked={valor === c.tipo} onChange={() => onChange(c.tipo)} />
          {c.nome}
        </label>
      ))}
    </div>
  );
}

function Formulario({ inicial, grupos, onFechar, onSalvo }) {
  const [f, setF] = useState(inicial);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const editando = Boolean(inicial.id);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function salvar(e) {
    e.preventDefault();
    setSalvando(true);
    setErro('');
    try {
      await api(editando ? `/api/tasks/${f.id}` : '/api/tasks', editando ? 'PATCH' : 'POST', f);
      onSalvo();
    } catch (e) {
      setErro(e.message);
      setSalvando(false);
    }
  }

  return (
    <Modal onFechar={onFechar}>
      <form onSubmit={salvar}>
        <h3>{editando ? 'Editar demanda' : 'Nova demanda'}</h3>
        <SeletorTipo valor={f.tipo} onChange={(tipo) => setF({ ...f, tipo })} />

        <label className="campo">
          <span>Título</span>
          <input autoFocus value={f.titulo} onChange={set('titulo')} maxLength={200} placeholder="O que precisa ser feito?" required />
        </label>

        <label className="campo">
          <span>Subtema <em>(opcional)</em></span>
          <input list="lista-grupos" value={f.grupo} onChange={set('grupo')} maxLength={120} placeholder="Ex.: Palestra de Pedagogia" />
          <datalist id="lista-grupos">{grupos.map((g) => <option key={g} value={g} />)}</datalist>
        </label>

        <label className="campo">
          <span>Detalhes <em>(opcional)</em></span>
          <textarea rows={3} value={f.descricao} onChange={set('descricao')} placeholder="Instruções, links, observações…" />
        </label>

        {f.tipo === 'urgente' && (
          <label className="campo">
            <span>Prazo <em>(opcional)</em></span>
            <input type="date" value={f.prazo} onChange={set('prazo')} />
          </label>
        )}
        {f.tipo === 'mensal' && (
          <label className="campo">
            <span>Até que dia do mês? <em>(opcional)</em></span>
            <input type="number" min="1" max="31" value={f.dia_mes} onChange={set('dia_mes')} placeholder="Ex.: 10" />
          </label>
        )}

        {erro && <p className="erro">{erro}</p>}
        <div className="modal-acoes">
          <button type="button" className="btn-sec" onClick={onFechar}>Cancelar</button>
          <button className="btn-primario" disabled={salvando}>{salvando ? 'Salvando…' : 'Salvar'}</button>
        </div>
      </form>
    </Modal>
  );
}

function Importar({ onFechar, onSalvo }) {
  const [texto, setTexto] = useState('');
  const [secoes, setSecoes] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  const selecionados = secoes ? secoes.reduce((n, s) => n + s.itens.filter((i) => i.marcado && i.texto.trim()).length, 0) : 0;

  function organizar() {
    const r = analisarTexto(texto);
    if (!r.length) return setErro('Não encontrei nenhuma linha no texto.');
    setErro('');
    setSecoes(r);
  }

  const mudarSecao = (si, campo, valor) =>
    setSecoes(secoes.map((s, i) => (i === si ? { ...s, [campo]: valor } : s)));
  const mudarItem = (si, ii, campo, valor) =>
    setSecoes(secoes.map((s, i) => (i === si ? { ...s, itens: s.itens.map((it, j) => (j === ii ? { ...it, [campo]: valor } : it)) } : s)));
  const novoItem = (si) =>
    setSecoes(secoes.map((s, i) => (i === si ? { ...s, itens: [...s.itens, { texto: '', marcado: true }] } : s)));

  async function salvar() {
    setSalvando(true);
    setErro('');
    const grupos = secoes
      .map((s) => ({
        grupo: s.nome,
        tipo: s.tipo,
        prazo: s.tipo === 'urgente' ? s.prazo : '',
        itens: s.itens.filter((i) => i.marcado && i.texto.trim()).map((i) => i.texto.trim()),
      }))
      .filter((g) => g.itens.length);
    try {
      await api('/api/lote', 'POST', { grupos });
      const contagem = {};
      grupos.forEach((g) => (contagem[g.tipo] = (contagem[g.tipo] || 0) + g.itens.length));
      onSalvo(Object.entries(contagem).sort((a, b) => b[1] - a[1])[0][0]);
    } catch (e) {
      setErro(e.message);
      setSalvando(false);
    }
  }

  return (
    <Modal onFechar={onFechar} largo>
      <h3>Colar do WhatsApp</h3>

      {!secoes ? (
        <>
          <p className="ajuda">
            Cole a mensagem da professora como veio. Linhas que terminam com <b>:</b> viram subtema,
            e linhas que começam com uma ação (<i>Verificar…</i>, <i>Tenho q pegar…</i>) viram itens do checklist.
            Você revisa tudo antes de salvar.
          </p>
          <textarea
            className="colar"
            autoFocus
            rows={12}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder={'Demandas da palestra:\nVerificar a frequência dos alunos\nPegar água para o palestrante\nVerificar se o data show está ok'}
          />
          {erro && <p className="erro">{erro}</p>}
          <div className="modal-acoes">
            <button type="button" className="btn-sec" onClick={onFechar}>Cancelar</button>
            <button className="btn-primario" disabled={!texto.trim()} onClick={organizar}>Organizar</button>
          </div>
        </>
      ) : (
        <>
          <p className="ajuda">
            Marque o que é tarefa e ajuste o texto se quiser. Os itens desmarcados são conversa e não serão salvos.
          </p>

          {secoes.map((s, si) => (
            <div key={si} className={`secao cor-${COLUNAS.find((c) => c.tipo === s.tipo).cor}`}>
              <input
                className="secao-nome"
                value={s.nome}
                onChange={(e) => mudarSecao(si, 'nome', e.target.value)}
                placeholder="Nome do subtema (ex.: Palestra de Pedagogia)"
                maxLength={120}
              />
              <div className="secao-config">
                <SeletorTipo valor={s.tipo} onChange={(tipo) => mudarSecao(si, 'tipo', tipo)} nome={`tipo-${si}`} />
                {s.tipo === 'urgente' && (
                  <label className="secao-prazo">
                    Data do evento
                    <input type="date" value={s.prazo} onChange={(e) => mudarSecao(si, 'prazo', e.target.value)} />
                  </label>
                )}
              </div>
              <ul className="secao-itens">
                {s.itens.map((it, ii) => (
                  <li key={ii} className={it.marcado ? '' : 'desmarcado'}>
                    <input
                      type="checkbox"
                      checked={it.marcado}
                      onChange={(e) => mudarItem(si, ii, 'marcado', e.target.checked)}
                      aria-label="Incluir item"
                    />
                    <textarea
                      className="item-texto"
                      rows={1}
                      ref={crescer}
                      value={it.texto}
                      onChange={(e) => { crescer(e.target); mudarItem(si, ii, 'texto', e.target.value); }}
                      onFocus={() => !it.marcado && mudarItem(si, ii, 'marcado', true)}
                      maxLength={200}
                    />
                  </li>
                ))}
              </ul>
              <button className="btn-mini" onClick={() => novoItem(si)}>+ item</button>
            </div>
          ))}

          {erro && <p className="erro">{erro}</p>}
          <div className="modal-acoes fixo">
            <button type="button" className="btn-sec" onClick={() => setSecoes(null)}>Voltar</button>
            <button className="btn-primario" disabled={!selecionados || salvando} onClick={salvar}>
              {salvando ? 'Salvando…' : `Adicionar ${selecionados} ${selecionados === 1 ? 'item' : 'itens'}`}
            </button>
          </div>
        </>
      )}
    </Modal>
  );
}

function AcaoGrupo({ modo, grupo, tipo, prazoAtual, onFechar, onSalvo }) {
  if (modo === 'data') return <DataEvento grupo={grupo} tipo={tipo} prazoAtual={prazoAtual} onFechar={onFechar} onSalvo={onSalvo} />;
  return <DuplicarRenomear modo={modo} grupo={grupo} tipo={tipo} onFechar={onFechar} onSalvo={onSalvo} />;
}

function DataEvento({ grupo, tipo, prazoAtual, onFechar, onSalvo }) {
  const [prazo, setPrazo] = useState(prazoAtual);
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  async function salvar(valor) {
    setSalvando(true);
    try {
      await api('/api/grupos', 'PATCH', { acao: 'data', grupo, tipo, prazo: valor });
      onSalvo();
    } catch (e) {
      setErro(e.message);
      setSalvando(false);
    }
  }

  return (
    <Modal onFechar={onFechar}>
      <form onSubmit={(e) => { e.preventDefault(); salvar(prazo); }}>
        <h3>Data do evento</h3>
        <p className="ajuda">A data vale para <b>todos os itens</b> de “{grupo}” de uma vez.</p>
        <label className="campo">
          <span>Data</span>
          <input type="date" autoFocus required value={prazo} onChange={(e) => setPrazo(e.target.value)} />
        </label>
        {erro && <p className="erro">{erro}</p>}
        <div className="modal-acoes">
          {prazoAtual && <button type="button" className="btn-sec" style={{ marginRight: 'auto' }} disabled={salvando} onClick={() => salvar('')}>Remover data</button>}
          <button type="button" className="btn-sec" onClick={onFechar}>Cancelar</button>
          <button className="btn-primario" disabled={salvando || !prazo}>Salvar</button>
        </div>
      </form>
    </Modal>
  );
}

function DuplicarRenomear({ modo, grupo, tipo, onFechar, onSalvo }) {
  const duplicar = modo === 'duplicar';
  const [nome, setNome] = useState(duplicar ? '' : grupo);
  const [prazo, setPrazo] = useState('');
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  async function salvar(e) {
    e.preventDefault();
    setSalvando(true);
    try {
      await api('/api/grupos', duplicar ? 'POST' : 'PATCH', { grupo, tipo, novo: nome, prazo });
      onSalvo();
    } catch (e) {
      setErro(e.message);
      setSalvando(false);
    }
  }

  return (
    <Modal onFechar={onFechar}>
      <form onSubmit={salvar}>
        <h3>{duplicar ? 'Duplicar subtema' : 'Renomear subtema'}</h3>
        {duplicar && (
          <p className="ajuda">
            Cria uma cópia de <b>{grupo}</b> com todos os itens desmarcados. Serve para repetir o mesmo checklist em outro evento ou curso.
          </p>
        )}
        <label className="campo">
          <span>{duplicar ? 'Nome da cópia' : 'Novo nome'}</span>
          <input autoFocus required value={nome} onChange={(e) => setNome(e.target.value)} maxLength={120}
            placeholder={duplicar ? 'Ex.: Palestra de Gestão – 03/10' : ''} />
        </label>
        {duplicar && tipo === 'urgente' && (
          <label className="campo">
            <span>Data do evento <em>(opcional)</em></span>
            <input type="date" value={prazo} onChange={(e) => setPrazo(e.target.value)} />
          </label>
        )}
        {erro && <p className="erro">{erro}</p>}
        <div className="modal-acoes">
          <button type="button" className="btn-sec" onClick={onFechar}>Cancelar</button>
          <button className="btn-primario" disabled={salvando || !nome.trim()}>{duplicar ? 'Duplicar' : 'Salvar'}</button>
        </div>
      </form>
    </Modal>
  );
}
