import type { Express } from "express";
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import { requireAuth, requireRole, type AuthenticatedRequest } from '../auth';
import { storage } from '../storage';

const userSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  role: z.enum(['admin', 'manager', 'member', 'viewer']),
});

export function registerUserRoutes(app: Express) {

  // Middleware para verificar se é admin
  const requireAdmin = requireRole(['admin']);

  // GET /api/users - Listar todos os usuários
  app.get('/api/users', async (req, res) => {
  try {
    const users = await storage.getUsers();
    
    res.json(users);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  });

  // POST /api/users - Criar novo usuário
  app.post('/api/users', async (req, res) => {
  try {
    const { name, email, role = 'member' } = req.body;
    
    // Validações
    const validation = userSchema.safeParse({ name, email, role });
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors[0].message });
    }
    
    // Verificar se o email já existe
    const existingUser = await storage.getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'Email já está em uso' });
    }
    
    // Gerar senha temporária
    const tempPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(tempPassword, 10);
    
    // Inserir usuário
    const newUser = await storage.createUser({
      username: name,
      name,
      email,
      password: hashedPassword,
      role
    });
    
    // Em produção, você enviaria um email com a senha temporária
    console.log(`Usuário criado: ${email}, Senha temporária: ${tempPassword}`);
    
    res.status(201).json({
      ...newUser,
      name: newUser.username,
      tempPassword // Remover em produção
    });
    } catch (error) {
      console.error('Error creating user:', error);
      res.status(500).json({ error: 'Failed to create user' });
    }
  });

  // PUT /api/users/:id - Atualizar usuário (apenas admin)
  app.put('/api/users/:id', requireAuth, requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { name, email, role } = req.body;
    
    // Validações
    const validation = userSchema.safeParse({ name, email, role });
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors[0].message });
    }
    
    // Verificar se o usuário existe
    const existingUser = await storage.getUser(id);
    if (!existingUser) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    
    // Verificar se o email já está em uso por outro usuário
    const emailCheck = await storage.getUserByEmail(email);
    if (emailCheck && emailCheck.id !== id) {
      return res.status(400).json({ error: 'Email já está em uso' });
    }
    
    // Atualizar usuário
    const updatedUser = await storage.updateUser(id, {
      username: name,
      email,
      role
    });
    
    res.json({
      ...updatedUser,
      name: updatedUser.username
    });
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(500).json({ error: 'Failed to update user' });
    }
  });

  // DELETE /api/users/:id - Excluir usuário (apenas admin)
  app.delete('/api/users/:id', requireAuth, requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    
    // Verificar se o usuário existe
    const existingUser = await storage.getUser(id);
    if (!existingUser) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    
    // Não permitir excluir o próprio usuário
    if (id === req.user?.id) {
      return res.status(400).json({ error: 'Não é possível excluir seu próprio usuário' });
    }
    
    // Verificar se não é o último admin
    if (existingUser.role === 'admin') {
      const users = await storage.getUsers();
      const activeAdmins = users.filter(u => u.role === 'admin');
      if (activeAdmins.length <= 1) {
        return res.status(400).json({ error: 'Não é possível excluir o último administrador ativo' });
      }
    }
    
    // Excluir usuário
    await storage.deleteUser(id);
    
    res.json({ message: 'Usuário excluído com sucesso' });
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({ error: 'Failed to delete user' });
    }
  });

  // GET /api/admin/stats - Estatísticas do sistema (apenas admin)
  app.get('/api/admin/stats', requireAuth, requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const users = await storage.getUsers();
    const projects = await storage.getProjects();
    const tasks = await storage.getTasks();
    const tickets = await storage.getTickets();
    
    const stats = {
      totalUsers: users.length,
      activeUsers: users.length, // All users are considered active for now
      totalProjects: projects.length,
      totalTasks: tasks.length,
      totalTickets: tickets.length,
      systemHealth: 'healthy' as const,
      uptime: '15 dias, 3 horas',
      lastBackup: new Date().toISOString()
    };
    
    res.json(stats);
    } catch (error) {
      console.error('Error fetching admin stats:', error);
      res.status(500).json({ error: 'Failed to fetch admin stats' });
    }
  });

}