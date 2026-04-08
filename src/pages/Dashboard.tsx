import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, LogOut, Users, User } from 'lucide-react';
import { useProjetos } from '@/hooks/useProjetos';
import { useAuthContext } from '@/contexts/AuthContext';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import ProjetoCard from '@/components/dashboard/ProjetoCard';
import ProjetoCreateDialog from '@/components/dashboard/ProjetoCreateDialog';
import TemplateSection from '@/components/dashboard/TemplateSection';
import UserManagement from '@/components/admin/UserManagement';

type StatusFilter = 'ativo' | 'todos' | 'arquivado' | 'concluído';

const STATUS_TABS: { key: StatusFilter; label: string }[] = [
  { key: 'ativo', label: 'Ativos' },
  { key: 'todos', label: 'Todos' },
  { key: 'arquivado', label: 'Arquivados' },
  { key: 'concluído', label: 'Concluídos' },
];

const Dashboard = () => {
  const navigate = useNavigate();
  const { profile, role } = useAuthContext();
  const { signOut } = useAuth();
  const { data: projetos = [], isLoading } = useProjetos();

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ativo');
  const [showCreate, setShowCreate] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);

  const filteredProjetos = useMemo(() => {
    if (statusFilter === 'todos') return projetos;
    return projetos.filter((p) => p.status === statusFilter);
  }, [projetos, statusFilter]);

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error: any) {
      toast.error('Erro ao sair');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Tour" className="h-10 w-10 rounded-lg object-cover" />
            <div>
              <h1 className="text-xl font-bold tracking-tight text-foreground">
                Tour Launch Hub
              </h1>
              <p className="text-sm text-muted-foreground">
                Seus projetos de lançamento
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {role === 'admin' && (
              <Button size="sm" onClick={() => setShowCreate(true)} className="gap-2">
                <Plus className="h-4 w-4" aria-hidden="true" />
                Novo Projeto
              </Button>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2" aria-label="Menu do usuário">
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
                {role === 'admin' && (
                  <>
                    <DropdownMenuItem onClick={() => setShowAdmin(true)} className="gap-2">
                      <Users className="h-4 w-4" /> Gerenciar Usuários
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem onClick={handleLogout} className="gap-2 text-destructive">
                  <LogOut className="h-4 w-4" /> Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-[1200px] px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        {/* Status filter tabs */}
        <div
          className="flex items-center gap-1 rounded-lg border border-border bg-muted p-1 w-fit"
          role="tablist"
          aria-label="Filtrar por status"
        >
          {STATUS_TABS.map((tab) => (
            <Button
              key={tab.key}
              variant={statusFilter === tab.key ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setStatusFilter(tab.key)}
              role="tab"
              aria-selected={statusFilter === tab.key}
            >
              {tab.label}
            </Button>
          ))}
        </div>

        {/* Project grid */}
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-44 rounded-xl" />
            ))}
          </div>
        ) : filteredProjetos.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProjetos.map((projeto) => (
              <ProjetoCard key={projeto.id} projeto={projeto} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-lg font-medium text-foreground">
              {statusFilter === 'ativo'
                ? 'Nenhum projeto ativo'
                : statusFilter === 'arquivado'
                ? 'Nenhum projeto arquivado'
                : statusFilter === 'concluído'
                ? 'Nenhum projeto concluído'
                : 'Nenhum projeto encontrado'}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {statusFilter === 'ativo' && role === 'admin'
                ? 'Crie um novo projeto para começar.'
                : 'Nenhum projeto neste filtro.'}
            </p>
          </div>
        )}

        {/* Templates section */}
        <TemplateSection />
      </main>

      {/* Dialogs */}
      <ProjetoCreateDialog open={showCreate} onOpenChange={setShowCreate} />
      <UserManagement open={showAdmin} onOpenChange={setShowAdmin} />
    </div>
  );
};

export default Dashboard;
