import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { type MacroEtapa } from '@/types/roadmap';

export function useMacroEtapas(projetoId?: string) {
  return useQuery({
    queryKey: ['macro_etapas', projetoId],
    queryFn: async (): Promise<MacroEtapa[]> => {
      const { data, error } = await supabase
        .from('macro_etapas')
        .select('*')
        .eq('projeto_id', projetoId!)
        .order('ordem');

      if (error) throw error;

      return (data ?? []).map((row) => ({
        id: row.id,
        titulo: row.nome,
        descricao: row.descricao ?? '',
        cor: row.cor,
        corBg: row.cor_bg,
        corBorder: row.cor_border,
        projetoId: row.projeto_id,
      }));
    },
    enabled: !!projetoId,
  });
}

export function useCreateMacroEtapa() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (macroEtapa: {
      id: string;
      nome: string;
      descricao: string | null;
      cor: string;
      ordem: number;
      projeto_id: string;
    }) => {
      const { data, error } = await supabase
        .from('macro_etapas')
        .insert({
          ...macroEtapa,
          cor_bg: '',
          cor_border: '',
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['macro_etapas', variables.projeto_id] });
    },
  });
}

export function useUpdateMacroEtapa() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, projetoId, ...updates }: { id: string; projetoId: string } & Partial<{
      nome: string;
      descricao: string | null;
      cor: string;
      cor_bg: string;
      cor_border: string;
      ordem: number;
    }>) => {
      const { data, error } = await supabase
        .from('macro_etapas')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['macro_etapas', variables.projetoId] });
    },
  });
}

export function useDeleteMacroEtapa() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, projetoId }: { id: string; projetoId: string }) => {
      const { error } = await supabase.from('macro_etapas').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['macro_etapas', variables.projetoId] });
    },
  });
}

export function useReorderMacroEtapas() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ items, projetoId }: { items: { id: string; ordem: number }[]; projetoId: string }) => {
      for (const item of items) {
        const { error } = await supabase
          .from('macro_etapas')
          .update({ ordem: item.ordem })
          .eq('id', item.id);
        if (error) throw error;
      }
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['macro_etapas', variables.projetoId] });
    },
  });
}
