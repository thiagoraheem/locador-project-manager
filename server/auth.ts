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
      
      // For now, just pass through - implement proper project permissions later
      next();
    } catch (error) {
      console.error('Erro na verificação de permissões:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  };
}