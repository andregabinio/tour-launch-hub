# Tour Launch Hub — Backend Supabase Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Connect the existing React frontend to Supabase for data persistence, email/password auth, and role-based access control (Admin/Editor/Viewer).

**Architecture:** Frontend communicates directly with Supabase via `@supabase/supabase-js`. Row Level Security (RLS) policies enforce RBAC. React Query handles data fetching. Auth state is managed via React Context.

**Tech Stack:** React 18, Vite, TypeScript, Supabase (Auth + Postgres + RLS), React Query, shadcn/ui, Tailwind CSS

---

## File Map

### New Files
| File | Responsibility |
|------|---------------|
| `src/lib/supabase.ts` | Supabase client singleton |
| `src/contexts/AuthContext.tsx` | Auth state provider (user + profile + role) |
| `src/hooks/useAuth.ts` | Login, signup, logout functions |
| `src/hooks/useProfile.ts` | Current user profile + role query |
| `src/hooks/useAcoes.ts` | CRUD acoes via React Query + Supabase |
| `src/hooks/useSubtarefas.ts` | CRUD subtarefas via React Query + Supabase |
| `src/hooks/useMacroEtapas.ts` | Read macro_etapas from Supabase |
| `src/pages/Login.tsx` | Login/signup page |
| `src/components/ProtectedRoute.tsx` | Redirect to /login if not authenticated |
| `src/components/admin/UserManagement.tsx` | Admin panel for managing user roles |
| `supabase/migration.sql` | Full database schema + RLS + triggers |
| `.env.example` | Template for Supabase env vars |

### Modified Files
| File | Change |
|------|--------|
| `package.json` | Add `@supabase/supabase-js` dependency |
| `src/App.tsx` | Wrap with AuthProvider, add /login route, add ProtectedRoute |
| `src/pages/Index.tsx` | Replace `acoesMock` import with `useAcoes()` hook |
| `src/components/roadmap/TopBar.tsx` | Add user menu (logout + admin link) |
| `src/components/roadmap/Filters.tsx` | Get MACRO_ETAPAS and RESPONSAVEIS from Supabase data instead of mock imports |
| `src/types/roadmap.ts` | Add `Profile` type and `UserRole` type |

---

## Task 1: Supabase SQL Migration

**Files:**
- Create: `supabase/migration.sql`

- [ ] **Step 1: Create the migration file with full schema**

```sql
-- supabase/migration.sql
-- Run this in Supabase SQL Editor

-- 1. Helper function to get current user role
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 2. Profiles table
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  role text NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'editor', 'viewer')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "profiles_select" ON public.profiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_admin_update" ON public.profiles
  FOR UPDATE TO authenticated
  USING (get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');

CREATE POLICY "profiles_admin_insert" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (get_user_role() = 'admin');

CREATE POLICY "profiles_admin_delete" ON public.profiles
  FOR DELETE TO authenticated
  USING (get_user_role() = 'admin');

-- 3. Trigger: auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', ''),
    NEW.email,
    'viewer'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Trigger: auto-update updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 5. Macro Etapas table
CREATE TABLE public.macro_etapas (
  id text PRIMARY KEY,
  nome text NOT NULL,
  descricao text DEFAULT '',
  cor text NOT NULL DEFAULT '',
  cor_bg text NOT NULL DEFAULT '',
  cor_border text NOT NULL DEFAULT '',
  ordem integer NOT NULL DEFAULT 0
);

ALTER TABLE public.macro_etapas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "macro_etapas_select" ON public.macro_etapas
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "macro_etapas_admin_insert" ON public.macro_etapas
  FOR INSERT TO authenticated
  WITH CHECK (get_user_role() = 'admin');

CREATE POLICY "macro_etapas_admin_update" ON public.macro_etapas
  FOR UPDATE TO authenticated
  USING (get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');

CREATE POLICY "macro_etapas_admin_delete" ON public.macro_etapas
  FOR DELETE TO authenticated
  USING (get_user_role() = 'admin');

-- 6. Acoes table
CREATE TABLE public.acoes (
  id text PRIMARY KEY,
  titulo text NOT NULL,
  descricao text NOT NULL DEFAULT '',
  macro_etapa_id text NOT NULL REFERENCES public.macro_etapas(id),
  responsavel text NOT NULL DEFAULT '',
  prioridade text NOT NULL DEFAULT 'média' CHECK (prioridade IN ('alta', 'média', 'baixa')),
  status text NOT NULL DEFAULT 'não iniciada' CHECK (status IN ('não iniciada', 'em andamento', 'concluída')),
  situacao_prazo text NOT NULL DEFAULT 'no prazo' CHECK (situacao_prazo IN ('no prazo', 'atrasada')),
  tempo_estimado text NOT NULL DEFAULT '',
  data_inicio date NOT NULL,
  data_fim date NOT NULL,
  dependencia_de text REFERENCES public.acoes(id),
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.acoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "acoes_select" ON public.acoes
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "acoes_editor_insert" ON public.acoes
  FOR INSERT TO authenticated
  WITH CHECK (get_user_role() IN ('admin', 'editor'));

CREATE POLICY "acoes_editor_update" ON public.acoes
  FOR UPDATE TO authenticated
  USING (get_user_role() IN ('admin', 'editor'))
  WITH CHECK (get_user_role() IN ('admin', 'editor'));

CREATE POLICY "acoes_admin_delete" ON public.acoes
  FOR DELETE TO authenticated
  USING (get_user_role() = 'admin');

CREATE TRIGGER acoes_updated_at
  BEFORE UPDATE ON public.acoes
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 7. Subtarefas table
CREATE TABLE public.subtarefas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  acao_id text NOT NULL REFERENCES public.acoes(id) ON DELETE CASCADE,
  titulo text NOT NULL,
  status text NOT NULL DEFAULT 'não iniciada' CHECK (status IN ('não iniciada', 'em andamento', 'concluída')),
  responsavel text DEFAULT '',
  tempo_estimado text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.subtarefas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "subtarefas_select" ON public.subtarefas
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "subtarefas_editor_insert" ON public.subtarefas
  FOR INSERT TO authenticated
  WITH CHECK (get_user_role() IN ('admin', 'editor'));

CREATE POLICY "subtarefas_editor_update" ON public.subtarefas
  FOR UPDATE TO authenticated
  USING (get_user_role() IN ('admin', 'editor'))
  WITH CHECK (get_user_role() IN ('admin', 'editor'));

CREATE POLICY "subtarefas_admin_delete" ON public.subtarefas
  FOR DELETE TO authenticated
  USING (get_user_role() = 'admin');

CREATE TRIGGER subtarefas_updated_at
  BEFORE UPDATE ON public.subtarefas
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 8. Seed macro_etapas data
INSERT INTO public.macro_etapas (id, nome, descricao, cor, cor_bg, cor_border, ordem) VALUES
  ('planejamento', 'Planejamento Estratégico', 'Definição de escopo, objetivos e diretrizes', 'hsl(221, 83%, 53%)', 'bg-primary/10', 'border-primary/30', 1),
  ('branding', 'Branding e Comunicação', 'Identidade visual, posicionamento e narrativa', 'hsl(262, 83%, 58%)', 'bg-blocked/10', 'border-blocked/30', 2),
  ('producao', 'Produção de Materiais', 'Criação de assets, vídeos e peças', 'hsl(38, 92%, 50%)', 'bg-warning/10', 'border-warning/30', 3),
  ('pre-lancamento', 'Pré-lançamento', 'Aquecimento, teasers e engajamento', 'hsl(142, 76%, 36%)', 'bg-success/10', 'border-success/30', 4),
  ('lancamento', 'Lançamento', 'Go-live, vendas e cobertura', 'hsl(0, 84%, 60%)', 'bg-destructive/10', 'border-destructive/30', 5),
  ('pos-lancamento', 'Pós-lançamento', 'Análise, feedback e otimização', 'hsl(220, 9%, 46%)', 'bg-muted', 'border-border', 6);
```

