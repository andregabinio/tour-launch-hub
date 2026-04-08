import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { type Acao } from '@/types/roadmap';

interface AcaoRow {
  id: string;
  titulo: string;
  descricao: string;
  macro_etapa_id: string;
  responsavel: string;
  prioridade: string;
  status: string;
  situacao_prazo: string;
  tempo_estimado: string;
  data_inicio: string;
  data_fim: string;
  dependencia_de: string | null;
  created_by: string | null;
  macro_etapas: { nome: string } | null;
  subtarefas: {
    id: string;
    titulo: string;
    status: string;
    responsavel: string;
    tempo_estimado: string;
  }[];
}

function rowToAcao(row: AcaoRow): Acao {
  return {
    id: row.id,
    titulo: row.titulo,
    descricao: row.descricao,
    macroEtapa: row.macro_etapas?.nome ?? '',
    responsavel: row.responsavel,
    prioridade: row.prioridade as Acao['prioridade'],
    status: row.status as Acao['status'],
    situacaoPrazo: row.situacao_prazo as Acao['situacaoPrazo'],
    tempoEstimado: row.tempo_estimado,
    dataInicio: row.data_inicio,
    dataFim: row.data_fim,
    dependenciaDe: row.dependencia_de,
    subtarefas: (row.subtarefas ?? []).map((s) => ({
      id: s.id,
      titulo: s.titulo,
      status: s.status as Acao['status'],
      responsavel: s.responsavel,
      tempoEstimado: s.tempo_estimado,
    })),
  };
}

export function useAcoes() {
  return useQuery({
    queryKey: ['acoes'],
    queryFn: async (): Promise<Acao[]> => {
      const { data, error } = await supabase
        .from('acoes')
        .select('*, macro_etapas(nome), subtarefas(*)')
        .order('data_inicio');

      if (error) throw error;
      return (data ?? []).map(rowToAcao);
    },
  });
}

export function useCreateAcao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (acao: {
      id: string;
      titulo: string;
      descricao: string;
      macro_etapa_id: string;
      responsavel: string;
      prioridade: string;
      status: string;
      situacao_prazo: string;
      tempo_estimado: string;
      data_inicio: string;
      data_fim: string;
      dependencia_de: string | null;
    }) => {
      const { data, error } = await supabase.from('acoes').insert(acao).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['acoes'] });
    },
  });
}

export function useUpdateAcao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<{
      titulo: string;
      descricao: string;
      macro_etapa_id: string;
      responsavel: string;
      prioridade: string;
      status: string;
      situacao_prazo: string;
      tempo_estimado: string;
      data_inicio: string;
      data_fim: string;
      dependencia_de: string | null;
    }>) => {
      const { data, error } = await supabase.from('acoes').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['acoes'] });
    },
  });
}

export function useDeleteAcao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('acoes').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['acoes'] });
    },
  });
}
