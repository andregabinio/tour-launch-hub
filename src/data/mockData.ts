import { Acao, MacroEtapa } from '@/types/roadmap';

export const MACRO_ETAPAS_DATA: MacroEtapa[] = [
  { id: 'planejamento', titulo: 'Planejamento Estratégico', descricao: 'Definição de escopo, objetivos e diretrizes', cor: 'hsl(221, 83%, 53%)', corBg: 'bg-primary/10', corBorder: 'border-primary/30' },
  { id: 'branding', titulo: 'Branding e Comunicação', descricao: 'Identidade visual, posicionamento e narrativa', cor: 'hsl(262, 83%, 58%)', corBg: 'bg-blocked/10', corBorder: 'border-blocked/30' },
  { id: 'producao', titulo: 'Produção de Materiais', descricao: 'Criação de assets, vídeos e peças', cor: 'hsl(38, 92%, 50%)', corBg: 'bg-warning/10', corBorder: 'border-warning/30' },
  { id: 'pre-lancamento', titulo: 'Pré-lançamento', descricao: 'Aquecimento, teasers e engajamento', cor: 'hsl(142, 76%, 36%)', corBg: 'bg-success/10', corBorder: 'border-success/30' },
  { id: 'lancamento', titulo: 'Lançamento', descricao: 'Go-live, vendas e cobertura', cor: 'hsl(0, 84%, 60%)', corBg: 'bg-destructive/10', corBorder: 'border-destructive/30' },
  { id: 'pos-lancamento', titulo: 'Pós-lançamento', descricao: 'Análise, feedback e otimização', cor: 'hsl(220, 9%, 46%)', corBg: 'bg-muted', corBorder: 'border-border' },
];

export const MACRO_ETAPAS = MACRO_ETAPAS_DATA.map(e => e.titulo);

export const RESPONSAVEIS = [
  'Ana Costa',
  'Bruno Silva',
  'Carla Mendes',
  'Diego Rocha',
  'Elena Martins',
  'Felipe Almeida',
  'Gabriela Lima',
  'Ricardo Nunes',
];