- [ ] **Step 2: Commit**

```bash
git add supabase/migration.sql
git commit -m "feat: add Supabase migration with schema, RLS, and triggers"
```

---

## Task 2: Install Supabase + Environment Config

**Files:**
- Modify: `package.json`
- Create: `.env.example`

- [ ] **Step 1: Install @supabase/supabase-js**

Run: `cd /opt/tour-launch-hub && npm install @supabase/supabase-js`

- [ ] **Step 2: Create .env.example**

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

- [ ] **Step 3: Add .env to .gitignore if not present**

Check `.gitignore` for `.env` entry. If missing, add it.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json .env.example .gitignore
git commit -m "feat: add supabase dependency and env config"
```

---

## Task 3: Supabase Client + Types

**Files:**
- Create: `src/lib/supabase.ts`
- Modify: `src/types/roadmap.ts`

- [ ] **Step 1: Create Supabase client singleton**

```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY env vars');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

- [ ] **Step 2: Add Profile and UserRole types to roadmap.ts**

Add at the end of `src/types/roadmap.ts`:

```typescript
export type UserRole = 'admin' | 'editor' | 'viewer';

export interface Profile {
  id: string;
  nome: string;
  email: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/supabase.ts src/types/roadmap.ts
git commit -m "feat: add Supabase client and auth types"
```

---

## Task 4: Auth Context + useAuth Hook

**Files:**
- Create: `src/contexts/AuthContext.tsx`
- Create: `src/hooks/useAuth.ts`

- [ ] **Step 1: Create useAuth hook**

```typescript
// src/hooks/useAuth.ts
import { supabase } from '@/lib/supabase';

export function useAuth() {
  const signUp = async (email: string, password: string, nome: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { nome } },
    });
    if (error) throw error;
    return data;
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return { signUp, signIn, signOut };
}
```

- [ ] **Step 2: Create AuthContext**

```typescript
// src/contexts/AuthContext.tsx
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { type Session, type User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { type Profile, type UserRole } from '@/types/roadmap';

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  role: UserRole | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue>({
  session: null,
  user: null,
  profile: null,
  role: null,
  loading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        if (session?.user) {
          fetchProfile(session.user.id);
        } else {
          setProfile(null);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  async function fetchProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      setProfile(null);
    } else {
      setProfile(data as Profile);
    }
    setLoading(false);
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        profile,
        role: profile?.role ?? null,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  return useContext(AuthContext);
}
```

- [ ] **Step 3: Verify build compiles**

Run: `cd /opt/tour-launch-hub && npx tsc --noEmit`

- [ ] **Step 4: Commit**

```bash
git add src/hooks/useAuth.ts src/contexts/AuthContext.tsx
git commit -m "feat: add auth context and useAuth hook"
```

---

## Task 5: Login Page

**Files:**
- Create: `src/pages/Login.tsx`

- [ ] **Step 1: Create the Login page**

```typescript
// src/pages/Login.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Rocket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

const Login = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nome, setNome] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        await signUp(email, password, nome);
        toast.success('Conta criada com sucesso!');
      } else {
        await signIn(email, password);
      }
      navigate('/');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao autenticar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
            <Rocket className="h-6 w-6 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl">TOUR Launch Hub</CardTitle>
          <CardDescription>
            {isSignUp ? 'Crie sua conta' : 'Entre na sua conta'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="nome">Nome</Label>
                <Input
                  id="nome"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Seu nome"
                  required
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Sua senha"
                required
                minLength={6}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Carregando...' : isSignUp ? 'Criar conta' : 'Entrar'}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-primary underline-offset-4 hover:underline"
            >
              {isSignUp ? 'Já tem conta? Entre' : 'Não tem conta? Crie uma'}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/Login.tsx
git commit -m "feat: add login/signup page"
```

---

## Task 6: ProtectedRoute + App Wiring

**Files:**
- Create: `src/components/ProtectedRoute.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Create ProtectedRoute component**

```typescript
// src/components/ProtectedRoute.tsx
import { Navigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, loading } = useAuthContext();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
```

- [ ] **Step 2: Update App.tsx**

Replace the entire content of `src/App.tsx` with:

```typescript
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index.tsx";
import Login from "./pages/Login.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Index />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
```

- [ ] **Step 3: Verify build compiles**

Run: `cd /opt/tour-launch-hub && npx tsc --noEmit`

- [ ] **Step 4: Commit**

```bash
git add src/components/ProtectedRoute.tsx src/App.tsx
git commit -m "feat: add protected routes and auth wiring"
```

---

## Task 7: Data Hooks (useAcoes, useSubtarefas, useMacroEtapas)

**Files:**
- Create: `src/hooks/useAcoes.ts`
- Create: `src/hooks/useSubtarefas.ts`
- Create: `src/hooks/useMacroEtapas.ts`

- [ ] **Step 1: Create useMacroEtapas hook**

```typescript
// src/hooks/useMacroEtapas.ts
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
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
```

- [ ] **Step 2: Create useAcoes hook**

```typescript
// src/hooks/useAcoes.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { type Acao } from '@/types/roadmap';

