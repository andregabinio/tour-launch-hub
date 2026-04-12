const CSV_HEADERS = [
  'Macro Etapa',
  'Título',
  'Descrição',
  'Subtarefas',
  'Responsável',
  'Prioridade',
  'Data Início',
  'Data Fim',
  'Dependência',
];

const EXAMPLE_ROWS = [
  [
    'Planejamento',
    'Definir escopo do projeto',
    'Levantar requisitos e definir entregas',
    'Reunião com stakeholders;Documento de escopo;Aprovação',
    'João Silva',
    'alta',
    '15/04/2026',
    '20/04/2026',
    '',
  ],
  [
    'Planejamento',
    'Criar cronograma',
    'Montar timeline com marcos e dependências',
    'Draft inicial;Revisão;Versão final',
    'Maria Santos',
    'média',
    '21/04/2026',
    '25/04/2026',
    'Definir escopo do projeto',
  ],
  [
    'Execução',
    'Desenvolver identidade visual',
    'Criar logo, paleta de cores e guia de marca',
    'Criar logo;Definir paleta;Aprovar com cliente',
    'Ana Costa',
    'alta',
    '26/04/2026',
    '05/05/2026',
    'Criar cronograma',
  ],
];

function escapeCsvField(field: string): string {
  if (field.includes(',') || field.includes('"') || field.includes('\n') || field.includes(';')) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}

function rowToCsvLine(row: string[]): string {
  return row.map(escapeCsvField).join(',');
}

export function downloadCsvTemplate(): void {
  const lines = [
    rowToCsvLine(CSV_HEADERS),
    ...EXAMPLE_ROWS.map(rowToCsvLine),
  ];
  const csvContent = lines.join('\r\n');
  // UTF-8 BOM so Excel opens with correct encoding for accented chars
  const bom = '\uFEFF';
  const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'modelo-importacao-acoes.csv';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export { CSV_HEADERS };
