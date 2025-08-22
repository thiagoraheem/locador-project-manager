import { Express, Request, Response } from 'express';
import { z } from 'zod';
import { 
  authenticateUser, 
  generateAccessToken, 
  generateRefreshToken, 
  verifyToken, 
  requireAuth,
  hashPassword,
  type AuthenticatedRequest 
} from '../auth';
import { storage } from '../storage';
import bcrypt from 'bcryptjs'; // Import bcrypt for password hashing

// Placeholder functions for storage operations (replace with actual implementation from '../storage')
const getUserById = async (userId: string) => {
  // Mock implementation: Replace with actual call to storage.getUser(userId)
  // For now, returning a dummy user to make the code runnable
  return storage.getUser(userId);
};

const updateUserProfile = async (userId: string, profileData: any) => {
  // Mock implementation: Replace with actual call to storage.updateUser(userId, profileData)
  // For now, updating a dummy user
  const user = await storage.getUser(userId);
  if (user) {
    Object.assign(user, profileData);
    // In a real scenario, you'd save this back to the database
    return user;
  }
  return null;
};

const authenticateToken = (req: AuthenticatedRequest, res: Response, next: Function) => {
  const token = req.cookies?.authToken;

  if (!token) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }

  try {
    const decoded = verifyToken(token);
    if (!decoded || decoded.type !== 'access') {
      return res.status(401).json({ error: 'Token de acesso inválido' });
    }

    // Fetch user from storage and attach to request
    storage.getUser(decoded.userId).then(user => {
      if (!user) {
        return res.status(401).json({ error: 'Usuário não encontrado' });
      }
      req.user = {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role,
      };
      next();
    }).catch(err => {
      console.error('Erro ao buscar usuário para autenticação:', err);
      res.status(500).json({ error: 'Erro interno do servidor ao autenticar' });
    });

  } catch (error) {
    console.error('Erro na autenticação:', error);
    res.status(401).json({ error: 'Não autorizado' });
  }
};


// Schema de validação para login
const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  rememberMe: z.boolean().optional().default(false)
});

// Schema para registro (se necessário)
const registerSchema = z.object({
  username: z.string().min(3, 'Username deve ter pelo menos 3 caracteres'),
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  role: z.enum(['admin', 'manager', 'member', 'viewer']).default('member')
});