interface AcaoRow {
  id: string;
  titulo: string;
  descricao: string;
  macro_etapa_id: string;
  responsavel: string;
  prioridade: string;
  status: string;
  situacao_prazo: string;
  tempo_estimado: string;
  data_inicio: string;
  data_fim: string;
  dependencia_de: string | null;
  created_by: string | null;
  macro_etapas: { nome: string } | null;
  subtarefas: {
    id: string;
    titulo: string;
    status: string;
    responsavel: string;
    tempo_estimado: string;
  }[];
}

function rowToAcao(row: AcaoRow): Acao {
  return {
    id: row.id,
    titulo: row.titulo,
    descricao: row.descricao,
    macroEtapa: row.macro_etapas?.nome ?? '',
    responsavel: row.responsavel,
    prioridade: row.prioridade as Acao['prioridade'],
    status: row.status as Acao['status'],
    situacaoPrazo: row.situacao_prazo as Acao['situacaoPrazo'],
    tempoEstimado: row.tempo_estimado,
    dataInicio: row.data_inicio,
    dataFim: row.data_fim,
    dependenciaDe: row.dependencia_de,
    subtarefas: (row.subtarefas ?? []).map((s) => ({
      id: s.id,
      titulo: s.titulo,
      status: s.status as Acao['status'],
      responsavel: s.responsavel,
      tempoEstimado: s.tempo_estimado,
    })),
  };
}

export function useAcoes() {
  return useQuery({
    queryKey: ['acoes'],
    queryFn: async (): Promise<Acao[]> => {
      const { data, error } = await supabase
        .from('acoes')
        .select('*, macro_etapas(nome), subtarefas(*)')
        .order('data_inicio');

      if (error) throw error;
      return (data ?? []).map(rowToAcao);
    },
  });
}

export function useCreateAcao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (acao: {
      id: string;
      titulo: string;
      descricao: string;
      macro_etapa_id: string;
      responsavel: string;
      prioridade: string;
      status: string;
      situacao_prazo: string;
      tempo_estimado: string;
      data_inicio: string;
      data_fim: string;
      dependencia_de: string | null;
    }) => {
      const { data, error } = await supabase.from('acoes').insert(acao).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['acoes'] });
    },
  });
}

export function useUpdateAcao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<{
      titulo: string;
      descricao: string;
      macro_etapa_id: string;
      responsavel: string;
      prioridade: string;
      status: string;
      situacao_prazo: string;
      tempo_estimado: string;
      data_inicio: string;
      data_fim: string;
      dependencia_de: string | null;
    }>) => {
      const { data, error } = await supabase.from('acoes').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['acoes'] });
    },
  });
}

export function useDeleteAcao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('acoes').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['acoes'] });
    },
  });
}
```

- [ ] **Step 3: Create useSubtarefas hook**

```typescript
// src/hooks/useSubtarefas.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

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
```

- [ ] **Step 4: Verify build compiles**

Run: `cd /opt/tour-launch-hub && npx tsc --noEmit`

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useAcoes.ts src/hooks/useSubtarefas.ts src/hooks/useMacroEtapas.ts
git commit -m "feat: add data hooks for acoes, subtarefas, and macro_etapas"
```

---

## Task 8: Replace Mock Data in Index.tsx

**Files:**
- Modify: `src/pages/Index.tsx`

- [ ] **Step 1: Update Index.tsx to use Supabase data**

Replace the entire content of `src/pages/Index.tsx` with:

```typescript
import { useState, useMemo } from 'react';
import { useAcoes } from '@/hooks/useAcoes';
import { Acao } from '@/types/roadmap';
import TopBar from '@/components/roadmap/TopBar';
import SummaryCards from '@/components/roadmap/SummaryCards';
import Filters, { FilterState, defaultFilters } from '@/components/roadmap/Filters';
import TimelineRoadmap from '@/components/roadmap/TimelineRoadmap';
import TableView from '@/components/roadmap/TableView';

const prioridadeOrder = { alta: 0, média: 1, baixa: 2 };

const Index = () => {
  const [viewMode, setViewMode] = useState<'roadmap' | 'tabela'>('roadmap');
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const { data: acoes = [], isLoading, error } = useAcoes();

  const processedAcoes: Acao[] = useMemo(() => {
    return acoes.map((acao) => {
      if (acao.dependenciaDe) {
        const dep = acoes.find(a => a.id === acao.dependenciaDe);
        if (dep && dep.status !== 'concluída') {
          return { ...acao, bloqueada: true };
        }
      }
      return { ...acao, bloqueada: false };
    });
  }, [acoes]);

  const filteredAcoes = useMemo(() => {
    let result = processedAcoes;

    if (filters.busca) {
      const q = filters.busca.toLowerCase();
      result = result.filter(a =>
        a.titulo.toLowerCase().includes(q) ||
        a.descricao.toLowerCase().includes(q) ||
        a.responsavel.toLowerCase().includes(q) ||
        a.id.toLowerCase().includes(q)
      );
    }
    if (filters.macroEtapa !== 'todas') {
      result = result.filter(a => a.macroEtapa === filters.macroEtapa);
    }
    if (filters.responsavel !== 'todos') {
      result = result.filter(a => a.responsavel === filters.responsavel);
    }
    if (filters.prioridade !== 'todas') {
      result = result.filter(a => a.prioridade === filters.prioridade);
    }
    if (filters.status !== 'todos') {
      result = result.filter(a => a.status === filters.status);
    }
    if (filters.situacaoPrazo !== 'todas') {
      result = result.filter(a => a.situacaoPrazo === filters.situacaoPrazo);
    }

    result = [...result].sort((a, b) => {
      switch (filters.ordenarPor) {
        case 'prazo':
          return new Date(a.dataInicio).getTime() - new Date(b.dataInicio).getTime();
        case 'prioridade':
          return prioridadeOrder[a.prioridade] - prioridadeOrder[b.prioridade];
        case 'responsavel':
          return a.responsavel.localeCompare(b.responsavel);
        default:
          return 0;
      }
    });

    return result;
  }, [processedAcoes, filters]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground">Carregando dados...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-destructive">Erro ao carregar dados: {error.message}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <TopBar viewMode={viewMode} onViewModeChange={setViewMode} />
      <main className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        <SummaryCards acoes={processedAcoes} />
        <Filters filters={filters} onChange={setFilters} acoes={processedAcoes} />
        {viewMode === 'roadmap' ? (
          <TimelineRoadmap acoes={filteredAcoes} allAcoes={processedAcoes} />
        ) : (
          <TableView acoes={filteredAcoes} />
        )}
      </main>
    </div>
  );
};

export default Index;
```

