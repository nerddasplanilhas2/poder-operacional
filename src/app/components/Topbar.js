import { Shield } from './Icons';

export default function Topbar({ right }) {
  return (
    <div className="topbar">
      <div className="brand">
        <div className="mark"><Shield /></div>
        <div>
          <h1>PODER OPERACIONAL</h1>
          <span>Corpo de Bombeiros — Cadastro por GBM</span>
        </div>
      </div>
      <div>{right}</div>
    </div>
  );
}
