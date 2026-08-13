'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS, ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend,
} from 'chart.js';
import Topbar from '../components/Topbar';
import {
  GBMS, CAMPOS, GRUPO_VIATURAS, GRUPO_EQUIP, GRUPO_EQUIP_SOMA,
} from '../../lib/config';

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

/* ---------- utilidades ---------- */
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
function parseData(s) {
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d) ? null : d;
}
function fmtData(s) {
  const d = parseData(s);
  if (!d) return '—';
  return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function DashboardPage() {
  const router = useRouter();
  const [estado, setEstado] = useState('carregando'); // carregando | ok | negado
  const [perfil, setPerfil] = useState('');
  const [email, setEmail] = useState('');
  const [linhas, setLinhas] = useState([]);
  const [filtro, setFiltro] = useState('');

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

  /* ---------- agregados ---------- */
  const dados = useMemo(() => {
    const preench = linhas.filter(foiPreenchido);
    const totalAgua = linhas.reduce((s, l) => s + numDe(l.valores['LITROS ÁGUA']), 0);
    const totalEpras = linhas.reduce((s, l) => s + numDe(l.valores['EPRAs DISPONIVEIS']), 0);
    const totalEquip = linhas.reduce((s, l) => s + GRUPO_EQUIP_SOMA.reduce((a, c) => a + numDe(l.valores[c]), 0), 0);

    let recente = null, quem = '';
    linhas.forEach((l) => {
      const d = parseData(l.atualizado);
      if (d && (!recente || d > recente)) { recente = d; quem = l.gbm; }
    });

    return {
      preench: preench.length,
      pendentes: linhas.length - preench.length,
      totalAgua, totalEpras, totalEquip,
      ultima: recente ? fmtData(recente.toISOString()) : '—',
      ultimaQuem: quem,
    };
  }, [linhas]);

  const viaturasData = GRUPO_VIATURAS.map((c) => linhas.filter((l) => temItem(l.valores[c])).length);
  const equipData = GRUPO_EQUIP.map((c) => linhas.filter((l) => temItem(l.valores[c])).length);
  const aguaData = linhas.map((l) => numDe(l.valores['LITROS ÁGUA']));

  const optBarH = {
    indexAxis: 'y', responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { beginAtZero: true, suggestedMax: linhas.length || 12, ticks: { stepSize: 1, font: { family: 'Fira Sans' } }, grid: { color: '#EEF2F7' } },
      y: { ticks: { font: { family: 'Fira Sans', size: 11 } }, grid: { display: false } },
    },
  };

  const tabela = filtro ? linhas.filter((l) => l.gbm === filtro) : linhas;

  if (estado === 'carregando') {
    return (<><Topbar /><div className="wrap"><div className="loader">Carregando painel...</div></div></>);
  }
  if (estado === 'negado') {
    return (
      <>
        <Topbar right={<button className="btn btn-login" onClick={sair}>Sair</button>} />
        <div className="center-screen">
          <div className="card login-card">
            <div className="card-head"><h2>Acesso não autorizado</h2></div>
            <p className="sub">O e-mail <b>{email}</b> não está na lista de acesso ao painel. Fale com o administrador.</p>
            <div className="actions"><button className="btn btn-ghost" onClick={sair}>Sair</button></div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Topbar right={<button className="btn btn-login" onClick={sair}>Sair</button>} />
      <div className="wrap">
        <div className="card">
          <div className="dash-head">
            <div className="card-head" style={{ margin: 0 }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9" rx="1" /><rect x="14" y="3" width="7" height="5" rx="1" /><rect x="14" y="12" width="7" height="9" rx="1" /><rect x="3" y="16" width="7" height="5" rx="1" /></svg>
              <h2>Painel de Controle</h2>
              <span className="pill acc">{perfil}</span>
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button className="btn btn-ghost" onClick={() => location.reload()}>Atualizar</button>
            </div>
          </div>
          <div className="sub" style={{ margin: '12px 0 0' }}>Acesso: {email}</div>

          {/* Controles */}
          <div className="controls">
            <div className="ctl">
              <label htmlFor="filtro">Filtrar unidade</label>
              <select id="filtro" value={filtro} onChange={(e) => setFiltro(e.target.value)}>
                <option value="">Todos os GBMs</option>
                {GBMS.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div className="spacer" />
            <button className="btn btn-primary" onClick={() => window.print()}>Exportar PDF</button>
          </div>

          {/* KPIs */}
          <div className="kpis">
            <div className="kpi green"><div className="label">GBMs preenchidos</div><div className="value">{dados.preench}</div><div className="foot">de {linhas.length} unidades</div></div>
            <div className="kpi red"><div className="label">Pendentes</div><div className="value">{dados.pendentes}</div><div className="foot">aguardando envio</div></div>
            <div className="kpi navy"><div className="label">Litros de água</div><div className="value">{dados.totalAgua.toLocaleString('pt-BR')} L</div><div className="foot">soma das reservas</div></div>
            <div className="kpi"><div className="label">EPRAs disponíveis</div><div className="value">{dados.totalEpras.toLocaleString('pt-BR')}</div><div className="foot">total na corporação</div></div>
            <div className="kpi"><div className="label">Equipamentos</div><div className="value">{dados.totalEquip.toLocaleString('pt-BR')}</div><div className="foot">corte/força + compressor</div></div>
            <div className="kpi"><div className="label">Última atualização</div><div className="value" style={{ fontSize: 18 }}>{dados.ultima}</div><div className="foot">{dados.ultimaQuem ? 'por ' + dados.ultimaQuem : ''}</div></div>
          </div>

          {/* Gráficos */}
          <div className="charts">
            <div className="chart-box">
              <h3>Situação do preenchimento</h3>
              <div className="chart-wrap">
                <Doughnut
                  data={{ labels: ['Preenchidos', 'Pendentes'], datasets: [{ data: [dados.preench, dados.pendentes], backgroundColor: ['#15803D', '#CBD5E1'], borderWidth: 0 }] }}
                  options={{ responsive: true, maintainAspectRatio: false, cutout: '62%', plugins: { legend: { position: 'bottom', labels: { font: { family: 'Fira Sans' } } } } }}
                />
              </div>
            </div>
            <div className="chart-box">
              <h3>Disponibilidade por tipo de viatura (nº de GBMs)</h3>
              <div className="chart-wrap">
                <Bar data={{ labels: GRUPO_VIATURAS, datasets: [{ data: viaturasData, backgroundColor: '#0F172A', borderRadius: 4, maxBarThickness: 22 }] }} options={optBarH} />
              </div>
            </div>
            <div className="chart-box">
              <h3>Disponibilidade de equipamentos (nº de GBMs)</h3>
              <div className="chart-wrap">
                <Bar data={{ labels: GRUPO_EQUIP, datasets: [{ data: equipData, backgroundColor: '#0369A1', borderRadius: 4, maxBarThickness: 22 }] }} options={optBarH} />
              </div>
            </div>
            <div className="chart-box">
              <h3>Litros de água por GBM</h3>
              <div className="chart-wrap">
                <Bar
                  data={{ labels: GBMS, datasets: [{ data: aguaData, backgroundColor: '#0369A1', borderRadius: 4, maxBarThickness: 34 }] }}
                  options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { ticks: { font: { family: 'Fira Sans', size: 10 } }, grid: { display: false } }, y: { beginAtZero: true, ticks: { font: { family: 'Fira Sans' } } } } }}
                />
              </div>
            </div>
          </div>

          {/* Status por unidade */}
          <div className="block-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><path d="m9 11 3 3L22 4" /></svg>
            Status por unidade
          </div>
          <div className="status-grid">
            {linhas.map((l) => (
              <div key={l.gbm} className="status-item">
                <span className={'dot ' + (foiPreenchido(l) ? 'on' : 'off')} />{l.gbm}
              </div>
            ))}
          </div>

          {/* Tabela detalhada */}
          <div className="block-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3h18v18H3z" /><path d="M3 9h18M3 15h18M9 3v18" /></svg>
            Detalhamento completo
          </div>
          <div className="scroll">
            <table>
              <thead>
                <tr>
                  <th>GBM</th>
                  {CAMPOS.map((c) => <th key={c.col}>{c.rotulo}</th>)}
                  <th>Responsável</th><th>Atualizado</th>
                </tr>
              </thead>
              <tbody>
                {tabela.map((l) => (
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
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
