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
        if (row.rowErrors.length > 0) continue;

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
