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
