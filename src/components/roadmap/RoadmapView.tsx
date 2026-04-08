import { Acao, MacroEtapa } from '@/types/roadmap';
import AcaoCard from './AcaoCard';

interface RoadmapViewProps {
  acoes: Acao[];
  allAcoes: Acao[];
  macroEtapas: MacroEtapa[];
  onEditAcao?: (acao: Acao) => void;
}

const etapaColors: Record<string, string> = {
  'Pré-produção': 'bg-primary/10 text-primary border-primary/20',
  'Produção de Conteúdo': 'bg-warning/10 text-warning border-warning/20',
  'Marketing & Comunicação': 'bg-blocked/10 text-blocked border-blocked/20',
  'Operação & Logística': 'bg-success/10 text-success border-success/20',
  'Vendas & Comercial': 'bg-destructive/10 text-destructive border-destructive/20',
  'Pós-lançamento': 'bg-muted text-muted-foreground border-border',
};

const RoadmapView = ({ acoes, allAcoes, macroEtapas, onEditAcao }: RoadmapViewProps) => {
  const etapasComAcoes = macroEtapas
    .map(e => e.titulo)
    .filter(etapa => acoes.some(a => a.macroEtapa === etapa));

  if (acoes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <p className="text-lg font-medium">Nenhuma ação encontrada</p>
        <p className="text-sm">Tente ajustar os filtros</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {etapasComAcoes.map((etapa) => {
        const acoesEtapa = acoes.filter(a => a.macroEtapa === etapa);
        const concluidas = acoesEtapa.filter(a => a.status === 'concluída').length;
        const colorClass = etapaColors[etapa] || 'bg-muted text-muted-foreground border-border';

        return (
          <section key={etapa}>
            <div className="mb-3 flex items-center gap-3">
              <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${colorClass}`}>
                {etapa}
              </span>
              <span className="text-xs text-muted-foreground">
                {concluidas}/{acoesEtapa.length} concluídas
              </span>
              <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{ width: `${acoesEtapa.length > 0 ? (concluidas / acoesEtapa.length) * 100 : 0}%` }}
                />
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {acoesEtapa.map((acao) => (
                <AcaoCard key={acao.id} acao={acao} allAcoes={allAcoes} onEdit={onEditAcao} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
};

export default RoadmapView;
