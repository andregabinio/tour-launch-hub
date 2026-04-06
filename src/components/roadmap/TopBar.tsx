import { Rocket, LayoutGrid, Table } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TopBarProps {
  viewMode: 'roadmap' | 'tabela';
  onViewModeChange: (mode: 'roadmap' | 'tabela') => void;
}

const TopBar = ({ viewMode, onViewModeChange }: TopBarProps) => {
  return (
    <header className="border-b border-border bg-card px-4 py-4 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
            <Rocket className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              TOUR Launch Roadmap
            </h1>
            <p className="text-sm text-muted-foreground">
              Planejamento e acompanhamento do lançamento
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-border bg-muted p-1">
          <Button
            variant={viewMode === 'roadmap' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onViewModeChange('roadmap')}
            className="gap-2"
          >
            <LayoutGrid className="h-4 w-4" />
            Roadmap
          </Button>
          <Button
            variant={viewMode === 'tabela' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onViewModeChange('tabela')}
            className="gap-2"
          >
            <Table className="h-4 w-4" />
            Tabela
          </Button>
        </div>
      </div>
    </header>
  );
};

export default TopBar;
