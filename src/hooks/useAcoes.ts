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
  macro_etapas: { nome: string; projeto_id: string } | null;
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

export function useAcoes(projetoId?: string) {
  return useQuery({
    queryKey: ['acoes', projetoId],
    queryFn: async (): Promise<Acao[]> => {
      const { data, error } = await supabase
        .from('acoes')
        .select('*, macro_etapas(nome, projeto_id), subtarefas(*)')
        .order('data_inicio');

      if (error) throw error;
      return (data ?? [])
        .filter((row) => row.macro_etapas?.projeto_id === projetoId)
        .map(rowToAcao);
    },
    enabled: !!projetoId,
  });
}

export function useCreateAcao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (acao: {
      id?: string;
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
      const { id, ...rest } = acao;
      const payload = id ? { id, ...rest } : rest;
      const { data, error } = await supabase.from('acoes').insert(payload).select().single();
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
    onMutate: async ({ id, ...updates }) => {
      await queryClient.cancelQueries({ queryKey: ['acoes'] });
      const queries = queryClient.getQueriesData<Acao[]>({ queryKey: ['acoes'] });
      const snapshots: [readonly unknown[], Acao[] | undefined][] = [];
      for (const [key, data] of queries) {
        snapshots.push([key, data]);
        if (data) {
          queryClient.setQueryData<Acao[]>(key as string[], data.map(a =>
            a.id === id ? { ...a, ...camelizeUpdates(updates) } : a
          ));
        }
      }
      return { snapshots };
    },
    onError: (_err, _vars, context) => {
      if (context?.snapshots) {
        for (const [key, data] of context.snapshots) {
          queryClient.setQueryData(key, data);
        }
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['acoes'] });
    },
  });
}

function camelizeUpdates(updates: Record<string, unknown>): Partial<Acao> {
  const map: Record<string, string> = {
    status: 'status',
    titulo: 'titulo',
    descricao: 'descricao',
    responsavel: 'responsavel',
    prioridade: 'prioridade',
    situacao_prazo: 'situacaoPrazo',
    tempo_estimado: 'tempoEstimado',
    data_inicio: 'dataInicio',
    data_fim: 'dataFim',
    dependencia_de: 'dependenciaDe',
  };
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(updates)) {
    const camel = map[key] || key;
    result[camel] = value;
  }
  return result as Partial<Acao>;
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
