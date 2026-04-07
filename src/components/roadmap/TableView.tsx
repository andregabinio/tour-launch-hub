import { Acao } from '@/types/roadmap';
import { StatusBadge, PrioridadeBadge, SituacaoPrazoBadge } from './StatusBadge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface TableViewProps {
  acoes: Acao[];
}

const TableView = ({ acoes }: TableViewProps) => {
  if (acoes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <p className="text-lg font-medium">Nenhuma ação encontrada</p>
        <p className="text-sm">Tente ajustar os filtros</p>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[80px]">ID</TableHead>
              <TableHead>Título</TableHead>
              <TableHead>Macro Etapa</TableHead>
              <TableHead>Responsável</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Prioridade</TableHead>
              <TableHead>Início</TableHead>
              <TableHead>Fim</TableHead>
              <TableHead>Situação</TableHead>
              <TableHead>Tempo Est.</TableHead>
              <TableHead>Dependência</TableHead>
              <TableHead className="text-center">Subtarefas</TableHead>
              <TableHead>Bloqueada</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {acoes.map((acao) => (
              <TableRow
                key={acao.id}
                className={
                  acao.bloqueada
                    ? 'bg-blocked/5'
                    : acao.situacaoPrazo === 'atrasada'
                    ? 'bg-destructive/5'
                    : ''
                }
              >
                <TableCell className="font-mono text-xs text-muted-foreground">{acao.id}</TableCell>
                <TableCell className="font-medium text-sm max-w-[250px]">
                  <span className="line-clamp-1">{acao.titulo}</span>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">{acao.macroEtapa}</TableCell>
                <TableCell className="text-xs">{acao.responsavel}</TableCell>
                <TableCell>
                  <StatusBadge status={acao.status} bloqueada={acao.bloqueada} />
                </TableCell>
                <TableCell>
                  <PrioridadeBadge prioridade={acao.prioridade} />
                </TableCell>
                <TableCell className="text-xs">
                  {new Date(acao.dataInicio).toLocaleDateString('pt-BR')}
                </TableCell>
                <TableCell className="text-xs">
                  {new Date(acao.dataFim).toLocaleDateString('pt-BR')}
                </TableCell>
                <TableCell>
                  <SituacaoPrazoBadge situacao={acao.situacaoPrazo} />
                </TableCell>
                <TableCell className="text-xs">{acao.tempoEstimado}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{acao.dependenciaDe || '—'}</TableCell>
                <TableCell className="text-center text-xs text-muted-foreground">
                  {acao.subtarefas.filter(s => s.status === 'concluída').length}/{acao.subtarefas.length}
                </TableCell>
                <TableCell className="text-xs">
                  {acao.bloqueada ? <span className="text-blocked font-medium">Sim</span> : '—'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default TableView;
