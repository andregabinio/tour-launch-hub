export type Prioridade = 'alta' | 'média' | 'baixa';
export type Status = 'não iniciada' | 'em andamento' | 'concluída';
export type SituacaoPrazo = 'no prazo' | 'atrasada';

export interface Subtarefa {
  id: string;
  titulo: string;
  status: Status;
  responsavel?: string;
  tempoEstimado?: string;
}

export interface Acao {
  id: string;
  titulo: string;
  descricao: string;
  macroEtapa: string;
  responsavel: string;
  prioridade: Prioridade;
  status: Status;
  situacaoPrazo: SituacaoPrazo;
  tempoEstimado: string;
  dataInicio: string;
  dataFim: string;
  dependenciaDe: string | null;
  subtarefas: Subtarefa[];
  bloqueada?: boolean;
}

export interface MacroEtapa {
  id: string;
  titulo: string;
  descricao?: string;
  cor: string;
  corBg: string;
  corBorder: string;
  projetoId: string;
}

export interface Marco {
  id: string;
  projetoId: string;
  nome: string;
  descricao: string;
  data: string;
  cor: string;
  createdAt: string;
}

export type UserRole = 'admin' | 'editor' | 'viewer';

export interface Profile {
  id: string;
  nome: string;
  email: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}
