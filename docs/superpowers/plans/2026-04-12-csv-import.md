# CSV Import Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow users to download a CSV template, fill it with action data, and upload it to automatically create all actions (with subtasks, dependencies, calculated fields) in a new or existing project.

**Architecture:** Frontend-only approach using PapaParse for CSV parsing, existing Supabase hooks for database inserts, and a multi-step Dialog (upload → preview → result) built with shadcn/ui components. No backend changes needed.

**Tech Stack:** React 18, TypeScript, PapaParse, date-fns (already installed), Tailwind CSS, shadcn/ui, Supabase JS client, React Query.

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `src/utils/csvTemplate.ts` | Create | Generate CSV template for download |
| `src/hooks/useCsvImport.ts` | Create | Parse, validate, calculate fields, orchestrate inserts |
| `src/components/csv-import/CsvImportDialog.tsx` | Create | Multi-step dialog shell |
| `src/components/csv-import/CsvUploadStep.tsx` | Create | Drag & drop zone + project name field + download button |
| `src/components/csv-import/CsvPreviewStep.tsx` | Create | Preview table with errors/warnings |
| `src/components/csv-import/CsvResultStep.tsx` | Create | Success/failure result screen |
| `src/pages/Dashboard.tsx` | Modify | Add "Importar CSV" button + dialog |
| `src/components/roadmap/TopBar.tsx` | Modify | Add "Importar CSV" button + prop |
| `src/pages/ProjetoPage.tsx` | Modify | Add CsvImportDialog + wire TopBar prop |
| `package.json` | Modify | Add papaparse + @types/papaparse |

---

### Task 1: Install PapaParse

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install papaparse and its types**

```bash
cd /root/tour-launch-hub && npm install papaparse && npm install -D @types/papaparse
```

- [ ] **Step 2: Verify installation**

```bash
cd /root/tour-launch-hub && node -e "require('papaparse'); console.log('papaparse OK')"
```

Expected: `papaparse OK`

- [ ] **Step 3: Commit**

```bash
cd /root/tour-launch-hub
git add package.json package-lock.json
git commit -m "chore: add papaparse dependency for CSV import"
```

---

### Task 2: CSV Template Generator

**Files:**
- Create: `src/utils/csvTemplate.ts`

- [ ] **Step 1: Create the CSV template utility**

Create `src/utils/csvTemplate.ts`:

```typescript
const CSV_HEADERS = [
  'Macro Etapa',
  'Título',
  'Descrição',
  'Subtarefas',
  'Responsável',
  'Prioridade',
  'Data Início',
  'Data Fim',
  'Dependência',
];

const EXAMPLE_ROWS = [
  [
    'Planejamento',
    'Definir escopo do projeto',
    'Levantar requisitos e definir entregas',
    'Reunião com stakeholders;Documento de escopo;Aprovação',
    'João Silva',
    'alta',
    '15/04/2026',
    '20/04/2026',
    '',
  ],
  [
    'Planejamento',
    'Criar cronograma',
    'Montar timeline com marcos e dependências',
    'Draft inicial;Revisão;Versão final',
    'Maria Santos',
    'média',
    '21/04/2026',
    '25/04/2026',
    'Definir escopo do projeto',
  ],
  [
    'Execução',
    'Desenvolver identidade visual',
    'Criar logo, paleta de cores e guia de marca',
    'Criar logo;Definir paleta;Aprovar com cliente',
    'Ana Costa',
    'alta',
    '26/04/2026',
    '05/05/2026',
    'Criar cronograma',
  ],
];

function escapeCsvField(field: string): string {
  if (field.includes(',') || field.includes('"') || field.includes('\n') || field.includes(';')) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}

function rowToCsvLine(row: string[]): string {
  return row.map(escapeCsvField).join(',');
}

export function downloadCsvTemplate(): void {
  const lines = [
    rowToCsvLine(CSV_HEADERS),
    ...EXAMPLE_ROWS.map(rowToCsvLine),
  ];
  const csvContent = lines.join('\r\n');
  // UTF-8 BOM so Excel opens with correct encoding for accented chars
  const bom = '\uFEFF';
  const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'modelo-importacao-acoes.csv';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export { CSV_HEADERS };
```

- [ ] **Step 2: Verify build compiles**

```bash
cd /root/tour-launch-hub && npx tsc --noEmit 2>&1 | head -20
```

Expected: No errors related to `csvTemplate.ts`

- [ ] **Step 3: Commit**

```bash
cd /root/tour-launch-hub
git add src/utils/csvTemplate.ts
git commit -m "feat: CSV template generator with download function"
```

---

### Task 3: CSV Import Hook — Parsing & Validation

**Files:**
- Create: `src/hooks/useCsvImport.ts`

- [ ] **Step 1: Create the hook with types, parsing, and validation logic**

Create `src/hooks/useCsvImport.ts`:

