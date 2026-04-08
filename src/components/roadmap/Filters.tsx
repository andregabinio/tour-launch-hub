import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { type Acao } from '@/types/roadmap';

export interface FilterState {
  busca: string;
  macroEtapa: string;
  responsavel: string;
  prioridade: string;
  status: string;
  situacaoPrazo: string;
  bloqueada: string;
  ordenarPor: string;
}

interface FiltersProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  acoes: Acao[];
}

const defaultFilters: FilterState = {
  busca: '',
  macroEtapa: 'todas',
  responsavel: 'todos',
  prioridade: 'todas',
  status: 'todos',
  situacaoPrazo: 'todas',
  bloqueada: 'todas',
  ordenarPor: 'prazo',
};

const Filters = ({ filters, onChange, acoes }: FiltersProps) => {
  const macroEtapas = [...new Set(acoes.map(a => a.macroEtapa))];
  const responsaveis = [...new Set(acoes.map(a => a.responsavel))].sort();

  const update = (key: keyof FilterState, value: string) =>
    onChange({ ...filters, [key]: value });

  const hasActiveFilters = Object.entries(filters).some(
    ([key, val]) => val !== defaultFilters[key as keyof FilterState]
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar ações, responsáveis..."
            value={filters.busca}
            onChange={(e) => update('busca', e.target.value)}
            className="pl-9"
          />
        </div>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={() => onChange(defaultFilters)} className="gap-1 text-muted-foreground">
            <X className="h-4 w-4" /> Limpar filtros
          </Button>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        <Select value={filters.macroEtapa} onValueChange={(v) => update('macroEtapa', v)}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Macro etapa" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas as etapas</SelectItem>
            {macroEtapas.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filters.responsavel} onValueChange={(v) => update('responsavel', v)}>
          <SelectTrigger className="w-[170px]"><SelectValue placeholder="Responsável" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            {responsaveis.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filters.prioridade} onValueChange={(v) => update('prioridade', v)}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Prioridade" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas</SelectItem>
            <SelectItem value="alta">Alta</SelectItem>
            <SelectItem value="média">Média</SelectItem>
            <SelectItem value="baixa">Baixa</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filters.status} onValueChange={(v) => update('status', v)}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="não iniciada">Não iniciada</SelectItem>
            <SelectItem value="em andamento">Em andamento</SelectItem>
            <SelectItem value="concluída">Concluída</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filters.situacaoPrazo} onValueChange={(v) => update('situacaoPrazo', v)}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="Situação" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas</SelectItem>
            <SelectItem value="no prazo">No prazo</SelectItem>
            <SelectItem value="atrasada">Atrasada</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filters.ordenarPor} onValueChange={(v) => update('ordenarPor', v)}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="Ordenar por" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="prazo">Prazo</SelectItem>
            <SelectItem value="prioridade">Prioridade</SelectItem>
            <SelectItem value="responsavel">Responsável</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export { defaultFilters };
export default Filters;
