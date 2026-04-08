import { useState, useMemo } from 'react';
import { useAcoes } from '@/hooks/useAcoes';
import { useMacroEtapas } from '@/hooks/useMacroEtapas';
import { Acao } from '@/types/roadmap';
import TopBar, { type ViewMode } from '@/components/roadmap/TopBar';
import SummaryCards, { type CardFilterKey } from '@/components/roadmap/SummaryCards';
import Filters, { FilterState, defaultFilters } from '@/components/roadmap/Filters';
import TimelineRoadmap from '@/components/roadmap/TimelineRoadmap';
import TableView from '@/components/roadmap/TableView';
import RoadmapView from '@/components/roadmap/RoadmapView';
import UserManagement from '@/components/admin/UserManagement';
import AcaoEditDialog from '@/components/roadmap/AcaoEditDialog';
import { RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useQueryClient } from '@tanstack/react-query';

const prioridadeOrder = { alta: 0, média: 1, baixa: 2 };

const Index = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('timeline');
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [activeCard, setActiveCard] = useState<CardFilterKey | null>(null);
  const [showAdmin, setShowAdmin] = useState(false);
  const [editingAcao, setEditingAcao] = useState<Acao | null>(null);
  const [showCreateAcao, setShowCreateAcao] = useState(false);
  const { data: acoes = [], isLoading, error } = useAcoes();
  const { data: macroEtapas = [] } = useMacroEtapas();
  const queryClient = useQueryClient();

  const handleCardClick = (key: CardFilterKey) => {
    if (activeCard === key) {
      setActiveCard(null);
      setFilters(defaultFilters);
      return;
    }
    setActiveCard(key);
    const newFilters = { ...defaultFilters };
    switch (key) {
      case 'total':
        break;
      case 'em andamento':
        newFilters.status = 'em andamento';
        break;
      case 'concluída':
        newFilters.status = 'concluída';
        break;
      case 'atrasada':
        newFilters.situacaoPrazo = 'atrasada';
        break;
      case 'bloqueada':
        newFilters.bloqueada = 'sim';
        break;
      case 'alta':
        newFilters.prioridade = 'alta';
        break;
    }
    setFilters(newFilters);
  };

  const processedAcoes: Acao[] = useMemo(() => {
    return acoes.map((acao) => {
      if (acao.dependenciaDe) {
        const dep = acoes.find(a => a.id === acao.dependenciaDe);
        if (dep && dep.status !== 'concluída') {
          return { ...acao, bloqueada: true };
        }
      }
      return { ...acao, bloqueada: false };
    });
  }, [acoes]);

  const filteredAcoes = useMemo(() => {
    let result = processedAcoes;

    if (filters.busca) {
      const q = filters.busca.toLowerCase();
      result = result.filter(a =>
        a.titulo.toLowerCase().includes(q) ||
        a.descricao.toLowerCase().includes(q) ||
        a.responsavel.toLowerCase().includes(q) ||
        a.id.toLowerCase().includes(q)
      );
    }
    if (filters.macroEtapa !== 'todas') {
      result = result.filter(a => a.macroEtapa === filters.macroEtapa);
    }
    if (filters.responsavel !== 'todos') {
      result = result.filter(a => a.responsavel === filters.responsavel);
    }
    if (filters.prioridade !== 'todas') {
      result = result.filter(a => a.prioridade === filters.prioridade);
    }
    if (filters.status !== 'todos') {
      result = result.filter(a => a.status === filters.status);
    }
    if (filters.situacaoPrazo !== 'todas') {
      result = result.filter(a => a.situacaoPrazo === filters.situacaoPrazo);
    }
    if (filters.bloqueada === 'sim') {
      result = result.filter(a => a.bloqueada);
    } else if (filters.bloqueada === 'não') {
      result = result.filter(a => !a.bloqueada);
    }

    result = [...result].sort((a, b) => {
      switch (filters.ordenarPor) {
        case 'prazo':
          return new Date(a.dataInicio).getTime() - new Date(b.dataInicio).getTime();
        case 'prioridade':
          return prioridadeOrder[a.prioridade] - prioridadeOrder[b.prioridade];
        case 'responsavel':
          return a.responsavel.localeCompare(b.responsavel);
        default:
          return 0;
      }
    });

    return result;
  }, [processedAcoes, filters]);

  // Global progress
  const totalAcoes = processedAcoes.length;
  const concluidas = processedAcoes.filter(a => a.status === 'concluída').length;
  const progressPercent = totalAcoes > 0 ? Math.round((concluidas / totalAcoes) * 100) : 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-64" />
              <Skeleton className="h-3 w-48" />
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8 space-y-6">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-lg" />
            ))}
          </div>
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-96 w-full rounded-xl" />
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 text-center px-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle className="h-6 w-6 text-destructive" />
          </div>
          <div>
            <p className="text-lg font-semibold text-foreground">Erro ao carregar dados</p>
            <p className="mt-1 text-sm text-muted-foreground">{error.message}</p>
          </div>
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => queryClient.invalidateQueries({ queryKey: ['acoes'] })}
          >
            <RefreshCw className="h-4 w-4" />
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <TopBar
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onOpenAdmin={() => setShowAdmin(true)}
        onCreateAcao={() => setShowCreateAcao(true)}
      />
      <main className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        {/* Global progress */}
        {totalAcoes > 0 && (
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-foreground whitespace-nowrap">
              Progresso geral
            </span>
            <div className="flex-1 h-2.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-700 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-sm font-semibold text-foreground whitespace-nowrap">
              {progressPercent}%
            </span>
            <span className="text-xs text-muted-foreground whitespace-nowrap hidden sm:inline">
              ({concluidas}/{totalAcoes} concluídas)
            </span>
          </div>
        )}

        <SummaryCards acoes={processedAcoes} activeCard={activeCard} onCardClick={handleCardClick} />
        <Filters
          filters={filters}
          onChange={(f) => { setActiveCard(null); setFilters(f); }}
          acoes={processedAcoes}
          filteredCount={filteredAcoes.length}
          totalCount={processedAcoes.length}
        />

        {viewMode === 'timeline' ? (
          <TimelineRoadmap
            acoes={filteredAcoes}
            allAcoes={processedAcoes}
            macroEtapas={macroEtapas}
            onEditAcao={setEditingAcao}
          />
        ) : viewMode === 'cards' ? (
          <RoadmapView
            acoes={filteredAcoes}
            allAcoes={processedAcoes}
            macroEtapas={macroEtapas}
            onEditAcao={setEditingAcao}
          />
        ) : (
          <TableView acoes={filteredAcoes} onEditAcao={setEditingAcao} />
        )}
      </main>
      <UserManagement open={showAdmin} onOpenChange={setShowAdmin} />
      <AcaoEditDialog
        open={!!editingAcao}
        onOpenChange={(open) => { if (!open) setEditingAcao(null); }}
        acao={editingAcao}
        allAcoes={processedAcoes}
      />
      <AcaoEditDialog
        open={showCreateAcao}
        onOpenChange={setShowCreateAcao}
        allAcoes={processedAcoes}
      />
    </div>
  );
};

export default Index;
