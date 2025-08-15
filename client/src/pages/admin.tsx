import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UserRolesManager } from '@/components/permissions/user-roles-manager';
import UserManagement from '@/components/admin/user-management';
import { Shield, Users, Settings, Database } from 'lucide-react';
import Header from '@/components/layout/header';

// Simulação do usuário atual - em produção viria da autenticação
const currentUser = {
  id: 'user-1',
  username: 'admin',
  email: 'admin@example.com',
  role: 'admin' as const
};

export default function Admin() {
  const [activeTab, setActiveTab] = useState('users');

  // Verificar se o usuário tem permissão para acessar a página de admin
  if (currentUser.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="p-8 text-center">
              <Shield className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-2xl font-bold mb-2">Acesso Negado</h2>
              <p className="text-muted-foreground">
                Você não tem permissão para acessar esta página. Apenas administradores podem gerenciar o sistema.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center space-x-2 mb-2">
            <Shield className="h-6 w-6" />
            <h1 className="text-3xl font-bold">Administração do Sistema</h1>
            <Badge variant="destructive">Admin</Badge>
          </div>
          <p className="text-muted-foreground">
            Gerencie usuários, permissões e configurações do sistema
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="users" className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>Usuários</span>
            </TabsTrigger>
            <TabsTrigger value="permissions" className="flex items-center space-x-2">
              <Shield className="h-4 w-4" />
              <span>Permissões</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center space-x-2">
              <Settings className="h-4 w-4" />
              <span>Configurações</span>
            </TabsTrigger>
            <TabsTrigger value="system" className="flex items-center space-x-2">
              <Database className="h-4 w-4" />
              <span>Sistema</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-6">
            <UserManagement />
          </TabsContent>

          <TabsContent value="permissions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Gerenciamento de Permissões</CardTitle>
                <CardDescription>
                  Configure permissões específicas por projeto e recurso
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-2">
                          <Shield className="h-5 w-5 text-blue-500" />
                          <div>
                            <p className="font-medium">Permissões de Projeto</p>
                            <p className="text-sm text-muted-foreground">Controle de acesso por projeto</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-2">
                          <Users className="h-5 w-5 text-green-500" />
                          <div>
                            <p className="font-medium">Roles de Sistema</p>
                            <p className="text-sm text-muted-foreground">Níveis de acesso globais</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-2">
                          <Settings className="h-5 w-5 text-orange-500" />
                          <div>
                            <p className="font-medium">Configurações</p>
                            <p className="text-sm text-muted-foreground">Políticas de segurança</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div className="border rounded-lg p-4">
                    <h3 className="font-medium mb-2">Hierarquia de Permissões</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center space-x-2">
                        <Badge variant="destructive">Admin</Badge>
                        <span>Acesso total ao sistema, pode gerenciar usuários e configurações</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="default">Manager</Badge>
                        <span>Pode criar e gerenciar projetos, atribuir tarefas</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary">Member</Badge>
                        <span>Pode trabalhar em projetos atribuídos, criar tarefas</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">Viewer</Badge>
                        <span>Apenas visualização, sem permissões de edição</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Configurações do Sistema</CardTitle>
                <CardDescription>
                  Configure parâmetros globais do sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <h3 className="font-medium mb-2">Segurança</h3>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          <li>• Política de senhas</li>
                          <li>• Tempo de sessão</li>
                          <li>• Autenticação de dois fatores</li>
                          <li>• Logs de auditoria</li>
                        </ul>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <h3 className="font-medium mb-2">Notificações</h3>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          <li>• Configurações de email</li>
                          <li>• Notificações push</li>
                          <li>• Frequência de alertas</li>
                          <li>• Templates de mensagem</li>
                        </ul>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="system" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informações do Sistema</CardTitle>
                <CardDescription>
                  Monitoramento e estatísticas do sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-2">
                          <Database className="h-5 w-5 text-blue-500" />
                          <div>
                            <p className="font-medium">Banco de Dados</p>
                            <p className="text-sm text-muted-foreground">Status: Conectado</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-2">
                          <Settings className="h-5 w-5 text-green-500" />
                          <div>
                            <p className="font-medium">Servidor</p>
                            <p className="text-sm text-muted-foreground">Status: Online</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-2">
                          <Users className="h-5 w-5 text-orange-500" />
                          <div>
                            <p className="font-medium">Usuários Ativos</p>
                            <p className="text-sm text-muted-foreground">Últimas 24h: 12</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div className="border rounded-lg p-4">
                    <h3 className="font-medium mb-2">Logs do Sistema</h3>
                    <div className="space-y-2 text-sm font-mono bg-gray-50 p-3 rounded">
                      <div>[2024-01-15 10:30:15] INFO: Sistema iniciado com sucesso</div>
                      <div>[2024-01-15 10:30:16] INFO: Banco de dados conectado</div>
                      <div>[2024-01-15 10:30:17] INFO: Servidor HTTP iniciado na porta 5000</div>
                      <div>[2024-01-15 10:30:18] INFO: Sistema de permissões carregado</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}