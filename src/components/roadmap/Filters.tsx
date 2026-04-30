import { Search, X, ArrowUpDown } from 'lucide-react';
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
  filteredCount?: number;
  totalCount?: number;
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

const Filters = ({ filters, onChange, acoes, filteredCount, totalCount }: FiltersProps) => {
  const macroEtapas = [...new Set(acoes.map(a => a.macroEtapa))];
  const responsaveis = [...new Set(acoes.map(a => a.responsavel))].sort();

  const update = (key: keyof FilterState, value: string) =>
    onChange({ ...filters, [key]: value });

  const hasActiveFilters = Object.entries(filters).some(
    ([key, val]) => key !== 'ordenarPor' && val !== defaultFilters[key as keyof FilterState]
  );

  // Count helpers
  const countByStatus = (status: string) => acoes.filter(a => a.status === status).length;
  const countByPrioridade = (p: string) => acoes.filter(a => a.prioridade === p).length;
  const countBySituacao = (s: string) => acoes.filter(a => a.situacaoPrazo === s).length;
  const countByEtapa = (e: string) => acoes.filter(a => a.macroEtapa === e).length;
  const countByResponsavel = (r: string) => acoes.filter(a => a.responsavel === r).length;

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="buscar ações, responsáveis..."
            value={filters.busca}
            onChange={(e) => update('busca', e.target.value)}
            className="pl-9"
            aria-label="buscar ações"
          />
        </div>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={() => onChange(defaultFilters)} className="gap-1 text-muted-foreground lowercase">
              <X className="h-4 w-4" /> limpar
            </Button>
          )}
          {filteredCount !== undefined && totalCount !== undefined && filteredCount !== totalCount && (
            <span className="text-xs text-muted-foreground whitespace-nowrap lowercase">
              {filteredCount} de {totalCount} ações
            </span>
          )}
        </div>
      </div>
      <div className="flex flex-wrap gap-2 items-center">
        <Select value={filters.macroEtapa} onValueChange={(v) => update('macroEtapa', v)}>
          <SelectTrigger className="w-full sm:w-[180px] lowercase"><SelectValue placeholder="macro etapa" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todas" className="lowercase">todas as etapas</SelectItem>
            {macroEtapas.map(e => <SelectItem key={e} value={e}>{e} ({countByEtapa(e)})</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filters.responsavel} onValueChange={(v) => update('responsavel', v)}>
          <SelectTrigger className="w-full sm:w-[170px] lowercase"><SelectValue placeholder="responsável" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos" className="lowercase">todos</SelectItem>
            {responsaveis.map(r => <SelectItem key={r} value={r}>{r} ({countByResponsavel(r)})</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filters.prioridade} onValueChange={(v) => update('prioridade', v)}>
          <SelectTrigger className="w-full sm:w-[140px] lowercase"><SelectValue placeholder="prioridade" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todas" className="lowercase">todas</SelectItem>
            <SelectItem value="alta" className="lowercase">alta ({countByPrioridade('alta')})</SelectItem>
            <SelectItem value="média" className="lowercase">média ({countByPrioridade('média')})</SelectItem>
            <SelectItem value="baixa" className="lowercase">baixa ({countByPrioridade('baixa')})</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filters.status} onValueChange={(v) => update('status', v)}>
          <SelectTrigger className="w-full sm:w-[160px] lowercase"><SelectValue placeholder="status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos" className="lowercase">todos</SelectItem>
            <SelectItem value="não iniciada" className="lowercase">não iniciada ({countByStatus('não iniciada')})</SelectItem>
            <SelectItem value="em andamento" className="lowercase">em andamento ({countByStatus('em andamento')})</SelectItem>
            <SelectItem value="concluída" className="lowercase">concluída ({countByStatus('concluída')})</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filters.situacaoPrazo} onValueChange={(v) => update('situacaoPrazo', v)}>
          <SelectTrigger className="w-full sm:w-[150px] lowercase"><SelectValue placeholder="situação" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todas" className="lowercase">todas</SelectItem>
            <SelectItem value="no prazo" className="lowercase">no prazo ({countBySituacao('no prazo')})</SelectItem>
            <SelectItem value="atrasada" className="lowercase">atrasada ({countBySituacao('atrasada')})</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filters.bloqueada} onValueChange={(v) => update('bloqueada', v)}>
          <SelectTrigger className="w-full sm:w-[140px] lowercase"><SelectValue placeholder="bloqueada" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todas" className="lowercase">todas</SelectItem>
            <SelectItem value="sim" className="lowercase">bloqueadas</SelectItem>
            <SelectItem value="não" className="lowercase">não bloqueadas</SelectItem>
          </SelectContent>
        </Select>

        <div className="hidden sm:block w-px h-6 bg-border mx-1" />

        <Select value={filters.ordenarPor} onValueChange={(v) => update('ordenarPor', v)}>
          <SelectTrigger className="w-full sm:w-[150px] gap-1 lowercase">
            <ArrowUpDown className="h-3.5 w-3.5 shrink-0" />
            <SelectValue placeholder="ordenar por" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="prazo" className="lowercase">prazo</SelectItem>
            <SelectItem value="prioridade" className="lowercase">prioridade</SelectItem>
            <SelectItem value="responsavel" className="lowercase">responsável</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export { defaultFilters };
export default Filters;
