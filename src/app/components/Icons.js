// Ícones SVG reutilizáveis (traçado, estilo Lucide/Heroicons).
const base = {
  fill: 'none', stroke: 'currentColor', strokeWidth: 1.9,
  strokeLinecap: 'round', strokeLinejoin: 'round', viewBox: '0 0 24 24',
};

export function Shield(p) {
  return (<svg {...base} {...p}><path d="M12 2 4 5v6c0 5 3.5 8.5 8 11 4.5-2.5 8-6 8-11V5l-8-3Z" /><path d="M12 8c-1.2 1.3-1.8 2.4-1.8 3.4A1.8 1.8 0 0 0 12 13.2a1.8 1.8 0 0 0 1.8-1.8c0-1-.6-2.1-1.8-3.4Z" /></svg>);
}
export function Grid(p) {
  return (<svg {...base} {...p}><rect x="3" y="3" width="7" height="9" rx="1" /><rect x="14" y="3" width="7" height="5" rx="1" /><rect x="14" y="12" width="7" height="9" rx="1" /><rect x="3" y="16" width="7" height="5" rx="1" /></svg>);
}
export function Units(p) {
  return (<svg {...base} {...p}><path d="M3 21h18" /><path d="M5 21V7l7-4 7 4v14" /><path d="M9 9h.01M15 9h.01M9 13h.01M15 13h.01M9 17h.01M15 17h.01" /></svg>);
}
export function Table(p) {
  return (<svg {...base} {...p}><rect x="3" y="3" width="18" height="18" rx="1.5" /><path d="M3 9h18M3 15h18M9 3v18" /></svg>);
}
export function Logout(p) {
  return (<svg {...base} {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="m16 17 5-5-5-5" /><path d="M21 12H9" /></svg>);
}
export function Lock(p) {
  return (<svg {...base} {...p}><rect x="3" y="11" width="18" height="10" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>);
}
export function Truck(p) {
  return (<svg {...base} {...p}><path d="M14 16V6a1 1 0 0 0-1-1H2v11" /><path d="M14 8h5l3 3v5h-8" /><circle cx="6.5" cy="18.5" r="1.8" /><circle cx="17.5" cy="18.5" r="1.8" /></svg>);
}
export function Boat(p) {
  return (<svg {...base} {...p}><path d="M3 14h18l-2.5 5.5a2 2 0 0 1-1.8 1.2H7.3a2 2 0 0 1-1.8-1.2L3 14Z" /><path d="M5 14V7l7-3 7 3v7" /><path d="M12 4v10" /></svg>);
}
export function Tool(p) {
  return (<svg {...base} {...p}><path d="M14.7 6.3a4 4 0 0 0-5.4 5.2L3 17.8 6.2 21l6.3-6.3a4 4 0 0 0 5.2-5.4l-2.5 2.5-2.3-2.3 2.5-2.5Z" /></svg>);
}
export function Drop(p) {
  return (<svg {...base} {...p}><path d="M12 2.7 6.5 9.3a7 7 0 1 0 11 0L12 2.7Z" /></svg>);
}
export function Search(p) {
  return (<svg {...base} {...p}><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>);
}
export function Refresh(p) {
  return (<svg {...base} {...p}><path d="M3 12a9 9 0 0 1 15-6.7L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-15 6.7L3 16" /><path d="M3 21v-5h5" /></svg>);
}
export function Download(p) {
  return (<svg {...base} {...p}><path d="M12 3v12" /><path d="m7 11 5 5 5-5" /><path d="M5 21h14" /></svg>);
}
export function Save(p) {
  return (<svg {...base} {...p}><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z" /><path d="M17 21v-8H7v8M7 3v5h8" /></svg>);
}
export function Edit(p) {
  return (<svg {...base} {...p}><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>);
}

export function Hash(p) {
  return (<svg {...base} {...p}><path d="M4 9h16M4 15h16M10 3 8 21M16 3l-2 18" /></svg>);
}
export function Filter(p) {
  return (<svg {...base} {...p}><path d="M3 4h18l-7 8v6l-4 2v-8L3 4Z" /></svg>);
}

export const ICONES = { truck: Truck, boat: Boat, tool: Tool, drop: Drop };
