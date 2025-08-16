import { db } from './db';
import { users, projects, projectUserPermissions } from '../shared/schema';
import { eq, and } from 'drizzle-orm';

// Função para adicionar permissão de usuário a um projeto
export async function addUserToProject(
  userId: string,
  projectId: string,
  permission: 'read' | 'write' | 'admin' = 'read'
): Promise<any | null> {
  try {
    // Verificar se o usuário e projeto existem
    const [user, project] = await Promise.all([
      db.select().from(users).where(eq(users.id, userId)).limit(1),
      db.select().from(projects).where(eq(projects.id, projectId)).limit(1)
    ]);
    
    if (!user.length || !project.length) {
      throw new Error('Usuário ou projeto não encontrado');
    }
    
    // Verificar se a permissão já existe
    const existingPermission = await db
      .select()
      .from(projectUserPermissions)
      .where(
        and(
          eq(projectUserPermissions.userId, userId),
          eq(projectUserPermissions.projectId, projectId)
        )
      )
      .limit(1);
    
    if (existingPermission.length > 0) {
      // Atualizar permissão existente
      const updated = await db
        .update(projectPermissions)
        .set({ 
          permission,
          updatedAt: new Date()
        })
        .where(
          and(
            eq(projectPermissions.userId, userId),
            eq(projectPermissions.projectId, projectId)
          )
        )
        .returning();
      
      return updated[0] || null;
    } else {
      // Criar nova permissão
      const newPermission: InsertProjectPermission = {
        userId,
        projectId,
        permission
      };
      
      const created = await db
        .insert(projectPermissions)
        .values(newPermission)
        .returning();
      
      return created[0] || null;
    }
  } catch (error) {
    console.error('Erro ao adicionar usuário ao projeto:', error);
    return null;
  }
}

// Função para remover usuário de um projeto
export async function removeUserFromProject(
  userId: string,
  projectId: string
): Promise<boolean> {
  try {
    const result = await db
      .delete(projectPermissions)
      .where(
        and(
          eq(projectPermissions.userId, userId),
          eq(projectPermissions.projectId, projectId)
        )
      );
    
    return true;
  } catch (error) {
    console.error('Erro ao remover usuário do projeto:', error);
    return false;
  }
}

// Função para listar usuários de um projeto
export async function getProjectUsers(projectId: string) {
  try {
    const result = await db
      .select({
        userId: projectPermissions.userId,
        permission: projectPermissions.permission,
        username: users.username,
        email: users.email,
        role: users.role,
        createdAt: projectPermissions.createdAt
      })
      .from(projectPermissions)
      .innerJoin(users, eq(projectPermissions.userId, users.id))
      .where(eq(projectPermissions.projectId, projectId));
    
    return result;
  } catch (error) {
    console.error('Erro ao listar usuários do projeto:', error);
    return [];
  }
}

// Função para listar projetos de um usuário
export async function getUserProjects(userId: string) {
  try {
    const result = await db
      .select({
        projectId: projectPermissions.projectId,
        permission: projectPermissions.permission,
        projectName: projects.name,
        projectDescription: projects.description,
        projectStatus: projects.status,
        createdAt: projectPermissions.createdAt
      })
      .from(projectPermissions)
      .innerJoin(projects, eq(projectPermissions.projectId, projects.id))
      .where(eq(projectPermissions.userId, userId));
    
    return result;
  } catch (error) {
    console.error('Erro ao listar projetos do usuário:', error);
    return [];
  }
}

// Função para verificar permissão específica
export async function getUserProjectPermission(
  userId: string,
  projectId: string
): Promise<'read' | 'write' | 'admin' | null> {
  try {
    const result = await db
      .select({ permission: projectPermissions.permission })
      .from(projectPermissions)
      .where(
        and(
          eq(projectPermissions.userId, userId),
          eq(projectPermissions.projectId, projectId)
        )
      )
      .limit(1);
    
    return result.length > 0 ? result[0].permission as 'read' | 'write' | 'admin' : null;
  } catch (error) {
    console.error('Erro ao verificar permissão do usuário:', error);
    return null;
  }
}

// Função para atualizar role de usuário (apenas admins)
export async function updateUserRole(
  userId: string,
  newRole: 'admin' | 'manager' | 'member' | 'viewer',
  adminUserId: string
): Promise<boolean> {
  try {
    // Verificar se quem está fazendo a alteração é admin
    const admin = await db.select().from(users).where(eq(users.id, adminUserId)).limit(1);
    
    if (!admin.length || admin[0].role !== 'admin') {
      throw new Error('Apenas administradores podem alterar roles de usuário');
    }
    
    await db
      .update(users)
      .set({ 
        role: newRole,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));
    
    return true;
  } catch (error) {
    console.error('Erro ao atualizar role do usuário:', error);
    return false;
  }
}

// Função para verificar se usuário pode executar ação
export async function canUserPerformAction(
  userId: string,
  action: 'create_project' | 'delete_project' | 'manage_users' | 'view_all_projects',
  targetResourceId?: string
): Promise<boolean> {
  try {
    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    
    if (!user.length) {
      return false;
    }
    
    const userRole = user[0].role;
    
    switch (action) {
      case 'create_project':
        return ['admin', 'manager'].includes(userRole);
      
      case 'delete_project':
        if (userRole === 'admin') return true;
        if (userRole === 'manager' && targetResourceId) {
          // Managers podem deletar apenas projetos onde têm permissão admin
          const permission = await getUserProjectPermission(userId, targetResourceId);
          return permission === 'admin';
        }
        return false;
      
      case 'manage_users':
        return userRole === 'admin';
      
      case 'view_all_projects':
        return ['admin', 'manager'].includes(userRole);
      
      default:
        return false;
    }
  } catch (error) {
    console.error('Erro ao verificar ação do usuário:', error);
    return false;
  }
}