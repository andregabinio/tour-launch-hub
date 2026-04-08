import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { type MacroEtapa } from '@/types/roadmap';

export function useMacroEtapas() {
  return useQuery({
    queryKey: ['macro_etapas'],
    queryFn: async (): Promise<MacroEtapa[]> => {
      const { data, error } = await supabase
        .from('macro_etapas')
        .select('*')
        .order('ordem');

      if (error) throw error;

      return (data ?? []).map((row) => ({
        id: row.id,
        titulo: row.nome,
        descricao: row.descricao ?? '',
        cor: row.cor,
        corBg: row.cor_bg,
        corBorder: row.cor_border,
      }));
    },
  });
}
