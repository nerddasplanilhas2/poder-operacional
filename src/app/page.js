'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Topbar from './components/Topbar';
import { Grid, Save, Edit, Logout, ICONES } from './components/Icons';
import { GBMS, CATEGORIAS } from '../lib/config';

export default function FormPage() {
  const router = useRouter();
  const [nomeUser, setNomeUser] = useState('');
  const [gbm, setGbm] = useState('');
  const [valores, setValores] = useState({});
  const [msg, setMsg] = useState(null);
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    fetch('/api/me').then((r) => (r.ok ? r.json() : null)).then((j) => {
      if (j && j.ok) setNomeUser(j.nome || '');
    }).catch(() => {});
  }, []);

  async function selecionarGbm(g) {
    setGbm(g); setValores({}); setMsg(null);
    if (!g) return;
    try {
      const r = await fetch('/api/submit?gbm=' + encodeURIComponent(g));
      const j = await r.json();
      if (j.ok) setValores(j.valores || {});
    } catch { /* vazio */ }
  }

  function setCampo(rotulo, v) { setValores((prev) => ({ ...prev, [rotulo]: v })); }

  async function enviar() {
    if (!gbm) return setMsg({ tipo: 'err', texto: 'Selecione o GBM.' });
    setCarregando(true);
    setMsg({ tipo: 'info', texto: 'Salvando...' });
    try {
      const r = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gbm, valores }),
      });
      if (r.status === 401) { router.replace('/login'); return; }
      const j = await r.json();
      setMsg({ tipo: j.ok ? 'ok' : 'err', texto: j.msg });
    } catch (e) {
      setMsg({ tipo: 'err', texto: 'Erro ao salvar: ' + e.message });
    } finally {
      setCarregando(false);
    }
  }

  async function sair() {
    await fetch('/api/logout', { method: 'POST' });
    router.replace('/login');
  }

  return (
    <>
      <Topbar right={
        <div style={{ display: 'flex', gap: 10 }}>
          <Link className="btn btn-outline-light" href="/dashboard"><Grid /> Painel</Link>
          <button className="btn btn-outline-light" onClick={sair}><Logout /> Sair</button>
        </div>
      } />

      <div className="wrap">
        <div className="card">
          <div className="card-head">
            <div className="ic"><Edit /></div>
            <h2>Preenchimento de Dados Operacionais</h2>
          </div>
          <p className="sub">
            {nomeUser ? <>Olá, <b style={{ color: 'var(--navy)' }}>{nomeUser}</b>. </> : null}
            Selecione o GBM e informe os recursos e equipamentos disponíveis hoje.
          </p>

          <label htmlFor="gbm">GBM</label>
          <select id="gbm" value={gbm} onChange={(e) => selecionarGbm(e.target.value)}>
            <option value="">Selecione o GBM...</option>
            {GBMS.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>

          {gbm && (
            <>
              <p className="sub" style={{ margin: '20px 0 0' }}>
                Deixe em branco quando não houver o item — não utilize "0" nem "-".
              </p>
              {CATEGORIAS.map((cat) => {
                const Ic = ICONES[cat.icone];
                const feitos = cat.campos.filter((c) => String(valores[c] || '').trim() !== '').length;
                return (
                  <div className="grupo" key={cat.nome}>
                    <div className="grupo-head">
                      <div className="gic">{Ic ? <Ic /> : null}</div>
                      <h3>{cat.nome}</h3>
                      <span className="cont">{feitos}/{cat.campos.length}</span>
                    </div>
                    <div className="grupo-body">
                      {cat.campos.map((rotulo) => (
                        <div key={rotulo}>
                          <label>{rotulo}</label>
                          <input type="text" autoComplete="off"
                                 value={valores[rotulo] || ''}
                                 onChange={(e) => setCampo(rotulo, e.target.value)} />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </>
          )}

          {msg && <div className={'msg ' + msg.tipo}>{msg.texto}</div>}

          <div className="actions">
            <button className="btn btn-gold" onClick={enviar} disabled={carregando}>
              <Save /> {carregando ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
