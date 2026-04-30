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
      toast.error('preencha os campos obrigatórios');
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
        toast.success('ação atualizada');
      } else {
        const { id: _id, ...createPayload } = payload;
        await createAcao.mutateAsync(createPayload as any);
        toast.success('ação criada');
      }
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || 'erro ao salvar');
    }
  };

  const set = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }));

  // Auto-calcula tempo_estimado em dias corridos (inclusivo) a partir de
  // data_inicio + data_fim. Sempre read-only, em criação e em edição.
  // Mesmo dia = 1 dia. Fim < início → vazio.
  useEffect(() => {
    if (!form.data_inicio || !form.data_fim) return;
    const inicio = new Date(form.data_inicio + 'T00:00:00');
    const fim = new Date(form.data_fim + 'T00:00:00');
    if (Number.isNaN(inicio.getTime()) || Number.isNaN(fim.getTime())) return;

    const diffMs = fim.getTime() - inicio.getTime();
    const diffDias = Math.floor(diffMs / 86400000);

    let novoTempo = '';
    if (diffDias >= 0) {
      const total = diffDias + 1;
      novoTempo = total === 1 ? '1 dia' : `${total} dias`;
    }

    if (novoTempo !== form.tempo_estimado) {
      setForm(prev => ({ ...prev, tempo_estimado: novoTempo }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.data_inicio, form.data_fim]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="lowercase">{isEdit ? 'editar ação' : 'nova ação'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className={`grid ${isEdit ? 'grid-cols-2' : 'grid-cols-1'} gap-3`}>
            {isEdit && (
              <div className="space-y-1.5">
                <Label className="lowercase">id</Label>
                <Input value={form.id} disabled className="font-mono text-xs" />
              </div>
            )}
            <div className="space-y-1.5">
              <Label className="lowercase">macro etapa *</Label>
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
            <Label className="lowercase">título *</Label>
            <Input value={form.titulo} onChange={e => set('titulo', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="lowercase">descrição</Label>
            <Textarea value={form.descricao} onChange={e => set('descricao', e.target.value)} rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="lowercase">responsável</Label>
              <Input value={form.responsavel} onChange={e => set('responsavel', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="lowercase">tempo estimado</Label>
              <Input
                value={form.tempo_estimado}
                disabled
                className="bg-muted cursor-not-allowed opacity-90"
                placeholder="—"
              />
              <p className="text-[11px] text-muted-foreground lowercase">
                calculado em dias corridos a partir das datas
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="lowercase">prioridade</Label>
              <Select value={form.prioridade} onValueChange={v => set('prioridade', v)}>
                <SelectTrigger className="lowercase"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="alta" className="lowercase">alta</SelectItem>
                  <SelectItem value="média" className="lowercase">média</SelectItem>
                  <SelectItem value="baixa" className="lowercase">baixa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="lowercase">status</Label>
              <Select value={form.status} onValueChange={v => set('status', v)}>
                <SelectTrigger className="lowercase"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="não iniciada" className="lowercase">não iniciada</SelectItem>
                  <SelectItem value="em andamento" className="lowercase">em andamento</SelectItem>
                  <SelectItem value="concluída" className="lowercase">concluída</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="lowercase">prazo</Label>
              <Select value={form.situacao_prazo} onValueChange={v => set('situacao_prazo', v)}>
                <SelectTrigger className="lowercase"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="no prazo" className="lowercase">no prazo</SelectItem>
                  <SelectItem value="atrasada" className="lowercase">atrasada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="lowercase">data início *</Label>
              <Input type="date" value={form.data_inicio} onChange={e => set('data_inicio', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="lowercase">data fim *</Label>
              <Input
                type="date"
                value={form.data_fim}
                onChange={e => set('data_fim', e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="lowercase">depende de (id da ação)</Label>
            <Select value={form.dependencia_de || '_none'} onValueChange={v => set('dependencia_de', v === '_none' ? '' : v)}>
              <SelectTrigger className="lowercase"><SelectValue placeholder="nenhuma" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="_none" className="lowercase">nenhuma</SelectItem>
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
                <Button variant="ghost" className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-1.5 lowercase">
                  <Trash2 className="h-4 w-4" /> excluir
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="lowercase">excluir ação?</AlertDialogTitle>
                  <AlertDialogDescription>
                    A ação <strong>{acao?.id} — {acao?.titulo}</strong> e todas as suas subtarefas serão excluídas permanentemente.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="lowercase">cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90 lowercase"
                    onClick={async () => {
                      try {
                        await deleteAcao.mutateAsync(acao!.id);
                        toast.success('ação excluída');
                        onOpenChange(false);
                      } catch (e: any) {
                        toast.error(e.message || 'erro ao excluir ação');
                      }
                    }}
                  >
                    excluir
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : (
            <div />
          )}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="lowercase">cancelar</Button>
            <Button onClick={handleSubmit} disabled={createAcao.isPending || updateAcao.isPending} className="lowercase">
              {(createAcao.isPending || updateAcao.isPending) ? 'salvando...' : 'salvar'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AcaoEditDialog;