```typescript
import { useState, useCallback } from 'react';
import Papa from 'papaparse';
import { differenceInDays, parse, isValid, isBefore } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

// --- Types ---

export interface ValidationIssue {
  row: number;
  column: string;
  message: string;
}

export interface ParsedRow {
  macroEtapa: string;
  titulo: string;
  descricao: string;
  subtarefas: string[];
  responsavel: string | null;
  prioridade: 'alta' | 'média' | 'baixa';
  dataInicio: string; // ISO yyyy-MM-dd
  dataFim: string;    // ISO yyyy-MM-dd
  tempoEstimado: string;
  dependencia: string | null;
  rowErrors: ValidationIssue[];
  rowWarnings: ValidationIssue[];
}

export interface ImportResult {
  success: boolean;
  acoesCreated: number;
  subtarefasCreated: number;
  macroEtapasCreated: number;
  projetoId: string;
  failures: { row: number; titulo: string; error: string }[];
}

type Step = 1 | 2 | 3;

const VALID_PRIORIDADES = ['alta', 'média', 'baixa'];

const MACRO_ETAPA_COLORS = ['#79B2C9', '#8EBC62', '#E2964E', '#BA5569', '#EAD86C'];

// --- Helpers ---

function parseDateBR(value: string): Date | null {
  const trimmed = value.trim();
  const d = parse(trimmed, 'dd/MM/yyyy', new Date());
  return isValid(d) ? d : null;
}

function toISODate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function normalizeHeader(h: string): string {
  return h.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

const HEADER_MAP: Record<string, string> = {
  'macro etapa': 'macroEtapa',
  'titulo': 'titulo',
  'descricao': 'descricao',
  'subtarefas': 'subtarefas',
  'responsavel': 'responsavel',
  'prioridade': 'prioridade',
  'data inicio': 'dataInicio',
  'data fim': 'dataFim',
  'dependencia': 'dependencia',
};

function mapHeaders(raw: Record<string, string>): Record<string, string> {
  const mapped: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw)) {
    const norm = normalizeHeader(key);
    const field = HEADER_MAP[norm];
    if (field) {
      mapped[field] = value?.trim() ?? '';
    }
  }
  return mapped;
}

// --- Parse & Validate ---

function parseAndValidateRows(rawRows: Record<string, string>[]): {
  rows: ParsedRow[];
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
} {
  const allErrors: ValidationIssue[] = [];
  const allWarnings: ValidationIssue[] = [];
  const titlesSeenLower = new Map<string, number>();
  const rows: ParsedRow[] = [];

  for (let i = 0; i < rawRows.length; i++) {
    const rowNum = i + 2; // +2 because row 1 is header
    const mapped = mapHeaders(rawRows[i]);
    const rowErrors: ValidationIssue[] = [];
    const rowWarnings: ValidationIssue[] = [];

    // Required fields
    const macroEtapa = mapped.macroEtapa || '';
    const titulo = mapped.titulo || '';
    const dataInicioRaw = mapped.dataInicio || '';
    const dataFimRaw = mapped.dataFim || '';

    if (!macroEtapa) {
      const issue = { row: rowNum, column: 'Macro Etapa', message: 'Macro Etapa é obrigatória' };
      rowErrors.push(issue);
      allErrors.push(issue);
    }
    if (!titulo) {
      const issue = { row: rowNum, column: 'Título', message: 'Título é obrigatório' };
      rowErrors.push(issue);
      allErrors.push(issue);
    } else {
      const lower = titulo.toLowerCase();
      if (titlesSeenLower.has(lower)) {
        const issue = { row: rowNum, column: 'Título', message: `Título duplicado: '${titulo}' (linha ${titlesSeenLower.get(lower)})` };
        rowErrors.push(issue);
        allErrors.push(issue);
      } else {
        titlesSeenLower.set(lower, rowNum);
      }
    }

    // Dates
    const dataInicioParsed = dataInicioRaw ? parseDateBR(dataInicioRaw) : null;
    const dataFimParsed = dataFimRaw ? parseDateBR(dataFimRaw) : null;

    if (!dataInicioRaw || !dataInicioParsed) {
      const issue = { row: rowNum, column: 'Data Início', message: 'Data Início inválida (use DD/MM/AAAA)' };
      rowErrors.push(issue);
      allErrors.push(issue);
    }
    if (!dataFimRaw || !dataFimParsed) {
      const issue = { row: rowNum, column: 'Data Fim', message: 'Data Fim inválida (use DD/MM/AAAA)' };
      rowErrors.push(issue);
      allErrors.push(issue);
    }
    if (dataInicioParsed && dataFimParsed && isBefore(dataFimParsed, dataInicioParsed)) {
      const issue = { row: rowNum, column: 'Data Fim', message: 'Data Fim deve ser posterior a Data Início' };
      rowErrors.push(issue);
      allErrors.push(issue);
    }

    // Optional fields
    const descricao = mapped.descricao || '';
    const subtarefasRaw = mapped.subtarefas || '';
    const subtarefas = subtarefasRaw ? subtarefasRaw.split(';').map(s => s.trim()).filter(Boolean) : [];
    const responsavel = mapped.responsavel || null;
    const dependencia = mapped.dependencia || null;

    // Prioridade
    let prioridade: 'alta' | 'média' | 'baixa' = 'média';
    const prioridadeRaw = (mapped.prioridade || '').toLowerCase().trim();
    if (prioridadeRaw) {
      if (VALID_PRIORIDADES.includes(prioridadeRaw)) {
        prioridade = prioridadeRaw as 'alta' | 'média' | 'baixa';
      } else {
        const issue = { row: rowNum, column: 'Prioridade', message: `Prioridade '${mapped.prioridade}' inválida, usando 'média'` };
        rowWarnings.push(issue);
        allWarnings.push(issue);
      }
    }

    // Calculated fields
    let tempoEstimado = '';
    if (dataInicioParsed && dataFimParsed) {
      const days = differenceInDays(dataFimParsed, dataInicioParsed);
      tempoEstimado = `${days} dia${days !== 1 ? 's' : ''}`;
    }

    rows.push({
      macroEtapa,
      titulo,
      descricao,
      subtarefas,
      responsavel,
      prioridade,
      dataInicio: dataInicioParsed ? toISODate(dataInicioParsed) : '',
      dataFim: dataFimParsed ? toISODate(dataFimParsed) : '',
      tempoEstimado,
      dependencia,
      rowErrors,
      rowWarnings,
    });
  }

  return { rows, errors: allErrors, warnings: allWarnings };
}

// --- Hook ---

export function useCsvImport() {
  const queryClient = useQueryClient();
  const [step, setStep] = useState<Step>(1);
  const [parsedData, setParsedData] = useState<ParsedRow[] | null>(null);
  const [errors, setErrors] = useState<ValidationIssue[]>([]);
  const [warnings, setWarnings] = useState<ValidationIssue[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const parseFile = useCallback((file: File) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      encoding: 'UTF-8',
      complete: (results) => {
        const { rows, errors: errs, warnings: warns } = parseAndValidateRows(results.data);
        setParsedData(rows);
        setErrors(errs);
        setWarnings(warns);
        setStep(2);
      },
      error: (err) => {
        setErrors([{ row: 0, column: '', message: `Erro ao ler CSV: ${err.message}` }]);
        setStep(2);
      },
    });
  }, []);

  const goBack = useCallback(() => {
    setStep(1);
    setParsedData(null);
    setErrors([]);
    setWarnings([]);
  }, []);

  const reset = useCallback(() => {
    setStep(1);
    setParsedData(null);
    setErrors([]);
    setWarnings([]);
    setIsImporting(false);
    setImportResult(null);
  }, []);

  const importToProject = useCallback(async (projetoId: string) => {
    if (!parsedData || errors.length > 0) return;
    setIsImporting(true);

    const failures: ImportResult['failures'] = [];
    let macroEtapasCreated = 0;
    let acoesCreated = 0;
    let subtarefasCreated = 0;

    try {
      // 1. Fetch existing macro etapas for the project
      const { data: existingME } = await supabase
        .from('macro_etapas')
        .select('id, nome, ordem')
        .eq('projeto_id', projetoId)
        .order('ordem');

      const meMap = new Map<string, string>(); // lowercase name → id
      let nextOrdem = 0;
      for (const me of existingME ?? []) {
        meMap.set(me.nome.toLowerCase(), me.id);
        if (me.ordem >= nextOrdem) nextOrdem = me.ordem + 1;
      }

      // 2. Determine which macro etapas need to be created
      const uniqueMENames: string[] = [];
      for (const row of parsedData) {
        const lower = row.macroEtapa.toLowerCase();
        if (!meMap.has(lower) && !uniqueMENames.some(n => n.toLowerCase() === lower)) {
          uniqueMENames.push(row.macroEtapa);
        }
      }

      // 3. Create new macro etapas
      for (let i = 0; i < uniqueMENames.length; i++) {
        const nome = uniqueMENames[i];
        const id = crypto.randomUUID();
        const cor = MACRO_ETAPA_COLORS[i % MACRO_ETAPA_COLORS.length];
        const { error } = await supabase.from('macro_etapas').insert({
          id,
          nome,
          descricao: null,
          cor,
          cor_bg: '',
          cor_border: '',
          ordem: nextOrdem + i,
          projeto_id: projetoId,
        });
        if (error) throw new Error(`Erro ao criar macro etapa '${nome}': ${error.message}`);
        meMap.set(nome.toLowerCase(), id);
        macroEtapasCreated++;
      }

      // 4. Fetch existing acoes for dependency resolution
      const { data: existingAcoes } = await supabase
        .from('acoes')
        .select('id, titulo, macro_etapa_id, macro_etapas(projeto_id)')
        .order('data_inicio');

      const existingTitleMap = new Map<string, string>(); // lowercase title → id
      for (const a of existingAcoes ?? []) {
        if ((a.macro_etapas as any)?.projeto_id === projetoId) {
          existingTitleMap.set(a.titulo.toLowerCase(), a.id);
        }
      }

      // 5. Pre-generate IDs for all CSV ações and build title→id map
      const acaoIds: string[] = parsedData.map(() => crypto.randomUUID());
      const csvTitleMap = new Map<string, string>(); // lowercase title → id
      for (let i = 0; i < parsedData.length; i++) {
        csvTitleMap.set(parsedData[i].titulo.toLowerCase(), acaoIds[i]);
      }

      // Combined map for dependency resolution (CSV takes precedence)
      const allTitleMap = new Map([...existingTitleMap, ...csvTitleMap]);

      // 6. Calculate situacao_prazo
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // 7. Insert ações
      for (let i = 0; i < parsedData.length; i++) {
        const row = parsedData[i];
        if (row.rowErrors.length > 0) continue; // skip rows with errors (shouldn't happen since we block import)

        const macroEtapaId = meMap.get(row.macroEtapa.toLowerCase());
        if (!macroEtapaId) {
          failures.push({ row: i + 2, titulo: row.titulo, error: 'Macro etapa não encontrada' });
          continue;
        }

        // Resolve dependency
        let dependenciaDe: string | null = null;
        if (row.dependencia) {
          dependenciaDe = allTitleMap.get(row.dependencia.toLowerCase()) ?? null;
        }

        // Situação prazo
        const dataFimDate = new Date(row.dataFim + 'T00:00:00');
        const situacaoPrazo = dataFimDate < today ? 'atrasada' : 'no prazo';

        const { error } = await supabase.from('acoes').insert({
          id: acaoIds[i],
          titulo: row.titulo,
          descricao: row.descricao,
          macro_etapa_id: macroEtapaId,
          responsavel: row.responsavel,
          prioridade: row.prioridade,
          status: 'não iniciada',
          situacao_prazo: situacaoPrazo,
          tempo_estimado: row.tempoEstimado,
          data_inicio: row.dataInicio,
          data_fim: row.dataFim,
          dependencia_de: dependenciaDe,
        });

        if (error) {
          failures.push({ row: i + 2, titulo: row.titulo, error: error.message });
          continue;
        }
        acoesCreated++;

        // 8. Insert subtarefas for this ação
        for (const subTitulo of row.subtarefas) {
          const { error: subError } = await supabase.from('subtarefas').insert({
            acao_id: acaoIds[i],
            titulo: subTitulo,
            status: 'não iniciada',
            responsavel: null,
            tempo_estimado: null,
          });
          if (!subError) subtarefasCreated++;
        }
      }

      const result: ImportResult = {
        success: failures.length === 0,
        acoesCreated,
        subtarefasCreated,
        macroEtapasCreated,
        projetoId,
        failures,
      };

      setImportResult(result);
      setStep(3);

      // Invalidate queries so the UI refreshes
      queryClient.invalidateQueries({ queryKey: ['acoes'] });
      queryClient.invalidateQueries({ queryKey: ['macro_etapas'] });
      queryClient.invalidateQueries({ queryKey: ['projetos'] });
    } catch (err: any) {
      setImportResult({
        success: false,
        acoesCreated,
        subtarefasCreated,
        macroEtapasCreated,
        projetoId,
        failures: [{ row: 0, titulo: '', error: err.message }],
      });
      setStep(3);
    } finally {
      setIsImporting(false);
    }
  }, [parsedData, errors, queryClient]);

  return {
    step,
    parsedData,
    errors,
    warnings,
    isImporting,
    importResult,
    parseFile,
    goBack,
    importToProject,
    reset,
  };
}
```

