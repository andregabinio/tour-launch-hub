import { CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ImportResult } from '@/hooks/useCsvImport';

interface CsvResultStepProps {
  result: ImportResult;
  projetoId?: string;
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
      {isFullSuccess ? (
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#8EBC62]/10">
          <CheckCircle2 className="h-10 w-10 text-[#8EBC62]" />
        </div>
      ) : (
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#BA5569]/10">
          <AlertCircle className="h-10 w-10 text-[#BA5569]" />
        </div>
      )}

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

        <div className="flex justify-center gap-4 text-sm text-muted-foreground">
          {result.macroEtapasCreated > 0 && (
            <span>{result.macroEtapasCreated} macro etapas criadas</span>
          )}
          {result.subtarefasCreated > 0 && (
            <span>{result.subtarefasCreated} subtarefas criadas</span>
          )}
        </div>
      </div>

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
