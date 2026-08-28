'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Shield, Lock, Grid, Table, Units } from '../components/Icons';

export default function CadastroPage() {
  const router = useRouter();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [senha2, setSenha2] = useState('');
  const [msg, setMsg] = useState(null);
  const [carregando, setCarregando] = useState(false);

  async function cadastrar(e) {
    e.preventDefault();
    if (!nome.trim()) return setMsg({ tipo: 'err', texto: 'Informe seu nome.' });
    if (senha.length < 4) return setMsg({ tipo: 'err', texto: 'A senha deve ter ao menos 4 caracteres.' });
    if (senha !== senha2) return setMsg({ tipo: 'err', texto: 'As senhas não conferem.' });
    setCarregando(true);
    setMsg({ tipo: 'info', texto: 'Criando conta...' });
    try {
      const r = await fetch('/api/cadastro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: nome.trim(), email: email.trim(), senha }),
      });
      const j = await r.json();
      if (!j.ok) { setMsg({ tipo: 'err', texto: j.msg || 'Não foi possível cadastrar.' }); setCarregando(false); return; }
      router.replace('/'); // já entra logado
    } catch (err) {
      setMsg({ tipo: 'err', texto: 'Erro: ' + err.message });
      setCarregando(false);
    }
  }

  return (
    <div className="login-shell">
      <div className="login-hero">
        <div className="lh-mark"><Shield /></div>
        <h1>PODER OPERACIONAL</h1>
        <p>Crie seu acesso para preencher os dados do seu GBM e visualizar o painel completo
           da corporação. É rápido.</p>
        <ul>
          <li><Grid /> Preencha o formulário diário</li>
          <li><Units /> Veja a situação de cada unidade</li>
          <li><Table /> Acompanhe todos os indicadores</li>
        </ul>
      </div>

      <div className="login-form-wrap">
        <div className="login-card">
          <div className="card-head">
            <div className="ic"><Lock /></div>
            <h2>Criar conta</h2>
          </div>
          <p className="sub">Preencha os dados para criar seu acesso.</p>
          <form onSubmit={cadastrar}>
            <label htmlFor="nome">Nome completo</label>
            <input id="nome" type="text" placeholder="Seu nome" value={nome} onChange={(e) => setNome(e.target.value)} />
            <label htmlFor="email">E-mail</label>
            <input id="email" type="email" autoComplete="username" placeholder="seuemail@exemplo.com"
                   value={email} onChange={(e) => setEmail(e.target.value)} />
            <label htmlFor="senha">Senha</label>
            <input id="senha" type="password" autoComplete="new-password" placeholder="Crie uma senha"
                   value={senha} onChange={(e) => setSenha(e.target.value)} />
            <label htmlFor="senha2">Confirmar senha</label>
            <input id="senha2" type="password" autoComplete="new-password" placeholder="Repita a senha"
                   value={senha2} onChange={(e) => setSenha2(e.target.value)} />
            {msg && <div className={'msg ' + msg.tipo}>{msg.texto}</div>}
            <div className="actions">
              <button className="btn btn-gold" type="submit" disabled={carregando} style={{ width: '100%' }}>
                {carregando ? 'Criando...' : 'Criar conta e entrar'}
              </button>
            </div>
          </form>
          <p className="sub" style={{ margin: '18px 0 0', textAlign: 'center' }}>
            Já tem acesso? <Link href="/login" style={{ color: 'var(--navy)', fontWeight: 700 }}>Entrar</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
