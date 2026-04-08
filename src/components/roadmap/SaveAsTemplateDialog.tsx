import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Info } from 'lucide-react';
import { useSaveProjectAsTemplate } from '@/hooks/useTemplates';
import { toast } from 'sonner';

interface SaveAsTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projetoId: string;
  projetoNome: string;
}

const SaveAsTemplateDialog = ({
  open,
  onOpenChange,
  projetoId,
  projetoNome,
}: SaveAsTemplateDialogProps) => {
  const [nome, setNome] = useState(`${projetoNome} — Modelo`);
  const [descricao, setDescricao] = useState('');
  const saveAsTemplate = useSaveProjectAsTemplate();

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setNome(`${projetoNome} — Modelo`);
      setDescricao('');
    }
    onOpenChange(nextOpen);
  };

  const handleSubmit = async () => {
    if (!nome.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }

    try {
      await saveAsTemplate.mutateAsync({
        projetoId,
        nome: nome.trim(),
        descricao: descricao.trim(),
      });
      toast.success('Modelo salvo com sucesso!');
      handleOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao salvar modelo');
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Salvar como Modelo</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="template-nome">Nome</Label>
            <Input
              id="template-nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Nome do modelo"
              aria-label="Nome do modelo"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="template-descricao">Descrição (opcional)</Label>
            <Textarea
              id="template-descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Descreva o modelo..."
              rows={3}
              aria-label="Descrição do modelo"
            />
          </div>
          <div className="flex gap-2 rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
            <Info className="h-4 w-4 mt-0.5 flex-shrink-0" aria-hidden="true" />
            <p>
              O modelo vai copiar todas as etapas, ações e subtarefas. Status, datas e responsáveis
              não são incluídos.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={saveAsTemplate.isPending}>
            {saveAsTemplate.isPending ? 'Salvando...' : 'Salvar Modelo'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SaveAsTemplateDialog;
