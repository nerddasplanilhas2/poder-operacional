'use client';
import { useState } from 'react';
import Link from 'next/link';
import Topbar from './components/Topbar';
import { Lock, Save, Edit, ICONES } from './components/Icons';
import { GBMS, CATEGORIAS } from '../lib/config';

export default function FormPage() {
  const [nome, setNome] = useState('');
  const [gbm, setGbm] = useState('');
  const [valores, setValores] = useState({});
  const [msg, setMsg] = useState(null);
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

  const preenchidos = Object.values(valores).filter((v) => String(v).trim() !== '').length;

  return (
    <>
      <Topbar right={<Link className="btn btn-outline-light" href="/login"><Lock /> Entrar</Link>} />

      <div className="wrap">
        <div className="card">
          <div className="card-head">
            <div className="ic"><Edit /></div>
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
              <p className="sub" style={{ margin: '20px 0 0' }}>
                Deixe em branco quando não houver o item — não utilize "0" nem "-".
                {preenchidos > 0 && <b style={{ color: 'var(--navy)' }}> {' '}({preenchidos} preenchidos)</b>}
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
