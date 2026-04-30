import { Acao } from '@/types/roadmap';
import { StatusBadge, PrioridadeBadge, SituacaoPrazoBadge } from './StatusBadge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Pencil, Trash2 } from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import { useUpdateAcao, useDeleteAcao } from '@/hooks/useAcoes';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface TableViewProps {
  acoes: Acao[];
  onEditAcao?: (acao: Acao) => void;
}

const TableView = ({ acoes, onEditAcao }: TableViewProps) => {
  const { role } = useAuthContext();
  const canEdit = role === 'admin' || role === 'editor';
  const updateAcao = useUpdateAcao();
  const deleteAcao = useDeleteAcao();

  const cycleStatus = async (acao: Acao) => {
    if (!canEdit) return;
    const next = acao.status === 'não iniciada' ? 'em andamento' : acao.status === 'em andamento' ? 'concluída' : 'não iniciada';
    try {
      await updateAcao.mutateAsync({ id: acao.id, status: next });
    } catch (e: any) {
      toast.error(e.message || 'Erro ao atualizar status');
    }
  };

  if (acoes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <p className="text-lg font-extrabold lowercase">nenhuma ação encontrada</p>
        <p className="text-sm lowercase">tente ajustar os filtros</p>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 [&_th]:lowercase">
              <TableHead className="w-[80px]">id</TableHead>
              <TableHead>título</TableHead>
              <TableHead className="hidden lg:table-cell">macro etapa</TableHead>
              <TableHead>responsável</TableHead>
              <TableHead>status</TableHead>
              <TableHead>prioridade</TableHead>
              <TableHead className="hidden md:table-cell">início</TableHead>
              <TableHead className="hidden md:table-cell">fim</TableHead>
              <TableHead>situação</TableHead>
              <TableHead className="hidden xl:table-cell">tempo est.</TableHead>
              <TableHead className="hidden xl:table-cell">dependência</TableHead>
              <TableHead className="text-center hidden sm:table-cell">subtarefas</TableHead>
              <TableHead className="hidden xl:table-cell">bloqueada</TableHead>
              {canEdit && <TableHead className="w-[80px]"></TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {acoes.map((acao) => (
              <TableRow
                key={acao.id}
                className={
                  acao.bloqueada
                    ? 'bg-blocked/5'
                    : acao.situacaoPrazo === 'atrasada'
                    ? 'bg-destructive/5'
                    : ''
                }
              >
                <TableCell className="font-mono text-xs text-muted-foreground">{acao.id}</TableCell>
                <TableCell className="font-medium text-sm max-w-[250px]">
                  <span className="line-clamp-1">{acao.titulo}</span>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground hidden lg:table-cell">{acao.macroEtapa}</TableCell>
                <TableCell className="text-xs">{acao.responsavel}</TableCell>
                <TableCell>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={() => cycleStatus(acao)}
                        disabled={!canEdit}
                        className={canEdit ? 'cursor-pointer hover:opacity-80' : ''}
                        aria-label={`Status: ${acao.status}. ${canEdit ? 'Clique para alterar' : ''}`}
                      >
                        <StatusBadge status={acao.status} bloqueada={acao.bloqueada} />
                      </button>
                    </TooltipTrigger>
                    {canEdit && (
                      <TooltipContent className="lowercase">clique para alterar status</TooltipContent>
                    )}
                  </Tooltip>
                </TableCell>
                <TableCell>
                  <PrioridadeBadge prioridade={acao.prioridade} />
                </TableCell>
                <TableCell className="text-xs hidden md:table-cell">
                  {new Date(acao.dataInicio).toLocaleDateString('pt-BR')}
                </TableCell>
                <TableCell className="text-xs hidden md:table-cell">
                  {new Date(acao.dataFim).toLocaleDateString('pt-BR')}
                </TableCell>
                <TableCell>
                  <SituacaoPrazoBadge situacao={acao.situacaoPrazo} />
                </TableCell>
                <TableCell className="text-xs hidden xl:table-cell">{acao.tempoEstimado}</TableCell>
                <TableCell className="text-xs text-muted-foreground hidden xl:table-cell">{acao.dependenciaDe || '—'}</TableCell>
                <TableCell className="text-center text-xs text-muted-foreground hidden sm:table-cell">
                  {acao.subtarefas.filter(s => s.status === 'concluída').length}/{acao.subtarefas.length}
                </TableCell>
                <TableCell className="text-xs hidden xl:table-cell">
                  {acao.bloqueada ? <span className="text-brand-bordo font-medium lowercase">sim</span> : '—'}
                </TableCell>
                {canEdit && (
                  <TableCell>
                    <div className="flex items-center gap-0.5">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEditAcao?.(acao)} aria-label={`Editar ação ${acao.id}`}>
                        <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10" aria-label={`Excluir ação ${acao.id}`}>
                            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle className="lowercase">excluir ação?</AlertDialogTitle>
                            <AlertDialogDescription>
                              A ação <strong>{acao.id} — {acao.titulo}</strong> e todas as suas subtarefas serão excluídas permanentemente.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="lowercase">cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 lowercase"
                              onClick={async () => {
                                try {
                                  await deleteAcao.mutateAsync(acao.id);
                                  toast.success('ação excluída');
                                } catch (e: any) {
                                  toast.error(e.message || 'erro ao excluir ação');
                                }
                              }}
                            >
                              excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default TableView;