- [ ] **Step 2: Update Filters.tsx to receive data via props instead of mock imports**

Replace the entire content of `src/components/roadmap/Filters.tsx` with:

```typescript
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { type Acao } from '@/types/roadmap';

export interface FilterState {
  busca: string;
  macroEtapa: string;
  responsavel: string;
  prioridade: string;
  status: string;
  situacaoPrazo: string;
  ordenarPor: string;
}

interface FiltersProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  acoes: Acao[];
}

const defaultFilters: FilterState = {
  busca: '',
  macroEtapa: 'todas',
  responsavel: 'todos',
  prioridade: 'todas',
  status: 'todos',
  situacaoPrazo: 'todas',
  ordenarPor: 'prazo',
};

const Filters = ({ filters, onChange, acoes }: FiltersProps) => {
  const macroEtapas = [...new Set(acoes.map(a => a.macroEtapa))];
  const responsaveis = [...new Set(acoes.map(a => a.responsavel))].sort();

  const update = (key: keyof FilterState, value: string) =>
    onChange({ ...filters, [key]: value });

  const hasActiveFilters = Object.entries(filters).some(
    ([key, val]) => val !== defaultFilters[key as keyof FilterState]
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar ações, responsáveis..."
            value={filters.busca}
            onChange={(e) => update('busca', e.target.value)}
            className="pl-9"
          />
        </div>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={() => onChange(defaultFilters)} className="gap-1 text-muted-foreground">
            <X className="h-4 w-4" /> Limpar filtros
          </Button>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        <Select value={filters.macroEtapa} onValueChange={(v) => update('macroEtapa', v)}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Macro etapa" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas as etapas</SelectItem>
            {macroEtapas.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filters.responsavel} onValueChange={(v) => update('responsavel', v)}>
          <SelectTrigger className="w-[170px]"><SelectValue placeholder="Responsável" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            {responsaveis.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filters.prioridade} onValueChange={(v) => update('prioridade', v)}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Prioridade" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas</SelectItem>
            <SelectItem value="alta">Alta</SelectItem>
            <SelectItem value="média">Média</SelectItem>
            <SelectItem value="baixa">Baixa</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filters.status} onValueChange={(v) => update('status', v)}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="não iniciada">Não iniciada</SelectItem>
            <SelectItem value="em andamento">Em andamento</SelectItem>
            <SelectItem value="concluída">Concluída</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filters.situacaoPrazo} onValueChange={(v) => update('situacaoPrazo', v)}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="Situação" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas</SelectItem>
            <SelectItem value="no prazo">No prazo</SelectItem>
            <SelectItem value="atrasada">Atrasada</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filters.ordenarPor} onValueChange={(v) => update('ordenarPor', v)}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="Ordenar por" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="prazo">Prazo</SelectItem>
            <SelectItem value="prioridade">Prioridade</SelectItem>
            <SelectItem value="responsavel">Responsável</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export { defaultFilters };
export default Filters;
```

- [ ] **Step 3: Verify build compiles**

Run: `cd /opt/tour-launch-hub && npx tsc --noEmit`

- [ ] **Step 4: Commit**

```bash
git add src/pages/Index.tsx src/components/roadmap/Filters.tsx
git commit -m "feat: replace mock data with Supabase data hooks"
```

---

## Task 9: TopBar with User Menu + Logout

**Files:**
- Modify: `src/components/roadmap/TopBar.tsx`

- [ ] **Step 1: Update TopBar with user menu**

Replace the entire content of `src/components/roadmap/TopBar.tsx` with:

```typescript
import { Rocket, LayoutGrid, Table, LogOut, Users, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuthContext } from '@/contexts/AuthContext';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface TopBarProps {
  viewMode: 'roadmap' | 'tabela';
  onViewModeChange: (mode: 'roadmap' | 'tabela') => void;
  onOpenAdmin?: () => void;
}

const TopBar = ({ viewMode, onViewModeChange, onOpenAdmin }: TopBarProps) => {
  const { profile, role } = useAuthContext();
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error: any) {
      toast.error('Erro ao sair');
    }
  };

  return (
    <header className="border-b border-border bg-card px-4 py-4 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
            <Rocket className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              Roadmap de Lançamento do TOUR
            </h1>
            <p className="text-sm text-muted-foreground">
              Planejamento e acompanhamento estratégico
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 rounded-lg border border-border bg-muted p-1">
            <Button
              variant={viewMode === 'roadmap' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onViewModeChange('roadmap')}
              className="gap-2"
            >
              <LayoutGrid className="h-4 w-4" />
              Roadmap
            </Button>
            <Button
              variant={viewMode === 'tabela' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onViewModeChange('tabela')}
              className="gap-2"
            >
              <Table className="h-4 w-4" />
              Tabela
            </Button>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <User className="h-4 w-4" />
                {profile?.nome || 'Usuário'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <div className="px-2 py-1.5 text-sm text-muted-foreground">
                {profile?.email}
                <span className="ml-2 rounded bg-muted px-1.5 py-0.5 text-xs font-medium">
                  {role}
                </span>
              </div>
              <DropdownMenuSeparator />
              {role === 'admin' && onOpenAdmin && (
                <>
                  <DropdownMenuItem onClick={onOpenAdmin} className="gap-2">
                    <Users className="h-4 w-4" />
                    Gerenciar Usuários
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem onClick={handleLogout} className="gap-2 text-destructive">
                <LogOut className="h-4 w-4" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default TopBar;
```

- [ ] **Step 2: Update Index.tsx to pass onOpenAdmin to TopBar**

In `src/pages/Index.tsx`, add state for admin panel and pass to TopBar. Add after the `filters` state:

```typescript
const [showAdmin, setShowAdmin] = useState(false);
```

Update TopBar usage:

```typescript
<TopBar viewMode={viewMode} onViewModeChange={setViewMode} onOpenAdmin={() => setShowAdmin(true)} />
```

Add the admin panel import and render (will be created in next task):

```typescript
// Add import at top:
import { useAuthContext } from '@/contexts/AuthContext';
```

- [ ] **Step 3: Verify build compiles**

Run: `cd /opt/tour-launch-hub && npx tsc --noEmit`

- [ ] **Step 4: Commit**

