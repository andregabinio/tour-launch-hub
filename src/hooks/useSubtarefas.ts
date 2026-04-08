import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useCreateSubtarefa() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (subtarefa: {
      acao_id: string;
      titulo: string;
      status: string;
      responsavel: string;
      tempo_estimado: string;
    }) => {
      const { data, error } = await supabase.from('subtarefas').insert(subtarefa).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['acoes'] });
    },
  });
}

export function useUpdateSubtarefa() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<{
      titulo: string;
      status: string;
      responsavel: string;
      tempo_estimado: string;
    }>) => {
      const { data, error } = await supabase.from('subtarefas').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onMutate: async ({ id, ...updates }) => {
      await queryClient.cancelQueries({ queryKey: ['acoes'] });
      const previousQueries: [readonly unknown[], unknown][] = [];
      queryClient.getQueriesData({ queryKey: ['acoes'] }).forEach(([key, data]) => {
        previousQueries.push([key, data]);
        queryClient.setQueryData(key, (old: any[]) =>
          old?.map((acao: any) => ({
            ...acao,
            subtarefas: acao.subtarefas?.map((sub: any) =>
              sub.id === id ? { ...sub, ...updates } : sub
            ),
          }))
        );
      });
      return { previousQueries };
    },
    onError: (_err, _vars, context) => {
      context?.previousQueries?.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['acoes'] });
    },
  });
}

export function useDeleteSubtarefa() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('subtarefas').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['acoes'] });
    },
  });
}
