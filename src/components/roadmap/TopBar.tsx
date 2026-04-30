import { LayoutGrid, Table, LogOut, Users, User, Plus, GanttChart, ArrowLeft, Settings, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuthContext } from '@/contexts/AuthContext';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export type ViewMode = 'timeline' | 'cards' | 'tabela';

interface TopBarProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onOpenAdmin?: () => void;
  onCreateAcao?: () => void;
  projetoNome?: string;
  onManageEtapas?: () => void;
  onManageMarcos?: () => void;
  onSaveAsTemplate?: () => void;
  onArchiveProjeto?: () => void;
  onImportCsv?: () => void;
}

const TopBar = ({ viewMode, onViewModeChange, onOpenAdmin, onCreateAcao, projetoNome, onManageEtapas, onManageMarcos, onSaveAsTemplate, onArchiveProjeto, onImportCsv }: TopBarProps) => {
  const { profile, role } = useAuthContext();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const canEdit = role === 'admin' || role === 'editor';

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error: any) {
      toast.error('Erro ao sair');
    }
  };

  return (
    <>
    <header className="bg-card px-4 py-5 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          {projetoNome && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="gap-1 lowercase"
              aria-label="voltar para lançamentos"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              lançamentos
            </Button>
          )}
          <img src="/logo.png" alt="Tour" className="h-11 w-11 rounded-lg object-cover" />
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground lowercase">
              {projetoNome || 'roadmap de lançamento'}
            </h1>
            <p className="text-sm text-muted-foreground lowercase">
              acompanhe e movimente seu lançamento
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {canEdit && onCreateAcao && (
            <Button size="sm" onClick={onCreateAcao} className="gap-2 font-semibold lowercase">
              <Plus className="h-4 w-4" aria-hidden="true" />
              nova ação
            </Button>
          )}
          {canEdit && onImportCsv && (
            <Button variant="outline" size="sm" onClick={onImportCsv} className="gap-2 font-semibold lowercase">
              <Upload className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">importar csv</span>
            </Button>
          )}
          <div className="flex items-center gap-1 rounded-lg border border-border bg-muted p-1" role="tablist" aria-label="Modo de visualização">
            <Button
              variant={viewMode === 'timeline' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onViewModeChange('timeline')}
              className="gap-2"
              role="tab"
              aria-selected={viewMode === 'timeline'}
            >
              <GanttChart className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Timeline</span>
            </Button>
            <Button
              variant={viewMode === 'cards' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onViewModeChange('cards')}
              className="gap-2"
              role="tab"
              aria-selected={viewMode === 'cards'}
            >
              <LayoutGrid className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Cards</span>
            </Button>
            <Button
              variant={viewMode === 'tabela' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onViewModeChange('tabela')}
              className="gap-2"
              role="tab"
              aria-selected={viewMode === 'tabela'}
            >
              <Table className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Tabela</span>
            </Button>
          </div>
          {role === 'admin' && projetoNome && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2" aria-label="Configurações do projeto">
                  <Settings className="h-4 w-4" aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onManageEtapas && (
                  <DropdownMenuItem onClick={onManageEtapas} className="gap-2 lowercase">
                    gerenciar macro etapas
                  </DropdownMenuItem>
                )}
                {onManageMarcos && (
                  <DropdownMenuItem onClick={onManageMarcos} className="gap-2 lowercase">
                    gerenciar marcos
                  </DropdownMenuItem>
                )}
                {onSaveAsTemplate && (
                  <DropdownMenuItem onClick={onSaveAsTemplate} className="gap-2 lowercase">
                    salvar como modelo
                  </DropdownMenuItem>
                )}
                {onArchiveProjeto && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={onArchiveProjeto} className="gap-2 text-destructive lowercase">
                      arquivar lançamento
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <User className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline">{profile?.nome || 'Usuário'}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <div className="px-2 py-1.5 text-sm text-muted-foreground">
                {profile?.email}
                <span className="ml-2 rounded bg-muted px-1.5 py-0.5 text-xs font-medium">
                  {role}
                </span>
              </div>
              <DropdownMenuSeparator />
              {role === 'admin' && onOpenAdmin && (
                <>
                  <DropdownMenuItem onClick={onOpenAdmin} className="gap-2 lowercase">
                    <Users className="h-4 w-4" /> gerenciar acessos
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem onClick={handleLogout} className="gap-2 text-destructive lowercase">
                <LogOut className="h-4 w-4" /> sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
    <div className="picote-divider" aria-hidden="true" />
    </>
  );
};

export default TopBar;
