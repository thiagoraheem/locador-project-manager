import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Crown, Shield, Edit, Eye, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'manager' | 'member' | 'viewer';
  createdAt: string;
  updatedAt: string;
}

interface UserRolesManagerProps {
  currentUserRole: 'admin' | 'manager' | 'member' | 'viewer';
}

const roleLabels = {
  admin: 'Administrador',
  manager: 'Gerente',
  member: 'Membro',
  viewer: 'Visualizador'
};

const roleDescriptions = {
  admin: 'Acesso total ao sistema, pode gerenciar usuários e configurações',
  manager: 'Pode criar e gerenciar projetos, atribuir tarefas',
  member: 'Pode trabalhar em projetos atribuídos, criar tarefas',
  viewer: 'Apenas visualização, sem permissões de edição'
};

const roleIcons = {
  admin: Crown,
  manager: Shield,
  member: Edit,
  viewer: Eye
};

const roleColors = {
  admin: 'bg-red-100 text-red-800 border-red-200',
  manager: 'bg-blue-100 text-blue-800 border-blue-200',
  member: 'bg-green-100 text-green-800 border-green-200',
  viewer: 'bg-gray-100 text-gray-800 border-gray-200'
};

export function UserRolesManager({ currentUserRole }: UserRolesManagerProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newRole, setNewRole] = useState<'admin' | 'manager' | 'member' | 'viewer'>('member');
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  const canManageRoles = currentUserRole === 'admin';

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users', {
        headers: {
          'x-user-id': 'user-1' // Simulação - em produção viria da autenticação
        }
      });
      
      if (response.ok) {
        const usersData = await response.json();
        setUsers(usersData);
      }
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao carregar usuários',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async () => {
    if (!editingUser) return;

    try {
      const response = await fetch(`/api/users/${editingUser.id}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'user-1' // Simulação - em produção viria da autenticação
        },
        body: JSON.stringify({ role: newRole })
      });

      if (response.ok) {
        toast({
          title: 'Sucesso',
          description: 'Role do usuário atualizada com sucesso'
        });
        setDialogOpen(false);
        setEditingUser(null);
        fetchUsers();
      } else {
        const error = await response.json();
        toast({
          title: 'Erro',
          description: error.message || 'Falha ao atualizar role',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Erro ao atualizar role:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao atualizar role do usuário',
        variant: 'destructive'
      });
    }
  };

  const openEditDialog = (user: User) => {
    setEditingUser(user);
    setNewRole(user.role);
    setDialogOpen(true);
  };

  const getRoleStats = () => {
    const stats = {
      admin: users.filter(u => u.role === 'admin').length,
      manager: users.filter(u => u.role === 'manager').length,
      member: users.filter(u => u.role === 'member').length,
      viewer: users.filter(u => u.role === 'viewer').length
    };
    return stats;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Gerenciamento de Roles</CardTitle>
          <CardDescription>Carregando usuários...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const roleStats = getRoleStats();

  return (
    <div className="space-y-6">
      {/* Estatísticas de Roles */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Object.entries(roleStats).map(([role, count]) => {
          const RoleIcon = roleIcons[role as keyof typeof roleIcons];
          return (
            <Card key={role}>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <RoleIcon className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{roleLabels[role as keyof typeof roleLabels]}</p>
                    <p className="text-2xl font-bold">{count}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Lista de Usuários */}
      <Card>
        <CardHeader>
          <CardTitle>Gerenciamento de Roles</CardTitle>
          <CardDescription>
            {canManageRoles 
              ? 'Gerencie as roles dos usuários no sistema'
              : 'Visualize as roles dos usuários no sistema'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Nenhum usuário encontrado.
              </p>
            ) : (
              users.map((user) => {
                const RoleIcon = roleIcons[user.role];
                
                return (
                  <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="flex flex-col">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{user.username}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">{user.email}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={`flex items-center space-x-1 ${roleColors[user.role]}`}>
                        <RoleIcon className="h-3 w-3" />
                        <span>{roleLabels[user.role]}</span>
                      </Badge>
                      {canManageRoles && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(user)}
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dialog de Edição */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar Role do Usuário</DialogTitle>
            <DialogDescription>
              Altere a role de {editingUser?.username}. Esta ação afetará as permissões do usuário em todo o sistema.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="role" className="text-sm font-medium">
                Nova Role
              </label>
              <Select value={newRole} onValueChange={(value: 'admin' | 'manager' | 'member' | 'viewer') => setNewRole(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">
                    <div className="flex items-center space-x-2">
                      <Crown className="h-4 w-4" />
                      <div>
                        <div className="font-medium">Administrador</div>
                        <div className="text-xs text-muted-foreground">{roleDescriptions.admin}</div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="manager">
                    <div className="flex items-center space-x-2">
                      <Shield className="h-4 w-4" />
                      <div>
                        <div className="font-medium">Gerente</div>
                        <div className="text-xs text-muted-foreground">{roleDescriptions.manager}</div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="member">
                    <div className="flex items-center space-x-2">
                      <Edit className="h-4 w-4" />
                      <div>
                        <div className="font-medium">Membro</div>
                        <div className="text-xs text-muted-foreground">{roleDescriptions.member}</div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="viewer">
                    <div className="flex items-center space-x-2">
                      <Eye className="h-4 w-4" />
                      <div>
                        <div className="font-medium">Visualizador</div>
                        <div className="text-xs text-muted-foreground">{roleDescriptions.viewer}</div>
                      </div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={updateUserRole}>
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}