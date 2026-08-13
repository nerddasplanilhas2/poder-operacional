import Link from 'next/link';

export default function Topbar({ right }) {
  return (
    <div className="topbar">
      <div className="brand">
        <div className="mark">
          <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="24" height="24">
            <path d="M12 2 4 5v6c0 5 3.5 8.5 8 11 4.5-2.5 8-6 8-11V5l-8-3Z" />
            <path d="M12 8c-1.2 1.3-1.8 2.4-1.8 3.4A1.8 1.8 0 0 0 12 13.2a1.8 1.8 0 0 0 1.8-1.8c0-1-.6-2.1-1.8-3.4Z" />
          </svg>
        </div>
        <div>
          <h1>PODER OPERACIONAL</h1>
          <span>Corpo de Bombeiros — Cadastro por GBM</span>
        </div>
      </div>
      <div>{right}</div>
    </div>
  );
}

export function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="10" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}
