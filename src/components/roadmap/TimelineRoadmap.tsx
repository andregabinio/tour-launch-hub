import { useState, useMemo, useRef, useEffect } from 'react';
import { ChevronDown, ChevronUp, User, Clock, Link, Lock, AlertTriangle, Pencil, X, Flag, Plus, Trash2, Check } from 'lucide-react';
import { Acao, MacroEtapa, Marco } from '@/types/roadmap';
import { StatusBadge, PrioridadeBadge, SituacaoPrazoBadge } from './StatusBadge';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuthContext } from '@/contexts/AuthContext';
import { useUpdateSubtarefa, useCreateSubtarefa, useDeleteSubtarefa } from '@/hooks/useSubtarefas';
import { useUpdateAcao } from '@/hooks/useAcoes';
import { toast } from 'sonner';

interface TimelineRoadmapProps {
  acoes: Acao[];
  allAcoes: Acao[];
  macroEtapas: MacroEtapa[];
  marcos?: Marco[];
  onEditAcao?: (acao: Acao) => void;
}

type TimelineScale = 'day' | 'week' | 'month' | 'quarter';

const columnWidth_BY_SCALE: Record<TimelineScale, number> = {
  day: 40,
  week: 120,
  month: 160,
  quarter: 220,
};

const ROW_LABEL_WIDTH_LG = 200;
const ROW_LABEL_WIDTH_SM = 120;
const CARD_HEIGHT = 80;
const ROW_PADDING = 14;

function hexToRgba(hex: string | undefined, alpha: number): string {
  if (!hex || !hex.startsWith('#') || (hex.length !== 7 && hex.length !== 4)) {
    return `rgba(99, 102, 241, ${alpha})`;
  }
  let r: number, g: number, b: number;
  if (hex.length === 4) {
    r = parseInt(hex[1] + hex[1], 16);
    g = parseInt(hex[2] + hex[2], 16);
    b = parseInt(hex[3] + hex[3], 16);
  } else {
    r = parseInt(hex.slice(1, 3), 16);
    g = parseInt(hex.slice(3, 5), 16);
    b = parseInt(hex.slice(5, 7), 16);
  }
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

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

const MONTH_NAMES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

type Column = { label: string; start: Date; end: Date };

function getColumns(acoes: Acao[], scale: TimelineScale): Column[] {
  if (acoes.length === 0) return [];

  let minDate = new Date(acoes[0].dataInicio);
  let maxDate = new Date(acoes[0].dataFim);
  for (const a of acoes) {
    const s = new Date(a.dataInicio);
    const e = new Date(a.dataFim);
    if (s < minDate) minDate = s;
    if (e > maxDate) maxDate = e;
  }

  const cols: Column[] = [];

  if (scale === 'day') {
    const cursor = new Date(minDate);
    while (cursor <= maxDate) {
      const start = new Date(cursor);
      const end = new Date(cursor);
      const label = `${start.getDate().toString().padStart(2, '0')}/${MONTH_NAMES[start.getMonth()]}`;
      cols.push({ label, start, end });
      cursor.setDate(cursor.getDate() + 1);
    }
    return cols;
  }

  if (scale === 'week') {
    const startDay = new Date(minDate);
    startDay.setDate(startDay.getDate() - ((startDay.getDay() + 6) % 7));
    const cursor = new Date(startDay);
    while (cursor <= maxDate) {
      const start = new Date(cursor);
      const end = new Date(cursor);
      end.setDate(end.getDate() + 6);
      const label = `${start.getDate().toString().padStart(2, '0')}/${(start.getMonth() + 1).toString().padStart(2, '0')}`;
      cols.push({ label, start, end });
      cursor.setDate(cursor.getDate() + 7);
    }
    return cols;
  }

  if (scale === 'month') {
    const cursor = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
    while (cursor <= maxDate) {
      const start = new Date(cursor);
      const end = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);
      const label = `${MONTH_NAMES[start.getMonth()]}/${start.getFullYear().toString().slice(-2)}`;
      cols.push({ label, start, end });
      cursor.setMonth(cursor.getMonth() + 1);
    }
    return cols;
  }

  // quarter
  const startMonth = Math.floor(minDate.getMonth() / 3) * 3;
  const cursor = new Date(minDate.getFullYear(), startMonth, 1);
  while (cursor <= maxDate) {
    const start = new Date(cursor);
    const end = new Date(cursor.getFullYear(), cursor.getMonth() + 3, 0);
    const q = Math.floor(start.getMonth() / 3) + 1;
    const label = `t${q}/${start.getFullYear().toString().slice(-2)}`;
    cols.push({ label, start, end });
    cursor.setMonth(cursor.getMonth() + 3);
  }
  return cols;
}

