# CSV Import — Design Spec

**Data:** 2026-04-12
**Status:** Aprovado
**Abordagem:** Frontend-only (PapaParse + hooks existentes)

## Resumo

Permitir que o usuário baixe um modelo CSV, preencha com dados de ações (título, descrição, subtarefas, responsáveis, prioridade, datas, dependências) e faça upload para criar automaticamente todas as ações no projeto. O sistema calcula ID, tempo estimado e situação do prazo.

Funciona em dois contextos:
- **Dashboard:** cria um novo projeto a partir do CSV
- **ProjetoPage:** importa ações para um projeto existente

## Formato do CSV Modelo

### Colunas

| Coluna | Obrigatória | Tipo | Default | Notas |
|--------|:-----------:|------|---------|-------|
| Macro Etapa | Sim | Texto | — | Se não existe no projeto, cria automaticamente |
| Título | Sim | Texto | — | Identificador da ação. Deve ser único no CSV |
| Descrição | Não | Texto | `""` | Texto livre |
| Subtarefas | Não | Texto | — | Separadas por `;` (ex: `Criar logo;Definir paleta`) |
| Responsável | Não | Texto | `null` | Texto livre |
| Prioridade | Não | Texto | `média` | Valores: `alta`, `média`, `baixa` |
| Data Início | Sim | Data | — | Formato DD/MM/AAAA |
| Data Fim | Sim | Data | — | Formato DD/MM/AAAA |
| Dependência | Não | Texto | `null` | Título de outra ação do CSV ou do projeto |

### Campos calculados automaticamente

- **ID:** UUID gerado via `crypto.randomUUID()`
- **Tempo Estimado:** `differenceInDays(dataFim, dataInicio)` + " dias" (date-fns)
- **Situação Prazo:** `dataFim < hoje` → "atrasada", senão → "no prazo"
- **Status:** sempre "não iniciada"

### Arquivo modelo

O CSV modelo contém os headers + 3 linhas de exemplo pré-preenchidas para o usuário entender o formato. Codificação UTF-8 com BOM (para Excel abrir corretamente com acentos).

## Fluxo do Dialog (3 Steps)

### Step 1 — Upload

