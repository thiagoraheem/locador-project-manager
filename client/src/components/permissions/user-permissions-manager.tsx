import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2, UserPlus, Shield, Eye, Edit, Crown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'manager' | 'member' | 'viewer';
}

interface ProjectUser {
  userId: string;
  username: string;
  email: string;
  role: 'admin' | 'manager' | 'member' | 'viewer';
  permission: 'read' | 'write' | 'admin';
  createdAt: string;
}

interface UserPermissionsManagerProps {
  projectId: string;
  currentUserRole: 'admin' | 'manager' | 'member' | 'viewer';
  currentUserPermission: 'read' | 'write' | 'admin';
}

const roleLabels = {
  admin: 'Administrador',
  manager: 'Gerente',
  member: 'Membro',
  viewer: 'Visualizador'
};

const permissionLabels = {
  read: 'Leitura',
  write: 'Escrita',
  admin: 'Administrador'
};

const roleIcons = {
  admin: Crown,
  manager: Shield,
  member: Edit,
  viewer: Eye
};

const permissionIcons = {
  read: Eye,
  write: Edit,
  admin: Crown
};

export function UserPermissionsManager({ 
  projectId, 
  currentUserRole, 
  currentUserPermission 
}: UserPermissionsManagerProps) {
  const [projectUsers, setProjectUsers] = useState<ProjectUser[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [addUserDialogOpen, setAddUserDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedPermission, setSelectedPermission] = useState<'read' | 'write' | 'admin'>('read');
  const { toast } = useToast();

  const canManageUsers = currentUserPermission === 'admin' || currentUserRole === 'admin';

  useEffect(() => {
    fetchProjectUsers();
    if (canManageUsers) {
      fetchAllUsers();
    }
  }, [projectId, canManageUsers]);

  const fetchProjectUsers = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/users`, {
        headers: {
          'x-user-id': 'user-1' // Simulação - em produção viria da autenticação
        }
      });
      
      if (response.ok) {
        const users = await response.json();
        setProjectUsers(users);
      }
    } catch (error) {
      console.error('Erro ao buscar usuários do projeto:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao carregar usuários do projeto',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAllUsers = async () => {
    try {
      const response = await fetch('/api/users', {
        headers: {
          'x-user-id': 'user-1' // Simulação - em produção viria da autenticação
        }
      });
      
      if (response.ok) {
        const users = await response.json();
        setAllUsers(users);
      }
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
    }
  };

  const addUserToProject = async () => {
    if (!selectedUserId) return;

    try {
      const response = await fetch(`/api/projects/${projectId}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'user-1' // Simulação - em produção viria da autenticação
        },
        body: JSON.stringify({
          userId: selectedUserId,
          permission: selectedPermission
        })
      });

      if (response.ok) {
        toast({
          title: 'Sucesso',
          description: 'Usuário adicionado ao projeto com sucesso'
        });
        setAddUserDialogOpen(false);
        setSelectedUserId('');
        setSelectedPermission('read');
        fetchProjectUsers();
      } else {
        const error = await response.json();
        toast({
          title: 'Erro',
          description: error.message || 'Falha ao adicionar usuário',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Erro ao adicionar usuário:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao adicionar usuário ao projeto',
        variant: 'destructive'
      });
    }
  };

  const removeUserFromProject = async (userId: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': 'user-1' // Simulação - em produção viria da autenticação
        }
      });

      if (response.ok) {
        toast({
          title: 'Sucesso',
          description: 'Usuário removido do projeto com sucesso'
        });
        fetchProjectUsers();
      } else {
        const error = await response.json();
        toast({
          title: 'Erro',
          description: error.message || 'Falha ao remover usuário',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Erro ao remover usuário:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao remover usuário do projeto',
        variant: 'destructive'
      });
    }
  };

  const availableUsers = allUsers.filter(
    user => !projectUsers.some(pu => pu.userId === user.id)
  );

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Permissões de Usuário</CardTitle>
          <CardDescription>Carregando usuários...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Permissões de Usuário</CardTitle>
            <CardDescription>
              Gerencie quem tem acesso a este projeto e suas permissões
            </CardDescription>
          </div>
          {canManageUsers && (
            <Dialog open={addUserDialogOpen} onOpenChange={setAddUserDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Adicionar Usuário
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Adicionar Usuário ao Projeto</DialogTitle>
                  <DialogDescription>
                    Selecione um usuário e defina suas permissões no projeto.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="user">Usuário</Label>
                    <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um usuário" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableUsers.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.username} ({user.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="permission">Permissão</Label>
                    <Select value={selectedPermission} onValueChange={(value: 'read' | 'write' | 'admin') => setSelectedPermission(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="read">Leitura - Pode visualizar o projeto</SelectItem>
                        <SelectItem value="write">Escrita - Pode editar tarefas e tickets</SelectItem>
                        <SelectItem value="admin">Admin - Controle total do projeto</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setAddUserDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={addUserToProject} disabled={!selectedUserId}>
                    Adicionar
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {projectUsers.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Nenhum usuário encontrado neste projeto.
            </p>
          ) : (
            projectUsers.map((user) => {
              const RoleIcon = roleIcons[user.role];
              const PermissionIcon = permissionIcons[user.permission];
              
              return (
                <div key={user.userId} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="flex flex-col">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{user.username}</span>
                        <Badge variant="outline" className="flex items-center space-x-1">
                          <RoleIcon className="h-3 w-3" />
                          <span>{roleLabels[user.role]}</span>
                        </Badge>
                      </div>
                      <span className="text-sm text-muted-foreground">{user.email}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className="flex items-center space-x-1">
                      <PermissionIcon className="h-3 w-3" />
                      <span>{permissionLabels[user.permission]}</span>
                    </Badge>
                    {canManageUsers && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeUserFromProject(user.userId)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
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
  );
}