import { Request, Response, NextFunction } from 'express';
import { getDb } from './db';
import sql from 'mssql';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { storage } from './storage';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_EXPIRES_IN = '7d';
const REFRESH_TOKEN_EXPIRES_IN = '30d';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    username: string;
    email: string;
    name: string;
    role: 'admin' | 'manager' | 'member' | 'viewer';
  };
}

export interface TokenPayload {
  userId: string;
  type: 'access' | 'refresh';
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

// Funções utilitárias para JWT
export function generateAccessToken(userId: string): string {
  return jwt.sign(
    { userId, type: 'access' } as TokenPayload, 
    JWT_SECRET, 
    { expiresIn: JWT_EXPIRES_IN }
  );
}

export function generateRefreshToken(userId: string): string {
  return jwt.sign(
    { userId, type: 'refresh' } as TokenPayload, 
    JWT_SECRET, 
    { expiresIn: REFRESH_TOKEN_EXPIRES_IN }
  );
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    return decoded;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

// Funções utilitárias para senhas
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword);
}

// Função para autenticar usuário
export async function authenticateUser(email: string, password: string) {
  try {
    // Buscar usuário por email
    const user = await storage.getUserByEmail(email);
    if (!user) {
      throw new Error('Credenciais inválidas');
    }

    // Verificar senha
    const isValidPassword = await verifyPassword(password, user.password);
    if (!isValidPassword) {
      throw new Error('Credenciais inválidas');
    }

    // Remover senha do objeto de retorno
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  } catch (error) {
    throw error;
  }
}

// Middleware de autenticação real com JWT
export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    // Buscar token do cookie ou header Authorization
    const token = req.cookies?.authToken || 
                 (req.headers.authorization?.startsWith('Bearer ') 
                   ? req.headers.authorization.substring(7) 
                   : null);
    
    if (!token) {
      return res.status(401).json({ error: 'Token de acesso requerido' });
    }

    // Verificar e decodificar token
    const decoded = verifyToken(token);
    if (!decoded || decoded.type !== 'access') {
      return res.status(401).json({ error: 'Token inválido ou expirado' });
    }

    // Buscar usuário no banco de dados
    const user = await storage.getUser(decoded.userId);
    if (!user) {
      return res.status(401).json({ error: 'Usuário não encontrado' });
    }

    // Adicionar usuário à requisição (sem senha)
    req.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.name,
      role: user.role as 'admin' | 'manager' | 'member' | 'viewer'
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

// Middleware opcional de autenticação (não bloqueia se não tiver token)
export async function optionalAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.authToken || 
                 (req.headers.authorization?.startsWith('Bearer ') 
                   ? req.headers.authorization.substring(7) 
                   : null);
    
    if (token) {
      const decoded = verifyToken(token);
      if (decoded && decoded.type === 'access') {
        const user = await storage.getUser(decoded.userId);
        if (user) {
          req.user = {
            id: user.id,
            username: user.username,
            email: user.email,
            name: user.name,
            role: user.role as 'admin' | 'manager' | 'member' | 'viewer'
          };
        }
      }
    }
    
    next();
  } catch (error) {
    // Em caso de erro, apenas continue sem definir req.user
    next();
  }
}