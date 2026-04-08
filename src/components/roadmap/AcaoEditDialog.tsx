import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2 } from 'lucide-react';
import { useMacroEtapas } from '@/hooks/useMacroEtapas';
import { useCreateAcao, useUpdateAcao, useDeleteAcao } from '@/hooks/useAcoes';
import { Acao } from '@/types/roadmap';
import { toast } from 'sonner';

interface AcaoEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  acao?: Acao | null;
  allAcoes?: Acao[];
  projetoId?: string;
}

const AcaoEditDialog = ({ open, onOpenChange, acao, allAcoes = [], projetoId }: AcaoEditDialogProps) => {
  const isEdit = !!acao;
  const { data: macroEtapas = [] } = useMacroEtapas(projetoId);
  const createAcao = useCreateAcao();
  const updateAcao = useUpdateAcao();
  const deleteAcao = useDeleteAcao();

  const [form, setForm] = useState({
    id: '',
    titulo: '',
    descricao: '',
    macro_etapa_id: '',
    responsavel: '',
    prioridade: 'média',
    status: 'não iniciada',
    situacao_prazo: 'no prazo',
    tempo_estimado: '',
    data_inicio: '',
    data_fim: '',
    dependencia_de: '',
  });

  useEffect(() => {
    if (acao) {
      const me = macroEtapas.find(m => m.titulo === acao.macroEtapa);
      setForm({
        id: acao.id,
        titulo: acao.titulo,
        descricao: acao.descricao,
        macro_etapa_id: me?.id || '',
        responsavel: acao.responsavel,
        prioridade: acao.prioridade,
        status: acao.status,
        situacao_prazo: acao.situacaoPrazo,
        tempo_estimado: acao.tempoEstimado,
        data_inicio: acao.dataInicio,
        data_fim: acao.dataFim,
        dependencia_de: acao.dependenciaDe || '',
      });
    } else {
      setForm({
        id: '',
        titulo: '',
        descricao: '',
        macro_etapa_id: macroEtapas[0]?.id || '',
        responsavel: '',
        prioridade: 'média',
        status: 'não iniciada',
        situacao_prazo: 'no prazo',
        tempo_estimado: '',
        data_inicio: new Date().toISOString().split('T')[0],
        data_fim: new Date().toISOString().split('T')[0],
        dependencia_de: '',
      });
    }
  }, [acao, open, macroEtapas]);

  const handleSubmit = async () => {
    if (!form.titulo || !form.macro_etapa_id || !form.data_inicio || !form.data_fim) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }

    try {
      const payload = {
        ...form,
        dependencia_de: form.dependencia_de || null,
        tempo_estimado: form.tempo_estimado || null,
        responsavel: form.responsavel || null,
      };

      if (isEdit) {
        const { id, ...updates } = payload;
        await updateAcao.mutateAsync({ id, ...updates });
        toast.success('Ação atualizada!');
      } else {
        const { id: _id, ...createPayload } = payload;
        await createAcao.mutateAsync(createPayload as any);
        toast.success('Ação criada!');
      }
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao salvar');
    }
  };

  const set = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar Ação' : 'Nova Ação'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className={`grid ${isEdit ? 'grid-cols-2' : 'grid-cols-1'} gap-3`}>
            {isEdit && (
              <div className="space-y-1.5">
                <Label>ID</Label>
                <Input value={form.id} disabled />
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Macro Etapa *</Label>
              <Select value={form.macro_etapa_id} onValueChange={v => set('macro_etapa_id', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {macroEtapas.map(me => (
                    <SelectItem key={me.id} value={me.id}>{me.titulo}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Título *</Label>
            <Input value={form.titulo} onChange={e => set('titulo', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Descrição</Label>
            <Textarea value={form.descricao} onChange={e => set('descricao', e.target.value)} rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Responsável</Label>
              <Input value={form.responsavel} onChange={e => set('responsavel', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Tempo Estimado</Label>
              <Input value={form.tempo_estimado} onChange={e => set('tempo_estimado', e.target.value)} placeholder="ex: 2 dias" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>Prioridade</Label>
              <Select value={form.prioridade} onValueChange={v => set('prioridade', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="média">Média</SelectItem>
                  <SelectItem value="baixa">Baixa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => set('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="não iniciada">Não iniciada</SelectItem>
                  <SelectItem value="em andamento">Em andamento</SelectItem>
                  <SelectItem value="concluída">Concluída</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Prazo</Label>
              <Select value={form.situacao_prazo} onValueChange={v => set('situacao_prazo', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="no prazo">No prazo</SelectItem>
                  <SelectItem value="atrasada">Atrasada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Data Início *</Label>
              <Input type="date" value={form.data_inicio} onChange={e => set('data_inicio', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Data Fim *</Label>
              <Input type="date" value={form.data_fim} onChange={e => set('data_fim', e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Depende de (ID da ação)</Label>
            <Select value={form.dependencia_de || '_none'} onValueChange={v => set('dependencia_de', v === '_none' ? '' : v)}>
              <SelectTrigger><SelectValue placeholder="Nenhuma" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="_none">Nenhuma</SelectItem>
                {allAcoes?.filter(a => a.id !== form.id).map(a => (
                  <SelectItem key={a.id} value={a.id}>{a.id} — {a.titulo}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter className="flex-row justify-between sm:justify-between">
          {isEdit ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-1.5">
                  <Trash2 className="h-4 w-4" /> Excluir
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Excluir ação?</AlertDialogTitle>
                  <AlertDialogDescription>
                    A ação <strong>{acao?.id} — {acao?.titulo}</strong> e todas as suas subtarefas serão excluídas permanentemente.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={async () => {
                      try {
                        await deleteAcao.mutateAsync(acao!.id);
                        toast.success('Ação excluída!');
                        onOpenChange(false);
                      } catch (e: any) {
                        toast.error(e.message || 'Erro ao excluir ação');
                      }
                    }}
                  >
                    Excluir
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : (
            <div />
          )}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={createAcao.isPending || updateAcao.isPending}>
              {(createAcao.isPending || updateAcao.isPending) ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AcaoEditDialog;
