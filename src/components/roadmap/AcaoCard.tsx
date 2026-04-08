import { useState } from 'react';
import { ChevronDown, ChevronUp, Calendar, Clock, User, Link, Pencil, Plus, Trash2 } from 'lucide-react';
import { Acao } from '@/types/roadmap';
import { StatusBadge, PrioridadeBadge, SituacaoPrazoBadge } from './StatusBadge';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useUpdateAcao } from '@/hooks/useAcoes';
import { useUpdateSubtarefa, useCreateSubtarefa, useDeleteSubtarefa } from '@/hooks/useSubtarefas';
import { useAuthContext } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface AcaoCardProps {
  acao: Acao;
  allAcoes: Acao[];
  onEdit?: (acao: Acao) => void;
}

const AcaoCard = ({ acao, allAcoes, onEdit }: AcaoCardProps) => {
  const [expanded, setExpanded] = useState(false);
  const [newSubtarefa, setNewSubtarefa] = useState('');
  const [showAddSub, setShowAddSub] = useState(false);
  const { role } = useAuthContext();
  const updateAcao = useUpdateAcao();
  const updateSubtarefa = useUpdateSubtarefa();
  const createSubtarefa = useCreateSubtarefa();
  const deleteSubtarefa = useDeleteSubtarefa();

  const canEdit = role === 'admin' || role === 'editor';

  const depAcao = acao.dependenciaDe
    ? allAcoes.find(a => a.id === acao.dependenciaDe)
    : null;

  const borderClass = acao.bloqueada
    ? 'border-l-4 border-l-blocked'
    : acao.situacaoPrazo === 'atrasada'
    ? 'border-l-4 border-l-destructive'
    : acao.prioridade === 'alta'
    ? 'border-l-4 border-l-warning'
    : 'border-l-4 border-l-transparent';

  const cycleStatus = async () => {
    if (!canEdit) return;
    const next = acao.status === 'não iniciada' ? 'em andamento' : acao.status === 'em andamento' ? 'concluída' : 'não iniciada';
    try {
      await updateAcao.mutateAsync({ id: acao.id, status: next });
    } catch (e: any) {
      toast.error(e.message || 'Erro ao atualizar status');
    }
  };

  const toggleSubtarefa = async (subId: string, currentStatus: string) => {
    if (!canEdit) return;
    const next = currentStatus === 'concluída' ? 'não iniciada' : 'concluída';
    try {
      await updateSubtarefa.mutateAsync({ id: subId, status: next });
    } catch (e: any) {
      toast.error(e.message || 'Erro ao atualizar subtarefa');
    }
  };

  const handleAddSubtarefa = async () => {
    if (!newSubtarefa.trim()) return;
    try {
      await createSubtarefa.mutateAsync({
        acao_id: acao.id,
        titulo: newSubtarefa.trim(),
        status: 'não iniciada',
        responsavel: '',
        tempo_estimado: '',
      });
      setNewSubtarefa('');
      setShowAddSub(false);
    } catch (e: any) {
      toast.error(e.message || 'Erro ao criar subtarefa');
    }
  };

  const handleDeleteSubtarefa = async (subId: string) => {
    if (role !== 'admin') return;
    try {
      await deleteSubtarefa.mutateAsync(subId);
    } catch (e: any) {
      toast.error(e.message || 'Erro ao excluir subtarefa');
    }
  };

  return (
    <div className={`glass-card rounded-lg ${borderClass} overflow-hidden`}>
      <div className="p-4 space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono text-muted-foreground">{acao.id}</span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={cycleStatus}
                    className={canEdit ? 'cursor-pointer hover:opacity-80' : ''}
                    disabled={!canEdit}
                    aria-label={`Status: ${acao.status}. ${canEdit ? 'Clique para alterar' : ''}`}
                  >
                    <StatusBadge status={acao.status} bloqueada={acao.bloqueada} />
                  </button>
                </TooltipTrigger>
                {canEdit && (
                  <TooltipContent>Clique para alterar status</TooltipContent>
                )}
              </Tooltip>
              <PrioridadeBadge prioridade={acao.prioridade} />
              <SituacaoPrazoBadge situacao={acao.situacaoPrazo} />
            </div>
            <h3 className="mt-1.5 text-sm font-semibold text-foreground leading-tight">
              {acao.titulo}
            </h3>
            <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
              {acao.descricao}
            </p>
          </div>
          {canEdit && onEdit && (
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => onEdit(acao)} aria-label={`Editar ação ${acao.id}`}>
              <Pencil className="h-4 w-4" aria-hidden="true" />
            </Button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <User className="h-3.5 w-3.5" aria-hidden="true" /> {acao.responsavel}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" aria-hidden="true" /> {new Date(acao.dataInicio).toLocaleDateString('pt-BR')} — {new Date(acao.dataFim).toLocaleDateString('pt-BR')}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" aria-hidden="true" /> {acao.tempoEstimado}
          </span>
        </div>

        {depAcao && (
          <div className={`flex items-center gap-1.5 text-xs rounded-md px-2.5 py-1.5 ${
            acao.bloqueada
              ? 'bg-blocked/10 text-blocked'
              : 'bg-muted text-muted-foreground'
          }`}>
            <Link className="h-3.5 w-3.5" aria-hidden="true" />
            Depende de: <span className="font-medium">{depAcao.id} — {depAcao.titulo}</span>
            {acao.bloqueada && <span className="ml-1 font-semibold">(pendente)</span>}
          </div>
        )}

        {(acao.subtarefas.length > 0 || canEdit) && (
          <div className="flex items-center gap-3">
            {acao.subtarefas.length > 0 && (
              <button
                type="button"
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
              >
                {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                {acao.subtarefas.length} subtarefa{acao.subtarefas.length > 1 ? 's' : ''}
                <span className="text-muted-foreground font-normal">
                  ({acao.subtarefas.filter(s => s.status === 'concluída').length}/{acao.subtarefas.length})
                </span>
              </button>
            )}
            {canEdit && (
              <button
                type="button"
                onClick={() => { setExpanded(true); setShowAddSub(true); }}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
              >
                <Plus className="h-3.5 w-3.5" /> Subtarefa
              </button>
            )}
          </div>
        )}
      </div>

      {expanded && (
        <div className="border-t border-border bg-muted/30 px-4 py-3 space-y-2">
          {acao.subtarefas.map((sub) => (
            <div key={sub.id} className="flex items-center gap-3 text-xs group">
              <Checkbox
                checked={sub.status === 'concluída'}
                disabled={!canEdit}
                onCheckedChange={() => toggleSubtarefa(sub.id, sub.status)}
                className="h-4 w-4"
              />
              <span className={`flex-1 ${sub.status === 'concluída' ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                {sub.titulo}
              </span>
              {sub.responsavel && <span className="text-muted-foreground hidden sm:inline">{sub.responsavel}</span>}
              {sub.tempoEstimado && <span className="text-muted-foreground">{sub.tempoEstimado}</span>}
              {role === 'admin' && (
                <button
                  type="button"
                  onClick={() => handleDeleteSubtarefa(sub.id)}
                  className="sm:opacity-0 sm:group-hover:opacity-100 text-destructive hover:text-destructive/80 p-1"
                  aria-label={`Excluir subtarefa: ${sub.titulo}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
          {showAddSub && canEdit && (
            <div className="flex items-center gap-2 pt-1">
              <Input
                value={newSubtarefa}
                onChange={e => setNewSubtarefa(e.target.value)}
                placeholder="Nome da subtarefa"
                className="h-8 text-xs"
                onKeyDown={e => e.key === 'Enter' && handleAddSubtarefa()}
                autoFocus
              />
              <Button size="sm" className="h-8 text-xs" onClick={handleAddSubtarefa} disabled={createSubtarefa.isPending}>
                Adicionar
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AcaoCard;
