export interface Projeto {
  id: string;
  nome: string;
  descricao: string;
  status: 'ativo' | 'arquivado' | 'concluído';
  cor: string;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TemplateSubtarefa {
  titulo: string;
}

export interface TemplateAcao {
  ref_id: string;
  titulo: string;
  descricao: string;
  prioridade: string;
  tempo_estimado: string | null;
  dependencia_ref: string | null;
  subtarefas: TemplateSubtarefa[];
}

export interface TemplateMacroEtapa {
  ref_id: string;
  nome: string;
  descricao: string | null;
  cor: string;
  ordem: number;
  acoes: TemplateAcao[];
}

export interface TemplateConteudo {
  macro_etapas: TemplateMacroEtapa[];
}

export interface Template {
  id: string;
  nome: string;
  descricao: string;
  conteudo: TemplateConteudo;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}