```bash
git add src/components/roadmap/TopBar.tsx src/pages/Index.tsx
git commit -m "feat: add user menu with logout and admin link"
```

---

## Task 10: Admin User Management Panel

**Files:**
- Create: `src/components/admin/UserManagement.tsx`
- Modify: `src/pages/Index.tsx` (add admin dialog)

- [ ] **Step 1: Create UserManagement component**

```typescript
// src/components/admin/UserManagement.tsx
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { type Profile, type UserRole } from '@/types/roadmap';
import { useAuthContext } from '@/contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

interface UserManagementProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const UserManagement = ({ open, onOpenChange }: UserManagementProps) => {
  const { user } = useAuthContext();
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open) {
      fetchUsers();
    }
  }, [open]);

  async function fetchUsers() {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at');

    if (error) {
      toast.error('Erro ao carregar usuários');
    } else {
      setUsers((data ?? []) as Profile[]);
    }
    setLoading(false);
  }

  async function updateRole(userId: string, newRole: UserRole) {
    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId);

    if (error) {
      toast.error('Erro ao atualizar role');
    } else {
      toast.success('Role atualizado');
      setUsers(prev =>
        prev.map(u => (u.id === userId ? { ...u, role: newRole } : u))
      );
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Gerenciar Usuários</DialogTitle>
        </DialogHeader>
        {loading ? (
          <div className="py-8 text-center text-muted-foreground">Carregando...</div>
        ) : (
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 font-medium">Nome</th>
                  <th className="pb-2 font-medium">Email</th>
                  <th className="pb-2 font-medium">Role</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b">
                    <td className="py-3">{u.nome || '—'}</td>
                    <td className="py-3 text-muted-foreground">{u.email}</td>
                    <td className="py-3">
                      {u.id === user?.id ? (
                        <span className="rounded bg-muted px-2 py-1 text-xs font-medium">
                          {u.role} (você)
                        </span>
                      ) : (
                        <Select
                          value={u.role}
                          onValueChange={(v) => updateRole(u.id, v as UserRole)}
                        >
                          <SelectTrigger className="h-8 w-[120px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="viewer">Viewer</SelectItem>
                            <SelectItem value="editor">Editor</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default UserManagement;
```

- [ ] **Step 2: Wire admin panel into Index.tsx**

In `src/pages/Index.tsx`, add the import and render the dialog. Add import:

```typescript
import UserManagement from '@/components/admin/UserManagement';
```

Add after `</main>` and before the closing `</div>`:

```typescript
<UserManagement open={showAdmin} onOpenChange={setShowAdmin} />
```

- [ ] **Step 3: Verify build compiles**

Run: `cd /opt/tour-launch-hub && npx tsc --noEmit`

- [ ] **Step 4: Commit**

```bash
git add src/components/admin/UserManagement.tsx src/pages/Index.tsx
git commit -m "feat: add admin user management panel"
```

---

## Task 11: Seed Script for Mock Data Migration

**Files:**
- Create: `supabase/seed.sql`

- [ ] **Step 1: Create seed script to migrate mock data**

This converts all 30 actions from `mockData.ts` into SQL inserts. The macro_etapas seed is already in migration.sql.

