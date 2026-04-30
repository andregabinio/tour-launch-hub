import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { type Profile, type UserRole } from '@/types/roadmap';
import { useAuthContext } from '@/contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

interface UserManagementProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const UserManagement = ({ open, onOpenChange }: UserManagementProps) => {
  const { user, role } = useAuthContext();
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  if (role !== 'admin') return null;

  useEffect(() => {
    if (open) {
      fetchUsers();
    }
  }, [open]);

  async function fetchUsers() {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at');

    if (error) {
      toast.error('erro ao carregar acessos');
    } else {
      setUsers((data ?? []) as Profile[]);
    }
    setLoading(false);
  }

  async function updateRole(userId: string, newRole: UserRole) {
    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId);

    if (error) {
      toast.error('erro ao atualizar permissão');
    } else {
      toast.success('permissão atualizada');
      setUsers(prev =>
        prev.map(u => (u.id === userId ? { ...u, role: newRole } : u))
      );
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="lowercase">gerenciar acessos</DialogTitle>
        </DialogHeader>
        {loading ? (
          <div className="py-8 text-center text-muted-foreground lowercase">um momento...</div>
        ) : (
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground [&_th]:lowercase">
                  <th className="pb-2 font-medium">nome</th>
                  <th className="pb-2 font-medium">e-mail</th>
                  <th className="pb-2 font-medium">permissão</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b">
                    <td className="py-3">{u.nome || '—'}</td>
                    <td className="py-3 text-muted-foreground">{u.email}</td>
                    <td className="py-3">
                      {u.id === user?.id ? (
                        <span className="rounded bg-muted px-2 py-1 text-xs font-medium lowercase">
                          {u.role} (você)
                        </span>
                      ) : (
                        <Select
                          value={u.role}
                          onValueChange={(v) => updateRole(u.id, v as UserRole)}
                        >
                          <SelectTrigger className="h-8 w-[120px] lowercase">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="viewer" className="lowercase">viewer</SelectItem>
                            <SelectItem value="editor" className="lowercase">editor</SelectItem>
                            <SelectItem value="admin" className="lowercase">admin</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default UserManagement;
