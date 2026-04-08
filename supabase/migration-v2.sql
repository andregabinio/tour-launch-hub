-- =============================================================================
-- Tour Launch Hub — Migration V2: Multi-Projeto + Templates
-- Run this in the Supabase SQL Editor AFTER migration.sql
-- =============================================================================

-- =============================================================================
-- TABLE: projetos
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.projetos (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  nome        TEXT        NOT NULL,
  descricao   TEXT        NOT NULL DEFAULT '',
  status      TEXT        NOT NULL DEFAULT 'ativo'
                          CHECK (status IN ('ativo', 'arquivado', 'concluído')),
  cor         TEXT        NOT NULL DEFAULT '#3B82F6',
  created_by  UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.projetos ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER set_projetos_updated_at
  BEFORE UPDATE ON public.projetos
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE POLICY "projetos: authenticated select"
  ON public.projetos FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "projetos: admin insert"
  ON public.projetos FOR INSERT
  WITH CHECK (get_user_role() = 'admin');

CREATE POLICY "projetos: editor+ update"
  ON public.projetos FOR UPDATE
  USING (get_user_role() IN ('admin', 'editor'));

CREATE POLICY "projetos: admin delete"
  ON public.projetos FOR DELETE
  USING (get_user_role() = 'admin');

-- =============================================================================
-- TABLE: templates
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.templates (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  nome        TEXT        NOT NULL,
  descricao   TEXT        NOT NULL DEFAULT '',
  conteudo    JSONB       NOT NULL DEFAULT '{}',
  created_by  UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER set_templates_updated_at
  BEFORE UPDATE ON public.templates
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE POLICY "templates: authenticated select"
  ON public.templates FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "templates: admin insert"
  ON public.templates FOR INSERT
  WITH CHECK (get_user_role() = 'admin');

CREATE POLICY "templates: admin update"
  ON public.templates FOR UPDATE
  USING (get_user_role() = 'admin');

CREATE POLICY "templates: admin delete"
  ON public.templates FOR DELETE
  USING (get_user_role() = 'admin');

-- =============================================================================
-- ALTER: macro_etapas — add projeto_id
-- =============================================================================

-- Step 1: Add nullable column
ALTER TABLE public.macro_etapas
  ADD COLUMN IF NOT EXISTS projeto_id UUID REFERENCES public.projetos(id) ON DELETE CASCADE;

-- Step 2: Create default project from existing data
INSERT INTO public.projetos (id, nome, descricao, status, cor)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Tour Curitiba',
  'Roadmap de lançamento do Tour O Que Fazer Curitiba',
  'ativo',
  '#3B82F6'
)
ON CONFLICT (id) DO NOTHING;

-- Step 3: Migrate existing macro_etapas to the default project
UPDATE public.macro_etapas
SET projeto_id = '00000000-0000-0000-0000-000000000001'
WHERE projeto_id IS NULL;

-- Step 4: Make NOT NULL
ALTER TABLE public.macro_etapas
  ALTER COLUMN projeto_id SET NOT NULL;

-- =============================================================================
-- Create initial template from existing Tour Curitiba data
-- =============================================================================
INSERT INTO public.templates (nome, descricao, conteudo)
VALUES (
  'Tour Completo',
  'Modelo padrão com 6 etapas: planejamento, branding, produção, pré-lançamento, lançamento e pós-lançamento. Inclui 26 ações e 50+ subtarefas.',
  (
    SELECT jsonb_build_object(
      'macro_etapas',
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'ref_id', me.id,
            'nome', me.nome,
            'descricao', me.descricao,
            'cor', me.cor,
            'ordem', me.ordem,
            'acoes', COALESCE(
              (
                SELECT jsonb_agg(
                  jsonb_build_object(
                    'ref_id', a.id,
                    'titulo', a.titulo,
                    'descricao', a.descricao,
                    'prioridade', a.prioridade,
                    'tempo_estimado', a.tempo_estimado,
                    'dependencia_ref', a.dependencia_de,
                    'subtarefas', COALESCE(
                      (
                        SELECT jsonb_agg(
                          jsonb_build_object('titulo', s.titulo)
                        )
                        FROM public.subtarefas s
                        WHERE s.acao_id = a.id
                      ),
                      '[]'::jsonb
                    )
                  )
                  ORDER BY a.data_inicio
                )
                FROM public.acoes a
                WHERE a.macro_etapa_id = me.id
              ),
              '[]'::jsonb
            )
          )
          ORDER BY me.ordem
        )
        FROM public.macro_etapas me
        WHERE me.projeto_id = '00000000-0000-0000-0000-000000000001'
      )
    )
  )
);
