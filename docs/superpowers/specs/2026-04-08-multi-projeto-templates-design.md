# Multi-Projeto + CRUD Macro Etapas + Templates — Design Spec

## Goal

Transform Tour Launch Hub from a single-roadmap app into a multi-project platform where users can manage multiple launch roadmaps in parallel, with reusable templates and full CRUD on macro etapas.

## Architecture

### Data Layer

Three changes to the database:

1. **New `projetos` table** — top-level container for roadmaps
2. **New `templates` table** — stores reusable project blueprints as JSONB
3. **Alter `macro_etapas`** — add `projeto_id` FK to scope etapas per project

Ações and subtarefas inherit project scope through their FK chain: `subtarefas → acoes → macro_etapas → projetos`.

### Permissions

Global roles (admin/editor/viewer) from `profiles.role` apply to ALL projects. No per-project permissions.

- **admin**: full CRUD on projects, templates, macro etapas, ações, subtarefas
- **editor**: CRUD on ações and subtarefas within any project
- **viewer**: read-only across all projects

---

## Database Schema

### Table: `projetos`

```sql
CREATE TABLE public.projetos (
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
```

RLS policies:
- All authenticated users can SELECT
- Admin can INSERT, UPDATE, DELETE
- Editor can UPDATE (status only — not enforced at RLS level, handled in UI)

### Table: `templates`

```sql
CREATE TABLE public.templates (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  nome        TEXT        NOT NULL,
  descricao   TEXT        NOT NULL DEFAULT '',
  conteudo    JSONB       NOT NULL DEFAULT '{}',
  created_by  UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

RLS policies: admin only for all operations, all authenticated can SELECT.

### Alter: `macro_etapas`

```sql
ALTER TABLE public.macro_etapas
  ADD COLUMN projeto_id UUID REFERENCES public.projetos(id) ON DELETE CASCADE;
