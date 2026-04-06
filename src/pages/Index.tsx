import { useState, useMemo } from 'react';
import { acoesMock } from '@/data/mockData';
import { Acao } from '@/types/roadmap';
import TopBar from '@/components/roadmap/TopBar';
import SummaryCards from '@/components/roadmap/SummaryCards';
import Filters, { FilterState, defaultFilters } from '@/components/roadmap/Filters';
import RoadmapView from '@/components/roadmap/RoadmapView';
import TableView from '@/components/roadmap/TableView';

const prioridadeOrder = { alta: 0, média: 1, baixa: 2 };

const Index = () => {
  const [viewMode, setViewMode] = useState<'roadmap' | 'tabela'>('roadmap');
  const [filters, setFilters] = useState<FilterState>(defaultFilters);

  // Process blocked status
  const processedAcoes: Acao[] = useMemo(() => {
    return acoesMock.map((acao) => {
      if (acao.dependenciaDe) {
        const dep = acoesMock.find(a => a.id === acao.dependenciaDe);
        if (dep && dep.status !== 'concluída') {
          return { ...acao, bloqueada: true };
        }
      }
      return { ...acao, bloqueada: false };
    });
  }, []);

  // Filter
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

    // Sort
    result = [...result].sort((a, b) => {
      switch (filters.ordenarPor) {
        case 'prazo':
          return new Date(a.prazo).getTime() - new Date(b.prazo).getTime();
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

  return (
    <div className="min-h-screen bg-background">
      <TopBar viewMode={viewMode} onViewModeChange={setViewMode} />
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        <SummaryCards acoes={processedAcoes} />
        <Filters filters={filters} onChange={setFilters} />
        {viewMode === 'roadmap' ? (
          <RoadmapView acoes={filteredAcoes} allAcoes={processedAcoes} />
        ) : (
          <TableView acoes={filteredAcoes} />
        )}
      </main>
    </div>
  );
};

export default Index;
