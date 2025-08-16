import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertProjectSchema, insertTicketSchema, insertTaskSchema, insertMilestoneSchema, insertCommentSchema, insertTaskDependencySchema, insertNotificationSchema } from "@shared/schema";
import { z } from "zod";
import { requireAuth, requireRole, requireProjectPermission, type AuthenticatedRequest } from "./auth";
// import { 
//   addUserToProject, 
//   removeUserFromProject, 
//   getProjectUsers, 
//   getUserProjects, 
//   getUserProjectPermission,
//   updateUserRole,
//   canUserPerformAction 
// } from "./permissions";
import { registerUserRoutes } from "./routes/users";

export async function registerRoutes(app: Express): Promise<Server> {
  // Dashboard stats
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Projects routes
  app.get("/api/projects", async (req, res) => {
    try {
      const projects = await storage.getProjects();
      res.json(projects);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  app.get("/api/projects/:id", async (req, res) => {
    try {
      const project = await storage.getProject(req.params.id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch project" });
    }
  });

  app.post("/api/projects", async (req, res) => {
    try {
      const validatedData = insertProjectSchema.parse(req.body);
      const project = await storage.createProject(validatedData);
      res.status(201).json(project);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid project data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create project" });
    }
  });

  app.put("/api/projects/:id", async (req, res) => {
    try {
      const validatedData = insertProjectSchema.partial().parse(req.body);
      const project = await storage.updateProject(req.params.id, validatedData);
      res.json(project);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid project data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update project" });
    }
  });

  app.delete("/api/projects/:id", async (req, res) => {
    try {
      await storage.deleteProject(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete project" });
    }
  });

  // Tickets routes
  app.get("/api/tickets", async (req, res) => {
    try {
      const projectId = req.query.projectId as string | undefined;
      const tickets = await storage.getTickets(projectId);
      res.json(tickets);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tickets" });
    }
  });

  app.get("/api/tickets/:id", async (req, res) => {
    try {
      const ticket = await storage.getTicket(req.params.id);
      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }
      res.json(ticket);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch ticket" });
    }
  });

  app.post("/api/tickets", async (req, res) => {
    try {
      const validatedData = insertTicketSchema.parse(req.body);
      const ticket = await storage.createTicket(validatedData);
      res.status(201).json(ticket);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid ticket data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create ticket" });
    }
  });

  app.put("/api/tickets/:id", async (req, res) => {
    try {
      const validatedData = insertTicketSchema.partial().parse(req.body);
      const ticket = await storage.updateTicket(req.params.id, validatedData);
      res.json(ticket);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid ticket data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update ticket" });
    }
  });

  app.delete("/api/tickets/:id", async (req, res) => {
    try {
      await storage.deleteTicket(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete ticket" });
    }
  });

  // Tasks routes
  app.get("/api/tasks", async (req, res) => {
    try {
      const projectId = req.query.projectId as string | undefined;
      const tasks = await storage.getTasks(projectId);
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  app.get("/api/tasks/:id", async (req, res) => {
    try {
      const task = await storage.getTask(req.params.id);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      res.json(task);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch task" });
    }
  });

  app.post("/api/tasks", async (req, res) => {
    try {
      const validatedData = insertTaskSchema.parse(req.body);
      const task = await storage.createTask(validatedData);
      res.status(201).json(task);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid task data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create task" });
    }
  });

  app.put("/api/tasks/:id", async (req, res) => {
    try {
      const validatedData = insertTaskSchema.partial().parse(req.body);
      const task = await storage.updateTask(req.params.id, validatedData);
      res.json(task);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid task data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update task" });
    }
  });

  app.delete("/api/tasks/:id", async (req, res) => {
    try {
      await storage.deleteTask(req.params.id);
      res.json({ message: "Task deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete task" });
    }
  });

  // Milestones routes
  app.get("/api/milestones", async (req, res) => {
    try {
      const projectId = req.query.projectId as string | undefined;
      const milestones = await storage.getMilestones(projectId);
      res.json(milestones);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch milestones" });
    }
  });

  // Comments routes
  app.get("/api/tickets/:ticketId/comments", async (req, res) => {
    try {
      const comments = await storage.getComments(req.params.ticketId);
      res.json(comments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  app.post("/api/tickets/:ticketId/comments", async (req, res) => {
    try {
      const validatedData = insertCommentSchema.parse({
        ...req.body,
        ticketId: req.params.ticketId,
      });
      const comment = await storage.createComment(validatedData);
      res.status(201).json(comment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid comment data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create comment" });
    }
  });

  app.put("/api/comments/:id", async (req, res) => {
    try {
      const validatedData = insertCommentSchema.partial().parse(req.body);
      const comment = await storage.updateComment(req.params.id, validatedData);
      res.json(comment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid comment data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update comment" });
    }
  });

  app.delete("/api/comments/:id", async (req, res) => {
    try {
      await storage.deleteComment(req.params.id);
      res.json({ message: "Comment deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete comment" });
    }
  });

  app.post("/api/milestones", async (req, res) => {
    try {
      const validatedData = insertMilestoneSchema.parse(req.body);
      const milestone = await storage.createMilestone(validatedData);
      res.status(201).json(milestone);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid milestone data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create milestone" });
    }
  });

  // Task Dependencies routes
  app.get("/api/tasks/:taskId/dependencies", async (req, res) => {
    try {
      const dependencies = await storage.getTaskDependencies(req.params.taskId);
      res.json(dependencies);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch task dependencies" });
    }
  });

  app.post("/api/tasks/:taskId/dependencies", async (req, res) => {
    try {
      const validatedData = insertTaskDependencySchema.parse({
        ...req.body,
        taskId: req.params.taskId,
      });
      
      // Check for circular dependencies
      const hasCircularDependency = await storage.checkCircularDependency(
        req.params.taskId,
        validatedData.dependsOnTaskId
      );
      
      if (hasCircularDependency) {
        return res.status(400).json({ message: "Circular dependency detected" });
      }
      
      const dependency = await storage.createTaskDependency(validatedData);
      res.status(201).json(dependency);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid dependency data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create task dependency" });
    }
  });

  app.delete("/api/task-dependencies/:id", async (req, res) => {
    try {
      await storage.deleteTaskDependency(req.params.id);
      res.json({ message: "Task dependency deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete task dependency" });
    }
  });

  // Notifications routes
  app.get("/api/notifications/:userId", async (req, res) => {
    try {
      const notifications = await storage.getNotifications(req.params.userId);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.get("/api/notifications/:userId/unread", async (req, res) => {
    try {
      const notifications = await storage.getUnreadNotifications(req.params.userId);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch unread notifications" });
    }
  });

  app.post("/api/notifications", async (req, res) => {
    try {
      const validatedData = insertNotificationSchema.parse(req.body);
      const notification = await storage.createNotification(validatedData);
      res.status(201).json(notification);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid notification data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create notification" });
    }
  });

  app.patch("/api/notifications/:id/read", async (req, res) => {
    try {
      await storage.markNotificationAsRead(req.params.id);
      res.json({ message: "Notification marked as read" });
    } catch (error) {
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  app.patch("/api/notifications/:userId/read-all", async (req, res) => {
    try {
      await storage.markAllNotificationsAsRead(req.params.userId);
      res.json({ message: "All notifications marked as read" });
    } catch (error) {
      res.status(500).json({ message: "Failed to mark all notifications as read" });
    }
  });

  app.delete("/api/notifications/:id", async (req, res) => {
    try {
      await storage.deleteNotification(req.params.id);
      res.json({ message: "Notification deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete notification" });
    }
  });

  // Users routes
  app.get("/api/users", requireAuth, async (req, res) => {
    try {
      const users = await storage.getUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Permissions routes
  
  // Adicionar usuário a projeto
  app.post("/api/projects/:projectId/users", requireAuth, requireProjectPermission('admin'), async (req: AuthenticatedRequest, res) => {
    try {
      const { userId, permission = 'read' } = req.body;
      const { projectId } = req.params;
      
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }
      
      const result = await addUserToProject(userId, projectId, permission);
      
      if (!result) {
        return res.status(400).json({ message: "Failed to add user to project" });
      }
      
      res.status(201).json(result);
    } catch (error) {
      res.status(500).json({ message: "Failed to add user to project" });
    }
  });
  
  // Remover usuário de projeto
  app.delete("/api/projects/:projectId/users/:userId", requireAuth, requireProjectPermission('admin'), async (req: AuthenticatedRequest, res) => {
    try {
      const { projectId, userId } = req.params;
      
      const success = await removeUserFromProject(userId, projectId);
      
      if (!success) {
        return res.status(400).json({ message: "Failed to remove user from project" });
      }
      
      res.json({ message: "User removed from project successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to remove user from project" });
    }
  });
  
  // Listar usuários de um projeto
  app.get("/api/projects/:projectId/users", requireAuth, requireProjectPermission('read'), async (req: AuthenticatedRequest, res) => {
    try {
      const { projectId } = req.params;
      const users = await getProjectUsers(projectId);
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch project users" });
    }
  });
  
  // Listar projetos de um usuário
  app.get("/api/users/:userId/projects", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { userId } = req.params;
      
      // Usuários só podem ver seus próprios projetos, exceto admins
      if (req.user?.id !== userId && req.user?.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const projects = await getUserProjects(userId);
      res.json(projects);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user projects" });
    }
  });
  
  // Verificar permissão específica
  app.get("/api/users/:userId/projects/:projectId/permission", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { userId, projectId } = req.params;
      
      // Usuários só podem ver suas próprias permissões, exceto admins
      if (req.user?.id !== userId && req.user?.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const permission = await getUserProjectPermission(userId, projectId);
      res.json({ permission });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user permission" });
    }
  });
  
  // Atualizar role de usuário (apenas admins)
  app.put("/api/users/:userId/role", requireAuth, requireRole(['admin']), async (req: AuthenticatedRequest, res) => {
    try {
      const { userId } = req.params;
      const { role } = req.body;
      
      if (!role || !['admin', 'manager', 'member', 'viewer'].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }
      
      const success = await updateUserRole(userId, role, req.user!.id);
      
      if (!success) {
        return res.status(400).json({ message: "Failed to update user role" });
      }
      
      res.json({ message: "User role updated successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to update user role" });
    }
  });
  
  // Verificar se usuário pode executar ação
  app.get("/api/users/:userId/can/:action", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { userId, action } = req.params;
      const { resourceId } = req.query;
      
      // Usuários só podem verificar suas próprias permissões, exceto admins
      if (req.user?.id !== userId && req.user?.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const canPerform = await canUserPerformAction(
        userId, 
        action as any, 
        resourceId as string
      );
      
      res.json({ canPerform });
    } catch (error) {
      res.status(500).json({ message: "Failed to check user permissions" });
    }
  });

  // Comments routes
  app.get("/api/comments/:ticketId", async (req, res) => {
    try {
      const comments = await storage.getComments(req.params.ticketId);
      res.json(comments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  app.post("/api/comments", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const result = insertCommentSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid comment data", errors: result.error.errors });
      }

      const comment = await storage.createComment(result.data);
      res.status(201).json(comment);
    } catch (error) {
      res.status(500).json({ message: "Failed to create comment" });
    }
  });

  app.patch("/api/comments/:id", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const updates = req.body;
      const comment = await storage.updateComment(req.params.id, updates);
      res.json(comment);
    } catch (error) {
      res.status(500).json({ message: "Failed to update comment" });
    }
  });

  app.delete("/api/comments/:id", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      await storage.deleteComment(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete comment" });
    }
  });

  // Task Dependencies routes
  app.get("/api/tasks/:taskId/dependencies", async (req, res) => {
    try {
      const dependencies = await storage.getTaskDependencies(req.params.taskId);
      res.json(dependencies);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch task dependencies" });
    }
  });

  app.post("/api/task-dependencies", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const result = insertTaskDependencySchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid dependency data", errors: result.error.errors });
      }

      const isCircular = await storage.checkCircularDependency(
        result.data.taskId,
        result.data.dependsOnTaskId
      );

      if (isCircular) {
        return res.status(400).json({ message: "Circular dependency detected" });
      }

      const dependency = await storage.createTaskDependency(result.data);
      res.status(201).json(dependency);
    } catch (error) {
      res.status(500).json({ message: "Failed to create task dependency" });
    }
  });

  app.delete("/api/task-dependencies/:id", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      await storage.deleteTaskDependency(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete task dependency" });
    }
  });

  // Milestones routes  
  app.get("/api/milestones", async (req, res) => {
    try {
      const projectId = req.query.projectId as string;
      const milestones = await storage.getMilestones(projectId);
      res.json(milestones);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch milestones" });
    }
  });

  app.post("/api/milestones", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const result = insertMilestoneSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid milestone data", errors: result.error.errors });
      }

      const milestone = await storage.createMilestone(result.data);
      res.status(201).json(milestone);
    } catch (error) {
      res.status(500).json({ message: "Failed to create milestone" });
    }
  });

  // Register user management routes
  registerUserRoutes(app);

  const httpServer = createServer(app);
  return httpServer;
}
