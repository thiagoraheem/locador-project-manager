
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Eye, EyeOff, User, Mail, Shield, Calendar, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import Header from '@/components/layout/header';

// Schema de validação para o perfil
const profileSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6, 'Nova senha deve ter pelo menos 6 caracteres').optional().or(z.literal('')),
  confirmPassword: z.string().optional().or(z.literal(''))
}).refine((data) => {
  if (data.newPassword && data.newPassword !== data.confirmPassword) {
    return false;
  }
  if (data.newPassword && !data.currentPassword) {
    return false;
  }
  return true;
}, {
  message: "Senhas não coincidem ou senha atual é obrigatória",
  path: ["confirmPassword"]
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { user, refreshAuth } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    watch
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }
  });

  const newPassword = watch('newPassword');

  // Mutation para atualizar perfil
  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      const updateData: any = {
        name: data.name,
        email: data.email
      };

      // Apenas incluir senhas se uma nova senha foi fornecida
      if (data.newPassword) {
        updateData.currentPassword = data.currentPassword;
        updateData.newPassword = data.newPassword;
      }

      const response = await fetch('/api/auth/update-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao atualizar perfil');
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Perfil atualizado!',
        description: 'Suas informações foram atualizadas com sucesso.',
        variant: 'default'
      });
      
      // Atualizar dados do usuário no cache
      refreshAuth();
      
      // Resetar apenas os campos de senha
      reset({
        name: data.user.name,
        email: data.user.email,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao atualizar perfil',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const onSubmit = async (data: ProfileFormData) => {
    updateProfileMutation.mutate(data);
  };

  const getRoleName = (role?: string) => {
    switch (role) {
      case 'admin': return 'Administrador';
      case 'manager': return 'Gerente';
      case 'member': return 'Membro';
      default: return 'Usuário';
    }
  };

  const getRoleColor = (role?: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'manager': return 'bg-blue-100 text-blue-800';
      case 'member': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      <Header />
      <main className="flex-1 p-6 bg-gray-50">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header da página */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Meu Perfil</h1>
              <p className="text-gray-600 mt-1">
                Gerencie suas informações pessoais e configurações de conta
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Informações do usuário */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader className="text-center">
                  <div className="mx-auto w-20 h-20 bg-secondary rounded-full flex items-center justify-center mb-4">
                    <User className="w-10 h-10 text-white" />
                  </div>
                  <CardTitle>{user?.name}</CardTitle>
                  <CardDescription>{user?.email}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Perfil:</span>
                    <Badge className={getRoleColor(user?.role)}>
                      {getRoleName(user?.role)}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Status:</span>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      Ativo
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">ID:</span>
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded">{user?.id}</code>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Formulário de edição */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Informações Pessoais</CardTitle>
                  <CardDescription>
                    Atualize suas informações pessoais e senha
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    {/* Informações básicas */}
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Nome completo</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            id="name"
                            {...register('name')}
                            className={`pl-10 ${errors.name ? 'border-red-500' : ''}`}
                            placeholder="Digite seu nome completo"
                          />
                        </div>
                        {errors.name && (
                          <p className="text-sm text-red-600">{errors.name.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            id="email"
                            type="email"
                            {...register('email')}
                            className={`pl-10 ${errors.email ? 'border-red-500' : ''}`}
                            placeholder="Digite seu email"
                          />
                        </div>
                        {errors.email && (
                          <p className="text-sm text-red-600">{errors.email.message}</p>
                        )}
                      </div>
                    </div>

                    <Separator />

                    {/* Alteração de senha */}
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-lg font-medium">Alterar Senha</h3>
                        <p className="text-sm text-gray-600">
                          Deixe em branco se não quiser alterar a senha
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="currentPassword">Senha atual</Label>
                        <div className="relative">
                          <Input
                            id="currentPassword"
                            type={showCurrentPassword ? 'text' : 'password'}
                            {...register('currentPassword')}
                            placeholder="Digite sua senha atual"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          >
                            {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="newPassword">Nova senha</Label>
                        <div className="relative">
                          <Input
                            id="newPassword"
                            type={showNewPassword ? 'text' : 'password'}
                            {...register('newPassword')}
                            placeholder="Digite sua nova senha"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                          >
                            {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                        {errors.newPassword && (
                          <p className="text-sm text-red-600">{errors.newPassword.message}</p>
                        )}
                      </div>

                      {newPassword && (
                        <div className="space-y-2">
                          <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
                          <div className="relative">
                            <Input
                              id="confirmPassword"
                              type={showConfirmPassword ? 'text' : 'password'}
                              {...register('confirmPassword')}
                              placeholder="Confirme sua nova senha"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                          </div>
                          {errors.confirmPassword && (
                            <p className="text-sm text-red-600">{errors.confirmPassword.message}</p>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end space-x-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => reset()}
                        disabled={!isDirty || updateProfileMutation.isPending}
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="submit"
                        disabled={!isDirty || updateProfileMutation.isPending}
                      >
                        {updateProfileMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Salvando...
                          </>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            Salvar Alterações
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