export function registerAuthRoutes(app: Express) {

  // POST /api/auth/login - Fazer login
  app.post('/api/auth/login', async (req: Request, res: Response) => {
    try {
      const validation = loginSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          error: 'Dados inválidos',
          details: validation.error.errors
        });
      }

      const { email, password, rememberMe } = validation.data;

      // Autenticar usuário
      const user = await authenticateUser(email, password);

      // Gerar tokens
      const accessToken = generateAccessToken(user.id);
      const refreshToken = generateRefreshToken(user.id);

      // Configurar cookies
      const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict' as const,
        maxAge: rememberMe ? 30 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000 // 30 dias ou 7 dias
      };

      res.cookie('authToken', accessToken, cookieOptions);
      res.cookie('refreshToken', refreshToken, {
        ...cookieOptions,
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 dias sempre para refresh
      });

      // Retornar dados do usuário (sem senha)
      res.json({
        success: true,
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          email: user.email,
          role: user.role
        },
        accessToken // Opcional: para uso em headers se necessário
      });

    } catch (error: any) {
      console.error('Erro no login:', error);
      res.status(401).json({ 
        error: error.message === 'Credenciais inválidas' 
          ? 'Email ou senha incorretos' 
          : 'Erro no servidor' 
      });
    }
  });

  // POST /api/auth/logout - Fazer logout
  app.post('/api/auth/logout', (req: Request, res: Response) => {
    try {
      // Limpar cookies
      res.clearCookie('authToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });

      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });

      res.json({ success: true, message: 'Logout realizado com sucesso' });
    } catch (error) {
      console.error('Erro no logout:', error);
      res.status(500).json({ error: 'Erro no servidor' });
    }
  });

  // GET /api/auth/me - Obter dados do usuário atual
  app.get('/api/auth/me', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      res.json({
        user: {
          id: req.user.id,
          username: req.user.username,
          name: req.user.name,
          email: req.user.email,
          role: req.user.role
        }
      });
    } catch (error) {
      console.error('Erro ao obter dados do usuário:', error);
      res.status(500).json({ error: 'Erro no servidor' });
    }
  });

  // POST /api/auth/refresh - Renovar token de acesso
  app.post('/api/auth/refresh', async (req: Request, res: Response) => {
    try {
      const refreshToken = req.cookies?.refreshToken;

      if (!refreshToken) {
        return res.status(401).json({ error: 'Token de renovação não encontrado' });
      }

      const decoded = verifyToken(refreshToken);
      if (!decoded || decoded.type !== 'refresh') {
        return res.status(401).json({ error: 'Token de renovação inválido' });
      }

      // Verificar se usuário ainda existe
      const user = await storage.getUser(decoded.userId);
      if (!user) {
        return res.status(401).json({ error: 'Usuário não encontrado' });
      }

      // Gerar novo access token
      const newAccessToken = generateAccessToken(user.id);

      const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict' as const,
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 dias
      };

      res.cookie('authToken', newAccessToken, cookieOptions);

      res.json({ 
        success: true,
        accessToken: newAccessToken 
      });

    } catch (error) {
      console.error('Erro ao renovar token:', error);
      res.status(401).json({ error: 'Erro ao renovar token' });
    }
  });

  // POST /api/auth/register - Registrar novo usuário (opcional - pode ser removido se não precisar)
  app.post('/api/auth/register', async (req: Request, res: Response) => {
    try {
      const validation = registerSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          error: 'Dados inválidos',
          details: validation.error.errors
        });
      }

      const { username, name, email, password, role } = validation.data;

      // Verificar se email já existe
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: 'Email já está em uso' });
      }

      // Verificar se username já existe
      const existingUsername = await storage.getUserByUsername(username);
      if (existingUsername) {
        return res.status(400).json({ error: 'Username já está em uso' });
      }

      // Hash da senha
      const hashedPassword = await hashPassword(password);

      // Criar usuário
      const newUser = await storage.createUser({
        username,
        name,
        email,
        password: hashedPassword,
        role
      });

      // Fazer login automático
      const accessToken = generateAccessToken(newUser.id);
      const refreshToken = generateRefreshToken(newUser.id);

      const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict' as const,
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 dias
      };

      res.cookie('authToken', accessToken, cookieOptions);
      res.cookie('refreshToken', refreshToken, {
        ...cookieOptions,
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 dias
      });

      res.status(201).json({
        success: true,
        user: {
          id: newUser.id,
          username: newUser.username,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role
        }
      });

    } catch (error: any) {
      console.error('Erro no registro:', error);
      res.status(500).json({ error: 'Erro no servidor' });
    }
  });

  // Rota para atualizar perfil do usuário
  app.put('/api/auth/update-profile', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.id; // Use ! because authenticateToken ensures req.user exists
      const { name, email, currentPassword, newPassword } = req.body;

      if (!name || !email) {
        return res.status(400).json({ error: 'Nome e email são obrigatórios' });
      }

      // Buscar usuário atual
      const currentUser = await getUserById(userId);
      if (!currentUser) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      // Se está tentando alterar a senha
      if (newPassword) {
        if (!currentPassword) {
          return res.status(400).json({ error: 'Senha atual é obrigatória para alterar senha' });
        }

        // Verificar senha atual
        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, currentUser.password);
        if (!isCurrentPasswordValid) {
          return res.status(401).json({ error: 'Senha atual incorreta' });
        }

        // Hash da nova senha
        const hashedNewPassword = await bcrypt.hash(newPassword, 12);

        // Atualizar com nova senha
        await updateUserProfile(userId, { name, email, password: hashedNewPassword });
      } else {
        // Atualizar apenas nome e email
        await updateUserProfile(userId, { name, email });
      }

      // Buscar usuário atualizado
      const updatedUser = await getUserById(userId);

      res.json({
        success: true,
        message: 'Perfil atualizado com sucesso',
        user: {
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          username: updatedUser.username,
          role: updatedUser.role,
          status: updatedUser.status // Assuming status is a field in your user model
        }
      });
    } catch (error: any) {
      console.error('Erro ao atualizar perfil:', error);
      // Provide more specific error messages if possible
      if (error.message === 'Usuário não encontrado') {
        return res.status(404).json({ error: error.message });
      }
      if (error.message === 'Senha atual incorreta') {
        return res.status(401).json({ error: error.message });
      }
      res.status(500).json({ error: 'Erro interno do servidor ao atualizar perfil' });
    }
  });
}