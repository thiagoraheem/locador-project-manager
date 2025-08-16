import { Request, Response, NextFunction } from 'express';
import { db } from './db';
import { users } from '../shared/schema';
import { eq } from 'drizzle-orm';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    username: string;
    email: string;
    role: 'admin' | 'manager' | 'member' | 'viewer';
  };
}

// Middleware para verificar se o usuário está autenticado
export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    // Por enquanto, vamos simular um usuário logado
    // Em uma implementação real, isso viria de uma sessão ou JWT
    const userId = req.headers['x-user-id'] as string || 'user-1';
    
    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    
    if (!user.length) {
      return res.status(401).json({ error: 'Usuário não encontrado' });
    }
    
    req.user = {
      id: user[0].id,
      username: user[0].username,
      email: user[0].email,
      role: user[0].role as 'admin' | 'manager' | 'member' | 'viewer'
    };
    
    next();
  } catch (error) {
    console.error('Erro na autenticação:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

// Middleware para verificar se o usuário tem uma role específica
export function requireRole(roles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Permissão insuficiente' });
    }
    
    next();
  };
}

// Middleware para verificar permissões específicas de projeto
export function requireProjectPermission(permission: 'read' | 'write' | 'admin') {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }
      
      // Admins têm acesso total
      if (req.user.role === 'admin') {
        return next();
      }
      
      const projectId = req.params.projectId || req.body.projectId;
      
      if (!projectId) {
        return res.status(400).json({ error: 'ID do projeto não fornecido' });
      }
      
      // Verificar permissões específicas do projeto
      const userPermission = await db
        .select()
        .from(projectPermissions)
        .where(
          and(
            eq(projectPermissions.userId, req.user.id),
            eq(projectPermissions.projectId, projectId)
          )
        )
        .limit(1);
      
      if (!userPermission.length) {
        return res.status(403).json({ error: 'Sem permissão para este projeto' });
      }
      
      const userPerm = userPermission[0].permission;
      
      // Verificar se a permissão do usuário é suficiente
      const permissionLevels = {
        'read': 1,
        'write': 2,
        'admin': 3
      };
      
      const requiredLevel = permissionLevels[permission];
      const userLevel = permissionLevels[userPerm as keyof typeof permissionLevels];
      
      if (userLevel < requiredLevel) {
        return res.status(403).json({ error: 'Permissão insuficiente para esta ação' });
      }
      
      next();
    } catch (error) {
      console.error('Erro na verificação de permissões:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  };
}

// Função para verificar se o usuário pode acessar um recurso
export async function canAccessResource(
  userId: string,
  resourceType: 'project' | 'ticket' | 'task',
  resourceId: string,
  action: 'read' | 'write' | 'delete' = 'read'
): Promise<boolean> {
  try {
    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    
    if (!user.length) {
      return false;
    }
    
    // Admins têm acesso total
    if (user[0].role === 'admin') {
      return true;
    }
    
    // Para projetos, verificar permissões diretas
    if (resourceType === 'project') {
      const permission = await db
        .select()
        .from(projectPermissions)
        .where(
          and(
            eq(projectPermissions.userId, userId),
            eq(projectPermissions.projectId, resourceId)
          )
        )
        .limit(1);
      
      if (!permission.length) {
        return false;
      }
      
      const permissionLevels = {
        'read': 1,
        'write': 2,
        'admin': 3
      };
      
      const actionLevels = {
        'read': 1,
        'write': 2,
        'delete': 3
      };
      
      const userLevel = permissionLevels[permission[0].permission as keyof typeof permissionLevels];
      const requiredLevel = actionLevels[action];
      
      return userLevel >= requiredLevel;
    }
    
    // Para tickets e tasks, verificar através do projeto
    // TODO: Implementar lógica para verificar permissões através do projeto pai
    
    return false;
  } catch (error) {
    console.error('Erro ao verificar acesso ao recurso:', error);
    return false;
  }
}