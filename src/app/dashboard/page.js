'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS, ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend,
} from 'chart.js';
import {
  Shield, Grid, Units, Table as TableIc, Hash, Filter, Logout, Refresh, Download, Search, ICONES,
} from '../components/Icons';
import {
  GBMS, CAMPOS, CATEGORIAS, GRUPO_VIATURAS, GRUPO_EQUIP, GRUPO_EQUIP_SOMA,
} from '../../lib/config';

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const NAVY = '#1E3A5F', GOLD = '#C99A2E', BLUE = '#2563EB', OK = '#15803D', CINZA = '#CBD5E1';

function numDe(v) {
  if (v == null) return 0;
  const m = String(v).replace(/\./g, '').match(/-?\d+/);
  return m ? parseInt(m[0], 10) : 0;
}
function temItem(v) {
  v = String(v || '').trim().toLowerCase();
  if (!v || v === '0') return false;
  if (v.indexOf('baix') >= 0) return false;
  return true;
}
function foiPreenchido(l) {
  if (l.responsavel || l.atualizado) return true;
  return CAMPOS.some((c) => String(l.valores[c.rotulo] || '').trim() !== '');
}
function fmtData(s) {
  if (!s) return '—';
  const dt = new Date(s);
  if (isNaN(dt)) return '—';
  return dt.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function DashboardPage() {
  const router = useRouter();
  const [estado, setEstado] = useState('carregando');
  const [perfil, setPerfil] = useState('');
  const [email, setEmail] = useState('');
  const [linhas, setLinhas] = useState([]);
  const [aba, setAba] = useState('geral');
  const [unidadeSel, setUnidadeSel] = useState(''); // filtro global
  const [busca, setBusca] = useState('');
  const [ordenar, setOrdenar] = useState({ col: null, dir: 1 });

  useEffect(() => {
    let ativo = true;
    (async () => {
      try {
        const r = await fetch('/api/dados');
        if (r.status === 401) { router.replace('/login'); return; }
        const j = await r.json();
        if (!ativo) return;
        if (!j.ok) { setEstado('negado'); return; }
        setPerfil(j.perfil || '');
        setEmail(j.email || '');
        setLinhas(j.linhas || []);
        setEstado('ok');
      } catch {
        if (ativo) setEstado('negado');
      }
    })();
    return () => { ativo = false; };
  }, [router]);

  async function sair() {
    await fetch('/api/logout', { method: 'POST' });
    router.replace('/login');
  }

  // Base de dados após o filtro global de unidade.
  const base = useMemo(
    () => (unidadeSel ? linhas.filter((l) => l.gbm === unidadeSel) : linhas),
    [linhas, unidadeSel]
  );

  const d = useMemo(() => {
    const preench = base.filter(foiPreenchido);
    const soma = (rot) => base.reduce((s, l) => s + numDe(l.valores[rot]), 0);
    const totalAgua = soma('LITROS ÁGUA');
    const totalEpras = soma('EPRAs DISPONIVEIS');
    const totalEquip = base.reduce((s, l) => s + GRUPO_EQUIP_SOMA.reduce((a, c) => a + numDe(l.valores[c]), 0), 0);
    const viaturasDisp = base.reduce((s, l) => s + GRUPO_VIATURAS.filter((c) => temItem(l.valores[c])).length, 0);
    const embarcDisp = base.filter((l) => temItem(l.valores['EMBARCAÇÕES'])).length;
    let recente = null, quem = '';
    base.forEach((l) => {
      const dt = l.atualizado ? new Date(l.atualizado) : null;
      if (dt && !isNaN(dt) && (!recente || dt > recente)) { recente = dt; quem = l.gbm; }
    });
    const total = base.length || 1;
    return {
      preench: preench.length, pendentes: total - preench.length, total,
      pct: Math.round((preench.length / total) * 100),
      totalAgua, totalEpras, totalEquip, viaturasDisp, embarcDisp,
      ultima: recente ? fmtData(recente.toISOString()) : '—', ultimaQuem: quem,
    };
  }, [base]);

  const catValor = {
    Viaturas: { big: d.viaturasDisp, small: 'viaturas disponíveis' },
    'Embarcações': { big: d.embarcDisp, small: unidadeSel ? 'com embarcação' : 'GBMs com embarcação' },
    Equipamentos: { big: d.totalEquip, small: 'itens no total' },
    Recursos: { big: d.totalAgua.toLocaleString('pt-BR') + ' L', small: 'água armazenada' },
  };

  // Quantitativo por item (respeita o filtro global).
  const quantitativo = useMemo(() =>
    CATEGORIAS.map((cat) => ({
      nome: cat.nome,
      itens: cat.campos.map((rot) => ({
        rotulo: rot,
        soma: base.reduce((s, l) => s + numDe(l.valores[rot]), 0),
        unidades: base.filter((l) => temItem(l.valores[rot])).length,
      })),
    })), [base]);

  const optBarH = {
    indexAxis: 'y', responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { beginAtZero: true, suggestedMax: base.length || 12, ticks: { stepSize: 1, font: { family: 'Fira Sans' } }, grid: { color: '#EEF2F7' } },
      y: { ticks: { font: { family: 'Fira Sans', size: 11 } }, grid: { display: false } },
    },
  };

  const linhasTabela = useMemo(() => {
    let rows = base.slice();
    const q = busca.trim().toLowerCase();
    if (q) {
      rows = rows.filter((l) =>
        l.gbm.toLowerCase().includes(q) ||
        (l.responsavel || '').toLowerCase().includes(q) ||
        CAMPOS.some((c) => String(l.valores[c.rotulo] || '').toLowerCase().includes(q)));
    }
    if (ordenar.col) {
      const val = (l) => ordenar.col === 'gbm' ? l.gbm
        : ordenar.col === 'responsavel' ? l.responsavel
        : ordenar.col === 'atualizado' ? l.atualizado
        : l.valores[ordenar.col] || '';
      rows.sort((a, b) => {
        const va = String(val(a) || ''), vb = String(val(b) || '');
        let cmp;
        if (/\d/.test(va) && /\d/.test(vb)) cmp = numDe(va) - numDe(vb);
        else cmp = va.localeCompare(vb, 'pt');
        return cmp * ordenar.dir;
      });
    }
    return rows;
  }, [base, busca, ordenar]);

  function clicarCol(col) {
    setOrdenar((o) => (o.col === col ? { col, dir: -o.dir } : { col, dir: 1 }));
  }
  const seta = (col) => ordenar.col === col ? <span className="ar">{ordenar.dir > 0 ? '▲' : '▼'}</span> : null;

  if (estado === 'carregando') return <div className="loader">Carregando painel...</div>;
  if (estado === 'negado') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div className="card" style={{ maxWidth: 420 }}>
          <div className="card-head"><h2>Acesso não autorizado</h2></div>
          <p className="sub">Sua sessão expirou ou o e-mail não tem acesso ao painel.</p>
          <button className="btn btn-navy" onClick={sair}>Voltar ao login</button>
        </div>
      </div>
    );
  }

  const titulos = {
    geral: { t: 'Visão geral', d: 'Resumo consolidado de recursos e preenchimento.' },
    quant: { t: 'Quantitativo', d: 'Total de cada item somado e nº de unidades que possuem.' },
    unidades: { t: 'Unidades', d: 'Situação individual de cada GBM.' },
    detalhe: { t: 'Detalhamento', d: 'Tabela completa com busca, ordenação e exportação.' },
  };
  const escopo = unidadeSel || 'todas as unidades';

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="sb-brand">
          <div className="mark"><Shield /></div>
          <div><h1>PODER OPERACIONAL</h1><span>Painel de comando</span></div>
        </div>
        <button className={'nav-item' + (aba === 'geral' ? ' active' : '')} onClick={() => setAba('geral')}><Grid /> Visão geral</button>
        <button className={'nav-item' + (aba === 'quant' ? ' active' : '')} onClick={() => setAba('quant')}><Hash /> Quantitativo</button>
        <button className={'nav-item' + (aba === 'unidades' ? ' active' : '')} onClick={() => setAba('unidades')}><Units /> Unidades</button>
        <button className={'nav-item' + (aba === 'detalhe' ? ' active' : '')} onClick={() => setAba('detalhe')}><TableIc /> Detalhamento</button>
        <div className="sb-foot">
          <div className="sb-user">
            <div className="av">{(perfil || 'U')[0]}</div>
            <div className="who"><b>{perfil}</b><small>{email}</small></div>
          </div>
          <button className="nav-item" onClick={sair}><Logout /> Sair</button>
        </div>
      </aside>

      <main className="content">
        <div className="content-head">
          <div>
            <h2>{titulos[aba].t}</h2>
            <p className="desc">{titulos[aba].d}</p>
          </div>
          <div className="head-actions">
            <div className="unit-pick">
              <Filter />
              <label htmlFor="uni">Unidade</label>
              <select id="uni" value={unidadeSel} onChange={(e) => setUnidadeSel(e.target.value)}>
                <option value="">Todas</option>
                {GBMS.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <span className="pill">{perfil}</span>
            <button className="btn btn-ghost" onClick={() => location.reload()}><Refresh /> Atualizar</button>
          </div>
        </div>

        {/* ===== VISÃO GERAL ===== */}
        {aba === 'geral' && (
          <>
            {unidadeSel ? (
              <div className="progress-card">
                <div className="pc-top">
                  <b>{unidadeSel}</b>
                  <span className="num">{d.preench > 0 ? 'Preenchido' : 'Pendente'}</span>
                </div>
                <small>{d.ultimaQuem ? `Última atualização: ${d.ultima}` : 'Esta unidade ainda não enviou os dados.'}</small>
              </div>
            ) : (
              <div className="progress-card">
                <div className="pc-top">
                  <b>Preenchimento das unidades</b>
                  <span className="num">{d.preench} de {d.total} · {d.pct}%</span>
                </div>
                <div className="bar"><span style={{ width: d.pct + '%' }} /></div>
                <small>{d.pendentes > 0 ? `${d.pendentes} unidade(s) ainda não enviaram os dados.` : 'Todas as unidades enviaram os dados.'}</small>
              </div>
            )}

            <div className="kpis">
              {!unidadeSel && <div className="kpi green"><div className="label">GBMs preenchidos</div><div className="value">{d.preench}</div><div className="foot">de {d.total} unidades</div></div>}
              {!unidadeSel && <div className="kpi red"><div className="label">Pendentes</div><div className="value">{d.pendentes}</div><div className="foot">aguardando envio</div></div>}
              <div className="kpi blue"><div className="label">Litros de água</div><div className="value">{d.totalAgua.toLocaleString('pt-BR')}</div><div className="foot">{unidadeSel ? 'desta unidade' : 'soma das reservas'}</div></div>
              <div className="kpi navy"><div className="label">EPRAs disponíveis</div><div className="value">{d.totalEpras.toLocaleString('pt-BR')}</div><div className="foot">{unidadeSel ? 'desta unidade' : 'total na corporação'}</div></div>
              <div className="kpi"><div className="label">Equipamentos</div><div className="value">{d.totalEquip.toLocaleString('pt-BR')}</div><div className="foot">corte/força + compressor</div></div>
              <div className="kpi"><div className="label">Viaturas disponíveis</div><div className="value">{d.viaturasDisp.toLocaleString('pt-BR')}</div><div className="foot">{unidadeSel ? 'nesta unidade' : 'em toda a corporação'}</div></div>
            </div>

            <div className="section-title"><Grid /> Resumo por categoria — {escopo}</div>
            <div className="cat-grid">
              {CATEGORIAS.map((cat) => {
                const Ic = ICONES[cat.icone];
                const v = catValor[cat.nome] || { big: 0, small: '' };
                return (
                  <div className="cat" key={cat.nome}>
                    <div className="ch"><div className="ci">{Ic ? <Ic /> : null}</div><b>{cat.nome}</b></div>
                    <div className="big">{v.big}</div>
                    <div className="small">{v.small}</div>
                  </div>
                );
              })}
            </div>

            <div className="section-title"><Grid /> Gráficos</div>
            <div className="charts">
              <div className="chart-box">
                <h3>Situação do preenchimento</h3>
                <div className="chart-wrap">
                  <Doughnut
                    data={{ labels: ['Preenchidos', 'Pendentes'], datasets: [{ data: [d.preench, d.pendentes], backgroundColor: [OK, CINZA], borderWidth: 0 }] }}
                    options={{ responsive: true, maintainAspectRatio: false, cutout: '62%', plugins: { legend: { position: 'bottom', labels: { font: { family: 'Fira Sans' } } } } }}
                  />
                </div>
              </div>
              <div className="chart-box">
                <h3>Disponibilidade por tipo de viatura (nº de GBMs)</h3>
                <div className="chart-wrap">
                  <Bar data={{ labels: GRUPO_VIATURAS, datasets: [{ data: GRUPO_VIATURAS.map((c) => base.filter((l) => temItem(l.valores[c])).length), backgroundColor: NAVY, borderRadius: 4, maxBarThickness: 22 }] }} options={optBarH} />
                </div>
              </div>
              <div className="chart-box">
                <h3>Disponibilidade de equipamentos (nº de GBMs)</h3>
                <div className="chart-wrap">
                  <Bar data={{ labels: GRUPO_EQUIP, datasets: [{ data: GRUPO_EQUIP.map((c) => base.filter((l) => temItem(l.valores[c])).length), backgroundColor: GOLD, borderRadius: 4, maxBarThickness: 22 }] }} options={optBarH} />
                </div>
              </div>
              <div className="chart-box">
                <h3>Litros de água por GBM</h3>
                <div className="chart-wrap">
                  <Bar
                    data={{ labels: base.map((l) => l.gbm), datasets: [{ data: base.map((l) => numDe(l.valores['LITROS ÁGUA'])), backgroundColor: BLUE, borderRadius: 4, maxBarThickness: 34 }] }}
                    options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { ticks: { font: { family: 'Fira Sans', size: 10 } }, grid: { display: false } }, y: { beginAtZero: true, ticks: { font: { family: 'Fira Sans' } } } } }}
                  />
                </div>
              </div>
            </div>
          </>
        )}

        {/* ===== QUANTITATIVO ===== */}
        {aba === 'quant' && (
          <>
            <p className="sub" style={{ marginTop: 8 }}>
              Escopo: <b style={{ color: 'var(--navy)' }}>{escopo}</b>. A coluna <b>Total</b> soma os números informados
              (útil para equipamentos, EPRAs e água). Para viaturas e embarcações, considere a coluna <b>Unidades que possuem</b>.
            </p>
            <div className="scroll">
              <table>
                <thead>
                  <tr><th style={{ textAlign: 'left' }}>Item</th><th>Total</th><th>Unidades que possuem</th></tr>
                </thead>
                <tbody>
                  {quantitativo.flatMap((cat) => [
                    <tr key={'h-' + cat.nome} className="cat-row"><td colSpan={3}>{cat.nome}</td></tr>,
                    ...cat.itens.map((it) => (
                      <tr key={it.rotulo}>
                        <td className="gbm">{it.rotulo}</td>
                        <td className="num">{it.soma.toLocaleString('pt-BR')}</td>
                        <td>{it.unidades}</td>
                      </tr>
                    )),
                  ])}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ===== UNIDADES ===== */}
        {aba === 'unidades' && (
          <div className="unidades">
            {base.map((l) => {
              const on = foiPreenchido(l);
              const viat = GRUPO_VIATURAS.filter((c) => temItem(l.valores[c])).length;
              const agua = numDe(l.valores['LITROS ÁGUA']);
              return (
                <div className={'uni' + (on ? ' on' : '')} key={l.gbm}>
                  <div className="ut">
                    <b>{l.gbm}</b>
                    <span className={'badge ' + (on ? 'ok' : 'pend')}>{on ? 'Preenchido' : 'Pendente'}</span>
                  </div>
                  <div className="urow"><span>Viaturas</span><span>{viat}</span></div>
                  <div className="urow"><span>Água</span><span>{agua.toLocaleString('pt-BR')} L</span></div>
                  <div className="urow"><span>EPRAs</span><span>{numDe(l.valores['EPRAs DISPONIVEIS'])}</span></div>
                  <div className="resp">{l.responsavel ? `${l.responsavel} · ${fmtData(l.atualizado)}` : 'Sem envio'}</div>
                </div>
              );
            })}
          </div>
        )}

        {/* ===== DETALHAMENTO ===== */}
        {aba === 'detalhe' && (
          <>
            <div className="controls">
              <div className="ctl search">
                <label htmlFor="busca">Buscar</label>
                <div className="search"><Search /><input id="busca" type="text" placeholder="GBM, responsável, valor..." value={busca} onChange={(e) => setBusca(e.target.value)} /></div>
              </div>
              <div className="spacer" />
              <button className="btn btn-gold" onClick={() => window.print()}><Download /> Exportar PDF</button>
            </div>

            <div className="scroll">
              <table>
                <thead>
                  <tr>
                    <th onClick={() => clicarCol('gbm')}>GBM {seta('gbm')}</th>
                    {CAMPOS.map((c) => <th key={c.col} onClick={() => clicarCol(c.rotulo)}>{c.rotulo} {seta(c.rotulo)}</th>)}
                    <th onClick={() => clicarCol('responsavel')}>Responsável {seta('responsavel')}</th>
                    <th onClick={() => clicarCol('atualizado')}>Atualizado {seta('atualizado')}</th>
                  </tr>
                </thead>
                <tbody>
                  {linhasTabela.map((l) => (
                    <tr key={l.gbm}>
                      <td className="gbm">{l.gbm}</td>
                      {CAMPOS.map((c) => {
                        const v = l.valores[c.rotulo] || '';
                        return <td key={c.col} className={v ? '' : 'empty'}>{v || '—'}</td>;
                      })}
                      <td>{l.responsavel || '—'}</td>
                      <td>{l.atualizado ? fmtData(l.atualizado) : '—'}</td>
                    </tr>
                  ))}
                  {linhasTabela.length === 0 && (
                    <tr><td colSpan={CAMPOS.length + 3} style={{ padding: 24, color: 'var(--muted)' }}>Nenhum resultado.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
