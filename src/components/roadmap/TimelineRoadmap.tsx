import { useState, useMemo, useRef, useEffect } from 'react';
import { ChevronDown, ChevronUp, User, Clock, Link, Lock, AlertTriangle, Pencil, X, Flag } from 'lucide-react';
import { Acao, MacroEtapa, Marco } from '@/types/roadmap';
import { StatusBadge, PrioridadeBadge, SituacaoPrazoBadge } from './StatusBadge';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuthContext } from '@/contexts/AuthContext';
import { useUpdateSubtarefa } from '@/hooks/useSubtarefas';
import { useUpdateAcao } from '@/hooks/useAcoes';
import { toast } from 'sonner';

interface TimelineRoadmapProps {
  acoes: Acao[];
  allAcoes: Acao[];
  macroEtapas: MacroEtapa[];
  marcos?: Marco[];
  onEditAcao?: (acao: Acao) => void;
}

const COLUMN_WIDTH = 120;
const ROW_LABEL_WIDTH_LG = 200;
const ROW_LABEL_WIDTH_SM = 120;
const CARD_HEIGHT = 64;
const ROW_PADDING = 12;

function useRowLabelWidth() {
  const [width, setWidth] = useState(
    typeof window !== 'undefined' && window.innerWidth < 768 ? ROW_LABEL_WIDTH_SM : ROW_LABEL_WIDTH_LG
  );
  useEffect(() => {
    const handler = () => setWidth(window.innerWidth < 768 ? ROW_LABEL_WIDTH_SM : ROW_LABEL_WIDTH_LG);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return width;
}

function getWeekColumns(acoes: Acao[]): { label: string; start: Date; end: Date }[] {
  if (acoes.length === 0) return [];

  let minDate = new Date(acoes[0].dataInicio);
  let maxDate = new Date(acoes[0].dataFim);

  for (const a of acoes) {
    const s = new Date(a.dataInicio);
    const e = new Date(a.dataFim);
    if (s < minDate) minDate = s;
    if (e > maxDate) maxDate = e;
  }

  const startDay = new Date(minDate);
  startDay.setDate(startDay.getDate() - ((startDay.getDay() + 6) % 7));

  const cols: { label: string; start: Date; end: Date }[] = [];
  const cursor = new Date(startDay);

  while (cursor <= maxDate) {
    const weekStart = new Date(cursor);
    const weekEnd = new Date(cursor);
    weekEnd.setDate(weekEnd.getDate() + 6);

    const label = `${weekStart.getDate().toString().padStart(2, '0')}/${(weekStart.getMonth() + 1).toString().padStart(2, '0')}`;
    cols.push({ label, start: weekStart, end: weekEnd });
    cursor.setDate(cursor.getDate() + 7);
  }

  return cols;
}

function getMonthHeaders(columns: { label: string; start: Date; end: Date }[]): { label: string; span: number }[] {
  const months: { label: string; span: number }[] = [];
  const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  for (const col of columns) {
    const monthLabel = `${monthNames[col.start.getMonth()]} ${col.start.getFullYear()}`;
    if (months.length > 0 && months[months.length - 1].label === monthLabel) {
      months[months.length - 1].span++;
    } else {
      months.push({ label: monthLabel, span: 1 });
    }
  }
  return months;
}

// Expanded card overlay
const AcaoDetail = ({ acao, allAcoes, onClose, onEdit }: { acao: Acao; allAcoes: Acao[]; onClose: () => void; onEdit?: (acao: Acao) => void }) => {
  const [showSubs, setShowSubs] = useState(true);
  const depAcao = acao.dependenciaDe ? allAcoes.find(a => a.id === acao.dependenciaDe) : null;
  const { role } = useAuthContext();
  const updateSubtarefa = useUpdateSubtarefa();
  const updateAcao = useUpdateAcao();
  const canEdit = role === 'admin' || role === 'editor';

  const cycleStatus = async () => {
    if (!canEdit) return;
    const next = acao.status === 'não iniciada' ? 'em andamento' : acao.status === 'em andamento' ? 'concluída' : 'não iniciada';
    try {
      await updateAcao.mutateAsync({ id: acao.id, status: next });
    } catch (e: any) {
      toast.error(e.message || 'Erro ao atualizar status');
    }
  };

  const toggleSub = async (subId: string, currentStatus: string) => {
    if (!canEdit) return;
    const next = currentStatus === 'concluída' ? 'não iniciada' : 'concluída';
    try {
      await updateSubtarefa.mutateAsync({ id: subId, status: next });
    } catch (e: any) {
      toast.error(e.message || 'Erro ao atualizar subtarefa');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative w-full max-w-lg mx-4 bg-card border border-border rounded-xl shadow-xl overflow-hidden"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-label={`Detalhes da ação: ${acao.titulo}`}
      >
        <div className="p-5 space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono text-muted-foreground">{acao.id}</span>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={cycleStatus}
                  className={canEdit ? 'cursor-pointer hover:opacity-80' : ''}
                  disabled={!canEdit}
                  aria-label={`Status: ${acao.status}. ${canEdit ? 'Clique para alterar' : ''}`}
                >
                  <StatusBadge status={acao.status} bloqueada={acao.bloqueada} />
                </button>
              </TooltipTrigger>
              {canEdit && (
                <TooltipContent className="lowercase">clique para alterar status</TooltipContent>
              )}
            </Tooltip>
            <PrioridadeBadge prioridade={acao.prioridade} />
            <SituacaoPrazoBadge situacao={acao.situacaoPrazo} />
            {canEdit && onEdit && (
              <Button variant="ghost" size="sm" className="ml-auto h-7 gap-1.5 text-xs lowercase" onClick={() => { onEdit(acao); onClose(); }} aria-label="editar ação">
                <Pencil className="h-3.5 w-3.5" aria-hidden="true" /> editar
              </Button>
            )}
          </div>
          <h3 className="text-base font-semibold text-foreground">{acao.titulo}</h3>
          <p className="text-sm text-muted-foreground">{acao.descricao}</p>

          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><User className="h-3.5 w-3.5" aria-hidden="true" /> {acao.responsavel}</span>
            <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" aria-hidden="true" /> {acao.tempoEstimado}</span>
            <span>{new Date(acao.dataInicio).toLocaleDateString('pt-BR')} — {new Date(acao.dataFim).toLocaleDateString('pt-BR')}</span>
          </div>

          {depAcao && (
            <div className={`flex items-center gap-1.5 text-xs rounded-md px-2.5 py-1.5 ${
              acao.bloqueada ? 'bg-blocked/10 text-blocked' : 'bg-muted text-muted-foreground'
            }`}>
              <Link className="h-3.5 w-3.5" aria-hidden="true" />
              Depende de: <span className="font-medium">{depAcao.id} — {depAcao.titulo}</span>
              {acao.bloqueada && <span className="ml-1 font-semibold">(pendente)</span>}
            </div>
          )}

          {acao.subtarefas.length > 0 && (
            <>
              <button
                type="button"
                onClick={() => setShowSubs(!showSubs)}
                className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
              >
                {showSubs ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                {acao.subtarefas.length} subtarefa{acao.subtarefas.length > 1 ? 's' : ''}
                <span className="text-muted-foreground font-normal">
                  ({acao.subtarefas.filter(s => s.status === 'concluída').length}/{acao.subtarefas.length})
                </span>
              </button>
              {showSubs && (
                <div className="border-t border-border pt-3 space-y-2">
                  {acao.subtarefas.map(sub => (
                    <div key={sub.id} className="flex items-center gap-3 text-xs">
                      <Checkbox
                        checked={sub.status === 'concluída'}
                        disabled={!canEdit}
                        onCheckedChange={() => toggleSub(sub.id, sub.status)}
                        className="h-4 w-4"
                      />
                      <span className={`flex-1 ${sub.status === 'concluída' ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                        {sub.titulo}
                      </span>
                      {sub.responsavel && <span className="text-muted-foreground">{sub.responsavel}</span>}
                      {sub.tempoEstimado && <span className="text-muted-foreground">{sub.tempoEstimado}</span>}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 flex items-center justify-center h-8 w-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label="Fechar detalhes"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

const TimelineRoadmap = ({ acoes, allAcoes, macroEtapas, marcos = [], onEditAcao }: TimelineRoadmapProps) => {
  const [selectedAcaoId, setSelectedAcaoId] = useState<string | null>(null);
  const selectedAcao = selectedAcaoId ? allAcoes.find(a => a.id === selectedAcaoId) ?? null : null;
  const scrollRef = useRef<HTMLDivElement>(null);
  const rowLabelWidth = useRowLabelWidth();

  const columns = useMemo(() => getWeekColumns(allAcoes), [allAcoes]);
  const monthHeaders = useMemo(() => getMonthHeaders(columns), [columns]);

  const timelineStart = columns.length > 0 ? columns[0].start : new Date();
  const totalDays = columns.length > 0
    ? Math.ceil((columns[columns.length - 1].end.getTime() - columns[0].start.getTime()) / (1000 * 60 * 60 * 24)) + 1
    : 1;
  const totalWidth = columns.length * COLUMN_WIDTH;

  const getPosition = (dateStr: string) => {
    const d = new Date(dateStr);
    const dayOffset = Math.max(0, (d.getTime() - timelineStart.getTime()) / (1000 * 60 * 60 * 24));
    return (dayOffset / totalDays) * totalWidth;
  };

  const getWidth = (start: string, end: string) => {
    const s = new Date(start);
    const e = new Date(end);
    const days = Math.max(1, (e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24) + 1);
    return Math.max(100, (days / totalDays) * totalWidth);
  };

  // Scroll to today on mount
  useEffect(() => {
    if (scrollRef.current && columns.length > 0) {
      const today = new Date();
      const todayPos = getPosition(today.toISOString().split('T')[0]);
      const containerWidth = scrollRef.current.clientWidth;
      scrollRef.current.scrollLeft = Math.max(0, todayPos - containerWidth / 3);
    }
  }, [columns.length]);

  // Group actions by macro etapa and stack overlapping ones
  const etapasWithAcoes = useMemo(() => {
    return macroEtapas.map(etapa => {
      const etapaAcoes = acoes.filter(a => a.macroEtapa === etapa.titulo);

      const rows: Acao[][] = [];
      for (const acao of etapaAcoes.sort((a, b) => new Date(a.dataInicio).getTime() - new Date(b.dataInicio).getTime())) {
        let placed = false;
        for (const row of rows) {
          const lastInRow = row[row.length - 1];
          if (new Date(acao.dataInicio) > new Date(lastInRow.dataFim)) {
            row.push(acao);
            placed = true;
            break;
          }
        }
        if (!placed) rows.push([acao]);
      }

      return { etapa, acoes: etapaAcoes, rows };
    }).filter(e => e.acoes.length > 0);
  }, [acoes, macroEtapas]);

  // Today line position
  const today = new Date();
  const todayOffset = getPosition(today.toISOString().split('T')[0]);
  const isTodayVisible = todayOffset >= 0 && todayOffset <= totalWidth;

  // Find which column contains today
  const todayColIndex = columns.findIndex(col => today >= col.start && today <= col.end);

  if (acoes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <p className="text-lg font-extrabold lowercase">nenhuma ação encontrada</p>
        <p className="text-sm lowercase">tente ajustar os filtros</p>
      </div>
    );
  }

  return (
    <>
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="flex">
          {/* Left: Macro etapa labels */}
          <div className="shrink-0 border-r border-border bg-card z-10" style={{ width: rowLabelWidth }}>
            {/* Month header spacer */}
            <div className="h-8 border-b border-border" />
            {/* Week header spacer */}
            <div className="h-10 border-b border-border" />
            {/* Etapa rows */}
            {etapasWithAcoes.map(({ etapa, rows }) => (
              <div
                key={etapa.id}
                className="border-b border-border flex items-start"
                style={{ minHeight: Math.max(1, rows.length) * (CARD_HEIGHT + ROW_PADDING) + ROW_PADDING }}
              >
                <div className="p-3 w-full">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: etapa.cor }} />
                    <span className="text-xs font-semibold text-foreground leading-tight truncate">{etapa.titulo}</span>
                  </div>
                  {etapa.descricao && rowLabelWidth > ROW_LABEL_WIDTH_SM && (
                    <p className="text-[10px] text-muted-foreground mt-1 leading-tight pl-[18px]">{etapa.descricao}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Right: Timeline area */}
          <div className="flex-1 overflow-x-auto" ref={scrollRef}>
            <div style={{ minWidth: totalWidth }}>
              {/* Month headers */}
              <div className="flex h-8 border-b border-border bg-muted/40 sticky top-0 z-[5]">
                {monthHeaders.map((m, i) => (
                  <div
                    key={i}
                    className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-center border-r border-border"
                    style={{ width: m.span * COLUMN_WIDTH }}
                  >
                    {m.label}
                  </div>
                ))}
              </div>

              {/* Week headers */}
              <div className="relative flex h-10 border-b border-border bg-muted/20 sticky top-8 z-[5]">
                {columns.map((col, i) => {
                  const isToday = i === todayColIndex;
                  return (
                    <div
                      key={i}
                      className={`text-[11px] font-medium flex items-center justify-center border-r border-border/50 lowercase ${
                        isToday ? 'text-brand-bordo font-bold bg-brand-bordo/10' : 'text-muted-foreground'
                      }`}
                      style={{ width: COLUMN_WIDTH }}
                    >
                      {isToday ? '● hoje' : `sem ${col.label}`}
                    </div>
                  );
                })}
                {/* Marco flags no header */}
                {marcos.map((marco) => {
                  const left = getPosition(marco.data);
                  if (left < 0 || left > totalWidth) return null;
                  return (
                    <Tooltip key={marco.id}>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          className="absolute -top-1 -translate-x-1/2 z-10 hover:scale-110 transition-transform"
                          style={{ left }}
                          aria-label={`marco: ${marco.nome}`}
                        >
                          <Flag
                            className="h-4 w-4 drop-shadow-sm"
                            style={{ color: marco.cor, fill: marco.cor }}
                            strokeWidth={2}
                          />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="max-w-[260px]">
                        <div className="space-y-0.5">
                          <p className="font-semibold lowercase">{marco.nome}</p>
                          <p className="text-[11px] opacity-80 lowercase">
                            {new Date(marco.data + 'T00:00:00').toLocaleDateString('pt-BR', {
                              day: '2-digit', month: 'short', year: 'numeric',
                            })}
                          </p>
                          {marco.descricao && (
                            <p className="text-[11px] opacity-80 mt-1">{marco.descricao}</p>
                          )}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>

              {/* Swimlane rows */}
              {etapasWithAcoes.map(({ etapa, rows }) => {
                const rowHeight = Math.max(1, rows.length) * (CARD_HEIGHT + ROW_PADDING) + ROW_PADDING;
                return (
                  <div
                    key={etapa.id}
                    className="relative border-b border-border"
                    style={{ height: rowHeight }}
                  >
                    {/* Grid lines */}
                    <div className="absolute inset-0 flex pointer-events-none">
                      {columns.map((_, i) => (
                        <div
                          key={i}
                          className="border-r border-border/30 h-full"
                          style={{ width: COLUMN_WIDTH }}
                        />
                      ))}
                    </div>

                    {/* Marco lines — verticais coloridas */}
                    {marcos.map((marco) => {
                      const left = getPosition(marco.data);
                      if (left < 0 || left > totalWidth) return null;
                      return (
                        <div
                          key={marco.id}
                          className="absolute top-0 bottom-0 w-[2px] z-[3] pointer-events-none opacity-70"
                          style={{ left, backgroundColor: marco.cor }}
                          aria-hidden="true"
                        />
                      );
                    })}

                    {/* Today marker — linha vermelha do hoje */}
                    {isTodayVisible && (
                      <div
                        className="absolute top-0 bottom-0 w-[2px] bg-brand-bordo z-20 pointer-events-none shadow-[0_0_0_1px_rgba(147,37,63,0.15)]"
                        style={{ left: todayOffset }}
                        aria-hidden="true"
                      />
                    )}

                    {/* Action cards */}
                    {rows.map((rowAcoes, rowIdx) =>
                      rowAcoes.map(acao => {
                        const left = getPosition(acao.dataInicio);
                        const width = getWidth(acao.dataInicio, acao.dataFim);
                        const top = ROW_PADDING + rowIdx * (CARD_HEIGHT + ROW_PADDING);

                        const isBlocked = acao.bloqueada;
                        const isAtrasada = acao.situacaoPrazo === 'atrasada';
                        const isAlta = acao.prioridade === 'alta';
                        const isConcluida = acao.status === 'concluída';

                        let cardBg = 'bg-card';
                        let borderColor = 'border-border';
                        if (isBlocked) { cardBg = 'bg-blocked/5'; borderColor = 'border-blocked/40'; }
                        else if (isAtrasada) { cardBg = 'bg-destructive/5'; borderColor = 'border-destructive/40'; }
                        else if (isConcluida) { cardBg = 'bg-success/5'; borderColor = 'border-success/30'; }
                        else if (isAlta) { borderColor = 'border-warning/40'; }

                        return (
                          <button
                            type="button"
                            key={acao.id}
                            className={`absolute rounded-lg border ${borderColor} ${cardBg} shadow-sm cursor-pointer
                              hover:shadow-md hover:z-10 transition-shadow duration-150 text-left
                              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary
                              ${isBlocked ? 'opacity-70' : ''}`}
                            style={{ left, top, width: Math.max(width, 100), height: CARD_HEIGHT }}
                            onClick={() => setSelectedAcaoId(acao.id)}
                            aria-label={`${acao.titulo} — ${acao.status}, ${acao.prioridade} prioridade`}
                          >
                            <div className="px-2.5 py-2 h-full flex flex-col justify-center overflow-hidden">
                              <div className="flex items-center gap-1.5">
                                {isBlocked && <Lock className="h-3 w-3 text-blocked shrink-0" aria-hidden="true" />}
                                {isAtrasada && !isBlocked && <AlertTriangle className="h-3 w-3 text-destructive shrink-0" aria-hidden="true" />}
                                <span className="text-[12px] font-semibold text-foreground truncate leading-tight">
                                  {acao.titulo}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] text-muted-foreground truncate">{acao.responsavel}</span>
                                <span className={`text-[10px] font-medium ${
                                  isAlta ? 'text-destructive' : isAtrasada ? 'text-destructive' : 'text-muted-foreground'
                                }`}>
                                  {acao.prioridade === 'alta' ? '● Alta' : acao.prioridade === 'média' ? '● Média' : '● Baixa'}
                                </span>
                                {isConcluida && <span className="text-[10px] text-success font-medium">✓</span>}
                              </div>
                              {acao.subtarefas.length > 0 && (
                                <div className="flex items-center gap-1 mt-0.5">
                                  <div className="flex-1 h-1 rounded-full bg-muted overflow-hidden max-w-[60px]">
                                    <div
                                      className="h-full rounded-full bg-primary/60"
                                      style={{ width: `${(acao.subtarefas.filter(s => s.status === 'concluída').length / acao.subtarefas.length) * 100}%` }}
                                    />
                                  </div>
                                  <span className="text-[9px] text-muted-foreground">
                                    {acao.subtarefas.filter(s => s.status === 'concluída').length}/{acao.subtarefas.length}
                                  </span>
                                </div>
                              )}
                            </div>
                            {/* Left accent bar */}
                            <div
                              className="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg"
                              style={{ backgroundColor: etapa.cor }}
                            />
                          </button>
                        );
                      })
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Detail overlay */}
      {selectedAcao && (
        <AcaoDetail acao={selectedAcao} allAcoes={allAcoes} onClose={() => setSelectedAcaoId(null)} onEdit={onEditAcao} />
      )}
    </>
  );
};

export default TimelineRoadmap;
