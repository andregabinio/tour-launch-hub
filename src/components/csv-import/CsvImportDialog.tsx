import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useCsvImport } from '@/hooks/useCsvImport';
import CsvUploadStep from './CsvUploadStep';
import CsvPreviewStep from './CsvPreviewStep';
import CsvResultStep from './CsvResultStep';

interface CsvImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projetoId?: string; // undefined = create new project mode
}

const STEP_TITLES: Record<1 | 2 | 3, string> = {
  1: 'Importar CSV',
  2: 'Preview da Importação',
  3: 'Resultado',
};

export default function CsvImportDialog({
  open,
  onOpenChange,
  projetoId,
}: CsvImportDialogProps) {
  const navigate = useNavigate();
  const {
    step,
    parsedData,
    errors,
    warnings,
    isImporting,
    importResult,
    parseFile,
    goBack,
    importToProject,
    reset,
  } = useCsvImport();

  const [projectName, setProjectName] = useState('');

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen && !isImporting) {
        reset();
        setProjectName('');
        onOpenChange(false);
      }
    },
    [isImporting, reset, onOpenChange]
  );

  const handleImport = useCallback(async () => {
    if (projetoId) {
      await importToProject(projetoId);
    } else {
      const name = projectName.trim();
      if (!name) return;
      await importToProject(null, name);
    }
  }, [projetoId, projectName, importToProject]);

  const handleOpenProject = useCallback(() => {
    if (importResult?.projetoId) {
      handleOpenChange(false);
      navigate(`/projeto/${importResult.projetoId}`);
    }
  }, [importResult, navigate, handleOpenChange]);

  const handleClose = useCallback(() => {
    handleOpenChange(false);
  }, [handleOpenChange]);

  const canImport = !projetoId ? projectName.trim().length > 0 : true;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{STEP_TITLES[step]}</DialogTitle>
        </DialogHeader>

        {step === 1 && (
          <CsvUploadStep
            projetoId={projetoId}
            projectName={projectName}
            onProjectNameChange={setProjectName}
            onFileSelected={parseFile}
          />
        )}

        {step === 2 && parsedData && (
          <CsvPreviewStep
            rows={parsedData}
            errors={errors}
            warnings={warnings}
            isImporting={isImporting}
            canImport={canImport}
            onImport={handleImport}
            onGoBack={goBack}
          />
        )}

        {step === 3 && importResult && (
          <CsvResultStep
            result={importResult}
            projetoId={projetoId}
            onOpenProject={handleOpenProject}
            onClose={handleClose}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
