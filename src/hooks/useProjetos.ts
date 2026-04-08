import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { type Projeto } from '@/types/projeto';

export function useProjetos(statusFilter?: string) {
  return useQuery({
    queryKey: ['projetos', statusFilter],
    queryFn: async (): Promise<Projeto[]> => {
      let query = supabase
        .from('projetos')
        .select('*')
        .order('created_at', { ascending: false });

      if (statusFilter) {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data ?? []).map((row) => ({
        id: row.id,
        nome: row.nome,
        descricao: row.descricao,
        status: row.status as Projeto['status'],
        cor: row.cor,
        createdBy: row.created_by,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));
    },
  });
}

export function useProjeto(id?: string) {
  return useQuery({
    queryKey: ['projetos', id],
    queryFn: async (): Promise<Projeto> => {
      const { data, error } = await supabase
        .from('projetos')
        .select('*')
        .eq('id', id!)
        .single();

      if (error) throw error;

      return {
        id: data.id,
        nome: data.nome,
        descricao: data.descricao,
        status: data.status as Projeto['status'],
        cor: data.cor,
        createdBy: data.created_by,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    },
    enabled: !!id,
  });
}

export function useCreateProjeto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (projeto: {
      id: string;
      nome: string;
      descricao: string;
      status: string;
      cor: string;
    }) => {
      const { data, error } = await supabase.from('projetos').insert(projeto).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projetos'] });
    },
  });
}

export function useUpdateProjeto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<{
      nome: string;
      descricao: string;
      status: string;
      cor: string;
    }>) => {
      const { data, error } = await supabase.from('projetos').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projetos'] });
    },
  });
}

export function useDeleteProjeto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('projetos').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projetos'] });
    },
  });
}
