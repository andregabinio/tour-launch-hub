-- =============================================================================
-- Tour Launch Hub — Full Database Migration
-- Run this in the Supabase SQL Editor
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Helper function: get_user_role()
-- Returns the current authenticated user's role from the profiles table
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;


-- =============================================================================
-- TABLE: profiles
-- Auto-populated via trigger on auth.users INSERT
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome        TEXT        NOT NULL DEFAULT '',
  email       TEXT        NOT NULL DEFAULT '',
  role        TEXT        NOT NULL DEFAULT 'viewer'
                          CHECK (role IN ('admin', 'editor', 'viewer')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read any profile
CREATE POLICY "profiles: authenticated select"
  ON public.profiles FOR SELECT
  USING (auth.role() = 'authenticated');

-- Users can update their own profile
CREATE POLICY "profiles: own update"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Admin full CRUD
CREATE POLICY "profiles: admin insert"
  ON public.profiles FOR INSERT
  WITH CHECK (get_user_role() = 'admin');

CREATE POLICY "profiles: admin update all"
  ON public.profiles FOR UPDATE
  USING (get_user_role() = 'admin');

CREATE POLICY "profiles: admin delete"
  ON public.profiles FOR DELETE
  USING (get_user_role() = 'admin');


-- =============================================================================
-- TRIGGER: handle_updated_at()
-- Generic function to auto-update updated_at on any table
-- =============================================================================
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();


-- =============================================================================
-- TRIGGER: handle_new_user()
-- Auto-creates a profile row when a new auth.users record is inserted
-- =============================================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, nome, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nome', ''),
    'viewer'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();


-- =============================================================================
-- TABLE: macro_etapas
-- High-level phases of a launch plan
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.macro_etapas (
  id          TEXT    PRIMARY KEY,
  nome        TEXT    NOT NULL,
  descricao   TEXT,
  cor         TEXT        NOT NULL DEFAULT '',
  cor_bg      TEXT        NOT NULL DEFAULT '',
  cor_border  TEXT        NOT NULL DEFAULT '',
  ordem       INTEGER     NOT NULL DEFAULT 0
);

ALTER TABLE public.macro_etapas ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read
CREATE POLICY "macro_etapas: authenticated select"
  ON public.macro_etapas FOR SELECT
  USING (auth.role() = 'authenticated');

-- Admin CRUD
CREATE POLICY "macro_etapas: admin insert"
  ON public.macro_etapas FOR INSERT
  WITH CHECK (get_user_role() = 'admin');

CREATE POLICY "macro_etapas: admin update"
  ON public.macro_etapas FOR UPDATE
  USING (get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');

CREATE POLICY "macro_etapas: admin delete"
  ON public.macro_etapas FOR DELETE
  USING (get_user_role() = 'admin');


-- =============================================================================
-- TABLE: acoes
-- Individual action items within a macro_etapa
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.acoes (
  id              TEXT        PRIMARY KEY,
  titulo          TEXT        NOT NULL,
  descricao       TEXT        NOT NULL DEFAULT '',
  macro_etapa_id  TEXT        NOT NULL REFERENCES public.macro_etapas(id) ON DELETE RESTRICT,
  responsavel     TEXT,
  prioridade      TEXT        NOT NULL DEFAULT 'média'
                              CHECK (prioridade IN ('alta', 'média', 'baixa')),
  status          TEXT        NOT NULL DEFAULT 'não iniciada'
                              CHECK (status IN ('não iniciada', 'em andamento', 'concluída')),
  situacao_prazo  TEXT        NOT NULL DEFAULT 'no prazo'
                              CHECK (situacao_prazo IN ('no prazo', 'atrasada')),
  tempo_estimado  TEXT,
  data_inicio     DATE        NOT NULL,
  data_fim        DATE        NOT NULL,
  dependencia_de  TEXT        REFERENCES public.acoes(id) ON DELETE SET NULL,
  created_by      UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.acoes ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER set_acoes_updated_at
  BEFORE UPDATE ON public.acoes
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- All authenticated users can read
CREATE POLICY "acoes: authenticated select"
  ON public.acoes FOR SELECT
  USING (auth.role() = 'authenticated');

-- Editor and admin can create/update
CREATE POLICY "acoes: editor insert"
  ON public.acoes FOR INSERT
  WITH CHECK (get_user_role() IN ('editor', 'admin'));

CREATE POLICY "acoes: editor update"
  ON public.acoes FOR UPDATE
  USING (get_user_role() IN ('editor', 'admin'))
  WITH CHECK (get_user_role() IN ('editor', 'admin'));

-- Admin only can delete
CREATE POLICY "acoes: admin delete"
  ON public.acoes FOR DELETE
  USING (get_user_role() = 'admin');


-- =============================================================================
-- TABLE: subtarefas
-- Sub-tasks belonging to an acao
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.subtarefas (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  acao_id         TEXT        NOT NULL REFERENCES public.acoes(id) ON DELETE CASCADE,
  titulo          TEXT        NOT NULL,
  status          TEXT        NOT NULL DEFAULT 'não iniciada'
                              CHECK (status IN ('não iniciada', 'em andamento', 'concluída')),
  responsavel     TEXT,
  tempo_estimado  TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.subtarefas ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER set_subtarefas_updated_at
  BEFORE UPDATE ON public.subtarefas
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- All authenticated users can read
CREATE POLICY "subtarefas: authenticated select"
  ON public.subtarefas FOR SELECT
  USING (auth.role() = 'authenticated');

-- Editor and admin can create/update
CREATE POLICY "subtarefas: editor insert"
  ON public.subtarefas FOR INSERT
  WITH CHECK (get_user_role() IN ('editor', 'admin'));

CREATE POLICY "subtarefas: editor update"
  ON public.subtarefas FOR UPDATE
  USING (get_user_role() IN ('editor', 'admin'))
  WITH CHECK (get_user_role() IN ('editor', 'admin'));

-- Admin only can delete
CREATE POLICY "subtarefas: admin delete"
  ON public.subtarefas FOR DELETE
  USING (get_user_role() = 'admin');


-- =============================================================================
-- SEED: macro_etapas
-- =============================================================================
INSERT INTO public.macro_etapas (id, nome, descricao, cor, cor_bg, cor_border, ordem) VALUES
  ('planejamento',  'Planejamento Estratégico',  'Definição de escopo, objetivos e diretrizes',   'hsl(221, 83%, 53%)', 'bg-primary/10',     'border-primary/30',     1),
  ('branding',      'Branding e Comunicação',    'Identidade visual, posicionamento e narrativa', 'hsl(262, 83%, 58%)', 'bg-blocked/10',     'border-blocked/30',     2),
  ('producao',      'Produção de Materiais',     'Criação de assets, vídeos e peças',             'hsl(38, 92%, 50%)',  'bg-warning/10',     'border-warning/30',     3),
  ('pre-lancamento','Pré-lançamento',            'Aquecimento, teasers e engajamento',            'hsl(142, 76%, 36%)', 'bg-success/10',     'border-success/30',     4),
  ('lancamento',    'Lançamento',                'Go-live, vendas e cobertura',                   'hsl(0, 84%, 60%)',   'bg-destructive/10', 'border-destructive/30', 5),
  ('pos-lancamento','Pós-lançamento',            'Análise, feedback e otimização',                'hsl(220, 9%, 46%)',  'bg-muted',          'border-border',         6)
ON CONFLICT (id) DO NOTHING;
