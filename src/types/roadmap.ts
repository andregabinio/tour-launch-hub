export type Prioridade = 'alta' | 'média' | 'baixa';
export type Status = 'não iniciada' | 'em andamento' | 'concluída';
export type SituacaoPrazo = 'no prazo' | 'atrasada';

export interface Subtarefa {
  id: string;
  titulo: string;
  status: Status;
  responsavel: string;
  tempoEstimado: string;
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
  prazo: string;
  dependenciaDe: string | null;
  subtarefas: Subtarefa[];
  bloqueada?: boolean;
}
