import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ChevronUp, ChevronDown, Pencil, Trash2, Plus, X, Check } from 'lucide-react';
import {
  useMacroEtapas,
  useCreateMacroEtapa,
  useUpdateMacroEtapa,
  useDeleteMacroEtapa,
  useReorderMacroEtapas,
} from '@/hooks/useMacroEtapas';
import { useAcoes } from '@/hooks/useAcoes';
import { toast } from 'sonner';

const COLORS = [
  'hsl(221, 83%, 53%)',
  'hsl(262, 83%, 58%)',
  'hsl(38, 92%, 50%)',
  'hsl(142, 76%, 36%)',
  'hsl(0, 84%, 60%)',
  'hsl(220, 9%, 46%)',
  'hsl(330, 80%, 55%)',
  'hsl(190, 80%, 45%)',
];

interface MacroEtapaManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projetoId: string;
}

interface EditForm {
  nome: string;
  descricao: string;
  cor: string;
}

const slugify = (text: string) =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const MacroEtapaManager = ({ open, onOpenChange, projetoId }: MacroEtapaManagerProps) => {
  const { data: macroEtapas = [] } = useMacroEtapas(projetoId);
  const { data: acoes = [] } = useAcoes(projetoId);
  const createMacroEtapa = useCreateMacroEtapa();
  const updateMacroEtapa = useUpdateMacroEtapa();
  const deleteMacroEtapa = useDeleteMacroEtapa();
  const reorderMacroEtapas = useReorderMacroEtapas();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({ nome: '', descricao: '', cor: COLORS[0] });
  const [showNewForm, setShowNewForm] = useState(false);
  const [newForm, setNewForm] = useState<EditForm>({ nome: '', descricao: '', cor: COLORS[0] });
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; titulo: string } | null>(null);

  const acoesCountByEtapa = useMemo(() => {
    const map = new Map<string, number>();
    for (const acao of acoes) {
      const etapa = macroEtapas.find((me) => me.titulo === acao.macroEtapa);
      if (etapa) {
        map.set(etapa.id, (map.get(etapa.id) ?? 0) + 1);
      }
    }
    return map;
  }, [acoes, macroEtapas]);

  const handleEdit = (me: typeof macroEtapas[0]) => {
    setEditingId(me.id);
    setEditForm({ nome: me.titulo, descricao: me.descricao ?? '', cor: me.cor });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({ nome: '', descricao: '', cor: COLORS[0] });
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editForm.nome.trim()) {
      toast.error('nome é obrigatório');
      return;
    }
    try {
      await updateMacroEtapa.mutateAsync({
        id: editingId,
        projetoId,
        nome: editForm.nome.trim(),
        descricao: editForm.descricao.trim() || null,
        cor: editForm.cor,
      });
      toast.success('etapa atualizada');
      handleCancelEdit();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao atualizar etapa');
    }
  };

  const handleCreate = async () => {
    if (!newForm.nome.trim()) {
      toast.error('nome é obrigatório');
      return;
    }
    try {
      const id = `${slugify(newForm.nome)}-${Date.now()}`;
      const ordem = macroEtapas.length;
      await createMacroEtapa.mutateAsync({
        id,
        nome: newForm.nome.trim(),
        descricao: newForm.descricao.trim() || null,
        cor: newForm.cor,
        ordem,
        projeto_id: projetoId,
      });
      toast.success('etapa criada');
      setNewForm({ nome: '', descricao: '', cor: COLORS[0] });
      setShowNewForm(false);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao criar etapa');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMacroEtapa.mutateAsync({ id: deleteTarget.id, projetoId });
      toast.success('etapa excluída');
      setDeleteTarget(null);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao excluir etapa');
    }
  };

  const handleReorder = async (index: number, direction: 'up' | 'down') => {
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= macroEtapas.length) return;

    const items = macroEtapas.map((me, i) => ({ id: me.id, ordem: i }));
    const temp = items[index].ordem;
    items[index].ordem = items[swapIndex].ordem;
    items[swapIndex].ordem = temp;

    try {
      await reorderMacroEtapas.mutateAsync({
        items: items.map((it) => ({ id: it.id, ordem: it.ordem })),
        projetoId,
      });
    } catch (error: any) {
      toast.error(error.message || 'Erro ao reordenar');
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="lowercase">gerenciar macro etapas</DialogTitle>
          </DialogHeader>

          <div className="space-y-2 py-2">
            {macroEtapas.map((me, index) => (
              <div key={me.id}>
                {editingId === me.id ? (
                  <div className="rounded-lg border border-primary/30 bg-muted/50 p-3 space-y-3">
                    <Input
                      value={editForm.nome}
                      onChange={(e) => setEditForm((f) => ({ ...f, nome: e.target.value }))}
                      placeholder="Nome da etapa"
                      aria-label="Nome da etapa"
                    />
                    <Textarea
                      value={editForm.descricao}
                      onChange={(e) => setEditForm((f) => ({ ...f, descricao: e.target.value }))}
                      placeholder="Descrição (opcional)"
                      rows={2}
                      aria-label="Descrição da etapa"
                    />
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Cor:</span>
                      <div className="flex gap-1.5">
                        {COLORS.map((c) => (
                          <button
                            key={c}
                            type="button"
                            className={`h-6 w-6 rounded-full border-2 transition-all ${
                              editForm.cor === c ? 'border-foreground scale-110' : 'border-transparent'
                            }`}
                            style={{ backgroundColor: c }}
                            onClick={() => setEditForm((f) => ({ ...f, cor: c }))}
                            aria-label={`Selecionar cor ${c}`}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={handleCancelEdit} className="gap-1 lowercase">
                        <X className="h-3.5 w-3.5" aria-hidden="true" /> cancelar
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleSaveEdit}
                        disabled={updateMacroEtapa.isPending}
                        className="gap-1 lowercase"
                      >
                        <Check className="h-3.5 w-3.5" aria-hidden="true" />
                        {updateMacroEtapa.isPending ? 'salvando...' : 'salvar'}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 rounded-lg border border-border p-2.5 hover:bg-muted/50 transition-colors">
                    <div className="flex flex-col gap-0.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5"
                        disabled={index === 0 || reorderMacroEtapas.isPending}
                        onClick={() => handleReorder(index, 'up')}
                        aria-label={`Mover ${me.titulo} para cima`}
                      >
                        <ChevronUp className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5"
                        disabled={index === macroEtapas.length - 1 || reorderMacroEtapas.isPending}
                        onClick={() => handleReorder(index, 'down')}
                        aria-label={`Mover ${me.titulo} para baixo`}
                      >
                        <ChevronDown className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <div
                      className="h-3.5 w-3.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: me.cor }}
                      aria-hidden="true"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{me.titulo}</p>
                      {me.descricao && (
                        <p className="text-xs text-muted-foreground truncate">{me.descricao}</p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 flex-shrink-0"
                      onClick={() => handleEdit(me)}
                      aria-label={`Editar ${me.titulo}`}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 flex-shrink-0 text-destructive hover:text-destructive"
                      onClick={() => setDeleteTarget({ id: me.id, titulo: me.titulo })}
                      aria-label={`Excluir ${me.titulo}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </div>
            ))}

            {macroEtapas.length === 0 && !showNewForm && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhuma macro etapa cadastrada.
              </p>
            )}

            {showNewForm ? (
              <div className="rounded-lg border-2 border-dashed border-border p-3 space-y-3">
                <Input
                  value={newForm.nome}
                  onChange={(e) => setNewForm((f) => ({ ...f, nome: e.target.value }))}
                  placeholder="Nome da nova etapa"
                  aria-label="Nome da nova etapa"
                  autoFocus
                />
                <Textarea
                  value={newForm.descricao}
                  onChange={(e) => setNewForm((f) => ({ ...f, descricao: e.target.value }))}
                  placeholder="Descrição (opcional)"
                  rows={2}
                  aria-label="Descrição da nova etapa"
                />
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Cor:</span>
                  <div className="flex gap-1.5">
                    {COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        className={`h-6 w-6 rounded-full border-2 transition-all ${
                          newForm.cor === c ? 'border-foreground scale-110' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: c }}
                        onClick={() => setNewForm((f) => ({ ...f, cor: c }))}
                        aria-label={`Selecionar cor ${c}`}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowNewForm(false);
                      setNewForm({ nome: '', descricao: '', cor: COLORS[0] });
                    }}
                    className="gap-1 lowercase"
                  >
                    <X className="h-3.5 w-3.5" aria-hidden="true" /> cancelar
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleCreate}
                    disabled={createMacroEtapa.isPending}
                    className="gap-1 lowercase"
                  >
                    <Check className="h-3.5 w-3.5" aria-hidden="true" />
                    {createMacroEtapa.isPending ? 'criando...' : 'criar'}
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-2 border-dashed lowercase"
                onClick={() => setShowNewForm(true)}
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                nova etapa
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="lowercase">excluir etapa "{deleteTarget?.titulo}"?</AlertDialogTitle>
            <AlertDialogDescription>
              {(() => {
                const count = deleteTarget ? (acoesCountByEtapa.get(deleteTarget.id) ?? 0) : 0;
                if (count > 0) {
                  return `Esta etapa possui ${count} ${count === 1 ? 'ação associada' : 'ações associadas'}. A exclusão pode afetar essas ações.`;
                }
                return 'Esta etapa não possui ações associadas. Deseja continuar?';
              })()}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="lowercase">cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 lowercase"
            >
              {deleteMacroEtapa.isPending ? 'excluindo...' : 'excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default MacroEtapaManager;
