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
    onSuccess: () => {
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
