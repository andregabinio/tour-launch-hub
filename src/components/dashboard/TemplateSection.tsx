import { useState } from 'react';
import { useTemplates, useDeleteTemplate } from '@/hooks/useTemplates';
import { useAuthContext } from '@/contexts/AuthContext';
import { FileText, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

const TemplateSection = () => {
  const { role } = useAuthContext();
  const { data: templates = [] } = useTemplates();
  const deleteTemplate = useDeleteTemplate();
  const [expanded, setExpanded] = useState(false);

  if (role !== 'admin' || templates.length === 0) return null;

  const handleDelete = async (id: string) => {
    try {
      await deleteTemplate.mutateAsync(id);
      toast.success('Modelo excluído');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao excluir modelo');
    }
  };

  return (
    <div className="mt-8">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        aria-label={expanded ? 'Recolher modelos' : 'Expandir modelos'}
      >
        <FileText className="h-4 w-4" aria-hidden="true" />
        <span>Modelos ({templates.length})</span>
        {expanded ? (
          <ChevronUp className="h-4 w-4" aria-hidden="true" />
        ) : (
          <ChevronDown className="h-4 w-4" aria-hidden="true" />
        )}
      </button>

      {expanded && (
        <div className="mt-3 space-y-2">
          {templates.map((tmpl) => {
            const totalEtapas = tmpl.conteudo.macro_etapas.length;
            const totalAcoes = tmpl.conteudo.macro_etapas.reduce(
              (sum, me) => sum + me.acoes.length,
              0,
            );

            return (
              <div
                key={tmpl.id}
                className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">{tmpl.nome}</p>
                  <p className="text-xs text-muted-foreground">
                    {totalEtapas} etapas, {totalAcoes} ações
                  </p>
                </div>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      aria-label={`Excluir modelo ${tmpl.nome}`}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir modelo</AlertDialogTitle>
                      <AlertDialogDescription>
                        Tem certeza que deseja excluir o modelo "{tmpl.nome}"? Esta ação não pode ser desfeita.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(tmpl.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Excluir
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TemplateSection;
