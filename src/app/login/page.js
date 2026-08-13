'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Topbar from '../components/Topbar';

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
      router.replace('/dashboard');
    } catch (err) {
      setMsg({ tipo: 'err', texto: 'Erro ao entrar: ' + err.message });
      setCarregando(false);
    }
  }

  return (
    <>
      <Topbar right={<Link className="btn btn-login" href="/">← Formulário</Link>} />
      <div className="center-screen">
        <div className="card login-card">
          <div className="card-head">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="10" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
            <h2>Acesso restrito</h2>
          </div>
          <p className="sub">Área do Comandante e do Diretor. Informe seu e-mail e senha.</p>
          <form onSubmit={entrar}>
            <label htmlFor="email">E-mail</label>
            <input id="email" type="email" autoComplete="username" placeholder="seuemail@exemplo.com"
                   value={email} onChange={(e) => setEmail(e.target.value)} />
            <label htmlFor="senha">Senha</label>
            <input id="senha" type="password" autoComplete="current-password" placeholder="••••••••"
                   value={senha} onChange={(e) => setSenha(e.target.value)} />
            {msg && <div className={'msg ' + msg.tipo}>{msg.texto}</div>}
            <div className="actions">
              <button className="btn btn-primary" type="submit" disabled={carregando}>
                {carregando ? 'Entrando...' : 'Acessar painel'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