- [ ] **Step 2: Verify build compiles**

```bash
cd /root/tour-launch-hub && npx tsc --noEmit 2>&1 | head -20
```

Expected: No errors related to `useCsvImport.ts`

- [ ] **Step 3: Commit**

```bash
cd /root/tour-launch-hub
git add src/hooks/useCsvImport.ts
git commit -m "feat: useCsvImport hook — CSV parsing, validation, and batch insert"
```

---

### Task 4: CsvUploadStep Component

**Files:**
- Create: `src/components/csv-import/CsvUploadStep.tsx`

- [ ] **Step 1: Create the upload step component**

Create `src/components/csv-import/CsvUploadStep.tsx`:

```typescript
import { useRef, useState, type DragEvent } from 'react';
import { Upload, Download, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { downloadCsvTemplate } from '@/utils/csvTemplate';

interface CsvUploadStepProps {
  projetoId?: string;
  projectName: string;
  onProjectNameChange: (name: string) => void;
  onFileSelected: (file: File) => void;
}

export default function CsvUploadStep({
  projetoId,
  projectName,
  onProjectNameChange,
  onFileSelected,
}: CsvUploadStepProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = (file: File) => {
    if (file.name.endsWith('.csv') || file.type === 'text/csv') {
      onFileSelected(file);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div className="space-y-6">
      {/* Project name field (only in Dashboard mode) */}
      {!projetoId && (
        <div className="space-y-2">
          <Label htmlFor="project-name" className="text-sm font-medium">
            Nome do Projeto
          </Label>
          <Input
            id="project-name"
            value={projectName}
            onChange={(e) => onProjectNameChange(e.target.value)}
            placeholder="Ex: Tour Curitiba 2026"
          />
        </div>
      )}

      {/* Drop zone */}
      <div
        role="button"
        tabIndex={0}
        className={`flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed p-10 transition-colors cursor-pointer ${
          isDragging
            ? 'border-[#79B2C9] bg-[#79B2C9]/5'
            : 'border-[#79B2C9]/50 hover:border-[#79B2C9] hover:bg-[#79B2C9]/5'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            fileInputRef.current?.click();
          }
        }}
        aria-label="Área de upload de CSV"
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#79B2C9]/10">
          <Upload className="h-7 w-7 text-[#79B2C9]" />
        </div>
        <div className="text-center">
          <p className="text-base font-medium text-foreground">
            Arraste o CSV aqui ou clique para selecionar
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Apenas arquivos .csv
          </p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={handleInputChange}
        />
      </div>

      {/* Download template button */}
      <div className="flex justify-center">
        <Button
          variant="outline"
          className="gap-2"
          onClick={(e) => {
            e.stopPropagation();
            downloadCsvTemplate();
          }}
        >
          <Download className="h-4 w-4" />
          Baixar Modelo CSV
        </Button>
      </div>

      {/* Help text */}
      <div className="rounded-lg border border-border bg-muted/50 p-4">
        <div className="flex items-start gap-3">
          <FileSpreadsheet className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
          <div className="text-sm text-muted-foreground space-y-1">
            <p className="font-medium text-foreground">Como usar:</p>
            <ol className="list-decimal list-inside space-y-0.5">
              <li>Baixe o modelo CSV acima</li>
              <li>Preencha com suas ações (título, descrição, datas, etc.)</li>
              <li>Separe subtarefas com ponto-e-vírgula (;)</li>
              <li>Suba o arquivo preenchido aqui</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify build compiles**

