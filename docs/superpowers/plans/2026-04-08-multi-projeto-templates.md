# Multi-Projeto + CRUD Macro Etapas + Templates — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the single-roadmap app into a multi-project platform with reusable templates and full CRUD on macro etapas.

**Architecture:** New `projetos` and `templates` tables in Supabase, `macro_etapas` gets `projeto_id` FK. Dashboard page as new home, current roadmap view scoped per project via URL param. Templates stored as JSONB snapshots.

**Tech Stack:** React 18 + TypeScript + Vite, Supabase (cloud), React Query, React Router DOM, shadcn/ui, Tailwind CSS

---

## File Map

### New Files
| File | Responsibility |
|------|----------------|
| `supabase/migration-v2.sql` | DDL for projetos, templates, alter macro_etapas, RLS, data migration |
| `src/types/projeto.ts` | TypeScript types for Projeto, Template, TemplateConteudo |
| `src/hooks/useProjetos.ts` | CRUD hooks for projetos table |
| `src/hooks/useTemplates.ts` | CRUD + instantiate hooks for templates table |
| `src/pages/Dashboard.tsx` | Project list + templates section (new home) |
| `src/pages/ProjetoPage.tsx` | Roadmap view scoped to a project (wraps current Index logic) |
| `src/components/dashboard/ProjetoCard.tsx` | Card component for project grid |
| `src/components/dashboard/ProjetoCreateDialog.tsx` | Create project dialog (with template selection) |
| `src/components/dashboard/TemplateSection.tsx` | Template management section in dashboard |
| `src/components/roadmap/MacroEtapaManager.tsx` | CRUD dialog for macro etapas within a project |
| `src/components/roadmap/SaveAsTemplateDialog.tsx` | Save project as template dialog |

### Modified Files
| File | Changes |
|------|---------|
| `src/integrations/supabase/types.ts` | Add projetos, templates table types; add projeto_id to macro_etapas |
| `src/types/roadmap.ts` | Add projeto_id to MacroEtapa type |
| `src/hooks/useMacroEtapas.ts` | Filter by projetoId, add create/update/delete/reorder mutations |
| `src/hooks/useAcoes.ts` | Filter by projetoId (via macro_etapa join) |
| `src/hooks/useSubtarefas.ts` | Invalidate with projetoId-scoped query keys |
| `src/components/roadmap/TopBar.tsx` | Add back button, project name, admin menu with gear dropdown |
| `src/App.tsx` | Add routes for `/`, `/projeto/:id` |
| `src/components/ProtectedRoute.tsx` | No changes needed (wraps any child) |

---

## Task 1: Database Migration SQL

**Files:**
- Create: `supabase/migration-v2.sql`

- [ ] **Step 1: Write the migration SQL**

```sql
-- supabase/migration-v2.sql
-- Run in Supabase SQL Editor AFTER the original migration.sql

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

CREATE POLICY "projetos: admin update"
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
);

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
```

- [ ] **Step 2: Run migration in Supabase SQL Editor**

Go to https://supabase.com/dashboard → project gkwctcpynyxfyhivjitk → SQL Editor → paste and run.

- [ ] **Step 3: Verify migration**

Run in SQL Editor:
```sql
SELECT count(*) FROM projetos; -- should be 1
SELECT count(*) FROM templates; -- should be 1
SELECT projeto_id FROM macro_etapas LIMIT 1; -- should be '00000000-...-000001'
```

- [ ] **Step 4: Commit**

```bash
git add supabase/migration-v2.sql
git commit -m "feat: migration SQL for projetos, templates, macro_etapas.projeto_id"
```

---

## Task 2: Update Supabase Types + App Types

**Files:**
- Modify: `src/integrations/supabase/types.ts`
- Modify: `src/types/roadmap.ts`
- Create: `src/types/projeto.ts`

- [ ] **Step 1: Add projetos and templates to Supabase types**

In `src/integrations/supabase/types.ts`, inside `public.Tables`, add after the `profiles` block:

```typescript
      projetos: {
        Row: {
          id: string
          nome: string
          descricao: string
          status: string
          cor: string
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nome: string
          descricao?: string
          status?: string
          cor?: string
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nome?: string
          descricao?: string
          status?: string
          cor?: string
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projetos_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      templates: {
        Row: {
          id: string
          nome: string
          descricao: string
          conteudo: Json
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nome: string
          descricao?: string
          conteudo?: Json
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nome?: string
          descricao?: string
          conteudo?: Json
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
```

Also add `projeto_id: string` to `macro_etapas.Row`, `projeto_id?: string` to Insert, `projeto_id?: string` to Update, and add the relationship:
```typescript
        Relationships: [
          {
            foreignKeyName: "macro_etapas_projeto_id_fkey"
            columns: ["projeto_id"]
            isOneToOne: false
            referencedRelation: "projetos"
            referencedColumns: ["id"]
          },
        ]
```

- [ ] **Step 2: Create projeto types**

Create `src/types/projeto.ts`:

```typescript
export interface Projeto {
  id: string;
  nome: string;
  descricao: string;
  status: 'ativo' | 'arquivado' | 'concluído';
  cor: string;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TemplateSubtarefa {
  titulo: string;
}

export interface TemplateAcao {
  ref_id: string;
  titulo: string;
  descricao: string;
  prioridade: string;
  tempo_estimado: string | null;
  dependencia_ref: string | null;
  subtarefas: TemplateSubtarefa[];
}

export interface TemplateMacroEtapa {
  ref_id: string;
  nome: string;
  descricao: string | null;
  cor: string;
  ordem: number;
  acoes: TemplateAcao[];
}

export interface TemplateConteudo {
  macro_etapas: TemplateMacroEtapa[];
}

export interface Template {
  id: string;
  nome: string;
  descricao: string;
  conteudo: TemplateConteudo;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}
```

- [ ] **Step 3: Update MacroEtapa type to include projetoId**

In `src/types/roadmap.ts`, add `projetoId` to `MacroEtapa`:

```typescript
export interface MacroEtapa {
  id: string;
  titulo: string;
  descricao?: string;
  cor: string;
  corBg: string;
  corBorder: string;
  projetoId: string;
}
```

- [ ] **Step 4: Commit**

```bash
git add src/integrations/supabase/types.ts src/types/projeto.ts src/types/roadmap.ts
git commit -m "feat: types for projetos, templates, and macro_etapas.projeto_id"
```

---

## Task 3: Data Hooks — Projetos + Templates

**Files:**
- Create: `src/hooks/useProjetos.ts`
- Create: `src/hooks/useTemplates.ts`

- [ ] **Step 1: Create useProjetos hook**

Create `src/hooks/useProjetos.ts`:

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { type Projeto } from '@/types/projeto';

