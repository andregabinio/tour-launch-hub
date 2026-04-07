# Tour Launch Hub — Backend com Supabase

**Data:** 2026-04-07
**Abordagem:** Supabase Client-Side Puro (sem servidor custom)

---

## 1. Visao Geral

Conectar o frontend React existente ao Supabase para persistir dados, autenticar usuarios e controlar acesso por roles. Sem backend intermediario — o frontend se comunica diretamente com o Supabase via `@supabase/supabase-js`.

### Decisoes Principais

- **Auth:** Email/senha simplificado (sem confirmacao de email)
- **Acesso:** RBAC com 3 roles — Admin, Editor, Viewer
- **Real-time:** Nao, refresh manual
- **Logica de dependencias/bloqueio:** Permanece no frontend (Index.tsx)

---

## 2. Schema do Banco

### 2.1 profiles

Criado automaticamente via trigger apos registro no Supabase Auth.

| Coluna     | Tipo        | Notas                        |
|------------|-------------|------------------------------|
| id         | uuid PK     | FK para auth.users.id        |
| nome       | text        | Nome do usuario              |
| email      | text        | Email do usuario             |
| role       | text        | 'admin' / 'editor' / 'viewer' (default: 'viewer') |
| created_at | timestamptz | Auto                         |
| updated_at | timestamptz | Auto                         |

### 2.2 macro_etapas

Fases do roadmap com configuracao visual.

| Coluna     | Tipo     | Notas                         |
|------------|----------|-------------------------------|
| id         | text PK  | Ex: "planejamento-estrategico"|
| nome       | text     | Nome da fase                  |
| descricao  | text     | Descricao opcional            |
| cor        | text     | Cor principal (hex/tailwind)  |
| cor_bg     | text     | Cor de fundo                  |
| cor_border | text     | Cor da borda                  |
| ordem      | integer  | Ordem de exibicao             |

### 2.3 acoes

Acoes do roadmap com datas, prioridade e dependencias.

| Coluna         | Tipo        | Notas                              |
|----------------|-------------|------------------------------------|
| id             | text PK     | Ex: "PLA-001"                      |
| titulo         | text        | Titulo da acao                     |
| descricao      | text        | Descricao detalhada                |
| macro_etapa_id | text FK     | Referencia macro_etapas.id         |
| responsavel    | text        | Nome do responsavel                |
| prioridade     | text        | 'alta' / 'media' / 'baixa'        |
| status         | text        | 'nao iniciada' / 'em andamento' / 'concluida' |
| situacao_prazo | text        | 'no prazo' / 'atrasada'           |
| tempo_estimado | text        | Ex: "5 dias"                       |
| data_inicio    | date        | Data de inicio                     |
| data_fim       | date        | Data de fim                        |
| dependencia_de | text FK     | Referencia acoes.id (nullable)     |
| created_by     | uuid FK     | Referencia profiles.id             |
| created_at     | timestamptz | Auto                               |
| updated_at     | timestamptz | Auto                               |

### 2.4 subtarefas

Subtarefas vinculadas a uma acao.

| Coluna         | Tipo        | Notas                    |
|----------------|-------------|--------------------------|
| id             | uuid PK     | Auto-gerado              |
| acao_id        | text FK     | Referencia acoes.id      |
| titulo         | text        | Titulo da subtarefa      |
| status         | text        | Mesmo enum de acoes      |
| responsavel    | text        | Nome do responsavel      |
| tempo_estimado | text        | Ex: "2 horas"            |
| created_at     | timestamptz | Auto                     |
| updated_at     | timestamptz | Auto                     |

---

## 3. Row Level Security (RLS)

Todas as tabelas com RLS habilitado. Policies baseadas em `profiles.role`.

### Matriz de Permissoes

| Tabela       | Admin          | Editor              | Viewer          |
|--------------|----------------|----------------------|-----------------|
| profiles     | CRUD todos     | READ todos, UPDATE proprio | READ todos, UPDATE proprio |
| macro_etapas | CRUD           | READ                 | READ            |
| acoes        | CRUD todas     | READ todas, CREATE, UPDATE | READ todas |
| subtarefas   | CRUD todas     | READ todas, CREATE, UPDATE | READ todas |

### Helper Function

```sql
CREATE FUNCTION public.get_user_role()
RETURNS text AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;
```

Todas as policies usam `get_user_role()` para verificar permissao.

---

## 4. Integracao Frontend

### 4.1 Novos Arquivos

| Arquivo                    | Funcao                              |
|----------------------------|-------------------------------------|
| src/lib/supabase.ts        | Cliente Supabase (singleton)        |
| src/contexts/AuthContext.tsx| Estado de auth global               |
| src/hooks/useAuth.ts       | Login, logout, registro             |
| src/hooks/useProfile.ts    | Perfil + role do usuario            |
| src/hooks/useAcoes.ts      | CRUD acoes via React Query          |
| src/hooks/useSubtarefas.ts | CRUD subtarefas via React Query     |
| src/pages/Login.tsx        | Tela de login/registro              |
| src/components/ProtectedRoute.tsx | Redireciona se nao logado    |
| src/components/admin/UserManagement.tsx | Painel de gerenciamento de usuarios |

### 4.2 Arquivos Modificados

| Arquivo           | Mudanca                                           |
|-------------------|---------------------------------------------------|
| src/App.tsx       | Adicionar AuthProvider, ProtectedRoute, rota /login |
| src/pages/Index.tsx | Trocar mockData por useAcoes() + useSubtarefas() |
| src/components/roadmap/TopBar.tsx | Botao admin + logout            |
| .env              | VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY        |
| package.json      | Adicionar @supabase/supabase-js                    |

### 4.3 Fluxo de Dados

1. `useAuth` gerencia sessao via `supabase.auth`
2. `AuthContext` fornece usuario + role para toda a app
3. Hooks de dados usam React Query + `supabase.from('tabela')`
4. Componentes condicionam acoes ao role (ex: botao "Editar" so para Admin/Editor)
5. `Index.tsx` troca `mockData` por dados reais — mesma interface

---

## 5. Fluxo de Autenticacao

### Registro
1. Usuario preenche nome + email + senha
2. `supabase.auth.signUp()` cria conta
3. Trigger Postgres cria profile com role = 'viewer'
4. Redireciona para dashboard

### Login
1. Usuario preenche email + senha
2. `supabase.auth.signInWithPassword()`
3. AuthContext carrega profile + role
4. Redireciona para dashboard

### Logout
1. `supabase.auth.signOut()`
2. Redireciona para login

### Primeiro Admin
- Seed manual via SQL no Supabase Dashboard
- Depois o admin gerencia roles pelo painel

---

## 6. Painel Admin

Acessivel apenas para usuarios com role 'admin'. Acessado via botao no TopBar.

### Funcionalidades
- Lista usuarios com nome, email e role
- Admin altera role via dropdown (viewer/editor/admin)
- Admin nao pode alterar seu proprio role
- Sem convites, sem exclusao de usuarios

---

## 7. Configuracao Supabase

### Variaveis de Ambiente
```
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

### Trigger de Criacao de Profile
```sql
CREATE FUNCTION public.handle_new_user()
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
```

---

## 8. Fora de Escopo

- Real-time / WebSockets
- Confirmacao de email
- Login social (Google, GitHub)
- Upload de arquivos
- Notificacoes por email
- Historico de alteracoes / audit log
- Exclusao de usuarios
- Convites por email