```sql
-- supabase/seed.sql
-- Run AFTER migration.sql to populate initial data

-- Insert all acoes (actions without dependencies first, then dependent ones)

-- PLANEJAMENTO ESTRATEGICO
INSERT INTO public.acoes (id, titulo, descricao, macro_etapa_id, responsavel, prioridade, status, situacao_prazo, tempo_estimado, data_inicio, data_fim, dependencia_de) VALUES
  ('PLA-001', 'Definir conceito criativo do TOUR', 'Criar o conceito visual, narrativa e identidade do tour.', 'planejamento', 'Ana Costa', 'alta', 'concluída', 'no prazo', '5 dias', '2025-07-01', '2025-07-07', NULL),
  ('PLA-003', 'Orçamento geral do projeto', 'Consolidar orçamento de todas as frentes.', 'planejamento', 'Felipe Almeida', 'alta', 'em andamento', 'no prazo', '7 dias', '2025-07-03', '2025-07-12', NULL),
  ('PLA-004', 'Definir cronograma geral', 'Estabelecer marcos e deadlines para todas as áreas.', 'planejamento', 'Ricardo Nunes', 'média', 'concluída', 'no prazo', '4 dias', '2025-07-08', '2025-07-12', NULL),
  ('PLA-005', 'Montar equipe de projeto', 'Definir papéis, alocações e responsabilidades do time.', 'planejamento', 'Ricardo Nunes', 'alta', 'concluída', 'no prazo', '3 dias', '2025-07-01', '2025-07-04', NULL),
  ('PLA-002', 'Mapear cidades e venues', 'Selecionar cidades-alvo e negociar venues para as datas.', 'planejamento', 'Diego Rocha', 'alta', 'em andamento', 'atrasada', '10 dias', '2025-07-05', '2025-07-18', 'PLA-001');

-- BRANDING E COMUNICACAO
INSERT INTO public.acoes (id, titulo, descricao, macro_etapa_id, responsavel, prioridade, status, situacao_prazo, tempo_estimado, data_inicio, data_fim, dependencia_de) VALUES
  ('BRA-001', 'Criar identidade visual do TOUR', 'Logo, paleta de cores, tipografia e key visual.', 'branding', 'Ana Costa', 'alta', 'em andamento', 'no prazo', '8 dias', '2025-07-10', '2025-07-21', 'PLA-001'),
  ('BRA-002', 'Estratégia de posicionamento', 'Definir tom de voz, mensagens-chave e narrativa da marca.', 'branding', 'Elena Martins', 'média', 'em andamento', 'no prazo', '6 dias', '2025-07-12', '2025-07-19', 'PLA-001'),
  ('BRA-003', 'Press kit e media kit', 'Montar kit de imprensa para assessoria e parceiros.', 'branding', 'Elena Martins', 'média', 'não iniciada', 'no prazo', '5 dias', '2025-07-21', '2025-07-27', 'BRA-001'),
  ('BRA-004', 'Plano de assessoria de imprensa', 'Definir veículos, pautas e cronograma de divulgação.', 'branding', 'Elena Martins', 'baixa', 'não iniciada', 'no prazo', '4 dias', '2025-07-24', '2025-07-29', 'BRA-003');

-- PRODUCAO DE MATERIAIS
INSERT INTO public.acoes (id, titulo, descricao, macro_etapa_id, responsavel, prioridade, status, situacao_prazo, tempo_estimado, data_inicio, data_fim, dependencia_de) VALUES
  ('PRO-003', 'Peças para redes sociais', 'Criar grid de posts, stories e reels para lançamento.', 'producao', 'Gabriela Lima', 'média', 'em andamento', 'atrasada', '10 dias', '2025-07-15', '2025-07-28', NULL),
  ('PRO-001', 'Produzir vídeo teaser de anúncio', 'Roteirizar e produzir vídeo teaser de 30s para redes.', 'producao', 'Bruno Silva', 'alta', 'não iniciada', 'no prazo', '12 dias', '2025-07-22', '2025-08-05', 'BRA-001'),
  ('PRO-002', 'Banco de imagens e assets digitais', 'Criar e organizar banco de imagens para todas as peças.', 'producao', 'Gabriela Lima', 'média', 'não iniciada', 'no prazo', '6 dias', '2025-07-22', '2025-07-29', 'BRA-001'),
  ('PRO-004', 'Material gráfico para venues', 'Banners, backdrops, sinalização e materiais impressos.', 'producao', 'Ana Costa', 'média', 'não iniciada', 'no prazo', '7 dias', '2025-07-28', '2025-08-05', 'BRA-001'),
  ('PRO-005', 'Landing page do TOUR', 'Desenvolver landing page com informações, datas e venda.', 'producao', 'Bruno Silva', 'alta', 'não iniciada', 'no prazo', '8 dias', '2025-07-25', '2025-08-04', 'BRA-001');

-- PRE-LANCAMENTO
INSERT INTO public.acoes (id, titulo, descricao, macro_etapa_id, responsavel, prioridade, status, situacao_prazo, tempo_estimado, data_inicio, data_fim, dependencia_de) VALUES
  ('PRE-003', 'Prospecção de patrocinadores', 'Identificar marcas para patrocínio e cotas de apoio.', 'pre-lancamento', 'Elena Martins', 'alta', 'em andamento', 'atrasada', '15 dias', '2025-07-14', '2025-08-01', NULL),
  ('PRE-002', 'Estratégia de influenciadores', 'Mapear, contatar e fechar parcerias com influenciadores.', 'pre-lancamento', 'Elena Martins', 'média', 'não iniciada', 'no prazo', '10 dias', '2025-08-01', '2025-08-13', 'BRA-001'),
  ('PRE-001', 'Plano de mídia paga', 'Estratégia de mídia paga: Meta Ads, Google Ads, YouTube.', 'pre-lancamento', 'Carla Mendes', 'alta', 'não iniciada', 'no prazo', '7 dias', '2025-08-04', '2025-08-12', 'PRO-001'),
  ('PRE-004', 'Configurar plataforma de ingressos', 'Integrar e configurar plataforma de vendas com lotes.', 'pre-lancamento', 'Bruno Silva', 'alta', 'não iniciada', 'no prazo', '10 dias', '2025-08-06', '2025-08-18', 'PLA-002'),
  ('PRE-005', 'Campanha de aquecimento', 'Ativar teasers e contagem regressiva nas redes.', 'pre-lancamento', 'Gabriela Lima', 'média', 'não iniciada', 'no prazo', '7 dias', '2025-08-11', '2025-08-19', 'PRO-001');

-- LANCAMENTO
INSERT INTO public.acoes (id, titulo, descricao, macro_etapa_id, responsavel, prioridade, status, situacao_prazo, tempo_estimado, data_inicio, data_fim, dependencia_de) VALUES
  ('LAN-001', 'Contratação de fornecedores técnicos', 'Contratar som, iluminação, palco e equipe técnica.', 'lancamento', 'Diego Rocha', 'alta', 'não iniciada', 'no prazo', '12 dias', '2025-08-11', '2025-08-25', 'PLA-002'),
  ('LAN-002', 'Logística de hospedagem e transporte', 'Organizar deslocamento e hospedagem da equipe e artistas.', 'lancamento', 'Felipe Almeida', 'média', 'não iniciada', 'no prazo', '8 dias', '2025-08-18', '2025-08-27', 'PLA-002'),
  ('LAN-003', 'Go-live de vendas de ingressos', 'Abertura oficial de vendas com campanhas ativas.', 'lancamento', 'Bruno Silva', 'alta', 'não iniciada', 'no prazo', '5 dias', '2025-08-20', '2025-08-26', 'PRE-004'),
  ('LAN-004', 'Cobertura ao vivo nas redes', 'Stories, lives e cobertura em tempo real do lançamento.', 'lancamento', 'Gabriela Lima', 'média', 'não iniciada', 'no prazo', '5 dias', '2025-08-20', '2025-08-26', 'PRO-001');

-- POS-LANCAMENTO
INSERT INTO public.acoes (id, titulo, descricao, macro_etapa_id, responsavel, prioridade, status, situacao_prazo, tempo_estimado, data_inicio, data_fim, dependencia_de) VALUES
  ('POS-002', 'Pesquisa de satisfação pós-show', 'Enviar pesquisa NPS e qualitativa para o público.', 'pos-lancamento', 'Gabriela Lima', 'baixa', 'não iniciada', 'no prazo', '4 dias', '2025-09-01', '2025-09-05', NULL),
  ('POS-001', 'Relatório de performance', 'Consolidar métricas de vendas, engajamento e mídia.', 'pos-lancamento', 'Carla Mendes', 'baixa', 'não iniciada', 'no prazo', '5 dias', '2025-08-27', '2025-09-02', 'PRE-001'),
  ('POS-003', 'Retrospectiva e aprendizados', 'Reunião de retrospectiva com todas as áreas envolvidas.', 'pos-lancamento', 'Ricardo Nunes', 'baixa', 'não iniciada', 'no prazo', '3 dias', '2025-09-05', '2025-09-09', 'POS-001'),
  ('POS-004', 'Plano de continuidade', 'Definir próximos passos, novas datas e expansão do tour.', 'pos-lancamento', 'Ricardo Nunes', 'média', 'não iniciada', 'no prazo', '5 dias', '2025-09-08', '2025-09-14', 'POS-003');

-- Insert all subtarefas
INSERT INTO public.subtarefas (id, acao_id, titulo, status, responsavel, tempo_estimado) VALUES
  -- PLA-001
  (gen_random_uuid(), 'PLA-001', 'Pesquisa de referências visuais', 'concluída', 'Ana Costa', '2 dias'),
  (gen_random_uuid(), 'PLA-001', 'Mood board aprovado', 'concluída', 'Ana Costa', '1 dia'),
  (gen_random_uuid(), 'PLA-001', 'Documento de conceito final', 'concluída', 'Ana Costa', '2 dias'),
  -- PLA-002
  (gen_random_uuid(), 'PLA-002', 'Lista de cidades prioritárias', 'concluída', 'Diego Rocha', '2 dias'),
  (gen_random_uuid(), 'PLA-002', 'Contato com venues', 'em andamento', 'Diego Rocha', '5 dias'),
  (gen_random_uuid(), 'PLA-002', 'Contratos assinados', 'não iniciada', 'Felipe Almeida', '3 dias'),
  -- PLA-003
  (gen_random_uuid(), 'PLA-003', 'Levantamento de custos por área', 'concluída', 'Felipe Almeida', '3 dias'),
  (gen_random_uuid(), 'PLA-003', 'Aprovação da diretoria', 'não iniciada', 'Felipe Almeida', '2 dias'),
  -- PLA-004
  (gen_random_uuid(), 'PLA-004', 'Timeline por macro etapa', 'concluída', 'Ricardo Nunes', '2 dias'),
  (gen_random_uuid(), 'PLA-004', 'Alinhamento entre áreas', 'concluída', 'Ricardo Nunes', '2 dias'),
  -- BRA-001
  (gen_random_uuid(), 'BRA-001', 'Proposta de logo (3 opções)', 'concluída', 'Ana Costa', '3 dias'),
  (gen_random_uuid(), 'BRA-001', 'Guideline de marca', 'em andamento', 'Ana Costa', '3 dias'),
  (gen_random_uuid(), 'BRA-001', 'Adaptações para redes sociais', 'não iniciada', 'Gabriela Lima', '2 dias'),
  -- BRA-002
  (gen_random_uuid(), 'BRA-002', 'Documento de posicionamento', 'em andamento', 'Elena Martins', '3 dias'),
  (gen_random_uuid(), 'BRA-002', 'Key messages por público', 'não iniciada', 'Elena Martins', '3 dias'),
  -- BRA-003
  (gen_random_uuid(), 'BRA-003', 'Release de imprensa', 'não iniciada', 'Elena Martins', '2 dias'),
  (gen_random_uuid(), 'BRA-003', 'Assets visuais para press', 'não iniciada', 'Ana Costa', '2 dias'),
  (gen_random_uuid(), 'BRA-003', 'Página de press online', 'não iniciada', 'Bruno Silva', '1 dia'),
  -- PRO-001
  (gen_random_uuid(), 'PRO-001', 'Roteiro aprovado', 'não iniciada', 'Bruno Silva', '3 dias'),
  (gen_random_uuid(), 'PRO-001', 'Gravação', 'não iniciada', 'Bruno Silva', '4 dias'),
  (gen_random_uuid(), 'PRO-001', 'Edição e pós-produção', 'não iniciada', 'Bruno Silva', '5 dias'),
  -- PRO-002
  (gen_random_uuid(), 'PRO-002', 'Sessão fotográfica', 'não iniciada', 'Gabriela Lima', '2 dias'),
  (gen_random_uuid(), 'PRO-002', 'Tratamento e catalogação', 'não iniciada', 'Gabriela Lima', '4 dias'),
  -- PRO-003
  (gen_random_uuid(), 'PRO-003', 'Grid de 30 dias planejado', 'concluída', 'Gabriela Lima', '3 dias'),
  (gen_random_uuid(), 'PRO-003', 'Criação de 15 peças visuais', 'em andamento', 'Gabriela Lima', '5 dias'),
  (gen_random_uuid(), 'PRO-003', 'Redação de copies', 'não iniciada', 'Elena Martins', '2 dias'),
  -- PRO-004
  (gen_random_uuid(), 'PRO-004', 'Layout dos banners', 'não iniciada', 'Ana Costa', '3 dias'),
  (gen_random_uuid(), 'PRO-004', 'Envio para produção gráfica', 'não iniciada', 'Ana Costa', '2 dias'),
  (gen_random_uuid(), 'PRO-004', 'Conferência de provas', 'não iniciada', 'Ana Costa', '2 dias'),
  -- PRO-005
  (gen_random_uuid(), 'PRO-005', 'Wireframe aprovado', 'não iniciada', 'Bruno Silva', '2 dias'),
  (gen_random_uuid(), 'PRO-005', 'Desenvolvimento front-end', 'não iniciada', 'Bruno Silva', '4 dias'),
  (gen_random_uuid(), 'PRO-005', 'Integração com vendas', 'não iniciada', 'Bruno Silva', '2 dias'),
  -- PRE-001
  (gen_random_uuid(), 'PRE-001', 'Definir budget por canal', 'não iniciada', 'Carla Mendes', '2 dias'),
  (gen_random_uuid(), 'PRE-001', 'Criar audiências e segmentações', 'não iniciada', 'Carla Mendes', '3 dias'),
  (gen_random_uuid(), 'PRE-001', 'Subir campanhas', 'não iniciada', 'Carla Mendes', '2 dias'),
  -- PRE-002
  (gen_random_uuid(), 'PRE-002', 'Lista de influenciadores (tier 1-3)', 'não iniciada', 'Elena Martins', '3 dias'),
  (gen_random_uuid(), 'PRE-002', 'Briefing e proposta comercial', 'não iniciada', 'Elena Martins', '4 dias'),
  (gen_random_uuid(), 'PRE-002', 'Contratos assinados', 'não iniciada', 'Felipe Almeida', '3 dias'),
  -- PRE-003
  (gen_random_uuid(), 'PRE-003', 'Deck de patrocínio finalizado', 'concluída', 'Elena Martins', '5 dias'),
  (gen_random_uuid(), 'PRE-003', 'Lista de 30 prospects', 'concluída', 'Elena Martins', '3 dias'),
  (gen_random_uuid(), 'PRE-003', 'Reuniões de apresentação', 'em andamento', 'Elena Martins', '5 dias'),
  (gen_random_uuid(), 'PRE-003', 'Contratos fechados', 'não iniciada', 'Felipe Almeida', '2 dias'),
  -- PRE-004
  (gen_random_uuid(), 'PRE-004', 'Definir categorias e preços', 'não iniciada', 'Bruno Silva', '2 dias'),
  (gen_random_uuid(), 'PRE-004', 'Configurar lotes na plataforma', 'não iniciada', 'Bruno Silva', '4 dias'),
  (gen_random_uuid(), 'PRE-004', 'Teste de compra end-to-end', 'não iniciada', 'Bruno Silva', '2 dias'),
  (gen_random_uuid(), 'PRE-004', 'Página de venda publicada', 'não iniciada', 'Bruno Silva', '2 dias'),
  -- PRE-005
  (gen_random_uuid(), 'PRE-005', 'Cronograma de teasers', 'não iniciada', 'Gabriela Lima', '2 dias'),
  (gen_random_uuid(), 'PRE-005', 'Posts de contagem regressiva', 'não iniciada', 'Gabriela Lima', '3 dias'),
  (gen_random_uuid(), 'PRE-005', 'Ativação com influenciadores', 'não iniciada', 'Elena Martins', '2 dias'),
  -- LAN-001
  (gen_random_uuid(), 'LAN-001', 'Rider técnico finalizado', 'não iniciada', 'Diego Rocha', '3 dias'),
  (gen_random_uuid(), 'LAN-001', 'Cotações recebidas (mín. 3)', 'não iniciada', 'Diego Rocha', '4 dias'),
  (gen_random_uuid(), 'LAN-001', 'Contratos de fornecedores', 'não iniciada', 'Felipe Almeida', '3 dias'),
  (gen_random_uuid(), 'LAN-001', 'Cronograma de montagem', 'não iniciada', 'Diego Rocha', '2 dias'),
  -- LAN-002
  (gen_random_uuid(), 'LAN-002', 'Reservas de hotel', 'não iniciada', 'Felipe Almeida', '3 dias'),
  (gen_random_uuid(), 'LAN-002', 'Passagens aéreas/terrestres', 'não iniciada', 'Felipe Almeida', '3 dias'),
  (gen_random_uuid(), 'LAN-002', 'Transfers locais confirmados', 'não iniciada', 'Felipe Almeida', '2 dias'),
  -- LAN-003
  (gen_random_uuid(), 'LAN-003', 'Verificação final da plataforma', 'não iniciada', 'Bruno Silva', '1 dia'),
  (gen_random_uuid(), 'LAN-003', 'Monitoramento de vendas real-time', 'não iniciada', 'Bruno Silva', '2 dias'),
  (gen_random_uuid(), 'LAN-003', 'Suporte ao cliente ativo', 'não iniciada', 'Ricardo Nunes', '2 dias'),
  -- LAN-004
  (gen_random_uuid(), 'LAN-004', 'Roteiro de cobertura', 'não iniciada', 'Gabriela Lima', '1 dia'),
  (gen_random_uuid(), 'LAN-004', 'Equipe de social media no local', 'não iniciada', 'Gabriela Lima', '2 dias'),
  (gen_random_uuid(), 'LAN-004', 'Compilação e highlights', 'não iniciada', 'Bruno Silva', '2 dias'),
  -- POS-001
  (gen_random_uuid(), 'POS-001', 'Coleta de dados de mídia paga', 'não iniciada', 'Carla Mendes', '2 dias'),
  (gen_random_uuid(), 'POS-001', 'Análise de vendas por cidade', 'não iniciada', 'Bruno Silva', '2 dias'),
  (gen_random_uuid(), 'POS-001', 'Apresentação para stakeholders', 'não iniciada', 'Carla Mendes', '1 dia'),
  -- POS-002
  (gen_random_uuid(), 'POS-002', 'Criar formulário de pesquisa', 'não iniciada', 'Gabriela Lima', '1 dia'),
  (gen_random_uuid(), 'POS-002', 'Disparar e-mails', 'não iniciada', 'Gabriela Lima', '1 dia'),
  (gen_random_uuid(), 'POS-002', 'Compilar resultados', 'não iniciada', 'Gabriela Lima', '2 dias'),
  -- POS-003
  (gen_random_uuid(), 'POS-003', 'Pauta da retrospectiva', 'não iniciada', 'Ricardo Nunes', '1 dia'),
  (gen_random_uuid(), 'POS-003', 'Documento de lições aprendidas', 'não iniciada', 'Ricardo Nunes', '2 dias');
```

