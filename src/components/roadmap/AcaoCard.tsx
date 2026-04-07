import { useState } from 'react';
import { ChevronDown, ChevronUp, Calendar, Clock, User, Link } from 'lucide-react';
import { Acao } from '@/types/roadmap';
import { StatusBadge, PrioridadeBadge, SituacaoPrazoBadge } from './StatusBadge';
import { Checkbox } from '@/components/ui/checkbox';

interface AcaoCardProps {
  acao: Acao;
  allAcoes: Acao[];
}

const AcaoCard = ({ acao, allAcoes }: AcaoCardProps) => {
  const [expanded, setExpanded] = useState(false);

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

  return (
    <div className={`glass-card rounded-lg ${borderClass} overflow-hidden`}>
      <div className="p-4 space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono text-muted-foreground">{acao.id}</span>
              <StatusBadge status={acao.status} bloqueada={acao.bloqueada} />
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
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <User className="h-3.5 w-3.5" /> {acao.responsavel}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" /> {new Date(acao.dataInicio).toLocaleDateString('pt-BR')} — {new Date(acao.dataFim).toLocaleDateString('pt-BR')}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" /> {acao.tempoEstimado}
          </span>
        </div>

        {depAcao && (
          <div className={`flex items-center gap-1.5 text-xs rounded-md px-2.5 py-1.5 ${
            acao.bloqueada
              ? 'bg-blocked/10 text-blocked'
              : 'bg-muted text-muted-foreground'
          }`}>
            <Link className="h-3.5 w-3.5" />
            Depende de: <span className="font-medium">{depAcao.id} — {depAcao.titulo}</span>
            {acao.bloqueada && <span className="ml-1 font-semibold">(pendente)</span>}
          </div>
        )}

        {acao.subtarefas.length > 0 && (
          <button
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
      </div>

      {expanded && (
        <div className="border-t border-border bg-muted/30 px-4 py-3 space-y-2">
          {acao.subtarefas.map((sub) => (
            <div key={sub.id} className="flex items-center gap-3 text-xs">
              <Checkbox checked={sub.status === 'concluída'} disabled className="h-4 w-4" />
              <span className={`flex-1 ${sub.status === 'concluída' ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                {sub.titulo}
              </span>
              {sub.responsavel && <span className="text-muted-foreground hidden sm:inline">{sub.responsavel}</span>}
              {sub.tempoEstimado && <span className="text-muted-foreground">{sub.tempoEstimado}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AcaoCard;
