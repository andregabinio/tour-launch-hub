import { Rocket, LayoutGrid, Table, LogOut, Users, User } from 'lucide-react';
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

interface TopBarProps {
  viewMode: 'roadmap' | 'tabela';
  onViewModeChange: (mode: 'roadmap' | 'tabela') => void;
  onOpenAdmin?: () => void;
}

const TopBar = ({ viewMode, onViewModeChange, onOpenAdmin }: TopBarProps) => {
  const { profile, role } = useAuthContext();
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error: any) {
      toast.error('Erro ao sair');
    }
  };

  return (
    <header className="border-b border-border bg-card px-4 py-4 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
            <Rocket className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              Roadmap de Lançamento do TOUR
            </h1>
            <p className="text-sm text-muted-foreground">
              Planejamento e acompanhamento estratégico
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <User className="h-4 w-4" />
                {profile?.nome || 'Usuário'}
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
                  <DropdownMenuItem onClick={onOpenAdmin} className="gap-2">
                    <Users className="h-4 w-4" />
                    Gerenciar Usuários
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem onClick={handleLogout} className="gap-2 text-destructive">
                <LogOut className="h-4 w-4" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default TopBar;
