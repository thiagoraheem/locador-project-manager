
import { ReactNode, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';

interface PrivateRouteProps {
  children: ReactNode;
  requireRole?: 'admin' | 'manager' | 'member' | 'viewer';
  fallbackPath?: string;
}

export function PrivateRoute({ 
  children, 
  requireRole,
  fallbackPath = '/login'
}: PrivateRouteProps) {
  const { user, isLoading } = useAuth();
  const [location, setLocation] = useLocation();

  // Effect para redirecionamento - evita setState durante render
  useEffect(() => {
    // Só redireciona se não estiver carregando e não tiver usuário
    if (!isLoading && !user && location !== fallbackPath) {
      setLocation(fallbackPath);
    }
  }, [isLoading, user, location, fallbackPath, setLocation]);

  // Mostrar loading enquanto verifica autenticação
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="mt-2 text-sm text-gray-600">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  // Retorna null se não tem usuário (redirecionamento será feito pelo useEffect)
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="mt-2 text-sm text-gray-600">Redirecionando para login...</p>
        </div>
      </div>
    );
  }

  // Verificar permissão de role se especificada
  if (requireRole) {
    const roleHierarchy = {
      'viewer': 0,
      'member': 1, 
      'manager': 2,
      'admin': 3
    };

    const userLevel = roleHierarchy[user.role];
    const requiredLevel = roleHierarchy[requireRole];

    if (userLevel < requiredLevel) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center max-w-md">
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              <strong className="font-bold">Acesso Negado</strong>
              <p className="block sm:inline mt-1">
                Você não tem permissão para acessar esta página. 
                É necessário ter o papel de {requireRole} ou superior.
              </p>
            </div>
            <Button
              onClick={() => setLocation('/')}
              className="mt-4"
              variant="default"
            >
              Voltar ao Dashboard
            </Button>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
}

export default PrivateRoute;