export const acoesMock: Acao[] = [
  // PLANEJAMENTO ESTRATÉGICO
  {
    id: 'PLA-001', titulo: 'Definir conceito criativo do TOUR',
    descricao: 'Criar o conceito visual, narrativa e identidade do tour.',
    macroEtapa: 'Planejamento Estratégico', responsavel: 'Ana Costa',
    prioridade: 'alta', status: 'concluída', situacaoPrazo: 'no prazo',
    tempoEstimado: '5 dias', dataInicio: '2025-07-01', dataFim: '2025-07-07',
    dependenciaDe: null,
    subtarefas: [
      { id: 'PLA-001-1', titulo: 'Pesquisa de referências visuais', status: 'concluída', responsavel: 'Ana Costa', tempoEstimado: '2 dias' },
      { id: 'PLA-001-2', titulo: 'Mood board aprovado', status: 'concluída', responsavel: 'Ana Costa', tempoEstimado: '1 dia' },
      { id: 'PLA-001-3', titulo: 'Documento de conceito final', status: 'concluída', responsavel: 'Ana Costa', tempoEstimado: '2 dias' },
    ],
  },
  {
    id: 'PLA-002', titulo: 'Mapear cidades e venues',
    descricao: 'Selecionar cidades-alvo e negociar venues para as datas.',
    macroEtapa: 'Planejamento Estratégico', responsavel: 'Diego Rocha',
    prioridade: 'alta', status: 'em andamento', situacaoPrazo: 'atrasada',
    tempoEstimado: '10 dias', dataInicio: '2025-07-05', dataFim: '2025-07-18',
    dependenciaDe: 'PLA-001',
    subtarefas: [
      { id: 'PLA-002-1', titulo: 'Lista de cidades prioritárias', status: 'concluída', responsavel: 'Diego Rocha', tempoEstimado: '2 dias' },
      { id: 'PLA-002-2', titulo: 'Contato com venues', status: 'em andamento', responsavel: 'Diego Rocha', tempoEstimado: '5 dias' },
      { id: 'PLA-002-3', titulo: 'Contratos assinados', status: 'não iniciada', responsavel: 'Felipe Almeida', tempoEstimado: '3 dias' },
    ],
  },
  {
    id: 'PLA-003', titulo: 'Orçamento geral do projeto',
    descricao: 'Consolidar orçamento de todas as frentes.',
    macroEtapa: 'Planejamento Estratégico', responsavel: 'Felipe Almeida',
    prioridade: 'alta', status: 'em andamento', situacaoPrazo: 'no prazo',
    tempoEstimado: '7 dias', dataInicio: '2025-07-03', dataFim: '2025-07-12',
    dependenciaDe: null,
    subtarefas: [
      { id: 'PLA-003-1', titulo: 'Levantamento de custos por área', status: 'concluída', responsavel: 'Felipe Almeida', tempoEstimado: '3 dias' },
      { id: 'PLA-003-2', titulo: 'Aprovação da diretoria', status: 'não iniciada', responsavel: 'Felipe Almeida', tempoEstimado: '2 dias' },
    ],
  },
  {
    id: 'PLA-004', titulo: 'Definir cronograma geral',
    descricao: 'Estabelecer marcos e deadlines para todas as áreas.',
    macroEtapa: 'Planejamento Estratégico', responsavel: 'Ricardo Nunes',
    prioridade: 'média', status: 'concluída', situacaoPrazo: 'no prazo',
    tempoEstimado: '4 dias', dataInicio: '2025-07-08', dataFim: '2025-07-12',
    dependenciaDe: null,
    subtarefas: [
      { id: 'PLA-004-1', titulo: 'Timeline por macro etapa', status: 'concluída', responsavel: 'Ricardo Nunes', tempoEstimado: '2 dias' },
      { id: 'PLA-004-2', titulo: 'Alinhamento entre áreas', status: 'concluída', responsavel: 'Ricardo Nunes', tempoEstimado: '2 dias' },
    ],
  },
  {
    id: 'PLA-005', titulo: 'Montar equipe de projeto',
    descricao: 'Definir papéis, alocações e responsabilidades do time.',
    macroEtapa: 'Planejamento Estratégico', responsavel: 'Ricardo Nunes',
    prioridade: 'alta', status: 'concluída', situacaoPrazo: 'no prazo',
    tempoEstimado: '3 dias', dataInicio: '2025-07-01', dataFim: '2025-07-04',
    dependenciaDe: null,
    subtarefas: [],
  },

  // BRANDING E COMUNICAÇÃO
  {
    id: 'BRA-001', titulo: 'Criar identidade visual do TOUR',
    descricao: 'Logo, paleta de cores, tipografia e key visual.',
    macroEtapa: 'Branding e Comunicação', responsavel: 'Ana Costa',
    prioridade: 'alta', status: 'em andamento', situacaoPrazo: 'no prazo',
    tempoEstimado: '8 dias', dataInicio: '2025-07-10', dataFim: '2025-07-21',
    dependenciaDe: 'PLA-001',
    subtarefas: [
      { id: 'BRA-001-1', titulo: 'Proposta de logo (3 opções)', status: 'concluída', responsavel: 'Ana Costa', tempoEstimado: '3 dias' },
      { id: 'BRA-001-2', titulo: 'Guideline de marca', status: 'em andamento', responsavel: 'Ana Costa', tempoEstimado: '3 dias' },
      { id: 'BRA-001-3', titulo: 'Adaptações para redes sociais', status: 'não iniciada', responsavel: 'Gabriela Lima', tempoEstimado: '2 dias' },
    ],
  },
  {
    id: 'BRA-002', titulo: 'Estratégia de posicionamento',
    descricao: 'Definir tom de voz, mensagens-chave e narrativa da marca.',
    macroEtapa: 'Branding e Comunicação', responsavel: 'Elena Martins',
    prioridade: 'média', status: 'em andamento', situacaoPrazo: 'no prazo',
    tempoEstimado: '6 dias', dataInicio: '2025-07-12', dataFim: '2025-07-19',
    dependenciaDe: 'PLA-001',
    subtarefas: [
      { id: 'BRA-002-1', titulo: 'Documento de posicionamento', status: 'em andamento', responsavel: 'Elena Martins', tempoEstimado: '3 dias' },
      { id: 'BRA-002-2', titulo: 'Key messages por público', status: 'não iniciada', responsavel: 'Elena Martins', tempoEstimado: '3 dias' },
    ],
  },
  {
    id: 'BRA-003', titulo: 'Press kit e media kit',
    descricao: 'Montar kit de imprensa para assessoria e parceiros.',
    macroEtapa: 'Branding e Comunicação', responsavel: 'Elena Martins',
    prioridade: 'média', status: 'não iniciada', situacaoPrazo: 'no prazo',
    tempoEstimado: '5 dias', dataInicio: '2025-07-21', dataFim: '2025-07-27',
    dependenciaDe: 'BRA-001',
    subtarefas: [
      { id: 'BRA-003-1', titulo: 'Release de imprensa', status: 'não iniciada', responsavel: 'Elena Martins', tempoEstimado: '2 dias' },
      { id: 'BRA-003-2', titulo: 'Assets visuais para press', status: 'não iniciada', responsavel: 'Ana Costa', tempoEstimado: '2 dias' },
      { id: 'BRA-003-3', titulo: 'Página de press online', status: 'não iniciada', responsavel: 'Bruno Silva', tempoEstimado: '1 dia' },
    ],
  },
  {
    id: 'BRA-004', titulo: 'Plano de assessoria de imprensa',
    descricao: 'Definir veículos, pautas e cronograma de divulgação.',
    macroEtapa: 'Branding e Comunicação', responsavel: 'Elena Martins',
    prioridade: 'baixa', status: 'não iniciada', situacaoPrazo: 'no prazo',
    tempoEstimado: '4 dias', dataInicio: '2025-07-24', dataFim: '2025-07-29',
    dependenciaDe: 'BRA-003',
    subtarefas: [],
  },

  // PRODUÇÃO DE MATERIAIS
  {
    id: 'PRO-001', titulo: 'Produzir vídeo teaser de anúncio',
    descricao: 'Roteirizar e produzir vídeo teaser de 30s para redes.',
    macroEtapa: 'Produção de Materiais', responsavel: 'Bruno Silva',
    prioridade: 'alta', status: 'não iniciada', situacaoPrazo: 'no prazo',
    tempoEstimado: '12 dias', dataInicio: '2025-07-22', dataFim: '2025-08-05',
    dependenciaDe: 'BRA-001',
    subtarefas: [
      { id: 'PRO-001-1', titulo: 'Roteiro aprovado', status: 'não iniciada', responsavel: 'Bruno Silva', tempoEstimado: '3 dias' },
      { id: 'PRO-001-2', titulo: 'Gravação', status: 'não iniciada', responsavel: 'Bruno Silva', tempoEstimado: '4 dias' },
      { id: 'PRO-001-3', titulo: 'Edição e pós-produção', status: 'não iniciada', responsavel: 'Bruno Silva', tempoEstimado: '5 dias' },
    ],
  },
  {
    id: 'PRO-002', titulo: 'Banco de imagens e assets digitais',
    descricao: 'Criar e organizar banco de imagens para todas as peças.',
    macroEtapa: 'Produção de Materiais', responsavel: 'Gabriela Lima',
    prioridade: 'média', status: 'não iniciada', situacaoPrazo: 'no prazo',
    tempoEstimado: '6 dias', dataInicio: '2025-07-22', dataFim: '2025-07-29',
    dependenciaDe: 'BRA-001',
    subtarefas: [
      { id: 'PRO-002-1', titulo: 'Sessão fotográfica', status: 'não iniciada', responsavel: 'Gabriela Lima', tempoEstimado: '2 dias' },
      { id: 'PRO-002-2', titulo: 'Tratamento e catalogação', status: 'não iniciada', responsavel: 'Gabriela Lima', tempoEstimado: '4 dias' },
    ],
  },
  {
    id: 'PRO-003', titulo: 'Peças para redes sociais',
    descricao: 'Criar grid de posts, stories e reels para lançamento.',
    macroEtapa: 'Produção de Materiais', responsavel: 'Gabriela Lima',
    prioridade: 'média', status: 'em andamento', situacaoPrazo: 'atrasada',
    tempoEstimado: '10 dias', dataInicio: '2025-07-15', dataFim: '2025-07-28',
    dependenciaDe: null,
    subtarefas: [
      { id: 'PRO-003-1', titulo: 'Grid de 30 dias planejado', status: 'concluída', responsavel: 'Gabriela Lima', tempoEstimado: '3 dias' },
      { id: 'PRO-003-2', titulo: 'Criação de 15 peças visuais', status: 'em andamento', responsavel: 'Gabriela Lima', tempoEstimado: '5 dias' },
      { id: 'PRO-003-3', titulo: 'Redação de copies', status: 'não iniciada', responsavel: 'Elena Martins', tempoEstimado: '2 dias' },
    ],
  },
  {
    id: 'PRO-004', titulo: 'Material gráfico para venues',
    descricao: 'Banners, backdrops, sinalização e materiais impressos.',
    macroEtapa: 'Produção de Materiais', responsavel: 'Ana Costa',
    prioridade: 'média', status: 'não iniciada', situacaoPrazo: 'no prazo',
    tempoEstimado: '7 dias', dataInicio: '2025-07-28', dataFim: '2025-08-05',
    dependenciaDe: 'BRA-001',
    subtarefas: [
      { id: 'PRO-004-1', titulo: 'Layout dos banners', status: 'não iniciada', responsavel: 'Ana Costa', tempoEstimado: '3 dias' },
      { id: 'PRO-004-2', titulo: 'Envio para produção gráfica', status: 'não iniciada', responsavel: 'Ana Costa', tempoEstimado: '2 dias' },
      { id: 'PRO-004-3', titulo: 'Conferência de provas', status: 'não iniciada', responsavel: 'Ana Costa', tempoEstimado: '2 dias' },
    ],
  },
  {
    id: 'PRO-005', titulo: 'Landing page do TOUR',
    descricao: 'Desenvolver landing page com informações, datas e venda.',
    macroEtapa: 'Produção de Materiais', responsavel: 'Bruno Silva',
    prioridade: 'alta', status: 'não iniciada', situacaoPrazo: 'no prazo',
    tempoEstimado: '8 dias', dataInicio: '2025-07-25', dataFim: '2025-08-04',
    dependenciaDe: 'BRA-001',
    subtarefas: [
      { id: 'PRO-005-1', titulo: 'Wireframe aprovado', status: 'não iniciada', responsavel: 'Bruno Silva', tempoEstimado: '2 dias' },
      { id: 'PRO-005-2', titulo: 'Desenvolvimento front-end', status: 'não iniciada', responsavel: 'Bruno Silva', tempoEstimado: '4 dias' },
      { id: 'PRO-005-3', titulo: 'Integração com vendas', status: 'não iniciada', responsavel: 'Bruno Silva', tempoEstimado: '2 dias' },
    ],
  },

  // PRÉ-LANÇAMENTO
  {
    id: 'PRE-001', titulo: 'Plano de mídia paga',
    descricao: 'Estratégia de mídia paga: Meta Ads, Google Ads, YouTube.',
    macroEtapa: 'Pré-lançamento', responsavel: 'Carla Mendes',
    prioridade: 'alta', status: 'não iniciada', situacaoPrazo: 'no prazo',
    tempoEstimado: '7 dias', dataInicio: '2025-08-04', dataFim: '2025-08-12',
    dependenciaDe: 'PRO-001',
    subtarefas: [
      { id: 'PRE-001-1', titulo: 'Definir budget por canal', status: 'não iniciada', responsavel: 'Carla Mendes', tempoEstimado: '2 dias' },
      { id: 'PRE-001-2', titulo: 'Criar audiências e segmentações', status: 'não iniciada', responsavel: 'Carla Mendes', tempoEstimado: '3 dias' },
      { id: 'PRE-001-3', titulo: 'Subir campanhas', status: 'não iniciada', responsavel: 'Carla Mendes', tempoEstimado: '2 dias' },
    ],
  },
  {
    id: 'PRE-002', titulo: 'Estratégia de influenciadores',
    descricao: 'Mapear, contatar e fechar parcerias com influenciadores.',
    macroEtapa: 'Pré-lançamento', responsavel: 'Elena Martins',
    prioridade: 'média', status: 'não iniciada', situacaoPrazo: 'no prazo',
    tempoEstimado: '10 dias', dataInicio: '2025-08-01', dataFim: '2025-08-13',
    dependenciaDe: 'BRA-001',
    subtarefas: [
      { id: 'PRE-002-1', titulo: 'Lista de influenciadores (tier 1-3)', status: 'não iniciada', responsavel: 'Elena Martins', tempoEstimado: '3 dias' },
      { id: 'PRE-002-2', titulo: 'Briefing e proposta comercial', status: 'não iniciada', responsavel: 'Elena Martins', tempoEstimado: '4 dias' },
      { id: 'PRE-002-3', titulo: 'Contratos assinados', status: 'não iniciada', responsavel: 'Felipe Almeida', tempoEstimado: '3 dias' },
    ],
  },
  {
    id: 'PRE-003', titulo: 'Prospecção de patrocinadores',
    descricao: 'Identificar marcas para patrocínio e cotas de apoio.',
    macroEtapa: 'Pré-lançamento', responsavel: 'Elena Martins',
    prioridade: 'alta', status: 'em andamento', situacaoPrazo: 'atrasada',
    tempoEstimado: '15 dias', dataInicio: '2025-07-14', dataFim: '2025-08-01',
    dependenciaDe: null,
    subtarefas: [
      { id: 'PRE-003-1', titulo: 'Deck de patrocínio finalizado', status: 'concluída', responsavel: 'Elena Martins', tempoEstimado: '5 dias' },
      { id: 'PRE-003-2', titulo: 'Lista de 30 prospects', status: 'concluída', responsavel: 'Elena Martins', tempoEstimado: '3 dias' },
      { id: 'PRE-003-3', titulo: 'Reuniões de apresentação', status: 'em andamento', responsavel: 'Elena Martins', tempoEstimado: '5 dias' },
      { id: 'PRE-003-4', titulo: 'Contratos fechados', status: 'não iniciada', responsavel: 'Felipe Almeida', tempoEstimado: '2 dias' },
    ],
  },
  {
    id: 'PRE-004', titulo: 'Configurar plataforma de ingressos',
    descricao: 'Integrar e configurar plataforma de vendas com lotes.',
    macroEtapa: 'Pré-lançamento', responsavel: 'Bruno Silva',
    prioridade: 'alta', status: 'não iniciada', situacaoPrazo: 'no prazo',
    tempoEstimado: '10 dias', dataInicio: '2025-08-06', dataFim: '2025-08-18',
    dependenciaDe: 'PLA-002',
    subtarefas: [
      { id: 'PRE-004-1', titulo: 'Definir categorias e preços', status: 'não iniciada', responsavel: 'Bruno Silva', tempoEstimado: '2 dias' },
      { id: 'PRE-004-2', titulo: 'Configurar lotes na plataforma', status: 'não iniciada', responsavel: 'Bruno Silva', tempoEstimado: '4 dias' },
      { id: 'PRE-004-3', titulo: 'Teste de compra end-to-end', status: 'não iniciada', responsavel: 'Bruno Silva', tempoEstimado: '2 dias' },
      { id: 'PRE-004-4', titulo: 'Página de venda publicada', status: 'não iniciada', responsavel: 'Bruno Silva', tempoEstimado: '2 dias' },
    ],
  },
  {
    id: 'PRE-005', titulo: 'Campanha de aquecimento',
    descricao: 'Ativar teasers e contagem regressiva nas redes.',
    macroEtapa: 'Pré-lançamento', responsavel: 'Gabriela Lima',
    prioridade: 'média', status: 'não iniciada', situacaoPrazo: 'no prazo',
    tempoEstimado: '7 dias', dataInicio: '2025-08-11', dataFim: '2025-08-19',
    dependenciaDe: 'PRO-001',
    subtarefas: [
      { id: 'PRE-005-1', titulo: 'Cronograma de teasers', status: 'não iniciada', responsavel: 'Gabriela Lima', tempoEstimado: '2 dias' },
      { id: 'PRE-005-2', titulo: 'Posts de contagem regressiva', status: 'não iniciada', responsavel: 'Gabriela Lima', tempoEstimado: '3 dias' },
      { id: 'PRE-005-3', titulo: 'Ativação com influenciadores', status: 'não iniciada', responsavel: 'Elena Martins', tempoEstimado: '2 dias' },
    ],
  },

  // LANÇAMENTO
  {
    id: 'LAN-001', titulo: 'Contratação de fornecedores técnicos',
    descricao: 'Contratar som, iluminação, palco e equipe técnica.',
    macroEtapa: 'Lançamento', responsavel: 'Diego Rocha',
    prioridade: 'alta', status: 'não iniciada', situacaoPrazo: 'no prazo',
    tempoEstimado: '12 dias', dataInicio: '2025-08-11', dataFim: '2025-08-25',
    dependenciaDe: 'PLA-002',
    subtarefas: [
      { id: 'LAN-001-1', titulo: 'Rider técnico finalizado', status: 'não iniciada', responsavel: 'Diego Rocha', tempoEstimado: '3 dias' },
      { id: 'LAN-001-2', titulo: 'Cotações recebidas (mín. 3)', status: 'não iniciada', responsavel: 'Diego Rocha', tempoEstimado: '4 dias' },
      { id: 'LAN-001-3', titulo: 'Contratos de fornecedores', status: 'não iniciada', responsavel: 'Felipe Almeida', tempoEstimado: '3 dias' },
      { id: 'LAN-001-4', titulo: 'Cronograma de montagem', status: 'não iniciada', responsavel: 'Diego Rocha', tempoEstimado: '2 dias' },
    ],
  },
  {
    id: 'LAN-002', titulo: 'Logística de hospedagem e transporte',
    descricao: 'Organizar deslocamento e hospedagem da equipe e artistas.',
    macroEtapa: 'Lançamento', responsavel: 'Felipe Almeida',
    prioridade: 'média', status: 'não iniciada', situacaoPrazo: 'no prazo',
    tempoEstimado: '8 dias', dataInicio: '2025-08-18', dataFim: '2025-08-27',
    dependenciaDe: 'PLA-002',
    subtarefas: [
      { id: 'LAN-002-1', titulo: 'Reservas de hotel', status: 'não iniciada', responsavel: 'Felipe Almeida', tempoEstimado: '3 dias' },
      { id: 'LAN-002-2', titulo: 'Passagens aéreas/terrestres', status: 'não iniciada', responsavel: 'Felipe Almeida', tempoEstimado: '3 dias' },
      { id: 'LAN-002-3', titulo: 'Transfers locais confirmados', status: 'não iniciada', responsavel: 'Felipe Almeida', tempoEstimado: '2 dias' },
    ],
  },
  {
    id: 'LAN-003', titulo: 'Go-live de vendas de ingressos',
    descricao: 'Abertura oficial de vendas com campanhas ativas.',
    macroEtapa: 'Lançamento', responsavel: 'Bruno Silva',
    prioridade: 'alta', status: 'não iniciada', situacaoPrazo: 'no prazo',
    tempoEstimado: '5 dias', dataInicio: '2025-08-20', dataFim: '2025-08-26',
    dependenciaDe: 'PRE-004',
    subtarefas: [
      { id: 'LAN-003-1', titulo: 'Verificação final da plataforma', status: 'não iniciada', responsavel: 'Bruno Silva', tempoEstimado: '1 dia' },
      { id: 'LAN-003-2', titulo: 'Monitoramento de vendas real-time', status: 'não iniciada', responsavel: 'Bruno Silva', tempoEstimado: '2 dias' },
      { id: 'LAN-003-3', titulo: 'Suporte ao cliente ativo', status: 'não iniciada', responsavel: 'Ricardo Nunes', tempoEstimado: '2 dias' },
    ],
  },
  {
    id: 'LAN-004', titulo: 'Cobertura ao vivo nas redes',
    descricao: 'Stories, lives e cobertura em tempo real do lançamento.',
    macroEtapa: 'Lançamento', responsavel: 'Gabriela Lima',
    prioridade: 'média', status: 'não iniciada', situacaoPrazo: 'no prazo',
    tempoEstimado: '5 dias', dataInicio: '2025-08-20', dataFim: '2025-08-26',
    dependenciaDe: 'PRO-001',
    subtarefas: [
      { id: 'LAN-004-1', titulo: 'Roteiro de cobertura', status: 'não iniciada', responsavel: 'Gabriela Lima', tempoEstimado: '1 dia' },
      { id: 'LAN-004-2', titulo: 'Equipe de social media no local', status: 'não iniciada', responsavel: 'Gabriela Lima', tempoEstimado: '2 dias' },
      { id: 'LAN-004-3', titulo: 'Compilação e highlights', status: 'não iniciada', responsavel: 'Bruno Silva', tempoEstimado: '2 dias' },
    ],
  },

  // PÓS-LANÇAMENTO
  {
    id: 'POS-001', titulo: 'Relatório de performance',
    descricao: 'Consolidar métricas de vendas, engajamento e mídia.',
    macroEtapa: 'Pós-lançamento', responsavel: 'Carla Mendes',
    prioridade: 'baixa', status: 'não iniciada', situacaoPrazo: 'no prazo',
    tempoEstimado: '5 dias', dataInicio: '2025-08-27', dataFim: '2025-09-02',
    dependenciaDe: 'PRE-001',
    subtarefas: [
      { id: 'POS-001-1', titulo: 'Coleta de dados de mídia paga', status: 'não iniciada', responsavel: 'Carla Mendes', tempoEstimado: '2 dias' },
      { id: 'POS-001-2', titulo: 'Análise de vendas por cidade', status: 'não iniciada', responsavel: 'Bruno Silva', tempoEstimado: '2 dias' },
      { id: 'POS-001-3', titulo: 'Apresentação para stakeholders', status: 'não iniciada', responsavel: 'Carla Mendes', tempoEstimado: '1 dia' },
    ],
  },
  {
    id: 'POS-002', titulo: 'Pesquisa de satisfação pós-show',
    descricao: 'Enviar pesquisa NPS e qualitativa para o público.',
    macroEtapa: 'Pós-lançamento', responsavel: 'Gabriela Lima',
    prioridade: 'baixa', status: 'não iniciada', situacaoPrazo: 'no prazo',
    tempoEstimado: '4 dias', dataInicio: '2025-09-01', dataFim: '2025-09-05',
    dependenciaDe: null,
    subtarefas: [
      { id: 'POS-002-1', titulo: 'Criar formulário de pesquisa', status: 'não iniciada', responsavel: 'Gabriela Lima', tempoEstimado: '1 dia' },
      { id: 'POS-002-2', titulo: 'Disparar e-mails', status: 'não iniciada', responsavel: 'Gabriela Lima', tempoEstimado: '1 dia' },
      { id: 'POS-002-3', titulo: 'Compilar resultados', status: 'não iniciada', responsavel: 'Gabriela Lima', tempoEstimado: '2 dias' },
    ],
  },
  {
    id: 'POS-003', titulo: 'Retrospectiva e aprendizados',
    descricao: 'Reunião de retrospectiva com todas as áreas envolvidas.',
    macroEtapa: 'Pós-lançamento', responsavel: 'Ricardo Nunes',
    prioridade: 'baixa', status: 'não iniciada', situacaoPrazo: 'no prazo',
    tempoEstimado: '3 dias', dataInicio: '2025-09-05', dataFim: '2025-09-09',
    dependenciaDe: 'POS-001',
    subtarefas: [
      { id: 'POS-003-1', titulo: 'Pauta da retrospectiva', status: 'não iniciada', responsavel: 'Ricardo Nunes', tempoEstimado: '1 dia' },
      { id: 'POS-003-2', titulo: 'Documento de lições aprendidas', status: 'não iniciada', responsavel: 'Ricardo Nunes', tempoEstimado: '2 dias' },
    ],
  },
  {
    id: 'POS-004', titulo: 'Plano de continuidade',
    descricao: 'Definir próximos passos, novas datas e expansão do tour.',
    macroEtapa: 'Pós-lançamento', responsavel: 'Ricardo Nunes',
    prioridade: 'média', status: 'não iniciada', situacaoPrazo: 'no prazo',
    tempoEstimado: '5 dias', dataInicio: '2025-09-08', dataFim: '2025-09-14',
    dependenciaDe: 'POS-003',
    subtarefas: [],
  },
];
