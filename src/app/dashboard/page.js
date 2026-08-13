'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS, ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend,
} from 'chart.js';
import {
  Shield, Grid, Units, Table as TableIc, Logout, Refresh, Download, Search, ICONES,
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
  const d = new Date(s);
  if (isNaN(d)) return '—';
  return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function DashboardPage() {
  const router = useRouter();
  const [estado, setEstado] = useState('carregando');
  const [perfil, setPerfil] = useState('');
  const [email, setEmail] = useState('');
  const [linhas, setLinhas] = useState([]);
  const [aba, setAba] = useState('geral');
  const [filtro, setFiltro] = useState('');
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

  const d = useMemo(() => {
    const preench = linhas.filter(foiPreenchido);
    const totalAgua = linhas.reduce((s, l) => s + numDe(l.valores['LITROS ÁGUA']), 0);
    const totalEpras = linhas.reduce((s, l) => s + numDe(l.valores['EPRAs DISPONIVEIS']), 0);
    const totalEquip = linhas.reduce((s, l) => s + GRUPO_EQUIP_SOMA.reduce((a, c) => a + numDe(l.valores[c]), 0), 0);
    const viaturasDisp = linhas.reduce((s, l) => s + GRUPO_VIATURAS.filter((c) => temItem(l.valores[c])).length, 0);
    const embarcDisp = linhas.filter((l) => temItem(l.valores['EMBARCAÇÕES'])).length;
    let recente = null, quem = '';
    linhas.forEach((l) => {
      const dt = l.atualizado ? new Date(l.atualizado) : null;
      if (dt && !isNaN(dt) && (!recente || dt > recente)) { recente = dt; quem = l.gbm; }
    });
    const total = linhas.length || 12;
    return {
      preench: preench.length, pendentes: total - preench.length, total,
      pct: Math.round((preench.length / total) * 100),
      totalAgua, totalEpras, totalEquip, viaturasDisp, embarcDisp,
      ultima: recente ? fmtData(recente.toISOString()) : '—', ultimaQuem: quem,
    };
  }, [linhas]);

  const catValor = {
    Viaturas: { big: d.viaturasDisp, small: 'viaturas disponíveis' },
    'Embarcações': { big: d.embarcDisp, small: 'GBMs com embarcação' },
    Equipamentos: { big: d.totalEquip, small: 'itens no total' },
    Recursos: { big: d.totalAgua.toLocaleString('pt-BR') + ' L', small: 'água armazenada' },
  };

  const optBarH = {
    indexAxis: 'y', responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { beginAtZero: true, suggestedMax: linhas.length || 12, ticks: { stepSize: 1, font: { family: 'Fira Sans' } }, grid: { color: '#EEF2F7' } },
      y: { ticks: { font: { family: 'Fira Sans', size: 11 } }, grid: { display: false } },
    },
  };

  // tabela: filtro + busca + ordenacao
  const linhasTabela = useMemo(() => {
    let rows = filtro ? linhas.filter((l) => l.gbm === filtro) : linhas.slice();
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
  }, [linhas, filtro, busca, ordenar]);

  function clicarCol(col) {
    setOrdenar((o) => (o.col === col ? { col, dir: -o.dir } : { col, dir: 1 }));
  }
  const seta = (col) => ordenar.col === col ? <span className="ar">{ordenar.dir > 0 ? '▲' : '▼'}</span> : null;

  if (estado === 'carregando') {
    return <div className="loader">Carregando painel...</div>;
  }
  if (estado === 'negado') {
    return (
      <div className="center-screen" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
    unidades: { t: 'Unidades', d: 'Situação individual de cada GBM.' },
    detalhe: { t: 'Detalhamento', d: 'Tabela completa com busca, filtro e exportação.' },
  };

  return (
    <div className="shell">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sb-brand">
          <div className="mark"><Shield /></div>
          <div>
            <h1>PODER OPERACIONAL</h1>
            <span>Painel de comando</span>
          </div>
        </div>
        <button className={'nav-item' + (aba === 'geral' ? ' active' : '')} onClick={() => setAba('geral')}><Grid /> Visão geral</button>
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

      {/* Conteúdo */}
      <main className="content">
        <div className="content-head">
          <div>
            <h2>{titulos[aba].t}</h2>
            <p className="desc">{titulos[aba].d}</p>
          </div>
          <div className="head-actions">
            <span className="pill">{perfil}</span>
            <button className="btn btn-ghost" onClick={() => location.reload()}><Refresh /> Atualizar</button>
          </div>
        </div>

        {/* ===== VISÃO GERAL ===== */}
        {aba === 'geral' && (
          <>
            <div className="progress-card">
              <div className="pc-top">
                <b>Preenchimento das unidades</b>
                <span className="num">{d.preench} de {d.total} · {d.pct}%</span>
              </div>
              <div className="bar"><span style={{ width: d.pct + '%' }} /></div>
              <small>{d.pendentes > 0 ? `${d.pendentes} unidade(s) ainda não enviaram os dados.` : 'Todas as unidades enviaram os dados.'}</small>
            </div>

            <div className="kpis">
              <div className="kpi green"><div className="label">GBMs preenchidos</div><div className="value">{d.preench}</div><div className="foot">de {d.total} unidades</div></div>
              <div className="kpi red"><div className="label">Pendentes</div><div className="value">{d.pendentes}</div><div className="foot">aguardando envio</div></div>
              <div className="kpi blue"><div className="label">Litros de água</div><div className="value">{d.totalAgua.toLocaleString('pt-BR')}</div><div className="foot">soma das reservas</div></div>
              <div className="kpi navy"><div className="label">EPRAs disponíveis</div><div className="value">{d.totalEpras.toLocaleString('pt-BR')}</div><div className="foot">total na corporação</div></div>
              <div className="kpi"><div className="label">Equipamentos</div><div className="value">{d.totalEquip.toLocaleString('pt-BR')}</div><div className="foot">corte/força + compressor</div></div>
              <div className="kpi"><div className="label">Última atualização</div><div className="value" style={{ fontSize: 17 }}>{d.ultima}</div><div className="foot">{d.ultimaQuem ? 'por ' + d.ultimaQuem : ''}</div></div>
            </div>

            <div className="section-title"><Grid /> Resumo por categoria</div>
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
                  <Bar data={{ labels: GRUPO_VIATURAS, datasets: [{ data: GRUPO_VIATURAS.map((c) => linhas.filter((l) => temItem(l.valores[c])).length), backgroundColor: NAVY, borderRadius: 4, maxBarThickness: 22 }] }} options={optBarH} />
                </div>
              </div>
              <div className="chart-box">
                <h3>Disponibilidade de equipamentos (nº de GBMs)</h3>
                <div className="chart-wrap">
                  <Bar data={{ labels: GRUPO_EQUIP, datasets: [{ data: GRUPO_EQUIP.map((c) => linhas.filter((l) => temItem(l.valores[c])).length), backgroundColor: GOLD, borderRadius: 4, maxBarThickness: 22 }] }} options={optBarH} />
                </div>
              </div>
              <div className="chart-box">
                <h3>Litros de água por GBM</h3>
                <div className="chart-wrap">
                  <Bar
                    data={{ labels: GBMS, datasets: [{ data: linhas.map((l) => numDe(l.valores['LITROS ÁGUA'])), backgroundColor: BLUE, borderRadius: 4, maxBarThickness: 34 }] }}
                    options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { ticks: { font: { family: 'Fira Sans', size: 10 } }, grid: { display: false } }, y: { beginAtZero: true, ticks: { font: { family: 'Fira Sans' } } } } }}
                  />
                </div>
              </div>
            </div>
          </>
        )}

        {/* ===== UNIDADES ===== */}
        {aba === 'unidades' && (
          <div className="unidades">
            {linhas.map((l) => {
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
              <div className="ctl">
                <label htmlFor="filtro">Filtrar unidade</label>
                <select id="filtro" value={filtro} onChange={(e) => setFiltro(e.target.value)}>
                  <option value="">Todos os GBMs</option>
                  {GBMS.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
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
                    <tr><td colSpan={CAMPOS.length + 3} style={{ padding: 24, color: 'var(--muted)' }}>Nenhum resultado para a busca.</td></tr>
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