```

After adding the column, migrate existing data:
1. Create a "Tour Curitiba" project in `projetos`
2. Set all existing `macro_etapas.projeto_id` to that project's ID
3. Make `projeto_id` NOT NULL after migration

### Template JSONB Structure

```json
{
  "macro_etapas": [
    {
      "ref_id": "etapa-1",
      "nome": "Planejamento Estratégico",
      "descricao": "...",
      "cor": "hsl(221, 83%, 53%)",
      "ordem": 1,
      "acoes": [
        {
          "ref_id": "acao-1",
          "titulo": "Definir conceito criativo",
          "descricao": "...",
          "prioridade": "alta",
          "tempo_estimado": "5 dias",
          "dependencia_ref": null,
          "subtarefas": [
            { "titulo": "Pesquisa de referências visuais" },
            { "titulo": "Mood board aprovado" }
          ]
        }
      ]
    }
  ]
}
```

Fields NOT included in templates (project-specific):
- status, situacao_prazo, responsavel, data_inicio, data_fim, created_by
- These get defaults when instantiated: status="não iniciada", datas based on project creation date

---

## Navigation & Routing

### Routes

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | `Dashboard` | Project list + templates section |
| `/projeto/:id` | `ProjetoPage` | Current roadmap view, scoped to project |
| `/login` | `Login` | Unchanged |

### Dashboard (new home page)

- **Header**: "Tour Launch Hub" branding + user menu
- **Filtro de status**: tabs or buttons for Ativos / Arquivados / Concluídos / Todos
- **Grid de cards de projetos**: each card shows:
  - Nome do projeto
  - Cor (left border or accent)
  - Barra de progresso (% concluídas)
  - Contagem: "X/Y ações concluídas"
  - Status badge
  - Data de criação
  - Click → navega para `/projeto/:id`
- **Botão "+ Novo Projeto"** (admin only): opens creation dialog
- **Seção "Modelos"** (admin only, collapsible):
  - List of templates with nome, descricao, action buttons (editar, excluir)
  - Botão "+ Novo Modelo": opens template creation dialog

### ProjetoPage (current Index.tsx, scoped)

- **TopBar changes**:
  - "← Projetos" link/button to go back to dashboard
  - Project name displayed prominently
  - Admin menu (gear icon or dropdown) with:
    - "Gerenciar Macro Etapas"
    - "Salvar como Modelo"
    - "Editar Projeto" (nome, descrição, cor)
    - "Arquivar Projeto"
- Everything else (SummaryCards, Filters, Views) works the same, filtered by `projeto_id`

---

## CRUD: Macro Etapas

### UI: MacroEtapaManager Dialog

Accessed via admin menu in TopBar. Full-screen dialog or sheet.

- **List of macro etapas** ordered by `ordem` field
- Each row shows: color dot, nome, descrição, action count, edit/delete buttons
- **Reorder**: up/down arrow buttons (simpler than drag-and-drop, more accessible)
- **"+ Nova Etapa"** button at bottom
- **Edit**: opens inline form or sub-dialog with fields: nome, descrição, cor (color picker)
- **Delete**: confirmation dialog. If etapa has ações, warn "X ações serão excluídas" (cascade)

### Hooks

- `useMacroEtapas(projetoId)` — filtered by project
- `useCreateMacroEtapa()` — creates with next ordem value
- `useUpdateMacroEtapa()` — updates name, desc, color, order
- `useDeleteMacroEtapa()` — deletes with cascade warning
- `useReorderMacroEtapas()` — batch update of ordem values

---

## CRUD: Projetos

### Create Project Dialog

Fields:
- **Nome** (required): text input
- **Descrição** (optional): textarea
- **Cor** (required): color picker or preset palette
- **Ponto de partida** (required): radio group
  - "Começar do zero" — creates empty project
  - "Usar modelo: [dropdown de templates]" — creates project from template

On submit:
1. INSERT into `projetos`
2. If template selected: deserialize JSONB → create macro_etapas → create acoes → create subtarefas
3. Navigate to `/projeto/:id`

### Edit Project Dialog

Same fields as create, minus "Ponto de partida". Accessible from project menu.

### Archive/Complete Project

Admin can change status to 'arquivado' or 'concluído'. Project disappears from "Ativos" tab on dashboard but remains accessible via other tabs.

---

## Templates System

### "Salvar como Modelo"

1. Admin clicks "Salvar como Modelo" in project menu
2. Dialog opens with:
   - **Nome do modelo** (pre-filled with project name + " — Modelo")
   - **Descrição** (optional)
3. On submit: system queries all macro_etapas → acoes → subtarefas for that project
4. Serializes into JSONB structure (stripping status, dates, responsavel)
5. INSERT into `templates`

### Template Editor

From dashboard "Modelos" section:
- **Edit template**: opens dialog to change nome/descrição. For editing the content (macro_etapas/ações), the admin creates a temporary project from the template, edits it, then re-saves as template.
- **Delete template**: confirmation dialog

### Instantiate Template

When creating a project with a template:
1. Parse `templates.conteudo` JSONB
2. For each `macro_etapa`: INSERT with new IDs, `projeto_id` = new project
3. For each `acao`: INSERT with generated IDs (e.g., `PLA-001`), `status = 'não iniciada'`, `data_inicio = today`, `data_fim = today + tempo_estimado parsed`, `responsavel = ''`
4. Resolve `dependencia_ref` → real `dependencia_de` IDs using ref_id mapping
5. For each `subtarefa`: INSERT with `status = 'não iniciada'`

---

## Migration Plan

### Existing Data Migration

1. Create `projetos` table
2. Insert a "Tour Curitiba" project with `status = 'ativo'`
3. Add `projeto_id` column to `macro_etapas` (nullable initially)
4. UPDATE all existing macro_etapas SET `projeto_id` = Tour Curitiba project ID
5. ALTER `projeto_id` to NOT NULL
6. Create `templates` table
7. Create initial template from existing Tour Curitiba data

### ID Strategy

- `projetos.id`: UUID (auto-generated)
- `templates.id`: UUID (auto-generated)
- `macro_etapas.id`: keep TEXT (existing format), scoped by project
- `acoes.id`: keep TEXT (e.g., "PLA-001"), globally unique (current PK constraint). When creating from template, generate IDs with project-specific prefix or sequential numbering to avoid collisions

---

## File Structure (new/modified)

```
src/
├── pages/
│   ├── Dashboard.tsx          (NEW — project list + templates)
│   └── ProjetoPage.tsx        (NEW — current Index.tsx, wrapped with project context)
├── components/
│   ├── dashboard/
│   │   ├── ProjetoCard.tsx    (NEW — project card for dashboard grid)
│   │   ├── ProjetoCreateDialog.tsx (NEW — create project dialog)
│   │   ├── ProjetoEditDialog.tsx   (NEW — edit project dialog)
│   │   └── TemplateSection.tsx     (NEW — templates management section)
│   ├── roadmap/
│   │   ├── TopBar.tsx         (MODIFY — add back button, project name, admin menu)
│   │   ├── MacroEtapaManager.tsx   (NEW — CRUD dialog for macro etapas)
│   │   └── SaveAsTemplateDialog.tsx (NEW — save project as template)
│   └── ...existing components
├── hooks/
│   ├── useProjetos.ts         (NEW — CRUD hooks for projetos)
│   ├── useTemplates.ts        (NEW — CRUD hooks for templates)
│   ├── useMacroEtapas.ts      (MODIFY — add projetoId filter, add CRUD mutations)
│   ├── useAcoes.ts            (MODIFY — add projetoId filter via macro_etapa join)
│   └── ...existing hooks
├── contexts/
│   └── ProjetoContext.tsx     (NEW — current project context)
└── App.tsx                    (MODIFY — add routes)
```

---

## Out of Scope

- Per-project permissions/roles
- Drag-and-drop reordering (use arrow buttons instead)
- Real-time collaboration between users
- Project duplication (use save-as-template + create-from-template instead)
- Ação ID auto-generation based on etapa prefix (keep manual for now)
