import { CheckCircle2, Clock, AlertTriangle, Lock, ListTodo, Flame } from 'lucide-react';
import { Acao } from '@/types/roadmap';

export type CardFilterKey = 'total' | 'em andamento' | 'concluída' | 'atrasada' | 'bloqueada' | 'alta';

interface SummaryCardsProps {
  acoes: Acao[];
  activeCard?: CardFilterKey | null;
  onCardClick?: (key: CardFilterKey) => void;
}

const SummaryCards = ({ acoes, activeCard, onCardClick }: SummaryCardsProps) => {
  const total = acoes.length;
  const concluidas = acoes.filter(a => a.status === 'concluída').length;
  const emAndamento = acoes.filter(a => a.status === 'em andamento').length;
  const atrasadas = acoes.filter(a => a.situacaoPrazo === 'atrasada').length;
  const bloqueadas = acoes.filter(a => a.bloqueada).length;
  const prioridadeAlta = acoes.filter(a => a.prioridade === 'alta').length;

  const cards: { label: string; value: number; icon: typeof ListTodo; color: string; bg: string; filterKey: CardFilterKey }[] = [
    { label: 'Total de Ações', value: total, icon: ListTodo, color: 'text-primary', bg: 'bg-primary/10', filterKey: 'total' },
    { label: 'Em Andamento', value: emAndamento, icon: Clock, color: 'text-primary', bg: 'bg-primary/10', filterKey: 'em andamento' },
    { label: 'Concluídas', value: concluidas, icon: CheckCircle2, color: 'text-success', bg: 'bg-success/10', filterKey: 'concluída' },
    { label: 'Atrasadas', value: atrasadas, icon: AlertTriangle, color: 'text-destructive', bg: 'bg-destructive/10', filterKey: 'atrasada' },
    { label: 'Bloqueadas', value: bloqueadas, icon: Lock, color: 'text-blocked', bg: 'bg-blocked/10', filterKey: 'bloqueada' },
    { label: 'Prioridade Alta', value: prioridadeAlta, icon: Flame, color: 'text-warning', bg: 'bg-warning/10', filterKey: 'alta' },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {cards.map((card) => {
        const isActive = activeCard === card.filterKey;
        return (
          <button
            key={card.label}
            type="button"
            onClick={() => onCardClick?.(card.filterKey)}
            aria-pressed={isActive}
            aria-label={`${card.label}: ${card.value}. ${isActive ? 'Filtro ativo' : 'Clique para filtrar'}`}
            className={`glass-card rounded-lg p-4 cursor-pointer transition-all hover:scale-[1.03] active:scale-[0.97] hover:shadow-md text-left w-full ${
              isActive ? 'ring-2 ring-primary shadow-md' : ''
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${card.bg}`}>
                <card.icon className={`h-5 w-5 ${card.color}`} aria-hidden="true" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{card.value}</p>
                <p className="text-xs text-muted-foreground leading-tight">{card.label}</p>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default SummaryCards;
