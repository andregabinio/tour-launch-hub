import { useState, useMemo } from 'react';
import { useAcoes } from '@/hooks/useAcoes';
import { useMacroEtapas } from '@/hooks/useMacroEtapas';
import { Acao } from '@/types/roadmap';
import TopBar from '@/components/roadmap/TopBar';
import SummaryCards, { type CardFilterKey } from '@/components/roadmap/SummaryCards';
import Filters, { FilterState, defaultFilters } from '@/components/roadmap/Filters';
import TimelineRoadmap from '@/components/roadmap/TimelineRoadmap';
import TableView from '@/components/roadmap/TableView';
import UserManagement from '@/components/admin/UserManagement';
import AcaoEditDialog from '@/components/roadmap/AcaoEditDialog';

const prioridadeOrder = { alta: 0, média: 1, baixa: 2 };

const Index = () => {
  const [viewMode, setViewMode] = useState<'roadmap' | 'tabela'>('roadmap');
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [activeCard, setActiveCard] = useState<CardFilterKey | null>(null);
  const [showAdmin, setShowAdmin] = useState(false);
  const [editingAcao, setEditingAcao] = useState<Acao | null>(null);
  const [showCreateAcao, setShowCreateAcao] = useState(false);
  const { data: acoes = [], isLoading, error } = useAcoes();
  const { data: macroEtapas = [] } = useMacroEtapas();

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

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground">Carregando dados...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-destructive">Erro ao carregar dados: {error.message}</div>
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
        <SummaryCards acoes={processedAcoes} activeCard={activeCard} onCardClick={handleCardClick} />
        <Filters filters={filters} onChange={(f) => { setActiveCard(null); setFilters(f); }} acoes={processedAcoes} />
        {viewMode === 'roadmap' ? (
          <TimelineRoadmap
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
