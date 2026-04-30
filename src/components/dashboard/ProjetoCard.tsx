import { useNavigate } from 'react-router-dom';
import { type Projeto } from '@/types/projeto';
import { useAcoes } from '@/hooks/useAcoes';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

const statusConfig: Record<Projeto['status'], { label: string; className: string }> = {
  ativo: { label: 'ativo', className: 'bg-brand-verde/15 text-brand-verde border-brand-verde/30' },
  arquivado: { label: 'arquivado', className: 'bg-muted text-muted-foreground border-border' },
  'concluído': { label: 'concluído', className: 'bg-brand-azul/15 text-brand-azul border-brand-azul/30' },
};

interface ProjetoCardProps {
  projeto: Projeto;
}

const ProjetoCard = ({ projeto }: ProjetoCardProps) => {
  const navigate = useNavigate();
  const { data: acoes = [] } = useAcoes(projeto.id);

  const totalAcoes = acoes.length;
  const concluidas = acoes.filter((a) => a.status === 'concluída').length;
  const progressPercent = totalAcoes > 0 ? Math.round((concluidas / totalAcoes) * 100) : 0;

  const status = statusConfig[projeto.status];
  const createdDate = new Date(projeto.createdAt).toLocaleDateString('pt-BR');

  return (
    <button
      onClick={() => navigate(`/projeto/${projeto.id}`)}
      className="glass-card rounded-xl p-4 text-left transition-transform duration-150 hover:scale-[1.01] hover:shadow-md active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      style={{ borderLeft: `4px solid ${projeto.cor}` }}
      aria-label={`Abrir projeto ${projeto.nome}`}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-foreground truncate">{projeto.nome}</h3>
        <Badge variant="outline" className={status.className}>
          {status.label}
        </Badge>
      </div>

      {projeto.descricao && (
        <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2">
          {projeto.descricao}
        </p>
      )}

      <div className="mt-3 space-y-1.5">
        <Progress value={progressPercent} className="h-2" />
        <div className="flex items-center justify-between text-xs text-muted-foreground lowercase">
          <span>{concluidas}/{totalAcoes} ações concluídas</span>
          <span>{progressPercent}%</span>
        </div>
      </div>

      <p className="mt-3 text-xs text-muted-foreground lowercase">
        criado em {createdDate}
      </p>
    </button>
  );
};

export default ProjetoCard;