- [ ] **Step 2: Commit**

```bash
git add supabase/seed.sql
git commit -m "feat: add seed script with all mock data as SQL inserts"
```

---

## Task 12: Supabase Configuration + Disable Email Confirmation

**Files:** None (Supabase Dashboard configuration)

- [ ] **Step 1: Configure Supabase project**

In Supabase Dashboard:
1. Go to **Authentication > Providers > Email**
2. **Disable** "Confirm email" (for simplified signup)
3. Set minimum password length to 6

- [ ] **Step 2: Run migration.sql in SQL Editor**

1. Go to **SQL Editor** in Supabase Dashboard
2. Paste and run the contents of `supabase/migration.sql`
3. Verify all tables were created in **Table Editor**

- [ ] **Step 3: Run seed.sql in SQL Editor**

1. Go to **SQL Editor** in Supabase Dashboard
2. Paste and run the contents of `supabase/seed.sql`
3. Verify data in **Table Editor** — should see 6 macro_etapas, 30 acoes, 67 subtarefas

- [ ] **Step 4: Create .env with real credentials**

```bash
cp .env.example .env
```

Edit `.env` with your Supabase project URL and anon key from **Settings > API**.

- [ ] **Step 5: Promote first user to admin**

After creating your account through the app, run in SQL Editor:

```sql
UPDATE public.profiles SET role = 'admin' WHERE email = 'your-email@example.com';
```

---

## Task 13: Final Integration Test

- [ ] **Step 1: Install dependencies and start dev server**

Run: `cd /opt/tour-launch-hub && npm install && npm run dev`

- [ ] **Step 2: Test signup flow**

1. Open `http://localhost:8080`
2. Should redirect to `/login`
3. Create a new account
4. Should redirect to dashboard with data from Supabase

- [ ] **Step 3: Test RBAC**

1. Promote your user to admin (Task 12, Step 5)
2. Refresh page — should see "Gerenciar Usuários" in user menu
3. Create a second account — should have role `viewer`
4. As admin, change second user's role to `editor`

- [ ] **Step 4: Test CRUD (as editor)**

1. Login as editor user
2. Verify data loads correctly
3. Verify view toggle (Roadmap/Tabela) works
4. Verify filters work with Supabase data

- [ ] **Step 5: Verify build succeeds**

Run: `cd /opt/tour-launch-hub && npm run build`
Expected: Build completes without errors.

- [ ] **Step 6: Commit any remaining changes**

```bash
git add -A
git commit -m "feat: complete Supabase backend integration"
```
