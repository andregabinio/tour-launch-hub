import { useState } from 'react';
import { Plus, X, Check, Pencil, Trash2, Flag } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useMarcos, useCreateMarco, useUpdateMarco, useDeleteMarco } from '@/hooks/useMarcos';
import { type Marco } from '@/types/roadmap';
import { toast } from 'sonner';

interface MarcoManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projetoId: string;
}

const COLORS = [
  { value: '#D86C1A', label: 'laranja' },
  { value: '#93253F', label: 'bordô' },
  { value: '#2A5EA8', label: 'azul' },
  { value: '#589E2B', label: 'verde' },
  { value: '#EABD2F', label: 'amarelo' },
];

const DEFAULT_NEW = { nome: '', descricao: '', data: '', cor: COLORS[0].value };

const MarcoManager = ({ open, onOpenChange, projetoId }: MarcoManagerProps) => {
  const { data: marcos = [], isLoading } = useMarcos(projetoId);
  const createMarco = useCreateMarco();
  const updateMarco = useUpdateMarco();
  const deleteMarco = useDeleteMarco();

  const [showNewForm, setShowNewForm] = useState(false);
  const [newForm, setNewForm] = useState(DEFAULT_NEW);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(DEFAULT_NEW);
  const [deleteTarget, setDeleteTarget] = useState<Marco | null>(null);

  const handleCreate = async () => {
    if (!newForm.nome.trim() || !newForm.data) {
      toast.error('nome e data são obrigatórios');
      return;
    }
    try {
      await createMarco.mutateAsync({
        projeto_id: projetoId,
        nome: newForm.nome.trim(),
        descricao: newForm.descricao.trim(),
        data: newForm.data,
        cor: newForm.cor,
      });
      toast.success('marco criado');
      setNewForm(DEFAULT_NEW);
      setShowNewForm(false);
    } catch (e: any) {
      toast.error(e.message || 'erro ao criar marco');
    }
  };

  const startEdit = (m: Marco) => {
    setEditingId(m.id);
    setEditForm({ nome: m.nome, descricao: m.descricao, data: m.data, cor: m.cor });
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    if (!editForm.nome.trim() || !editForm.data) {
      toast.error('nome e data são obrigatórios');
      return;
    }
    try {
      await updateMarco.mutateAsync({
        id: editingId,
        projetoId,
        nome: editForm.nome.trim(),
        descricao: editForm.descricao.trim(),
        data: editForm.data,
        cor: editForm.cor,
      });
      toast.success('marco atualizado');
      setEditingId(null);
    } catch (e: any) {
      toast.error(e.message || 'erro ao atualizar');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMarco.mutateAsync({ id: deleteTarget.id, projetoId });
      toast.success('marco excluído');
      setDeleteTarget(null);
    } catch (e: any) {
      toast.error(e.message || 'erro ao excluir');
    }
  };

  const formatDate = (d: string) => {
    const dt = new Date(d + 'T00:00:00');
    return dt.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="lowercase flex items-center gap-2">
              <Flag className="h-5 w-5 text-brand-laranja" /> gerenciar marcos
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            {isLoading ? (
              <p className="text-sm text-muted-foreground lowercase py-4 text-center">um momento...</p>
            ) : marcos.length === 0 && !showNewForm ? (
              <p className="text-sm text-muted-foreground lowercase py-6 text-center">
                nenhum marco criado. crie o primeiro pra marcar entregas-chave.
              </p>
            ) : (
              marcos.map((m) =>
                editingId === m.id ? (
                  <div key={m.id} className="rounded-lg border border-border p-3 space-y-3 bg-muted/30">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="lowercase">nome *</Label>
                        <Input
                          value={editForm.nome}
                          onChange={(e) => setEditForm((f) => ({ ...f, nome: e.target.value }))}
                          placeholder="ex: deadline budget"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="lowercase">data *</Label>
                        <Input
                          type="date"
                          value={editForm.data}
                          onChange={(e) => setEditForm((f) => ({ ...f, data: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="lowercase">descrição</Label>
                      <Textarea
                        value={editForm.descricao}
                        onChange={(e) => setEditForm((f) => ({ ...f, descricao: e.target.value }))}
                        rows={2}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="lowercase">cor</Label>
                      <div className="flex gap-1.5">
                        {COLORS.map((c) => (
                          <button
                            key={c.value}
                            type="button"
                            onClick={() => setEditForm((f) => ({ ...f, cor: c.value }))}
                            className={`h-7 w-7 rounded-full border-2 transition-all ${
                              editForm.cor === c.value
                                ? 'border-foreground scale-110'
                                : 'border-transparent'
                            }`}
                            style={{ backgroundColor: c.value }}
                            aria-label={`cor ${c.label}`}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingId(null)}
                        className="gap-1 lowercase"
                      >
                        <X className="h-3.5 w-3.5" /> cancelar
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleSaveEdit}
                        disabled={updateMarco.isPending}
                        className="gap-1 lowercase"
                      >
                        <Check className="h-3.5 w-3.5" />
                        {updateMarco.isPending ? 'salvando...' : 'salvar'}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div
                    key={m.id}
                    className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5"
                  >
                    <div
                      className="h-8 w-8 shrink-0 rounded-md flex items-center justify-center"
                      style={{ backgroundColor: m.cor + '20', color: m.cor }}
                    >
                      <Flag className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-foreground">{m.nome}</span>
                        <span className="text-xs text-muted-foreground lowercase">{formatDate(m.data)}</span>
                      </div>
                      {m.descricao && (
                        <p className="text-xs text-muted-foreground line-clamp-1">{m.descricao}</p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => startEdit(m)}
                      aria-label={`editar marco ${m.nome}`}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => setDeleteTarget(m)}
                      aria-label={`excluir marco ${m.nome}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ),
              )
            )}

            {showNewForm ? (
              <div className="rounded-lg border border-dashed border-border p-3 space-y-3 bg-muted/20">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="lowercase">nome *</Label>
                    <Input
                      value={newForm.nome}
                      onChange={(e) => setNewForm((f) => ({ ...f, nome: e.target.value }))}
                      placeholder="ex: deadline budget"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="lowercase">data *</Label>
                    <Input
                      type="date"
                      value={newForm.data}
                      onChange={(e) => setNewForm((f) => ({ ...f, data: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="lowercase">descrição</Label>
                  <Textarea
                    value={newForm.descricao}
                    onChange={(e) => setNewForm((f) => ({ ...f, descricao: e.target.value }))}
                    rows={2}
                    placeholder="opcional"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="lowercase">cor</Label>
                  <div className="flex gap-1.5">
                    {COLORS.map((c) => (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => setNewForm((f) => ({ ...f, cor: c.value }))}
                        className={`h-7 w-7 rounded-full border-2 transition-all ${
                          newForm.cor === c.value
                            ? 'border-foreground scale-110'
                            : 'border-transparent'
                        }`}
                        style={{ backgroundColor: c.value }}
                        aria-label={`cor ${c.label}`}
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
                      setNewForm(DEFAULT_NEW);
                    }}
                    className="gap-1 lowercase"
                  >
                    <X className="h-3.5 w-3.5" /> cancelar
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleCreate}
                    disabled={createMarco.isPending}
                    className="gap-1 lowercase"
                  >
                    <Check className="h-3.5 w-3.5" />
                    {createMarco.isPending ? 'criando...' : 'criar'}
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
                <Plus className="h-4 w-4" /> novo marco
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="lowercase">excluir marco "{deleteTarget?.nome}"?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="lowercase">cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 lowercase"
            >
              {deleteMarco.isPending ? 'excluindo...' : 'excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default MarcoManager;
