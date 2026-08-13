'use client';
import { useState } from 'react';
import Link from 'next/link';
import Topbar, { LockIcon } from './components/Topbar';
import { GBMS, CAMPOS } from '../lib/config';

export default function FormPage() {
  const [nome, setNome] = useState('');
  const [gbm, setGbm] = useState('');
  const [valores, setValores] = useState({});
  const [msg, setMsg] = useState(null); // { tipo, texto }
  const [carregando, setCarregando] = useState(false);

  async function selecionarGbm(g) {
    setGbm(g);
    setValores({});
    setMsg(null);
    if (!g) return;
    try {
      const r = await fetch('/api/submit?gbm=' + encodeURIComponent(g));
      const j = await r.json();
      if (j.ok) setValores(j.valores || {});
    } catch { /* mantem vazio */ }
  }

  function setCampo(rotulo, v) {
    setValores((prev) => ({ ...prev, [rotulo]: v }));
  }

  async function enviar() {
    if (!nome.trim()) return setMsg({ tipo: 'err', texto: 'Informe o nome do responsável.' });
    if (!gbm) return setMsg({ tipo: 'err', texto: 'Selecione o GBM.' });
    setCarregando(true);
    setMsg({ tipo: 'info', texto: 'Salvando...' });
    try {
      const r = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, gbm, valores }),
      });
      const j = await r.json();
      setMsg({ tipo: j.ok ? 'ok' : 'err', texto: j.msg });
    } catch (e) {
      setMsg({ tipo: 'err', texto: 'Erro ao salvar: ' + e.message });
    } finally {
      setCarregando(false);
    }
  }

  return (
    <>
      <Topbar right={
        <Link className="btn btn-login" href="/login"><LockIcon /> Entrar</Link>
      } />

      <div className="wrap">
        <div className="card">
          <div className="card-head">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>
            <h2>Preenchimento de Dados Operacionais</h2>
          </div>
          <p className="sub">Identifique-se, selecione seu GBM e informe os recursos e equipamentos disponíveis.</p>

          <div className="form-top">
            <div>
              <label htmlFor="nome">Nome do responsável</label>
              <input id="nome" type="text" placeholder="Nome de quem está preenchendo"
                     value={nome} onChange={(e) => setNome(e.target.value)} />
            </div>
            <div>
              <label htmlFor="gbm">GBM</label>
              <select id="gbm" value={gbm} onChange={(e) => selecionarGbm(e.target.value)}>
                <option value="">Selecione o GBM...</option>
                {GBMS.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
          </div>

          {gbm && (
            <>
              <div className="section-label">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 3v4a2 2 0 0 0 2 2h4" /><path d="M5 3h9l5 5v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" /><path d="M9 13h6M9 17h6" /></svg>
                Recursos e Equipamentos
              </div>
              <p className="sub" style={{ margin: '6px 0 0' }}>Deixe em branco quando não houver o item — não utilize "0" nem "-".</p>
              <div className="grid">
                {CAMPOS.map((c) => (
                  <div key={c.col}>
                    <label>{c.rotulo}</label>
                    <input type="text" autoComplete="off"
                           value={valores[c.rotulo] || ''}
                           onChange={(e) => setCampo(c.rotulo, e.target.value)} />
                  </div>
                ))}
              </div>
            </>
          )}

          {msg && <div className={'msg ' + msg.tipo}>{msg.texto}</div>}

          <div className="actions">
            <button className="btn btn-primary" onClick={enviar} disabled={carregando}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z" /><path d="M17 21v-8H7v8M7 3v5h8" /></svg>
              {carregando ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
