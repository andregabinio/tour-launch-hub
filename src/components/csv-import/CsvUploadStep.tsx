import { useRef, useState, type DragEvent } from 'react';
import { Upload, Download, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { downloadCsvTemplate } from '@/utils/csvTemplate';

interface CsvUploadStepProps {
  projetoId?: string;
  projectName: string;
  onProjectNameChange: (name: string) => void;
  onFileSelected: (file: File) => void;
}

export default function CsvUploadStep({
  projetoId,
  projectName,
  onProjectNameChange,
  onFileSelected,
}: CsvUploadStepProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = (file: File) => {
    if (file.name.endsWith('.csv') || file.type === 'text/csv') {
      onFileSelected(file);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div className="space-y-6">
      {/* Project name field (only in Dashboard mode) */}
      {!projetoId && (
        <div className="space-y-2">
          <Label htmlFor="project-name" className="text-sm font-medium">
            Nome do Projeto
          </Label>
          <Input
            id="project-name"
            value={projectName}
            onChange={(e) => onProjectNameChange(e.target.value)}
            placeholder="Ex: Tour Curitiba 2026"
          />
        </div>
      )}

      {/* Drop zone */}
      <div
        role="button"
        tabIndex={0}
        className={`flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed p-10 transition-colors cursor-pointer ${
          isDragging
            ? 'border-[#79B2C9] bg-[#79B2C9]/5'
            : 'border-[#79B2C9]/50 hover:border-[#79B2C9] hover:bg-[#79B2C9]/5'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            fileInputRef.current?.click();
          }
        }}
        aria-label="Área de upload de CSV"
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#79B2C9]/10">
          <Upload className="h-7 w-7 text-[#79B2C9]" />
        </div>
        <div className="text-center">
          <p className="text-base font-medium text-foreground">
            Arraste o CSV aqui ou clique para selecionar
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Apenas arquivos .csv
          </p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={handleInputChange}
        />
      </div>

      {/* Download template button */}
      <div className="flex justify-center">
        <Button
          variant="outline"
          className="gap-2"
          onClick={(e) => {
            e.stopPropagation();
            downloadCsvTemplate();
          }}
        >
          <Download className="h-4 w-4" />
          Baixar Modelo CSV
        </Button>
      </div>

      {/* Help text */}
      <div className="rounded-lg border border-border bg-muted/50 p-4">
        <div className="flex items-start gap-3">
          <FileSpreadsheet className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
          <div className="text-sm text-muted-foreground space-y-1">
            <p className="font-medium text-foreground">Como usar:</p>
            <ol className="list-decimal list-inside space-y-0.5">
              <li>Baixe o modelo CSV acima</li>
              <li>Preencha com suas ações (título, descrição, datas, etc.)</li>
              <li>Separe subtarefas com ponto-e-vírgula (;)</li>
              <li>Suba o arquivo preenchido aqui</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
