import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateProjeto } from '@/hooks/useProjetos';
import { useTemplates, useInstantiateTemplate } from '@/hooks/useTemplates';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const PRESET_COLORS = [
  '#3B82F6',
  '#16A34A',
  '#F59E0B',
  '#EF4444',
  '#8B5CF6',
  '#EC4899',
  '#06B6D4',
  '#F97316',
];

interface ProjetoCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ProjetoCreateDialog = ({ open, onOpenChange }: ProjetoCreateDialogProps) => {
  const navigate = useNavigate();
  const createProjeto = useCreateProjeto();
  const instantiate = useInstantiateTemplate();
  const { data: templates = [] } = useTemplates();

  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [cor, setCor] = useState(PRESET_COLORS[0]);
  const [pontoDepartida, setPontoDepartida] = useState<'zero' | 'modelo'>('zero');
  const [templateId, setTemplateId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const resetForm = () => {
    setNome('');
    setDescricao('');
    setCor(PRESET_COLORS[0]);
    setPontoDepartida('zero');
    setTemplateId('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) return;

    setSubmitting(true);
    try {
      const id = crypto.randomUUID();
      const result = await createProjeto.mutateAsync({
        id,
        nome: nome.trim(),
        descricao: descricao.trim(),
        status: 'ativo',
        cor,
      });

      if (pontoDepartida === 'modelo' && templateId) {
        const tmpl = templates.find((t) => t.id === templateId);
        if (tmpl) {
          await instantiate.mutateAsync({
            projetoId: result.id,
            template: tmpl.conteudo,
          });
        }
      }

      toast.success('Projeto criado com sucesso!');
      resetForm();
      onOpenChange(false);
      navigate(`/projeto/${result.id}`);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao criar projeto');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Novo Projeto</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="projeto-nome">Nome *</Label>
            <Input
              id="projeto-nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Nome do projeto"
              required
              aria-label="Nome do projeto"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="projeto-descricao">Descrição</Label>
            <Textarea
              id="projeto-descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Descrição opcional"
              rows={2}
              aria-label="Descrição do projeto"
            />
          </div>

          <div className="space-y-2">
            <Label>Cor</Label>
            <div className="flex items-center gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCor(c)}
                  className={`h-7 w-7 rounded-full border-2 transition-transform ${
                    cor === c ? 'border-foreground scale-110' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: c }}
                  aria-label={`Selecionar cor ${c}`}
                />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Ponto de partida</Label>
            <RadioGroup
              value={pontoDepartida}
              onValueChange={(v) => setPontoDepartida(v as 'zero' | 'modelo')}
              className="flex flex-col gap-2"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="zero" id="ponto-zero" />
                <Label htmlFor="ponto-zero" className="font-normal cursor-pointer">
                  Começar do zero
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="modelo" id="ponto-modelo" />
                <Label htmlFor="ponto-modelo" className="font-normal cursor-pointer">
                  Usar modelo
                </Label>
              </div>
            </RadioGroup>
          </div>

          {pontoDepartida === 'modelo' && (
            <div className="space-y-2">
              <Label htmlFor="template-select">Modelo</Label>
              <Select value={templateId} onValueChange={setTemplateId}>
                <SelectTrigger id="template-select" aria-label="Selecionar modelo">
                  <SelectValue placeholder="Selecione um modelo" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting || !nome.trim()}>
              {submitting ? 'Criando...' : 'Criar Projeto'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ProjetoCreateDialog;
