'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Shield, Lock, Grid, Table, Units } from '../components/Icons';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [msg, setMsg] = useState(null);
  const [carregando, setCarregando] = useState(false);

  async function entrar(e) {
    e.preventDefault();
    setCarregando(true);
    setMsg({ tipo: 'info', texto: 'Verificando...' });
    try {
      const r = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), senha }),
      });
      const j = await r.json();
      if (!j.ok) { setMsg({ tipo: 'err', texto: j.msg || 'E-mail ou senha inválidos.' }); setCarregando(false); return; }
      router.replace('/');
    } catch (err) {
      setMsg({ tipo: 'err', texto: 'Erro ao entrar: ' + err.message });
      setCarregando(false);
    }
  }

  return (
    <div className="login-shell">
      <div className="login-hero">
        <div className="lh-mark"><Shield /></div>
        <h1>PODER OPERACIONAL</h1>
        <p>Sistema do Corpo de Bombeiros. Registre os recursos do seu GBM e acompanhe o
           panorama de toda a corporação.</p>
        <ul>
          <li><Grid /> Formulário diário por unidade</li>
          <li><Units /> Situação de cada GBM</li>
          <li><Table /> Painel completo com indicadores</li>
        </ul>
      </div>

      <div className="login-form-wrap">
        <div className="login-card">
          <div className="card-head">
            <div className="ic"><Lock /></div>
            <h2>Entrar</h2>
          </div>
          <p className="sub">Acesse com seu e-mail e senha.</p>
          <form onSubmit={entrar}>
            <label htmlFor="email">E-mail</label>
            <input id="email" type="email" autoComplete="username" placeholder="seuemail@exemplo.com"
                   value={email} onChange={(e) => setEmail(e.target.value)} />
            <label htmlFor="senha">Senha</label>
            <input id="senha" type="password" autoComplete="current-password" placeholder="••••••••"
                   value={senha} onChange={(e) => setSenha(e.target.value)} />
            {msg && <div className={'msg ' + msg.tipo}>{msg.texto}</div>}
            <div className="actions">
              <button className="btn btn-navy" type="submit" disabled={carregando} style={{ width: '100%' }}>
                {carregando ? 'Entrando...' : 'Entrar'}
              </button>
            </div>
          </form>
          <p className="sub" style={{ margin: '18px 0 0', textAlign: 'center' }}>
            Não tem acesso? <Link href="/cadastro" style={{ color: 'var(--navy)', fontWeight: 700 }}>Faça seu cadastro</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
