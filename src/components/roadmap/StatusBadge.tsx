import { CheckCircle2, Clock, Circle, Lock, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { Status, Prioridade, SituacaoPrazo } from '@/types/roadmap';

export const StatusBadge = ({ status, bloqueada }: { status: Status; bloqueada?: boolean }) => {
  if (bloqueada) {
    return (
      <Badge className="gap-1 border-blocked/30 bg-blocked/10 text-blocked hover:bg-blocked/20" aria-label={`Status: Bloqueada`}>
        <Lock className="h-3 w-3" aria-hidden="true" /> Bloqueada
      </Badge>
    );
  }
  const config = {
    'concluída': { icon: CheckCircle2, className: 'border-success/30 bg-success/10 text-success hover:bg-success/20' },
    'em andamento': { icon: Clock, className: 'border-primary/30 bg-primary/10 text-primary hover:bg-primary/20' },
    'não iniciada': { icon: Circle, className: 'border-muted-foreground/30 bg-muted text-muted-foreground hover:bg-muted' },
  }[status];
  const Icon = config.icon;
  const label = status.charAt(0).toUpperCase() + status.slice(1);
  return (
    <Badge className={`gap-1 ${config.className}`} aria-label={`Status: ${label}`}>
      <Icon className="h-3 w-3" aria-hidden="true" /> {label}
    </Badge>
  );
};

export const PrioridadeBadge = ({ prioridade }: { prioridade: Prioridade }) => {
  const config = {
    alta: 'border-priority-high/30 bg-destructive/10 text-destructive',
    média: 'border-priority-medium/30 bg-warning/10 text-warning',
    baixa: 'border-priority-low/30 bg-success/10 text-success',
  }[prioridade];
  const label = prioridade.charAt(0).toUpperCase() + prioridade.slice(1);
  return (
    <Badge className={`${config} hover:opacity-90`} aria-label={`Prioridade: ${label}`}>
      {label}
    </Badge>
  );
};

export const SituacaoPrazoBadge = ({ situacao }: { situacao: SituacaoPrazo }) => {
  if (situacao === 'atrasada') {
    return (
      <Badge className="gap-1 border-destructive/30 bg-destructive/10 text-destructive animate-pulse-soft hover:bg-destructive/20" aria-label="Situação: Atrasada">
        <AlertTriangle className="h-3 w-3" aria-hidden="true" /> Atrasada
      </Badge>
    );
  }
  return (
    <Badge className="border-success/30 bg-success/10 text-success hover:bg-success/20" aria-label="Situação: No prazo">
      No prazo
    </Badge>
  );
};
