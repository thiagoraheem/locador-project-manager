import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { User } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Query para verificar se usuário está autenticado
  const { data: authData, isLoading: isCheckingAuth, error } = useQuery({
    queryKey: ['/api/auth/me'],
    queryFn: async () => {
      const response = await fetch('/api/auth/me', {
        credentials: 'include'
      });
      
      if (response.status === 401) {
        return null;
      }
      
      if (!response.ok) {
        throw new Error('Erro ao verificar autenticação');
      }
      
      const data = await response.json();
      return data.user;
    },
    retry: false,
    staleTime: 5 * 60 * 1000 // 5 minutos
  });

  // Atualizar estado do usuário quando a query retornar
  useEffect(() => {
    setUser(authData || null);
    setIsLoading(isCheckingAuth);
  }, [authData, isCheckingAuth]);

  // Mutation para login
  const loginMutation = useMutation({
    mutationFn: async ({ email, password, rememberMe }: { email: string; password: string; rememberMe?: boolean }) => {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ email, password, rememberMe })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro no login');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      setUser(data.user);
      queryClient.setQueryData(['/api/auth/me'], data.user);
      // Invalidar todas as queries para forçar recarregamento com nova auth
      queryClient.invalidateQueries();
    },
    onError: (error: any) => {
      throw error; // Re-throw para que o componente possa capturar
    }
  });

  // Mutation para logout
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Erro no logout');
      }
      
      return response.json();
    },
    onSuccess: () => {
      setUser(null);
      queryClient.setQueryData(['/api/auth/me'], null);
      // Limpar todas as queries em cache
      queryClient.clear();
    },
    onError: (error: any) => {
      // Mesmo com erro, limpar o estado local
      setUser(null);
      queryClient.setQueryData(['/api/auth/me'], null);
      queryClient.clear();
      
      toast({
        title: 'Aviso',
        description: 'Logout realizado localmente',
        variant: 'default'
      });
    }
  });

  // Funções públicas
  const login = async (email: string, password: string, rememberMe = false) => {
    return loginMutation.mutateAsync({ email, password, rememberMe });
  };

  const logout = async () => {
    return logoutMutation.mutateAsync();
  };

  const refreshAuth = async () => {
    try {
      await queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
    } catch (error) {
      console.error('Erro ao atualizar autenticação:', error);
    }
  };

  const contextValue: AuthContextType = {
    user,
    isLoading: isLoading || loginMutation.isPending || logoutMutation.isPending,
    login,
    logout,
    refreshAuth
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

