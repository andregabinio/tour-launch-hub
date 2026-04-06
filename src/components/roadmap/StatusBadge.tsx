import { CheckCircle2, Clock, Circle, Lock, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { Status, Prioridade, SituacaoPrazo } from '@/types/roadmap';

export const StatusBadge = ({ status, bloqueada }: { status: Status; bloqueada?: boolean }) => {
  if (bloqueada) {
    return (
      <Badge className="gap-1 border-blocked/30 bg-blocked/10 text-blocked hover:bg-blocked/20">
        <Lock className="h-3 w-3" /> Bloqueada
      </Badge>
    );
  }
  const config = {
    'concluída': { icon: CheckCircle2, className: 'border-success/30 bg-success/10 text-success hover:bg-success/20' },
    'em andamento': { icon: Clock, className: 'border-primary/30 bg-primary/10 text-primary hover:bg-primary/20' },
    'não iniciada': { icon: Circle, className: 'border-muted-foreground/30 bg-muted text-muted-foreground hover:bg-muted' },
  }[status];
  const Icon = config.icon;
  return (
    <Badge className={`gap-1 ${config.className}`}>
      <Icon className="h-3 w-3" /> {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
};

export const PrioridadeBadge = ({ prioridade }: { prioridade: Prioridade }) => {
  const config = {
    alta: 'border-priority-high/30 bg-destructive/10 text-destructive',
    média: 'border-priority-medium/30 bg-warning/10 text-warning',
    baixa: 'border-priority-low/30 bg-success/10 text-success',
  }[prioridade];
  return (
    <Badge className={`${config} hover:opacity-90`}>
      {prioridade.charAt(0).toUpperCase() + prioridade.slice(1)}
    </Badge>
  );
};

export const SituacaoPrazoBadge = ({ situacao }: { situacao: SituacaoPrazo }) => {
  if (situacao === 'atrasada') {
    return (
      <Badge className="gap-1 border-destructive/30 bg-destructive/10 text-destructive animate-pulse-soft hover:bg-destructive/20">
        <AlertTriangle className="h-3 w-3" /> Atrasada
      </Badge>
    );
  }
  return (
    <Badge className="border-success/30 bg-success/10 text-success hover:bg-success/20">
      No prazo
    </Badge>
  );
};