```bash
cd /root/tour-launch-hub && npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 3: Commit**

```bash
cd /root/tour-launch-hub
git add src/components/csv-import/CsvUploadStep.tsx
git commit -m "feat: CsvUploadStep — drag & drop zone with template download"
```

---

### Task 5: CsvPreviewStep Component

**Files:**
- Create: `src/components/csv-import/CsvPreviewStep.tsx`

- [ ] **Step 1: Create the preview step component**

Create `src/components/csv-import/CsvPreviewStep.tsx`:

```typescript
import { AlertTriangle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { ParsedRow, ValidationIssue } from '@/hooks/useCsvImport';

interface CsvPreviewStepProps {
  rows: ParsedRow[];
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  isImporting: boolean;
  onImport: () => void;
  onGoBack: () => void;
}

export default function CsvPreviewStep({
  rows,
  errors,
  warnings,
  isImporting,
  onImport,
  onGoBack,
}: CsvPreviewStepProps) {
  const hasErrors = errors.length > 0;
  const totalSubtarefas = rows.reduce((sum, r) => sum + r.subtarefas.length, 0);
  const uniqueMacroEtapas = new Set(rows.map((r) => r.macroEtapa.toLowerCase())).size;

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
        <span className="font-medium text-foreground">{rows.length} ações</span>
        <span className="text-muted-foreground">{totalSubtarefas} subtarefas</span>
        <span className="text-muted-foreground">{uniqueMacroEtapas} macro etapas</span>
        {warnings.length > 0 && (
          <span className="text-[#E2964E] font-medium">{warnings.length} avisos</span>
        )}
        {hasErrors && (
          <span className="text-[#BA5569] font-medium">{errors.length} erros</span>
        )}
      </div>

      {/* Error banner */}
      {hasErrors && (
        <div className="rounded-lg border border-[#BA5569]/30 bg-[#BA5569]/10 px-4 py-3 text-sm text-[#BA5569]">
          <XCircle className="inline h-4 w-4 mr-2 -mt-0.5" />
          Corrija {errors.length} erro{errors.length > 1 ? 's' : ''} no CSV e suba novamente.
        </div>
      )}

      {/* Table */}
      <div className="max-h-[400px] overflow-auto rounded-lg border border-border">
        <TooltipProvider delayDuration={200}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">#</TableHead>
                <TableHead>Macro Etapa</TableHead>
                <TableHead>Título</TableHead>
                <TableHead className="hidden md:table-cell">Responsável</TableHead>
                <TableHead className="hidden sm:table-cell">Prioridade</TableHead>
                <TableHead className="hidden lg:table-cell">Data Início</TableHead>
                <TableHead className="hidden lg:table-cell">Data Fim</TableHead>
                <TableHead className="hidden xl:table-cell">Tempo Est.</TableHead>
                <TableHead className="hidden xl:table-cell">Dependência</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, i) => {
                const hasRowErrors = row.rowErrors.length > 0;
                const hasRowWarnings = row.rowWarnings.length > 0;
                const rowBg = hasRowErrors
                  ? 'bg-[#BA5569]/10'
                  : hasRowWarnings
                  ? 'bg-[#E2964E]/10'
                  : '';

                const issues = [...row.rowErrors, ...row.rowWarnings];

                return (
                  <TableRow key={i} className={rowBg}>
                    <TableCell className="text-muted-foreground text-xs">{i + 2}</TableCell>
                    <TableCell className="font-medium">{row.macroEtapa}</TableCell>
                    <TableCell>
                      <div>
                        <span className="font-medium">{row.titulo}</span>
                        {row.subtarefas.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {row.subtarefas.map((s, j) => (
                              <Badge key={j} variant="secondary" className="text-xs font-normal">
                                {s}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{row.responsavel || '—'}</TableCell>
                    <TableCell className="hidden sm:table-cell capitalize">{row.prioridade}</TableCell>
                    <TableCell className="hidden lg:table-cell">{row.dataInicio}</TableCell>
                    <TableCell className="hidden lg:table-cell">{row.dataFim}</TableCell>
                    <TableCell className="hidden xl:table-cell">{row.tempoEstimado}</TableCell>
                    <TableCell className="hidden xl:table-cell">{row.dependencia || '—'}</TableCell>
                    <TableCell>
                      {issues.length > 0 && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="cursor-help">
                              {hasRowErrors ? (
                                <XCircle className="h-4 w-4 text-[#BA5569]" />
                              ) : (
                                <AlertTriangle className="h-4 w-4 text-[#E2964E]" />
                              )}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side="left" className="max-w-xs">
                            <ul className="space-y-1 text-xs">
                              {issues.map((issue, k) => (
                                <li key={k}>
                                  <span className="font-medium">{issue.column}:</span> {issue.message}
                                </li>
                              ))}
                            </ul>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TooltipProvider>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-2">
        <Button variant="outline" onClick={onGoBack} disabled={isImporting}>
          Voltar
        </Button>
        <Button
          onClick={onImport}
          disabled={hasErrors || isImporting}
          className="gap-2"
        >
          {isImporting ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Importando...
            </>
          ) : hasErrors ? (
            'Importar'
          ) : warnings.length > 0 ? (
            `Importar (${warnings.length} aviso${warnings.length > 1 ? 's' : ''} serão ignorados)`
          ) : (
            'Importar'
          )}
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify build compiles**

```bash
cd /root/tour-launch-hub && npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 3: Commit**

```bash
cd /root/tour-launch-hub
git add src/components/csv-import/CsvPreviewStep.tsx
git commit -m "feat: CsvPreviewStep — preview table with inline errors and warnings"
```

---

### Task 6: CsvResultStep Component

**Files:**
- Create: `src/components/csv-import/CsvResultStep.tsx`

- [ ] **Step 1: Create the result step component**

Create `src/components/csv-import/CsvResultStep.tsx`:

```typescript
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ImportResult } from '@/hooks/useCsvImport';

interface CsvResultStepProps {
  result: ImportResult;
  projetoId?: string; // if undefined, we were in "new project" mode
  onOpenProject: () => void;
  onClose: () => void;
}

export default function CsvResultStep({
  result,
  projetoId,
  onOpenProject,
  onClose,
}: CsvResultStepProps) {
  const hasFailures = result.failures.length > 0;
  const isFullSuccess = result.success && result.acoesCreated > 0;

  return (
    <div className="flex flex-col items-center gap-6 py-4">
      {/* Icon */}
      {isFullSuccess ? (
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#8EBC62]/10">
          <CheckCircle2 className="h-10 w-10 text-[#8EBC62]" />
        </div>
      ) : (
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#BA5569]/10">
          <AlertCircle className="h-10 w-10 text-[#BA5569]" />
        </div>
      )}

      {/* Message */}
      <div className="text-center space-y-2">
        {isFullSuccess ? (
          <h3 className="text-lg font-semibold text-foreground">
            {result.acoesCreated} ações importadas com sucesso!
          </h3>
        ) : hasFailures && result.acoesCreated > 0 ? (
          <h3 className="text-lg font-semibold text-foreground">
            Importação parcial: {result.acoesCreated} de {result.acoesCreated + result.failures.length} ações
          </h3>
        ) : (
          <h3 className="text-lg font-semibold text-foreground">
            Erro na importação
          </h3>
        )}

        {/* Stats */}
        <div className="flex justify-center gap-4 text-sm text-muted-foreground">
          {result.macroEtapasCreated > 0 && (
            <span>{result.macroEtapasCreated} macro etapas criadas</span>
          )}
          {result.subtarefasCreated > 0 && (
            <span>{result.subtarefasCreated} subtarefas criadas</span>
          )}
        </div>
      </div>

      {/* Failures list */}
      {hasFailures && (
        <div className="w-full max-w-md rounded-lg border border-[#BA5569]/30 bg-[#BA5569]/10 p-4">
          <p className="text-sm font-medium text-[#BA5569] mb-2">Falhas:</p>
          <ul className="space-y-1 text-sm text-[#BA5569]">
            {result.failures.map((f, i) => (
              <li key={i}>
                {f.row > 0 ? `Linha ${f.row}` : 'Geral'}
                {f.titulo ? ` (${f.titulo})` : ''}: {f.error}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        {!projetoId && result.acoesCreated > 0 ? (
          <Button onClick={onOpenProject} className="gap-2">
            Abrir Projeto
          </Button>
        ) : (
          <Button onClick={onClose}>Fechar</Button>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify build compiles**

```bash
cd /root/tour-launch-hub && npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 3: Commit**

```bash
cd /root/tour-launch-hub
git add src/components/csv-import/CsvResultStep.tsx
git commit -m "feat: CsvResultStep — success and failure result screen"
```

---

### Task 7: CsvImportDialog — Main Dialog Shell

**Files:**
- Create: `src/components/csv-import/CsvImportDialog.tsx`

- [ ] **Step 1: Create the main dialog component**

Create `src/components/csv-import/CsvImportDialog.tsx`:

```typescript
import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useCsvImport } from '@/hooks/useCsvImport';
import CsvUploadStep from './CsvUploadStep';
import CsvPreviewStep from './CsvPreviewStep';
import CsvResultStep from './CsvResultStep';

interface CsvImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projetoId?: string; // undefined = create new project mode
}

const STEP_TITLES: Record<1 | 2 | 3, string> = {
  1: 'Importar CSV',
  2: 'Preview da Importação',
  3: 'Resultado',
};

export default function CsvImportDialog({
  open,
  onOpenChange,
  projetoId,
}: CsvImportDialogProps) {
  const navigate = useNavigate();
  const {
    step,
    parsedData,
    errors,
    warnings,
    isImporting,
    importResult,
    parseFile,
    goBack,
    importToProject,
    reset,
  } = useCsvImport();

  const [projectName, setProjectName] = useState('');

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen && !isImporting) {
        reset();
        setProjectName('');
        onOpenChange(false);
      }
    },
    [isImporting, reset, onOpenChange]
  );

  const handleImport = useCallback(async () => {
    let targetProjetoId = projetoId;

    // If no projetoId, create a new project first
    if (!targetProjetoId) {
      const name = projectName.trim();
      if (!name) return;

      const id = crypto.randomUUID();
      const { error } = await supabase.from('projetos').insert({
        id,
        nome: name,
        descricao: 'Projeto importado via CSV',
        status: 'ativo',
        cor: '#3B82F6',
      });
      if (error) {
        // Let the import result handle the error display
        return;
      }
      targetProjetoId = id;
    }

    await importToProject(targetProjetoId);
  }, [projetoId, projectName, importToProject]);

  const handleOpenProject = useCallback(() => {
    if (importResult?.projetoId) {
      handleOpenChange(false);
      navigate(`/projeto/${importResult.projetoId}`);
    }
  }, [importResult, navigate, handleOpenChange]);

  const handleClose = useCallback(() => {
    handleOpenChange(false);
  }, [handleOpenChange]);

  const canImport = !projetoId ? projectName.trim().length > 0 : true;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{STEP_TITLES[step]}</DialogTitle>
        </DialogHeader>

        {step === 1 && (
          <CsvUploadStep
            projetoId={projetoId}
            projectName={projectName}
            onProjectNameChange={setProjectName}
            onFileSelected={parseFile}
          />
        )}

        {step === 2 && parsedData && (
          <CsvPreviewStep
            rows={parsedData}
            errors={errors}
            warnings={warnings}
            isImporting={isImporting}
            onImport={canImport ? handleImport : () => {}}
            onGoBack={goBack}
          />
        )}

        {step === 3 && importResult && (
          <CsvResultStep
            result={importResult}
            projetoId={projetoId}
            onOpenProject={handleOpenProject}
            onClose={handleClose}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: Verify build compiles**

```bash
cd /root/tour-launch-hub && npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 3: Commit**

```bash
cd /root/tour-launch-hub
git add src/components/csv-import/CsvImportDialog.tsx
git commit -m "feat: CsvImportDialog — multi-step dialog shell for CSV import"
```

---

### Task 8: Integrate into Dashboard

**Files:**
- Modify: `src/pages/Dashboard.tsx`

- [ ] **Step 1: Add import button and dialog to Dashboard**

In `src/pages/Dashboard.tsx`, add these changes:

1. Add imports at the top (after existing imports):

```typescript
import { Upload } from 'lucide-react';
import CsvImportDialog from '@/components/csv-import/CsvImportDialog';
```

2. Add state inside the component (after the existing `useState` calls around line 39):

```typescript
const [showCsvImport, setShowCsvImport] = useState(false);
```

3. Add the button next to "Novo Projeto" (inside the `{role === 'admin' && (` block, after the existing Button, around line 77):

```tsx
<Button
  variant="outline"
  size="sm"
  onClick={() => setShowCsvImport(true)}
  className="gap-2"
>
  <Upload className="h-4 w-4" aria-hidden="true" />
  Importar CSV
</Button>
```

4. Add the dialog (after the existing dialogs, around line 172):

```tsx
<CsvImportDialog open={showCsvImport} onOpenChange={setShowCsvImport} />
```

- [ ] **Step 2: Verify build compiles**

```bash
cd /root/tour-launch-hub && npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 3: Commit**

```bash
cd /root/tour-launch-hub
git add src/pages/Dashboard.tsx
git commit -m "feat: add CSV import button to Dashboard (admin only)"
```

---

### Task 9: Integrate into TopBar and ProjetoPage

**Files:**
- Modify: `src/components/roadmap/TopBar.tsx`
- Modify: `src/pages/ProjetoPage.tsx`

- [ ] **Step 1: Add onImportCsv prop to TopBar**

In `src/components/roadmap/TopBar.tsx`:

1. Add `Upload` to the lucide-react import (line 1):

```typescript
import { LayoutGrid, Table, LogOut, Users, User, Plus, GanttChart, ArrowLeft, Settings, Upload } from 'lucide-react';
```

2. Add `onImportCsv?: () => void;` to `TopBarProps` interface (after `onSaveAsTemplate`, around line 25):

```typescript
onImportCsv?: () => void;
```

3. Add it to the destructured props (line 28):

```typescript
const TopBar = ({ viewMode, onViewModeChange, onOpenAdmin, onCreateAcao, projetoNome, onManageEtapas, onSaveAsTemplate, onArchiveProjeto, onImportCsv }: TopBarProps) => {
```

4. Add the button after the "Nova Ação" button (around line 75, still inside the `<div className="flex items-center gap-3">` block):

```tsx
{canEdit && onImportCsv && (
  <Button variant="outline" size="sm" onClick={onImportCsv} className="gap-2">
    <Upload className="h-4 w-4" aria-hidden="true" />
    <span className="hidden sm:inline">Importar CSV</span>
  </Button>
)}
```

- [ ] **Step 2: Wire up ProjetoPage**

In `src/pages/ProjetoPage.tsx`:

1. Add import (after existing imports):

```typescript
import CsvImportDialog from '@/components/csv-import/CsvImportDialog';
```

2. Add state (after `showSaveTemplate` state, around line 42):

```typescript
const [showCsvImport, setShowCsvImport] = useState(false);
```

3. Add `onImportCsv` prop to TopBar (around line 226):

```tsx
onImportCsv={() => setShowCsvImport(true)}
```

4. Add dialog (after the SaveAsTemplateDialog block, around line 305):

```tsx
{id && (
  <CsvImportDialog
    open={showCsvImport}
    onOpenChange={setShowCsvImport}
    projetoId={id}
  />
)}
```

- [ ] **Step 3: Verify build compiles**

```bash
cd /root/tour-launch-hub && npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 4: Commit**

```bash
cd /root/tour-launch-hub
git add src/components/roadmap/TopBar.tsx src/pages/ProjetoPage.tsx
git commit -m "feat: add CSV import button to TopBar and ProjetoPage"
```

---

### Task 10: Verify Full Build & Smoke Test

**Files:** None (verification only)

- [ ] **Step 1: Run full build**

```bash
cd /root/tour-launch-hub && npm run build 2>&1 | tail -20
```

Expected: Build succeeds with no errors.

- [ ] **Step 2: Start dev server and smoke test**

```bash
cd /root/tour-launch-hub && npm run dev
```

Manual checks:
1. Open `http://localhost:8080` — Dashboard loads
2. Click "Importar CSV" button on Dashboard — Dialog opens at Step 1
3. Click "Baixar Modelo CSV" — CSV file downloads with UTF-8 BOM and 3 example rows
4. Upload the downloaded CSV model — Step 2 shows preview with 3 rows, all valid
5. Click "Importar" — creates project + macro etapas + ações + subtarefas
6. Navigate to the new project — all data appears correctly
7. Inside a project, click "Importar CSV" in TopBar — Dialog opens without project name field
8. Upload same CSV — imports into existing project

- [ ] **Step 3: Final commit if any fixes needed**

```bash
cd /root/tour-launch-hub
git add -A
git commit -m "fix: adjustments from CSV import smoke test"
```
