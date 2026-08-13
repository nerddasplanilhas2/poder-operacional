// Configuracao compartilhada: lista de GBMs e campos do formulario.
// "col" e o nome da coluna no banco (Supabase); "rotulo" e o texto exibido.

export const GBMS = [
  '1º GBM', '2º GBM', '3º GBM/GAPH', '4º GBM/GMAF', '5º GBM',
  '6º GBM', '7º GBM', '8º GBM', '9º GBM/GPCIF', '10º GBM/MCPB',
  'DIOP', 'CLOG',
];

export const CAMPOS = [
  { rotulo: 'ABT',                col: 'abt' },
  { rotulo: 'AT',                 col: 'at' },
  { rotulo: 'ABTF',               col: 'abtf' },
  { rotulo: 'AR',                 col: 'ar' },
  { rotulo: 'USB',                col: 'usb' },
  { rotulo: 'USA',                col: 'usa' },
  { rotulo: 'AEM',                col: 'aem' },
  { rotulo: 'VTR DE APOIO',       col: 'vtr_apoio' },
  { rotulo: 'EMBARCAÇÕES',        col: 'embarcacoes' },
  { rotulo: 'EPRAs DISPONIVEIS',  col: 'epras' },
  { rotulo: 'DESENCARCERADOR',    col: 'desencarcerador' },
  { rotulo: 'SERRA SABRE',        col: 'serra_sabre' },
  { rotulo: 'MOTOSSERRA',         col: 'motosserra' },
  { rotulo: 'MOTOPODA',           col: 'motopoda' },
  { rotulo: 'MICRO RETÍFICA',     col: 'micro_retifica' },
  { rotulo: 'COMPRESSOR',         col: 'compressor' },
  { rotulo: 'PRODUTOS PERIGOSOS', col: 'produtos_perigosos' },
  { rotulo: 'LITROS ÁGUA',        col: 'litros_agua' },
];

// Grupos para os agregados do dashboard.
export const GRUPO_VIATURAS = ['ABT','AT','ABTF','AR','USB','USA','AEM','VTR DE APOIO'];
export const GRUPO_EQUIP = ['DESENCARCERADOR','SERRA SABRE','MOTOSSERRA','MOTOPODA','MICRO RETÍFICA','COMPRESSOR','PRODUTOS PERIGOSOS'];
export const GRUPO_EQUIP_SOMA = ['DESENCARCERADOR','SERRA SABRE','MOTOSSERRA','MOTOPODA','MICRO RETÍFICA','COMPRESSOR'];

export const rotuloPorCol = Object.fromEntries(CAMPOS.map(c => [c.col, c.rotulo]));
export const colPorRotulo = Object.fromEntries(CAMPOS.map(c => [c.rotulo, c.col]));

// Agrupamento dos campos por categoria (usado no formulario e no resumo do painel).
export const CATEGORIAS = [
  { nome: 'Viaturas',     icone: 'truck', campos: ['ABT', 'AT', 'ABTF', 'AR', 'USB', 'USA', 'AEM', 'VTR DE APOIO'] },
  { nome: 'Embarcações',  icone: 'boat',  campos: ['EMBARCAÇÕES'] },
  { nome: 'Equipamentos', icone: 'tool',  campos: ['EPRAs DISPONIVEIS', 'DESENCARCERADOR', 'SERRA SABRE', 'MOTOSSERRA', 'MOTOPODA', 'MICRO RETÍFICA', 'COMPRESSOR'] },
  { nome: 'Recursos',     icone: 'drop',  campos: ['PRODUTOS PERIGOSOS', 'LITROS ÁGUA'] },
];
