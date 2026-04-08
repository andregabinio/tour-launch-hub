import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  type Template,
  type TemplateConteudo,
  type TemplateMacroEtapa,
  type TemplateAcao,
} from '@/types/projeto';

export function useTemplates() {
  return useQuery({
    queryKey: ['templates'],
    queryFn: async (): Promise<Template[]> => {
      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data ?? []).map((row) => ({
        id: row.id,
        nome: row.nome,
        descricao: row.descricao,
        conteudo: row.conteudo as unknown as TemplateConteudo,
        createdBy: row.created_by,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));
    },
  });
}

export function useCreateTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (template: {
      id: string;
      nome: string;
      descricao: string;
      conteudo: TemplateConteudo;
    }) => {
      const { data, error } = await supabase
        .from('templates')
        .insert({
          ...template,
          conteudo: template.conteudo as unknown as Record<string, unknown>,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    },
  });
}

export function useUpdateTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<{
      nome: string;
      descricao: string;
      conteudo: TemplateConteudo;
    }>) => {
      const payload: Record<string, unknown> = { ...updates };
      if (updates.conteudo) {
        payload.conteudo = updates.conteudo as unknown as Record<string, unknown>;
      }
      const { data, error } = await supabase
        .from('templates')
        .update(payload)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    },
  });
}

export function useDeleteTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('templates').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    },
  });
}

export function useSaveProjectAsTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      projetoId,
      nome,
      descricao,
    }: {
      projetoId: string;
      nome: string;
      descricao: string;
    }) => {
      // 1. Fetch macro_etapas for this project
      const { data: macroEtapas, error: meError } = await supabase
        .from('macro_etapas')
        .select('*')
        .eq('projeto_id', projetoId)
        .order('ordem');
      if (meError) throw meError;

      // 2. Fetch acoes for those macro_etapas
      const macroEtapaIds = (macroEtapas ?? []).map((me) => me.id);
      const { data: acoes, error: aError } = await supabase
        .from('acoes')
        .select('*, subtarefas(*)')
        .in('macro_etapa_id', macroEtapaIds);
      if (aError) throw aError;

      // 3. Build ref_id maps: macroEtapa.id -> ref_id, acao.id -> ref_id
      const meRefMap = new Map<string, string>();
      const acaoRefMap = new Map<string, string>();

      (macroEtapas ?? []).forEach((me, i) => {
        meRefMap.set(me.id, `me_${i}`);
      });

      let acaoIdx = 0;
      (acoes ?? []).forEach((a) => {
        acaoRefMap.set(a.id, `a_${acaoIdx}`);
        acaoIdx++;
      });

      // 4. Serialize to TemplateConteudo
      const templateMacroEtapas: TemplateMacroEtapa[] = (macroEtapas ?? []).map((me) => {
        const meRefId = meRefMap.get(me.id)!;
        const meAcoes = (acoes ?? []).filter((a) => a.macro_etapa_id === me.id);

        const templateAcoes: TemplateAcao[] = meAcoes.map((a) => ({
          ref_id: acaoRefMap.get(a.id)!,
          titulo: a.titulo,
          descricao: a.descricao,
          prioridade: a.prioridade,
          tempo_estimado: a.tempo_estimado,
          dependencia_ref: a.dependencia_de ? (acaoRefMap.get(a.dependencia_de) ?? null) : null,
          subtarefas: (a.subtarefas ?? []).map((s: { titulo: string }) => ({
            titulo: s.titulo,
          })),
        }));

        return {
          ref_id: meRefId,
          nome: me.nome,
          descricao: me.descricao,
          cor: me.cor,
          ordem: me.ordem,
          acoes: templateAcoes,
        };
      });

      const conteudo: TemplateConteudo = { macro_etapas: templateMacroEtapas };

      // 5. Insert template
      const id = crypto.randomUUID();
      const { data, error } = await supabase
        .from('templates')
        .insert({
          id,
          nome,
          descricao,
          conteudo: conteudo as unknown as Record<string, unknown>,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    },
  });
}

export function useInstantiateTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      projetoId,
      template,
    }: {
      projetoId: string;
      template: TemplateConteudo;
    }) => {
      const today = new Date().toISOString().split('T')[0];
      const projetoPrefix = projetoId.substring(0, 8);

      // Maps: ref_id -> actual new UUID
      const meIdMap = new Map<string, string>();
      const acaoIdMap = new Map<string, string>();

      // Pre-generate all IDs
      for (const me of template.macro_etapas) {
        meIdMap.set(me.ref_id, `${me.ref_id}_${projetoPrefix}`);
        for (const acao of me.acoes) {
          acaoIdMap.set(acao.ref_id, `${acao.ref_id}_${projetoPrefix}`);
        }
      }

      // 1. Insert macro_etapas
      for (const me of template.macro_etapas) {
        const meId = meIdMap.get(me.ref_id)!;
        const { error } = await supabase.from('macro_etapas').insert({
          id: meId,
          nome: me.nome,
          descricao: me.descricao,
          cor: me.cor,
          cor_bg: '',
          cor_border: '',
          ordem: me.ordem,
          projeto_id: projetoId,
        });
        if (error) throw error;

        // 2. Insert acoes for this macro_etapa
        for (const acao of me.acoes) {
          const acaoId = acaoIdMap.get(acao.ref_id)!;
          const dependenciaDe = acao.dependencia_ref
            ? (acaoIdMap.get(acao.dependencia_ref) ?? null)
            : null;

          const { error: acaoError } = await supabase.from('acoes').insert({
            id: acaoId,
            titulo: acao.titulo,
            descricao: acao.descricao,
            macro_etapa_id: meId,
            prioridade: acao.prioridade,
            status: 'não iniciada',
            situacao_prazo: 'no prazo',
            tempo_estimado: acao.tempo_estimado,
            data_inicio: today,
            data_fim: today,
            dependencia_de: dependenciaDe,
            responsavel: null,
          });
          if (acaoError) throw acaoError;

          // 3. Insert subtarefas
          if (acao.subtarefas.length > 0) {
            const subtarefasPayload = acao.subtarefas.map((s) => ({
              acao_id: acaoId,
              titulo: s.titulo,
              status: 'não iniciada',
            }));

            const { error: subError } = await supabase
              .from('subtarefas')
              .insert(subtarefasPayload);
            if (subError) throw subError;
          }
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['macro_etapas'] });
      queryClient.invalidateQueries({ queryKey: ['acoes'] });
    },
  });
}