function getHeaderGroups(columns: Column[], scale: TimelineScale): { label: string; span: number }[] {
  const groups: { label: string; span: number }[] = [];
  if (columns.length === 0) return groups;

  const keyOf = (col: Column): string => {
    if (scale === 'day' || scale === 'week') {
      return `${MONTH_NAMES[col.start.getMonth()]} ${col.start.getFullYear()}`;
    }
    return `${col.start.getFullYear()}`;
  };

  for (const col of columns) {
    const label = keyOf(col);
    if (groups.length > 0 && groups[groups.length - 1].label === label) {
      groups[groups.length - 1].span++;
    } else {
      groups.push({ label, span: 1 });
    }
  }
  return groups;
}

// Expanded card overlay
const AcaoDetail = ({ acao, allAcoes, onClose, onEdit }: { acao: Acao; allAcoes: Acao[]; onClose: () => void; onEdit?: (acao: Acao) => void }) => {
  const [showSubs, setShowSubs] = useState(true);
  const [newSubtarefa, setNewSubtarefa] = useState('');
  const [showAddSub, setShowAddSub] = useState(false);
  const [editingSubId, setEditingSubId] = useState<string | null>(null);
  const [editSubForm, setEditSubForm] = useState({ titulo: '', responsavel: '', tempo_estimado: '' });
  const depAcao = acao.dependenciaDe ? allAcoes.find(a => a.id === acao.dependenciaDe) : null;
  const { role } = useAuthContext();
  const updateSubtarefa = useUpdateSubtarefa();
  const createSubtarefa = useCreateSubtarefa();
  const deleteSubtarefa = useDeleteSubtarefa();
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

  const handleAddSubtarefa = async () => {
    if (!newSubtarefa.trim()) return;
    try {
      await createSubtarefa.mutateAsync({
        acao_id: acao.id,
        titulo: newSubtarefa.trim(),
        status: 'não iniciada',
        responsavel: '',
        tempo_estimado: '',
      });
      setNewSubtarefa('');
      setShowAddSub(false);
    } catch (e: any) {
      toast.error(e.message || 'erro ao criar subtarefa');
    }
  };

  const handleDeleteSubtarefa = async (subId: string) => {
    if (role !== 'admin') return;
    try {
      await deleteSubtarefa.mutateAsync(subId);
    } catch (e: any) {
      toast.error(e.message || 'erro ao excluir subtarefa');
    }
  };

  const startEditSub = (sub: Acao['subtarefas'][number]) => {
    if (!canEdit) return;
    setEditingSubId(sub.id);
    setEditSubForm({
      titulo: sub.titulo,
      responsavel: sub.responsavel ?? '',
      tempo_estimado: sub.tempoEstimado ?? '',
    });
  };

  const cancelEditSub = () => {
    setEditingSubId(null);
    setEditSubForm({ titulo: '', responsavel: '', tempo_estimado: '' });
  };

  const saveEditSub = async () => {
    if (!editingSubId || !editSubForm.titulo.trim()) return;
    try {
      await updateSubtarefa.mutateAsync({
        id: editingSubId,
        titulo: editSubForm.titulo.trim(),
        responsavel: editSubForm.responsavel.trim(),
        tempo_estimado: editSubForm.tempo_estimado.trim(),
      });
      cancelEditSub();
    } catch (e: any) {
      toast.error(e.message || 'erro ao salvar subtarefa');
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
              Depende de: <span className="font-medium">{depAcao.titulo}</span>
              {acao.bloqueada && <span className="ml-1 font-semibold">(pendente)</span>}
            </div>
          )}

          {(acao.subtarefas.length > 0 || canEdit) && (
            <>
              <div className="flex items-center gap-3">
                {acao.subtarefas.length > 0 && (
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
                )}
                {canEdit && (
                  <button
                    type="button"
                    onClick={() => { setShowSubs(true); setShowAddSub(true); }}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary lowercase"
                  >
                    <Plus className="h-3.5 w-3.5" /> subtarefa
                  </button>
                )}
              </div>
              {showSubs && (
                <div className="border-t border-border pt-3 space-y-2">
                  {acao.subtarefas.map(sub => {
                    const isEditing = editingSubId === sub.id;
                    if (isEditing) {
                      return (
                        <div key={sub.id} className="flex flex-col gap-2 p-2 rounded-md bg-muted/40 border border-border">
                          <Input
                            value={editSubForm.titulo}
                            onChange={e => setEditSubForm(f => ({ ...f, titulo: e.target.value }))}
                            placeholder="título"
                            className="h-8 text-xs"
                            autoFocus
                            onKeyDown={e => { if (e.key === 'Escape') cancelEditSub(); }}
                          />
                          <div className="flex gap-2">
                            <Input
                              value={editSubForm.responsavel}
                              onChange={e => setEditSubForm(f => ({ ...f, responsavel: e.target.value }))}
                              placeholder="responsável"
                              className="h-8 text-xs flex-1"
                              onKeyDown={e => { if (e.key === 'Escape') cancelEditSub(); }}
                            />
                            <Input
                              value={editSubForm.tempo_estimado}
                              onChange={e => setEditSubForm(f => ({ ...f, tempo_estimado: e.target.value }))}
                              placeholder="tempo (ex: 3 dias)"
                              className="h-8 text-xs flex-1"
                              onKeyDown={e => {
                                if (e.key === 'Enter') saveEditSub();
                                if (e.key === 'Escape') cancelEditSub();
                              }}
                            />
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 text-xs lowercase"
                              onClick={cancelEditSub}
                            >
                              cancelar
                            </Button>
                            <Button
                              size="sm"
                              className="h-7 text-xs lowercase gap-1"
                              onClick={saveEditSub}
                              disabled={updateSubtarefa.isPending || !editSubForm.titulo.trim()}
                            >
                              <Check className="h-3.5 w-3.5" /> salvar
                            </Button>
                          </div>
                        </div>
                      );
                    }
                    return (
                      <div key={sub.id} className="flex items-center gap-3 text-xs group">
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
                        {canEdit && (
                          <button
                            type="button"
                            onClick={() => startEditSub(sub)}
                            className="sm:opacity-0 sm:group-hover:opacity-100 text-muted-foreground hover:text-primary p-1"
                            aria-label={`editar subtarefa: ${sub.titulo}`}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {role === 'admin' && (
                          <button
                            type="button"
                            onClick={() => handleDeleteSubtarefa(sub.id)}
                            className="sm:opacity-0 sm:group-hover:opacity-100 text-destructive hover:text-destructive/80 p-1"
                            aria-label={`excluir subtarefa: ${sub.titulo}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                  {showAddSub && canEdit && (
                    <div className="flex items-center gap-2 pt-1">
                      <Input
                        value={newSubtarefa}
                        onChange={e => setNewSubtarefa(e.target.value)}
                        placeholder="nome da subtarefa"
                        className="h-8 text-xs"
                        onKeyDown={e => {
                          if (e.key === 'Enter') handleAddSubtarefa();
                          if (e.key === 'Escape') { setNewSubtarefa(''); setShowAddSub(false); }
                        }}
                        autoFocus
                      />
                      <Button
                        size="sm"
                        className="h-8 text-xs lowercase"
                        onClick={handleAddSubtarefa}
                        disabled={createSubtarefa.isPending || !newSubtarefa.trim()}
                      >
                        adicionar
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 text-xs lowercase"
                        onClick={() => { setNewSubtarefa(''); setShowAddSub(false); }}
                      >
                        cancelar
                      </Button>
                    </div>
                  )}
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

type DragMode = 'move' | 'resize-left' | 'resize-right';
type DragState = {
  acaoId: string;
  mode: DragMode;
  startX: number;
  originalStart: string;
  originalEnd: string;
  deltaDays: number;
  pixelsPerDay: number;
  moved: boolean;
};

function addDaysISO(iso: string, days: number): string {
  const d = new Date(iso + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function diffDaysInclusive(startISO: string, endISO: string): number {
  const s = new Date(startISO + 'T00:00:00').getTime();
  const e = new Date(endISO + 'T00:00:00').getTime();
  return Math.floor((e - s) / 86400000) + 1;
}

function applyDrag(acao: Acao, drag: DragState): { dataInicio: string; dataFim: string } {
  if (drag.mode === 'move') {
    return {
      dataInicio: addDaysISO(drag.originalStart, drag.deltaDays),
      dataFim: addDaysISO(drag.originalEnd, drag.deltaDays),
    };
  }
  if (drag.mode === 'resize-left') {
    const totalDays = diffDaysInclusive(drag.originalStart, drag.originalEnd);
    const maxDelta = totalDays - 1;
    const clamped = Math.min(drag.deltaDays, maxDelta);
    return { dataInicio: addDaysISO(drag.originalStart, clamped), dataFim: drag.originalEnd };
  }
  const totalDays = diffDaysInclusive(drag.originalStart, drag.originalEnd);
  const minDelta = -(totalDays - 1);
  const clamped = Math.max(drag.deltaDays, minDelta);
  return { dataInicio: drag.originalStart, dataFim: addDaysISO(drag.originalEnd, clamped) };
}

const TimelineRoadmap = ({ acoes, allAcoes, macroEtapas, marcos = [], onEditAcao }: TimelineRoadmapProps) => {
  const [selectedAcaoId, setSelectedAcaoId] = useState<string | null>(null);
  const selectedAcao = selectedAcaoId ? allAcoes.find(a => a.id === selectedAcaoId) ?? null : null;
  const scrollRef = useRef<HTMLDivElement>(null);
  const rowLabelWidth = useRowLabelWidth();
  const { role } = useAuthContext();
  const canEdit = role === 'admin' || role === 'editor';
  const updateAcao = useUpdateAcao();
  const [drag, setDrag] = useState<DragState | null>(null);
  const [scale, setScale] = useState<TimelineScale>('week');
  const columnWidth = columnWidth_BY_SCALE[scale];

  const columns = useMemo(() => getColumns(allAcoes, scale), [allAcoes, scale]);
  const headerGroups = useMemo(() => getHeaderGroups(columns, scale), [columns, scale]);

  const timelineStart = columns.length > 0 ? columns[0].start : new Date();
  const totalDays = columns.length > 0
    ? Math.ceil((columns[columns.length - 1].end.getTime() - columns[0].start.getTime()) / (1000 * 60 * 60 * 24)) + 1
    : 1;
  const totalWidth = columns.length * columnWidth;

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

  // Scroll to today on mount and when scale changes
  useEffect(() => {
    if (scrollRef.current && columns.length > 0) {
      const today = new Date();
      const todayPos = getPosition(today.toISOString().split('T')[0]);
      const containerWidth = scrollRef.current.clientWidth;
      scrollRef.current.scrollLeft = Math.max(0, todayPos - containerWidth / 3);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columns.length, scale]);

  const pixelsPerDay = totalDays > 0 ? totalWidth / totalDays : 0;

  // Global pointer listeners while dragging
  useEffect(() => {
    if (!drag) return;

    const handleMove = (e: PointerEvent) => {
      if (drag.pixelsPerDay === 0) return;
      const deltaDays = Math.round((e.clientX - drag.startX) / drag.pixelsPerDay);
      const movedPx = Math.abs(e.clientX - drag.startX);
      setDrag(prev => {
        if (!prev) return prev;
        if (prev.deltaDays === deltaDays && prev.moved === movedPx > 4) return prev;
        return { ...prev, deltaDays, moved: prev.moved || movedPx > 4 };
      });
    };

    const handleUp = async () => {
      const current = drag;
      setDrag(null);
      if (!current.moved || current.deltaDays === 0) return;

      const acao = allAcoes.find(a => a.id === current.acaoId);
      if (!acao) return;
      const { dataInicio, dataFim } = applyDrag(acao, current);
      if (dataInicio === acao.dataInicio && dataFim === acao.dataFim) return;

      const totalDays = diffDaysInclusive(dataInicio, dataFim);
      const tempo_estimado = totalDays === 1 ? '1 dia' : `${totalDays} dias`;

      try {
        await updateAcao.mutateAsync({
          id: acao.id,
          data_inicio: dataInicio,
          data_fim: dataFim,
          tempo_estimado,
        });

        if (acao.dependenciaDe) {
          const pai = allAcoes.find(a => a.id === acao.dependenciaDe);
          if (pai && new Date(dataInicio) < new Date(pai.dataFim)) {
            toast.warning(`atenção: esta ação fica antes do fim de "${pai.titulo}"`);
          }
        }
      } catch (e: any) {
        toast.error(e.message || 'erro ao mover ação');
      }
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    window.addEventListener('pointercancel', handleUp);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
      window.removeEventListener('pointercancel', handleUp);
    };
  }, [drag, allAcoes, updateAcao]);

  const startDrag = (acao: Acao, mode: DragMode, clientX: number) => {
    if (!canEdit || pixelsPerDay === 0) return;
    setDrag({
      acaoId: acao.id,
      mode,
      startX: clientX,
      originalStart: acao.dataInicio,
      originalEnd: acao.dataFim,
      deltaDays: 0,
      pixelsPerDay,
      moved: false,
    });
  };

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

  const scaleOptions: { value: TimelineScale; label: string }[] = [
    { value: 'day', label: 'dia' },
    { value: 'week', label: 'semana' },
    { value: 'month', label: 'mês' },
    { value: 'quarter', label: 'trimestre' },
  ];

  return (
    <>
      <div className="flex items-center justify-end gap-1 mb-2">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground mr-2">escala</span>
        <div className="inline-flex rounded-md border border-border bg-card p-0.5">
          {scaleOptions.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setScale(opt.value)}
              className={`text-xs px-2.5 py-1 rounded transition-colors lowercase ${
                scale === opt.value
                  ? 'bg-primary text-primary-foreground font-medium'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
              aria-pressed={scale === opt.value}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
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
              {/* Group headers (month for day/week, year for month/quarter) */}
              <div className="flex h-8 border-b border-border bg-muted/40 sticky top-0 z-[5]">
                {headerGroups.map((m, i) => (
                  <div
                    key={i}
                    className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-center border-r border-border"
                    style={{ width: m.span * columnWidth }}
                  >
                    {m.label}
                  </div>
                ))}
              </div>

              {/* Column headers */}
              <div className="relative flex h-10 border-b border-border bg-muted/20 sticky top-8 z-[5]">
                {columns.map((col, i) => {
                  const isToday = i === todayColIndex;
                  const prefix = scale === 'week' ? 'sem ' : '';
                  return (
                    <div
                      key={i}
                      className={`text-[11px] font-medium flex items-center justify-center border-r border-border/50 lowercase ${
                        isToday ? 'text-brand-bordo font-bold bg-brand-bordo/10' : 'text-muted-foreground'
                      }`}
                      style={{ width: columnWidth }}
                    >
                      {isToday && scale === 'day' ? '● hoje' : `${prefix}${col.label}`}
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
                    className="relative border-b border-border bg-muted/20"
                    style={{ height: rowHeight }}
                  >
                    {/* Grid lines */}
                    <div className="absolute inset-0 flex pointer-events-none">
                      {columns.map((_, i) => (
                        <div
                          key={i}
                          className="border-r border-border/30 h-full"
                          style={{ width: columnWidth }}
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
                        const isDraggingThis = drag?.acaoId === acao.id;
                        const dragged = isDraggingThis ? applyDrag(acao, drag!) : null;
                        const effectiveStart = dragged?.dataInicio ?? acao.dataInicio;
                        const effectiveEnd = dragged?.dataFim ?? acao.dataFim;

                        const left = getPosition(effectiveStart);
                        const width = getWidth(effectiveStart, effectiveEnd);
                        const top = ROW_PADDING + rowIdx * (CARD_HEIGHT + ROW_PADDING);

                        const isBlocked = acao.bloqueada;
                        const isAtrasada = acao.situacaoPrazo === 'atrasada';
                        const isAlta = acao.prioridade === 'alta';
                        const isConcluida = acao.status === 'concluída';
                        const isEmAndamento = acao.status === 'em andamento';
                        const effectiveWidth = Math.max(width, 100);
                        const isNarrow = effectiveWidth < 160;
                        const isVeryNarrow = effectiveWidth < 110;

                        const totalSubs = acao.subtarefas.length;
                        const doneSubs = acao.subtarefas.filter(s => s.status === 'concluída').length;
                        const progressPct = totalSubs > 0 ? Math.round((doneSubs / totalSubs) * 100) : 0;

                        let stateClasses = 'border-2';
                        const cardStyle: React.CSSProperties = {
                          left,
                          top,
                          width: effectiveWidth,
                          height: CARD_HEIGHT,
                        };

                        if (isBlocked) {
                          stateClasses += ' bg-blocked/15 border-blocked/60';
                        } else if (isAtrasada) {
                          stateClasses += ' bg-destructive/10 border-destructive/55';
                        } else if (isConcluida) {
                          stateClasses += ' bg-success/15 border-success/55';
                        } else {
                          cardStyle.backgroundColor = hexToRgba(etapa.cor, isEmAndamento ? 0.22 : 0.13);
                          cardStyle.borderColor = hexToRgba(etapa.cor, 0.55);
                        }
                        if (isAlta && !isBlocked && !isAtrasada && !isConcluida) {
                          stateClasses += ' ring-1 ring-warning/50';
                        }

                        return (
                          <div
                            key={acao.id}
                            className={`absolute rounded-lg ${stateClasses} shadow-sm
                              hover:shadow-md hover:z-10 transition-shadow duration-150
                              focus-within:outline-none focus-within:ring-2 focus-within:ring-primary
                              ${isBlocked ? 'opacity-80' : ''}
                              ${isDraggingThis ? 'shadow-lg ring-2 ring-primary/60 z-20' : ''}`}
                            style={cardStyle}
                          >
                            <button
                              type="button"
                              className={`absolute inset-0 w-full h-full text-left rounded-lg
                                ${canEdit ? (isDraggingThis ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-pointer'}`}
                              onPointerDown={e => {
                                if (e.button !== 0) return;
                                if (canEdit) {
                                  e.preventDefault();
                                  startDrag(acao, 'move', e.clientX);
                                }
                              }}
                              onClick={e => {
                                if (drag?.moved) { e.preventDefault(); return; }
                                setSelectedAcaoId(acao.id);
                              }}
                              aria-label={`${acao.titulo} — ${acao.status}, ${acao.prioridade} prioridade`}
                            />
                            {canEdit && (
                              <>
                                <div
                                  role="separator"
                                  aria-label="redimensionar início"
                                  className="absolute left-0 top-0 bottom-0 w-1.5 cursor-ew-resize z-10 hover:bg-primary/40 rounded-l-lg"
                                  onPointerDown={e => {
                                    if (e.button !== 0) return;
                                    e.preventDefault();
                                    e.stopPropagation();
                                    startDrag(acao, 'resize-left', e.clientX);
                                  }}
                                />
                                <div
                                  role="separator"
                                  aria-label="redimensionar fim"
                                  className="absolute right-0 top-0 bottom-0 w-1.5 cursor-ew-resize z-10 hover:bg-primary/40 rounded-r-lg"
                                  onPointerDown={e => {
                                    if (e.button !== 0) return;
                                    e.preventDefault();
                                    e.stopPropagation();
                                    startDrag(acao, 'resize-right', e.clientX);
                                  }}
                                />
                              </>
                            )}
                            <div className="pointer-events-none px-3 py-2 h-full flex flex-col justify-center gap-1 overflow-hidden">
                              <div className="flex items-center gap-1.5 min-w-0">
                                {isBlocked && <Lock className="h-3.5 w-3.5 text-blocked shrink-0" aria-hidden="true" />}
                                {isAtrasada && !isBlocked && <AlertTriangle className="h-3.5 w-3.5 text-destructive shrink-0" aria-hidden="true" />}
                                {isConcluida && <Check className="h-3.5 w-3.5 text-success shrink-0" aria-hidden="true" />}
                                <span className="text-[13px] font-semibold text-foreground truncate leading-tight">
                                  {acao.titulo}
                                </span>
                              </div>
                              {!isVeryNarrow && (
                                <div className="flex items-center gap-2 text-[11px] leading-tight min-w-0">
                                  <span className="font-medium text-foreground/80 shrink-0">
                                    {acao.tempoEstimado || `${diffDaysInclusive(effectiveStart, effectiveEnd)} dias`}
                                  </span>
                                  {!isNarrow && acao.responsavel && (
                                    <>
                                      <span className="text-muted-foreground/60" aria-hidden="true">·</span>
                                      <span className="text-muted-foreground truncate">{acao.responsavel}</span>
                                    </>
                                  )}
                                  <span className={`ml-auto shrink-0 font-medium ${
                                    isAlta ? 'text-warning' : 'text-muted-foreground'
                                  }`}>
                                    {acao.prioridade === 'alta' ? '● alta' : acao.prioridade === 'média' ? '● média' : '● baixa'}
                                  </span>
                                </div>
                              )}
                              {totalSubs > 0 && !isVeryNarrow && (
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 h-1.5 rounded-full bg-foreground/10 overflow-hidden">
                                    <div
                                      className={`h-full rounded-full ${isConcluida ? 'bg-success' : 'bg-primary/80'}`}
                                      style={{ width: `${progressPct}%` }}
                                    />
                                  </div>
                                  <span className="text-[10px] font-semibold text-foreground/70 tabular-nums shrink-0">
                                    {progressPct}%
                                  </span>
                                </div>
                              )}
                            </div>
                            {/* Left accent bar — marca a macro etapa */}
                            <div
                              className="pointer-events-none absolute left-0 top-0 bottom-0 w-1.5 rounded-l-md"
                              style={{ backgroundColor: etapa.cor }}
                            />
                            {isDraggingThis && (
                              <div className="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 bg-foreground text-background text-[10px] font-medium px-2 py-1 rounded whitespace-nowrap shadow-lg z-30">
                                {new Date(effectiveStart + 'T00:00:00').toLocaleDateString('pt-BR')} → {new Date(effectiveEnd + 'T00:00:00').toLocaleDateString('pt-BR')}
                                {' · '}{diffDaysInclusive(effectiveStart, effectiveEnd)} dias
                              </div>
                            )}
                          </div>
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