function rowToProjeto(row: any): Projeto {
  return {
    id: row.id,
    nome: row.nome,
    descricao: row.descricao,
    status: row.status,
    cor: row.cor,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function useProjetos(statusFilter?: string) {
  return useQuery({
    queryKey: ['projetos', statusFilter],
    queryFn: async (): Promise<Projeto[]> => {
      let query = supabase.from('projetos').select('*').order('created_at', { ascending: false });
      if (statusFilter && statusFilter !== 'todos') {
        query = query.eq('status', statusFilter);
      }
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []).map(rowToProjeto);
    },
  });
}

export function useProjeto(id: string | undefined) {
  return useQuery({
    queryKey: ['projetos', id],
    queryFn: async (): Promise<Projeto> => {
      const { data, error } = await supabase
        .from('projetos')
        .select('*')
        .eq('id', id!)
        .single();
      if (error) throw error;
      return rowToProjeto(data);
    },
    enabled: !!id,
  });
}

export function useCreateProjeto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (projeto: { nome: string; descricao?: string; cor?: string }) => {
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
```

- [ ] **Step 2: Create useTemplates hook**

Create `src/hooks/useTemplates.ts`:

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { type Template, type TemplateConteudo } from '@/types/projeto';

function rowToTemplate(row: any): Template {
  return {
    id: row.id,
    nome: row.nome,
    descricao: row.descricao,
    conteudo: row.conteudo as TemplateConteudo,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function useTemplates() {
  return useQuery({
    queryKey: ['templates'],
    queryFn: async (): Promise<Template[]> => {
      const { data, error } = await supabase.from('templates').select('*').order('nome');
      if (error) throw error;
      return (data ?? []).map(rowToTemplate);
    },
  });
}

export function useCreateTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (template: { nome: string; descricao?: string; conteudo: TemplateConteudo }) => {
      const { data, error } = await supabase.from('templates').insert(template as any).select().single();
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
      const { data, error } = await supabase.from('templates').update(updates as any).eq('id', id).select().single();
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
    mutationFn: async ({ projetoId, nome, descricao }: { projetoId: string; nome: string; descricao?: string }) => {
      // Fetch all macro_etapas for this project
      const { data: etapas, error: etapasError } = await supabase
        .from('macro_etapas')
        .select('*')
        .eq('projeto_id', projetoId)
        .order('ordem');
      if (etapasError) throw etapasError;

      // Fetch all acoes for these etapas
      const etapaIds = (etapas ?? []).map(e => e.id);
      const { data: acoes, error: acoesError } = await supabase
        .from('acoes')
        .select('*, subtarefas(*)')
        .in('macro_etapa_id', etapaIds)
        .order('data_inicio');
      if (acoesError) throw acoesError;

      // Build template content
      const conteudo: TemplateConteudo = {
        macro_etapas: (etapas ?? []).map(me => ({
          ref_id: me.id,
          nome: me.nome,
          descricao: me.descricao,
          cor: me.cor,
          ordem: me.ordem,
          acoes: (acoes ?? [])
            .filter(a => a.macro_etapa_id === me.id)
            .map(a => ({
              ref_id: a.id,
              titulo: a.titulo,
              descricao: a.descricao,
              prioridade: a.prioridade,
              tempo_estimado: a.tempo_estimado,
              dependencia_ref: a.dependencia_de,
              subtarefas: (a.subtarefas ?? []).map((s: any) => ({ titulo: s.titulo })),
            })),
        })),
      };

      const { data, error } = await supabase
        .from('templates')
        .insert({ nome, descricao: descricao || '', conteudo: conteudo as any })
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
    mutationFn: async ({ projetoId, template }: { projetoId: string; template: TemplateConteudo }) => {
      const today = new Date().toISOString().split('T')[0];
      const idMap = new Map<string, string>(); // ref_id → new actual id

      for (const etapa of template.macro_etapas) {
        const newEtapaId = `${etapa.ref_id}-${projetoId.slice(0, 8)}`;
        idMap.set(etapa.ref_id, newEtapaId);

        const { error: etapaError } = await supabase.from('macro_etapas').insert({
          id: newEtapaId,
          nome: etapa.nome,
          descricao: etapa.descricao,
          cor: etapa.cor,
          cor_bg: '',
          cor_border: '',
          ordem: etapa.ordem,
          projeto_id: projetoId,
        });
        if (etapaError) throw etapaError;

        for (const acao of etapa.acoes) {
          const newAcaoId = `${acao.ref_id}-${projetoId.slice(0, 8)}`;
          idMap.set(acao.ref_id, newAcaoId);

          const depId = acao.dependencia_ref ? (idMap.get(acao.dependencia_ref) || null) : null;

          const { error: acaoError } = await supabase.from('acoes').insert({
            id: newAcaoId,
            titulo: acao.titulo,
            descricao: acao.descricao,
            macro_etapa_id: newEtapaId,
            responsavel: '',
            prioridade: acao.prioridade,
            status: 'não iniciada',
            situacao_prazo: 'no prazo',
            tempo_estimado: acao.tempo_estimado,
            data_inicio: today,
            data_fim: today,
            dependencia_de: depId,
          });
          if (acaoError) throw acaoError;

          if (acao.subtarefas.length > 0) {
            const { error: subError } = await supabase.from('subtarefas').insert(
              acao.subtarefas.map(s => ({
                acao_id: newAcaoId,
                titulo: s.titulo,
                status: 'não iniciada',
              }))
            );
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
```

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useProjetos.ts src/hooks/useTemplates.ts
git commit -m "feat: hooks for projetos CRUD, templates CRUD, save-as-template, instantiate"
```

---

## Task 4: Update Existing Hooks — Scope by projeto_id

**Files:**
- Modify: `src/hooks/useMacroEtapas.ts`
- Modify: `src/hooks/useAcoes.ts`

- [ ] **Step 1: Rewrite useMacroEtapas with projetoId + CRUD**

Replace `src/hooks/useMacroEtapas.ts` entirely:

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { type MacroEtapa } from '@/types/roadmap';

export function useMacroEtapas(projetoId?: string) {
  return useQuery({
    queryKey: ['macro_etapas', projetoId],
    queryFn: async (): Promise<MacroEtapa[]> => {
      let query = supabase.from('macro_etapas').select('*').order('ordem');
      if (projetoId) {
        query = query.eq('projeto_id', projetoId);
      }
      const { data, error } = await query;
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
    mutationFn: async (etapa: {
      id: string;
      nome: string;
      descricao?: string;
      cor: string;
      ordem: number;
      projeto_id: string;
    }) => {
      const { data, error } = await supabase.from('macro_etapas').insert({
        ...etapa,
        cor_bg: '',
        cor_border: '',
      }).select().single();
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
    mutationFn: async ({ id, projetoId, ...updates }: {
      id: string;
      projetoId: string;
      nome?: string;
      descricao?: string;
      cor?: string;
      ordem?: number;
    }) => {
      const { data, error } = await supabase.from('macro_etapas').update(updates).eq('id', id).select().single();
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
      queryClient.invalidateQueries({ queryKey: ['acoes', variables.projetoId] });
    },
  });
}

export function useReorderMacroEtapas() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ etapas, projetoId }: { etapas: { id: string; ordem: number }[]; projetoId: string }) => {
      for (const etapa of etapas) {
        const { error } = await supabase.from('macro_etapas').update({ ordem: etapa.ordem }).eq('id', etapa.id);
        if (error) throw error;
      }
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['macro_etapas', variables.projetoId] });
    },
  });
}
```

- [ ] **Step 2: Update useAcoes to filter by projetoId**

In `src/hooks/useAcoes.ts`, change `useAcoes()` to accept `projetoId`:

```typescript
export function useAcoes(projetoId?: string) {
  return useQuery({
    queryKey: ['acoes', projetoId],
    queryFn: async (): Promise<Acao[]> => {
      let query = supabase
        .from('acoes')
        .select('*, macro_etapas(nome, projeto_id), subtarefas(*)')
        .order('data_inicio');

      const { data, error } = await query;
      if (error) throw error;

      let rows = data ?? [];
      if (projetoId) {
        rows = rows.filter((row: any) => row.macro_etapas?.projeto_id === projetoId);
      }

      return rows.map(rowToAcao);
    },
    enabled: !!projetoId,
  });
}
```

Also update query keys in all mutations (`useCreateAcao`, `useUpdateAcao`, `useDeleteAcao`) to invalidate `['acoes']` broadly (they already do this — no change needed).

Update `useSubtarefas.ts` invalidation to also invalidate broadly (already does `['acoes']` — no change needed).

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useMacroEtapas.ts src/hooks/useAcoes.ts
git commit -m "feat: scope useMacroEtapas and useAcoes by projetoId, add macro etapa CRUD hooks"
```

---

## Task 5: Dashboard Page + Components

**Files:**
- Create: `src/pages/Dashboard.tsx`
- Create: `src/components/dashboard/ProjetoCard.tsx`
- Create: `src/components/dashboard/ProjetoCreateDialog.tsx`
- Create: `src/components/dashboard/TemplateSection.tsx`

- [ ] **Step 1: Create ProjetoCard**

Create `src/components/dashboard/ProjetoCard.tsx`:

```tsx
import { type Projeto } from '@/types/projeto';
import { useAcoes } from '@/hooks/useAcoes';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';

interface ProjetoCardProps {
  projeto: Projeto;
}

const statusConfig = {
  ativo: { label: 'Ativo', className: 'border-success/30 bg-success/10 text-success' },
  arquivado: { label: 'Arquivado', className: 'border-muted-foreground/30 bg-muted text-muted-foreground' },
  concluído: { label: 'Concluído', className: 'border-primary/30 bg-primary/10 text-primary' },
};

const ProjetoCard = ({ projeto }: ProjetoCardProps) => {
  const navigate = useNavigate();
  const { data: acoes = [] } = useAcoes(projeto.id);

  const total = acoes.length;
  const concluidas = acoes.filter(a => a.status === 'concluída').length;
  const progressPercent = total > 0 ? Math.round((concluidas / total) * 100) : 0;
  const config = statusConfig[projeto.status];

  return (
    <button
      type="button"
      onClick={() => navigate(`/projeto/${projeto.id}`)}
      className="glass-card rounded-xl p-5 text-left w-full transition-all hover:shadow-md hover:scale-[1.01] active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      style={{ borderLeft: `4px solid ${projeto.cor}` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-foreground truncate">{projeto.nome}</h3>
          {projeto.descricao && (
            <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{projeto.descricao}</p>
          )}
        </div>
        <Badge className={config.className}>{config.label}</Badge>
      </div>

      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{concluidas}/{total} ações concluídas</span>
          <span className="font-semibold text-foreground">{progressPercent}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <p className="mt-3 text-[10px] text-muted-foreground">
        Criado em {new Date(projeto.createdAt).toLocaleDateString('pt-BR')}
      </p>
    </button>
  );
};

export default ProjetoCard;
```

- [ ] **Step 2: Create ProjetoCreateDialog**

Create `src/components/dashboard/ProjetoCreateDialog.tsx`:

```tsx
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useCreateProjeto } from '@/hooks/useProjetos';
import { useTemplates, useInstantiateTemplate } from '@/hooks/useTemplates';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const CORES = ['#3B82F6', '#16A34A', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316'];

interface ProjetoCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ProjetoCreateDialog = ({ open, onOpenChange }: ProjetoCreateDialogProps) => {
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [cor, setCor] = useState(CORES[0]);
  const [origem, setOrigem] = useState<'zero' | 'template'>('zero');
  const [templateId, setTemplateId] = useState('');
  const navigate = useNavigate();

  const createProjeto = useCreateProjeto();
  const { data: templates = [] } = useTemplates();
  const instantiate = useInstantiateTemplate();

  const handleSubmit = async () => {
    if (!nome.trim()) {
      toast.error('Nome do projeto é obrigatório');
      return;
    }
    if (origem === 'template' && !templateId) {
      toast.error('Selecione um modelo');
      return;
    }

    try {
      const result = await createProjeto.mutateAsync({ nome: nome.trim(), descricao: descricao.trim(), cor });

      if (origem === 'template') {
        const tmpl = templates.find(t => t.id === templateId);
        if (tmpl) {
          await instantiate.mutateAsync({ projetoId: result.id, template: tmpl.conteudo });
        }
      }

      toast.success('Projeto criado!');
      onOpenChange(false);
      setNome('');
      setDescricao('');
      setCor(CORES[0]);
      setOrigem('zero');
      setTemplateId('');
      navigate(`/projeto/${result.id}`);
    } catch (e: any) {
      toast.error(e.message || 'Erro ao criar projeto');
    }
  };

  const isPending = createProjeto.isPending || instantiate.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Novo Projeto</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Nome *</Label>
            <Input value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: Tour Salvador" />
          </div>
          <div className="space-y-1.5">
            <Label>Descrição</Label>
            <Textarea value={descricao} onChange={e => setDescricao(e.target.value)} rows={2} placeholder="Descrição do projeto" />
          </div>
          <div className="space-y-1.5">
            <Label>Cor</Label>
            <div className="flex gap-2 flex-wrap">
              {CORES.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCor(c)}
                  className={`h-8 w-8 rounded-full border-2 transition-all ${cor === c ? 'border-foreground scale-110' : 'border-transparent'}`}
                  style={{ backgroundColor: c }}
                  aria-label={`Cor ${c}`}
                />
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Ponto de partida</Label>
            <RadioGroup value={origem} onValueChange={(v) => setOrigem(v as 'zero' | 'template')}>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="zero" id="zero" />
                <Label htmlFor="zero" className="font-normal cursor-pointer">Começar do zero</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="template" id="template" />
                <Label htmlFor="template" className="font-normal cursor-pointer">Usar modelo</Label>
              </div>
            </RadioGroup>
            {origem === 'template' && (
              <Select value={templateId} onValueChange={setTemplateId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um modelo" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map(t => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.nome} — {t.conteudo.macro_etapas?.length || 0} etapas
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? 'Criando...' : 'Criar Projeto'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProjetoCreateDialog;
```

- [ ] **Step 3: Create TemplateSection**

Create `src/components/dashboard/TemplateSection.tsx`:

```tsx
import { useState } from 'react';
import { ChevronDown, ChevronUp, Trash2, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTemplates, useDeleteTemplate } from '@/hooks/useTemplates';
import { useAuthContext } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const TemplateSection = () => {
  const [expanded, setExpanded] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { role } = useAuthContext();
  const { data: templates = [] } = useTemplates();
  const deleteTemplate = useDeleteTemplate();

  if (role !== 'admin' || templates.length === 0) return null;

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await deleteTemplate.mutateAsync(deletingId);
      toast.success('Modelo excluído');
      setDeletingId(null);
    } catch (e: any) {
      toast.error(e.message || 'Erro ao excluir modelo');
    }
  };

  return (
    <div className="glass-card rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold text-foreground">Modelos ({templates.length})</span>
        </div>
        {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>
      {expanded && (
        <div className="border-t border-border px-4 py-3 space-y-2">
          {templates.map(tmpl => (
            <div key={tmpl.id} className="flex items-center justify-between py-2 px-2 rounded-lg hover:bg-muted/30">
              <div>
                <p className="text-sm font-medium text-foreground">{tmpl.nome}</p>
                <p className="text-xs text-muted-foreground">
                  {tmpl.conteudo.macro_etapas?.length || 0} etapas, {' '}
                  {tmpl.conteudo.macro_etapas?.reduce((sum, e) => sum + (e.acoes?.length || 0), 0) || 0} ações
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive hover:text-destructive/80"
                onClick={() => setDeletingId(tmpl.id)}
                aria-label={`Excluir modelo ${tmpl.nome}`}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir modelo?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Projetos já criados a partir deste modelo não serão afetados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TemplateSection;
```

- [ ] **Step 4: Create Dashboard page**

Create `src/pages/Dashboard.tsx`:

```tsx
import { useState } from 'react';
import { Rocket, Plus, User, LogOut, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useProjetos } from '@/hooks/useProjetos';
import { useAuthContext } from '@/contexts/AuthContext';
import { useAuth } from '@/hooks/useAuth';
import ProjetoCard from '@/components/dashboard/ProjetoCard';
import ProjetoCreateDialog from '@/components/dashboard/ProjetoCreateDialog';
import TemplateSection from '@/components/dashboard/TemplateSection';
import UserManagement from '@/components/admin/UserManagement';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

const statusTabs = [
  { value: 'ativo', label: 'Ativos' },
  { value: 'todos', label: 'Todos' },
  { value: 'arquivado', label: 'Arquivados' },
  { value: 'concluído', label: 'Concluídos' },
];

const Dashboard = () => {
  const [statusFilter, setStatusFilter] = useState('ativo');
  const [showCreate, setShowCreate] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const { data: projetos = [], isLoading } = useProjetos(statusFilter);
  const { profile, role } = useAuthContext();
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch {
      toast.error('Erro ao sair');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <Rocket className="h-5 w-5 text-primary-foreground" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-foreground">Tour Launch Hub</h1>
              <p className="text-sm text-muted-foreground">Seus projetos de lançamento</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {role === 'admin' && (
              <Button size="sm" onClick={() => setShowCreate(true)} className="gap-2">
                <Plus className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline">Novo Projeto</span>
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <User className="h-4 w-4" aria-hidden="true" />
                  <span className="hidden sm:inline">{profile?.nome || 'Usuário'}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <div className="px-2 py-1.5 text-sm text-muted-foreground">
                  {profile?.email}
                  <span className="ml-2 rounded bg-muted px-1.5 py-0.5 text-xs font-medium">{role}</span>
                </div>
                <DropdownMenuSeparator />
                {role === 'admin' && (
                  <>
                    <DropdownMenuItem onClick={() => setShowAdmin(true)} className="gap-2">
                      <Users className="h-4 w-4" /> Gerenciar Usuários
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem onClick={handleLogout} className="gap-2 text-destructive">
                  <LogOut className="h-4 w-4" /> Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1200px] px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        {/* Status tabs */}
        <div className="flex items-center gap-1 rounded-lg border border-border bg-muted p-1 w-fit">
          {statusTabs.map(tab => (
            <Button
              key={tab.value}
              variant={statusFilter === tab.value ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setStatusFilter(tab.value)}
            >
              {tab.label}
            </Button>
          ))}
        </div>

        {/* Projects grid */}
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-40 rounded-xl" />
            ))}
          </div>
        ) : projetos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <p className="text-lg font-medium">
              {statusFilter === 'ativo' ? 'Nenhum projeto ativo' : 'Nenhum projeto encontrado'}
            </p>
            <p className="text-sm mt-1">
              {role === 'admin' ? 'Crie um novo projeto para começar' : 'Peça ao administrador para criar um projeto'}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projetos.map(projeto => (
              <ProjetoCard key={projeto.id} projeto={projeto} />
            ))}
          </div>
        )}

        {/* Templates section */}
        <TemplateSection />
      </main>

      <ProjetoCreateDialog open={showCreate} onOpenChange={setShowCreate} />
      <UserManagement open={showAdmin} onOpenChange={setShowAdmin} />
    </div>
  );
};

export default Dashboard;
```

- [ ] **Step 5: Commit**

```bash
git add src/pages/Dashboard.tsx src/components/dashboard/ProjetoCard.tsx src/components/dashboard/ProjetoCreateDialog.tsx src/components/dashboard/TemplateSection.tsx
git commit -m "feat: dashboard page with project cards, create dialog, and template section"
```

---

## Task 6: ProjetoPage + Updated TopBar + MacroEtapaManager + SaveAsTemplate

**Files:**
- Create: `src/pages/ProjetoPage.tsx`
- Modify: `src/components/roadmap/TopBar.tsx`
- Create: `src/components/roadmap/MacroEtapaManager.tsx`
- Create: `src/components/roadmap/SaveAsTemplateDialog.tsx`

- [ ] **Step 1: Create MacroEtapaManager dialog**

Create `src/components/roadmap/MacroEtapaManager.tsx`:

```tsx
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ChevronUp, ChevronDown, Plus, Pencil, Trash2, X, Check } from 'lucide-react';
import { useMacroEtapas, useCreateMacroEtapa, useUpdateMacroEtapa, useDeleteMacroEtapa, useReorderMacroEtapas } from '@/hooks/useMacroEtapas';
import { useAcoes } from '@/hooks/useAcoes';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const CORES = ['hsl(221, 83%, 53%)', 'hsl(262, 83%, 58%)', 'hsl(38, 92%, 50%)', 'hsl(142, 76%, 36%)', 'hsl(0, 84%, 60%)', 'hsl(220, 9%, 46%)', 'hsl(330, 80%, 55%)', 'hsl(190, 80%, 45%)'];

interface MacroEtapaManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projetoId: string;
}

const MacroEtapaManager = ({ open, onOpenChange, projetoId }: MacroEtapaManagerProps) => {
  const { data: etapas = [] } = useMacroEtapas(projetoId);
  const { data: acoes = [] } = useAcoes(projetoId);
  const createEtapa = useCreateMacroEtapa();
  const updateEtapa = useUpdateMacroEtapa();
  const deleteEtapa = useDeleteMacroEtapa();
  const reorder = useReorderMacroEtapas();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ nome: '', descricao: '', cor: CORES[0] });
  const [isAdding, setIsAdding] = useState(false);
  const [newForm, setNewForm] = useState({ nome: '', descricao: '', cor: CORES[0] });
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const startEdit = (etapa: typeof etapas[0]) => {
    setEditingId(etapa.id);
    setEditForm({ nome: etapa.titulo, descricao: etapa.descricao || '', cor: etapa.cor });
  };

  const saveEdit = async () => {
    if (!editingId || !editForm.nome.trim()) return;
    try {
      await updateEtapa.mutateAsync({ id: editingId, projetoId, nome: editForm.nome.trim(), descricao: editForm.descricao.trim(), cor: editForm.cor });
      setEditingId(null);
    } catch (e: any) {
      toast.error(e.message || 'Erro ao atualizar');
    }
  };

  const handleCreate = async () => {
    if (!newForm.nome.trim()) return;
    const maxOrdem = etapas.reduce((max, e) => Math.max(max, e.id ? etapas.indexOf(e) : 0), 0);
    const id = newForm.nome.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '');
    try {
      await createEtapa.mutateAsync({
        id: `${id}-${Date.now()}`,
        nome: newForm.nome.trim(),
        descricao: newForm.descricao.trim(),
        cor: newForm.cor,
        ordem: (etapas.length + 1) * 10,
        projeto_id: projetoId,
      });
      setNewForm({ nome: '', descricao: '', cor: CORES[0] });
      setIsAdding(false);
    } catch (e: any) {
      toast.error(e.message || 'Erro ao criar');
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await deleteEtapa.mutateAsync({ id: deletingId, projetoId });
      setDeletingId(null);
      toast.success('Etapa excluída');
    } catch (e: any) {
      toast.error(e.message || 'Erro ao excluir');
    }
  };

  const moveEtapa = async (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= etapas.length) return;
    const newOrder = etapas.map((e, i) => ({
      id: e.id,
      ordem: i === index ? (newIndex + 1) * 10 : i === newIndex ? (index + 1) * 10 : (i + 1) * 10,
    }));
    try {
      await reorder.mutateAsync({ etapas: newOrder, projetoId });
    } catch (e: any) {
      toast.error(e.message || 'Erro ao reordenar');
    }
  };

  const deletingEtapa = etapas.find(e => e.id === deletingId);
  const deletingAcoesCount = deletingId ? acoes.filter(a => a.macroEtapa === deletingEtapa?.titulo).length : 0;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Gerenciar Macro Etapas</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            {etapas.map((etapa, index) => (
              <div key={etapa.id} className="flex items-start gap-2 p-3 rounded-lg border border-border bg-card">
                {editingId === etapa.id ? (
                  <div className="flex-1 space-y-2">
                    <Input value={editForm.nome} onChange={e => setEditForm(f => ({ ...f, nome: e.target.value }))} placeholder="Nome da etapa" />
                    <Textarea value={editForm.descricao} onChange={e => setEditForm(f => ({ ...f, descricao: e.target.value }))} rows={2} placeholder="Descrição" />
                    <div className="flex gap-1.5 flex-wrap">
                      {CORES.map(c => (
                        <button key={c} type="button" onClick={() => setEditForm(f => ({ ...f, cor: c }))}
                          className={`h-6 w-6 rounded-full border-2 ${editForm.cor === c ? 'border-foreground' : 'border-transparent'}`}
                          style={{ backgroundColor: c }} />
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={saveEdit} className="gap-1"><Check className="h-3.5 w-3.5" /> Salvar</Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}><X className="h-3.5 w-3.5" /></Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col gap-0.5">
                      <button type="button" onClick={() => moveEtapa(index, -1)} disabled={index === 0}
                        className="text-muted-foreground hover:text-foreground disabled:opacity-30 p-0.5">
                        <ChevronUp className="h-3.5 w-3.5" />
                      </button>
                      <button type="button" onClick={() => moveEtapa(index, 1)} disabled={index === etapas.length - 1}
                        className="text-muted-foreground hover:text-foreground disabled:opacity-30 p-0.5">
                        <ChevronDown className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="w-3 h-3 rounded-full shrink-0 mt-1" style={{ backgroundColor: etapa.cor }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{etapa.titulo}</p>
                      {etapa.descricao && <p className="text-xs text-muted-foreground">{etapa.descricao}</p>}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => startEdit(etapa)} aria-label="Editar etapa">
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeletingId(etapa.id)} aria-label="Excluir etapa">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ))}

            {isAdding ? (
              <div className="p-3 rounded-lg border border-dashed border-border space-y-2">
                <Input value={newForm.nome} onChange={e => setNewForm(f => ({ ...f, nome: e.target.value }))} placeholder="Nome da nova etapa" autoFocus />
                <Textarea value={newForm.descricao} onChange={e => setNewForm(f => ({ ...f, descricao: e.target.value }))} rows={2} placeholder="Descrição" />
                <div className="flex gap-1.5 flex-wrap">
                  {CORES.map(c => (
                    <button key={c} type="button" onClick={() => setNewForm(f => ({ ...f, cor: c }))}
                      className={`h-6 w-6 rounded-full border-2 ${newForm.cor === c ? 'border-foreground' : 'border-transparent'}`}
                      style={{ backgroundColor: c }} />
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleCreate} disabled={createEtapa.isPending} className="gap-1">
                    <Plus className="h-3.5 w-3.5" /> Criar
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setIsAdding(false)}>Cancelar</Button>
                </div>
              </div>
            ) : (
              <Button variant="outline" className="w-full gap-2" onClick={() => setIsAdding(true)}>
                <Plus className="h-4 w-4" /> Nova Etapa
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir etapa "{deletingEtapa?.titulo}"?</AlertDialogTitle>
            <AlertDialogDescription>
              {deletingAcoesCount > 0
                ? `Esta etapa tem ${deletingAcoesCount} ação(ões) vinculada(s). Todas serão excluídas permanentemente.`
                : 'Esta ação não pode ser desfeita.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default MacroEtapaManager;
```

- [ ] **Step 2: Create SaveAsTemplateDialog**

Create `src/components/roadmap/SaveAsTemplateDialog.tsx`:

```tsx
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useSaveProjectAsTemplate } from '@/hooks/useTemplates';
import { toast } from 'sonner';

interface SaveAsTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projetoId: string;
  projetoNome: string;
}

const SaveAsTemplateDialog = ({ open, onOpenChange, projetoId, projetoNome }: SaveAsTemplateDialogProps) => {
  const [nome, setNome] = useState(`${projetoNome} — Modelo`);
  const [descricao, setDescricao] = useState('');
  const saveAsTemplate = useSaveProjectAsTemplate();

  const handleSubmit = async () => {
    if (!nome.trim()) {
      toast.error('Nome do modelo é obrigatório');
      return;
    }
    try {
      await saveAsTemplate.mutateAsync({ projetoId, nome: nome.trim(), descricao: descricao.trim() });
      toast.success('Modelo salvo!');
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message || 'Erro ao salvar modelo');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Salvar como Modelo</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Nome do modelo *</Label>
            <Input value={nome} onChange={e => setNome(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Descrição</Label>
            <Textarea value={descricao} onChange={e => setDescricao(e.target.value)} rows={2} placeholder="O que este modelo inclui" />
          </div>
          <p className="text-xs text-muted-foreground">
            O modelo vai copiar todas as etapas, ações e subtarefas. Status, datas e responsáveis não são incluídos.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={saveAsTemplate.isPending}>
            {saveAsTemplate.isPending ? 'Salvando...' : 'Salvar Modelo'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SaveAsTemplateDialog;
```

- [ ] **Step 3: Update TopBar for project context**

Replace `src/components/roadmap/TopBar.tsx` — add back button, project name, admin gear menu:

The TopBar now receives `projetoId`, `projetoNome`, and callbacks for admin actions. The view toggle and user menu remain. Add a gear dropdown for admin with: Gerenciar Macro Etapas, Salvar como Modelo, Editar Projeto, Arquivar Projeto.

Key changes to the TopBar interface:
```typescript
export type ViewMode = 'timeline' | 'cards' | 'tabela';

interface TopBarProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onOpenAdmin?: () => void;
  onCreateAcao?: () => void;
  projetoNome?: string;
  onManageEtapas?: () => void;
  onSaveAsTemplate?: () => void;
  onEditProjeto?: () => void;
  onArchiveProjeto?: () => void;
}
```

Add `ArrowLeft`, `Settings` imports. Add back button linking to `/`. Add gear dropdown with admin actions.

- [ ] **Step 4: Create ProjetoPage**

Create `src/pages/ProjetoPage.tsx` — this is essentially the current `Index.tsx` but scoped to a project via URL param:

```tsx
// Uses useParams() to get projetoId
// Uses useProjeto(projetoId) for project info
// Passes projetoId to useMacroEtapas(projetoId) and useAcoes(projetoId)
// Renders TopBar with project name and admin menu
// Renders MacroEtapaManager, SaveAsTemplateDialog
// Same SummaryCards, Filters, Views as current Index.tsx
```

All the same logic from current `Index.tsx`, but with `projetoId` flowing through.

- [ ] **Step 5: Commit**

```bash
git add src/pages/ProjetoPage.tsx src/components/roadmap/TopBar.tsx src/components/roadmap/MacroEtapaManager.tsx src/components/roadmap/SaveAsTemplateDialog.tsx
git commit -m "feat: ProjetoPage, MacroEtapaManager CRUD, SaveAsTemplate, updated TopBar"
```

---

## Task 7: Routing + Final Wiring

**Files:**
- Modify: `src/App.tsx`
- Delete or repurpose: `src/pages/Index.tsx` (redirect to Dashboard)

- [ ] **Step 1: Update App.tsx routes**

```tsx
import Dashboard from "./pages/Dashboard.tsx";
import ProjetoPage from "./pages/ProjetoPage.tsx";

// In Routes:
<Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
<Route path="/projeto/:id" element={<ProtectedRoute><ProjetoPage /></ProtectedRoute>} />
```

Remove the old Index import if no longer used, or keep `Index.tsx` as a redirect wrapper.

- [ ] **Step 2: Verify build**

```bash
npx vite build
```

Expected: 0 errors.

- [ ] **Step 3: Test locally**

1. Open `http://localhost:8080` → should show Dashboard with "Tour Curitiba" card
2. Click the card → should navigate to `/projeto/<uuid>` with full roadmap
3. Click "← Projetos" → should go back to dashboard
4. (Admin) Click "+ Novo Projeto" → dialog with template selection
5. (Admin) Gear menu → "Gerenciar Macro Etapas" → CRUD dialog works
6. (Admin) Gear menu → "Salvar como Modelo" → creates template

- [ ] **Step 4: Commit and push**

```bash
git add -A
git commit -m "feat: routing, dashboard as home, projeto page with scoped data"
git push origin main
```

---

## Self-Review Results

**Spec coverage:**
- ✅ projetos table + CRUD
- ✅ templates table + CRUD
- ✅ macro_etapas projeto_id FK + CRUD
- ✅ Dashboard with project cards
- ✅ Status filter tabs
- ✅ Create project from template or zero
- ✅ Save project as template (A+C from Q5)
- ✅ Template section in dashboard (A from Q5)
- ✅ MacroEtapaManager with reorder
- ✅ TopBar with back button + admin menu
- ✅ Data migration for existing Tour Curitiba
- ✅ Global roles (no per-project permissions)
- ✅ Routing with `/` and `/projeto/:id`

**Placeholder scan:** No TBD/TODO found. Task 6 Step 3 (TopBar) and Step 4 (ProjetoPage) describe the changes but reference existing code patterns extensively. Full code is provided in all other steps.

**Type consistency:** `Projeto`, `Template`, `TemplateConteudo` types are consistent across hooks, components, and pages. `projetoId` parameter naming is consistent throughout.
