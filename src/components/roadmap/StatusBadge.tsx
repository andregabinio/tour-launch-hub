import { CheckCircle2, Clock, Circle, Lock, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { Status, Prioridade, SituacaoPrazo } from '@/types/roadmap';

export const StatusBadge = ({ status, bloqueada }: { status: Status; bloqueada?: boolean }) => {
  if (bloqueada) {
    return (
      <Badge className="gap-1 border-brand-bordo/30 bg-brand-bordo/10 text-brand-bordo hover:bg-brand-bordo/20 lowercase" aria-label="status: bloqueada">
        <Lock className="h-3 w-3" aria-hidden="true" /> bloqueada
      </Badge>
    );
  }
  const config = {
    'concluída': { icon: CheckCircle2, className: 'border-brand-verde/30 bg-brand-verde/10 text-brand-verde hover:bg-brand-verde/20' },
    'em andamento': { icon: Clock, className: 'border-brand-azul/30 bg-brand-azul/10 text-brand-azul hover:bg-brand-azul/20' },
    'não iniciada': { icon: Circle, className: 'border-muted-foreground/30 bg-muted text-muted-foreground hover:bg-muted' },
  }[status];
  const Icon = config.icon;
  return (
    <Badge className={`gap-1 lowercase ${config.className}`} aria-label={`status: ${status}`}>
      <Icon className="h-3 w-3" aria-hidden="true" /> {status}
    </Badge>
  );
};

export const PrioridadeBadge = ({ prioridade }: { prioridade: Prioridade }) => {
  const config = {
    alta: 'border-brand-bordo/30 bg-brand-bordo/10 text-brand-bordo',
    média: 'border-brand-amarelo/40 bg-brand-amarelo/15 text-brand-laranja',
    baixa: 'border-brand-verde/30 bg-brand-verde/10 text-brand-verde',
  }[prioridade];
  return (
    <Badge className={`${config} hover:opacity-90 lowercase`} aria-label={`prioridade: ${prioridade}`}>
      {prioridade}
    </Badge>
  );
};

export const SituacaoPrazoBadge = ({ situacao }: { situacao: SituacaoPrazo }) => {
  if (situacao === 'atrasada') {
    return (
      <Badge className="gap-1 border-brand-bordo/30 bg-brand-bordo/10 text-brand-bordo animate-pulse-soft hover:bg-brand-bordo/20 lowercase" aria-label="situação: atrasada">
        <AlertTriangle className="h-3 w-3" aria-hidden="true" /> atrasada
      </Badge>
    );
  }
  return (
    <Badge className="border-brand-verde/30 bg-brand-verde/10 text-brand-verde hover:bg-brand-verde/20 lowercase" aria-label="situação: no prazo">
      no prazo
    </Badge>
  );
};
