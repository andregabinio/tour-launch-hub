import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { type Marco } from '@/types/roadmap';

export function useMarcos(projetoId?: string) {
  return useQuery({
    queryKey: ['marcos', projetoId],
    queryFn: async (): Promise<Marco[]> => {
      const { data, error } = await supabase
        .from('marcos')
        .select('*')
        .eq('projeto_id', projetoId!)
        .order('data');

      if (error) throw error;

      return (data ?? []).map((row: any) => ({
        id: row.id,
        projetoId: row.projeto_id,
        nome: row.nome,
        descricao: row.descricao ?? '',
        data: row.data,
        cor: row.cor,
        createdAt: row.created_at,
      }));
    },
    enabled: !!projetoId,
  });
}

export function useCreateMarco() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (marco: {
      projeto_id: string;
      nome: string;
      descricao?: string;
      data: string;
      cor?: string;
    }) => {
      const { data, error } = await supabase
        .from('marcos')
        .insert(marco as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['marcos', variables.projeto_id] });
    },
  });
}

export function useUpdateMarco() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      projetoId,
      ...updates
    }: {
      id: string;
      projetoId: string;
    } & Partial<{ nome: string; descricao: string; data: string; cor: string }>) => {
      const { data, error } = await supabase
        .from('marcos')
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['marcos', variables.projetoId] });
    },
  });
}

export function useDeleteMarco() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, projetoId }: { id: string; projetoId: string }) => {
      const { error } = await supabase.from('marcos').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['marcos', variables.projetoId] });
    },
  });
}