- Área de drag & drop com border dashed (#79B2C9)
- Ícone de upload + texto "Arraste o CSV aqui ou clique para selecionar"
- Aceita apenas arquivos `.csv`
- Botão secundário "Baixar Modelo CSV" abaixo da drop zone
- **Modo Dashboard (projetoId = undefined):** campo extra `Input` para nome do projeto
- **Modo ProjetoPage (projetoId definido):** sem campo extra
- Ao selecionar arquivo, avança automaticamente para Step 2

### Step 2 — Preview + Validação

- **Barra de resumo no topo:** "X ações · Y subtarefas · Z macro etapas · W avisos"
- **Tabela** com colunas: Macro Etapa, Título, Responsável, Prioridade, Data Início, Data Fim, Tempo Estimado, Dependência
  - Subtarefas aparecem como badges compactos na célula do Título
- **Linhas com aviso:** fundo amarelo sutil (#E2964E/10%) + ícone ⚠️ com tooltip
- **Linhas com erro:** fundo rosa sutil (#BA5569/10%) + ícone ❌ com tooltip
- **Se houver erros:** botão "Importar" desabilitado + mensagem "Corrija X erros no CSV e suba novamente"
- **Se só avisos:** botão "Importar" habilitado com texto "Importar (W avisos serão ignorados)"
- **Se tudo limpo:** botão "Importar" habilitado
- Botão "Voltar" para trocar o arquivo

### Step 3 — Resultado

- **Sucesso:** ícone verde ✓ + "X ações importadas com sucesso!"
  - Modo Dashboard: botão "Abrir Projeto" → navega para `/projeto/:id`
  - Modo ProjetoPage: botão "Fechar" → dialog fecha, dados aparecem via invalidação React Query
- **Falha parcial:** lista as ações que falharam com motivo

## Posicionamento dos Botões

### Dashboard

Ao lado do botão "Novo Projeto" no header:
```
[+ Novo Projeto]  [↑ Importar CSV]
```
- Só aparece para role `admin`
- variant `outline` para hierarquia visual (secundário ao "Novo Projeto")

### ProjetoPage (TopBar)

Junto aos controles existentes:
```
[← Voltar]     [Timeline | Cards | Tabela]     [↑ Importar CSV]  [⚙ Menu]
```
- Aparece para `admin` e `editor`

### Botão "Baixar Modelo"

Apenas dentro do Dialog (Step 1). Não precisa estar fora — o fluxo natural é: clicar "Importar CSV" → ver opção de baixar modelo.

## Validações

### Erros (bloqueiam importação)

| Validação | Mensagem |
|-----------|----------|
| Título em branco | "Título é obrigatório" |
| Macro Etapa em branco | "Macro Etapa é obrigatória" |
| Data Início em branco ou inválida | "Data Início inválida (use DD/MM/AAAA)" |
| Data Fim em branco ou inválida | "Data Fim inválida (use DD/MM/AAAA)" |
| Data Fim anterior a Data Início | "Data Fim deve ser posterior a Data Início" |
| Título duplicado no CSV | "Título duplicado: 'X'" |

### Avisos (permitem importação)

| Validação | Comportamento |
|-----------|---------------|
| Prioridade com valor inválido | Usa `média` como default |
| Dependência não encontrada | Importa com `dependencia_de = null` |

### Campos opcionais vazios

| Campo | Comportamento |
|-------|---------------|
| Responsável em branco | `null` |
| Descrição em branco | `""` |
| Subtarefas em branco | Nenhuma subtarefa criada |
| Prioridade em branco | `média` |
| Dependência em branco | `null` |

## Lógica de Parsing

### PapaParse config

```typescript
{
  header: true,
  skipEmptyLines: true,
  encoding: 'UTF-8',
  // Detecta delimitador automaticamente (vírgula ou ponto-e-vírgula)
}
```

PapaParse detecta o delimitador automaticamente. Isso cobre tanto CSV padrão (`,`) quanto CSV do Excel brasileiro (`;`).

### Resolução de macro etapas

1. Buscar macro etapas existentes do projeto
2. Para cada nome único de macro etapa no CSV:
   - Se já existe no projeto (match case-insensitive): usar o ID existente
   - Se não existe: criar nova com:
     - `id`: UUID gerado
     - `nome`: nome do CSV
     - `descricao`: null
     - `cor`: rotação cíclica pelas cores secundárias (#79B2C9, #8EBC62, #E2964E, #BA5569, #EAD86C)
     - `ordem`: continuando após a última etapa existente
     - `projeto_id`: ID do projeto

### Resolução de dependências

1. Montar mapa `titulo (lowercase) → uuid` de todas as ações do CSV
2. Buscar ações já existentes no projeto e adicionar ao mapa
3. Para cada ação com dependência:
   - Buscar título (case-insensitive) no mapa
   - Se encontrou: `dependencia_de = uuid`
   - Se não encontrou: aviso + `dependencia_de = null`

### Ordem de inserção

1. Criar projeto (se modo Dashboard): nome vem do campo Input, descrição = "Projeto importado via CSV", cor = #3B82F6 (default), status = "ativo"
2. Criar macro etapas novas
3. Criar ações (todas, com IDs pré-gerados)
4. Criar subtarefas (vinculadas aos IDs das ações)

## Arquitetura de Componentes

### Novos arquivos

```
src/
├── components/csv-import/
│   ├── CsvImportDialog.tsx       — Dialog principal com stepper
│   ├── CsvUploadStep.tsx         — Drop zone + nome projeto + baixar modelo
│   ├── CsvPreviewStep.tsx        — Tabela de preview com avisos/erros
│   └── CsvResultStep.tsx         — Tela de sucesso/falha
├── hooks/
│   └── useCsvImport.ts           — Parsing, validação, cálculos e inserção
├── utils/
│   └── csvTemplate.ts            — Geração do CSV modelo para download
```

### Hook `useCsvImport`

```typescript
interface UseCsvImportReturn {
  // Estado
  step: 1 | 2 | 3;
  parsedData: ParsedRow[] | null;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  isImporting: boolean;
  importResult: ImportResult | null;
  
  // Ações
  parseFile: (file: File) => void;
  goBack: () => void;
  importToProject: (projetoId: string) => Promise<void>;
  reset: () => void;
}

interface ParsedRow {
  macroEtapa: string;
  titulo: string;
  descricao: string;
  subtarefas: string[];
  responsavel: string | null;
  prioridade: 'alta' | 'média' | 'baixa';
  dataInicio: string;       // ISO format (convertido de DD/MM/AAAA)
  dataFim: string;          // ISO format
  tempoEstimado: string;    // Calculado: "X dias"
  dependencia: string | null;
  // Validação
  rowErrors: ValidationIssue[];
  rowWarnings: ValidationIssue[];
}

interface ValidationIssue {
  row: number;
  column: string;
  message: string;
}

interface ImportResult {
  success: boolean;
  acoesCreated: number;
  subtarefasCreated: number;
  macroEtapasCreated: number;
  failures: { row: number; titulo: string; error: string }[];
}
```

### Integração

- `Dashboard.tsx`: adiciona botão "Importar CSV" + `<CsvImportDialog />`
- `ProjetoPage.tsx` (ou `TopBar.tsx`): adiciona botão + `<CsvImportDialog projetoId={id} />`

### Dependência nova

- `papaparse` (~7KB gzip) — única dependência adicionada
- `@types/papaparse` — tipos TypeScript

## Identidade Visual

- **Drop zone:** border dashed 2px #79B2C9, border-radius 12px, fundo transparente, hover: fundo #79B2C9/5%
- **Avisos:** fundo #E2964E/10%, badge laranja
- **Erros:** fundo #BA5569/10%, badge rosa
- **Sucesso:** ícone #8EBC62
- **Botão importar:** bg #2A5EA8 (primária)
- **Botão baixar modelo:** variant outline
- **Fonte:** Outfit (consistente com o resto do app)
- **Dialog:** max-width 800px (para acomodar a tabela de preview)
