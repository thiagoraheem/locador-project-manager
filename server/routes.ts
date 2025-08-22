import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  insertProjectSchema,
  insertTicketSchema,
  insertTaskSchema,
  insertTaskTypeSchema,
  insertMilestoneSchema,
  insertCommentSchema,
  insertTaskDependencySchema,
  insertNotificationSchema,
} from "@shared/schema";
import { z } from "zod";
import {
  requireAuth,
  requireRole,
  requireProjectPermission,
  type AuthenticatedRequest,
} from "./auth";
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
import { registerAuthRoutes } from "./routes/auth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Register auth routes (deve vir antes das outras)
  registerAuthRoutes(app);
  // Dashboard stats
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Task Types routes
  app.get("/api/task-types", async (req, res) => {
    try {
      console.log('Getting task types from storage...');
      const taskTypes = await storage.getTaskTypes();
      console.log('Task types retrieved:', taskTypes.length);
      res.json(taskTypes);
    } catch (error) {
      console.error('Error in /api/task-types:', error);
      res.status(500).json({ message: "Failed to fetch task types" });
    }
  });

  app.get("/api/task-types/:id", async (req, res) => {
    try {
      const taskType = await storage.getTaskType(req.params.id);
      if (!taskType) {
        return res.status(404).json({ message: "Task type not found" });
      }
      res.json(taskType);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch task type" });
    }
  });

  app.post("/api/task-types", async (req, res) => {
    try {
      const parsed = insertTaskTypeSchema.parse(req.body);
      const taskType = await storage.createTaskType(parsed);
      res.status(201).json(taskType);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Failed to create task type" });
    }
  });

  app.put("/api/task-types/:id", async (req, res) => {
    try {
      const parsed = insertTaskTypeSchema.partial().parse(req.body);
      const taskType = await storage.updateTaskType(req.params.id, parsed);
      res.json(taskType);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Failed to update task type" });
    }
  });

  app.delete("/api/task-types/:id", async (req, res) => {
    try {
      await storage.deleteTaskType(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete task type" });
    }
  });

  // Projects routes
  app.get("/api/projects", async (req, res) => {
    try {
      const projects = await storage.getProjects();
      res.json(projects);
    } catch (error) {
      console.error('Error in /api/projects:', error);
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
      // For now, use the first available user as creator since we don't have authentication
      const users = await storage.getUsers();
      const defaultUser = users[0];

      if (!defaultUser) {
        return res.status(400).json({ message: "No users found in database" });
      }

      // Set the createdBy to the first available user
      const projectData = {
        ...req.body,
        createdBy: defaultUser.id,
        status: req.body.status || "planning",
      };

      const validatedData = insertProjectSchema.parse(projectData);
      const project = await storage.createProject(validatedData);
      res.status(201).json(project);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Invalid project data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create project" });
    }
  });

  app.put("/api/projects/:id", async (req, res) => {
    try {
      // Clean null values and ensure required defaults
      const cleanData = {
        ...req.body,
        description:
          req.body.description === null ? undefined : req.body.description,
      };
      const validatedData = insertProjectSchema.partial().parse(cleanData);
      const project = await storage.updateProject(req.params.id, validatedData);
      res.json(project);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Invalid project data", errors: error.errors });
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
      console.log('Creating ticket with body:', req.body);

      // Get first user as default reporter
      const users = await storage.getUsers();
      const defaultUser = users[0];

      if (!defaultUser) {
        console.error('No users found in database');
        return res.status(400).json({ message: "No users found in database" });
      }

      // Clean and prepare ticket data
      const ticketData = {
        title: req.body.title,
        description: req.body.description || "",
        reporterId: defaultUser.id,
        status: req.body.status || "open",
        priority: req.body.priority || "medium",
        projectId: req.body.projectId === null ? undefined : req.body.projectId,
        assigneeId: req.body.assigneeId === null ? undefined : req.body.assigneeId,
      };

      console.log('Prepared ticket data:', ticketData);

      const validatedData = insertTicketSchema.parse(ticketData);
      console.log('Validated ticket data:', validatedData);

      const ticket = await storage.createTicket(validatedData);
      console.log('Created ticket:', ticket);

      res.status(201).json(ticket);
    } catch (error: any) {
      console.error('Error creating ticket:', error);
      if (error instanceof z.ZodError) {
        console.error('Zod validation errors:', error.errors);
        return res
          .status(400)
          .json({ message: "Invalid ticket data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create ticket", error: error?.message || 'Unknown error' });
    }
  });

  app.put("/api/tickets/:id", async (req, res) => {
    try {
      console.log('Updating ticket with ID:', req.params.id);
      console.log('Update data:', req.body);

      // Clean null values
      const cleanData = {
        ...req.body,
        projectId: req.body.projectId === null ? undefined : req.body.projectId,
        assigneeId: req.body.assigneeId === null ? undefined : req.body.assigneeId,
      };

      console.log('Cleaned data:', cleanData);

      const validatedData = insertTicketSchema.partial().parse(cleanData);
      console.log('Validated data:', validatedData);

      const ticket = await storage.updateTicket(req.params.id, validatedData);
      console.log('Updated ticket:', ticket);

      res.json(ticket);
    } catch (error: any) {
      console.error('Error updating ticket:', error);
      if (error instanceof z.ZodError) {
        console.error('Zod validation errors:', error.errors);
        return res
          .status(400)
          .json({ message: "Invalid ticket data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update ticket", error: error?.message || 'Unknown error' });
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
      console.error('Error in /api/tasks:', error);
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
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      console.log('Creating task with data:', req.body);

      // Validar os dados recebidos
      const parsed = insertTaskSchema.parse(req.body);
      console.log('Task data parsed successfully:', parsed);

      // Generate task ID
      const taskId = 'task_' + Math.random().toString(36).substr(2, 15);

      // Preparar dados para inserção
      const taskData = {
        ...parsed,
        id: taskId,
        priority: parsed.priority || 'medium', // Default priority se não fornecido
      };

      console.log('Inserting task with data:', taskData);

      const task = await storage.createTask(taskData);

      console.log('Task created successfully:', task.id);
      res.status(201).json(task);
    } catch (error: any) {
      console.error('Error creating task:', error);
      console.error('Error details:', error.message);
      console.error('Stack trace:', error.stack);

      if (error instanceof z.ZodError) {
        console.log('Validation errors:', error.errors);
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }

      res.status(500).json({ 
        message: "Failed to create task",
        details: error.message 
      });
    }
  });

  // PUT /api/tasks/:id - Update task
  app.put("/api/tasks/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      console.log("Updating task:", id, "with updates:", updates);

      // Verificar se a tarefa existe
      const existingTask = await storage.getTask(id);
      if (!existingTask) {
        return res.status(404).json({ message: "Task not found" });
      }

      const updatedTask = await storage.updateTask(id, updates);
      console.log("Task updated successfully:", updatedTask);

      res.json(updatedTask);
    } catch (error) {
      console.error("Error updating task:", error);
      console.error("Error stack:", error.stack);
      res.status(500).json({ 
        message: "Failed to update task", 
        error: error.message,
        details: error.stack 
      });
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
      console.log('Creating comment with body:', req.body);
      console.log('TicketId from params:', req.params.ticketId);

      // Verificar se o ticket existe
      const ticket = await storage.getTicket(req.params.ticketId);
      if (!ticket) {
        console.error('Ticket not found:', req.params.ticketId);
        return res.status(404).json({ message: "Ticket not found" });
      }

      // Verificar se o usuário existe
      const user = await storage.getUser(req.body.authorId);
      if (!user) {
        console.error('User not found:', req.body.authorId);
        // Se o user-1 não existe, criar um usuário padrão
        if (req.body.authorId === 'user-1') {
          try {
            await storage.createUser({
              id: 'user-1',
              username: 'admin',
              password: 'password123',
              name: 'Usuário Administrador',
              email: 'admin@projectflow.com',
              role: 'admin'
            });
            console.log('Created default user-1');
          } catch (createUserError) {
            console.error('Error creating default user:', createUserError);
            return res.status(400).json({ message: "User not found and could not create default user" });
          }
        } else {
          return res.status(404).json({ message: "User not found" });
        }
      }

      const commentData = {
        content: req.body.content,
        ticketId: req.params.ticketId,
        authorId: req.body.authorId,
      };

      console.log('Prepared comment data:', commentData);
      const validatedData = insertCommentSchema.parse(commentData);
      console.log('Validated comment data:', validatedData);

      const comment = await storage.createComment(validatedData);
      console.log('Created comment:', comment);
      res.status(201).json(comment);
    } catch (error: any) {
      console.error('Error creating comment:', error);
      console.error('Error stack:', error.stack);
      if (error instanceof z.ZodError) {
        console.error('Zod validation errors:', error.errors);
        return res
          .status(400)
          .json({ message: "Invalid comment data", errors: error.errors });
      }
      res.status(500).json({ 
        message: "Failed to create comment", 
        error: error?.message || 'Unknown error',
        details: error?.stack || 'No stack trace available'
      });
    }
  });

  app.put("/api/comments/:id", async (req, res) => {
    try {
      const validatedData = insertCommentSchema.partial().parse(req.body);
      const comment = await storage.updateComment(req.params.id, validatedData);
      res.json(comment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Invalid comment data", errors: error.errors });
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
      // Clean and prepare milestone data
      const milestoneData = {
        ...req.body,
        completed:
          req.body.completed !== undefined ? req.body.completed : false,
        description:
          req.body.description === null ? undefined : req.body.description,
      };

      const validatedData = insertMilestoneSchema.parse(milestoneData);
      const milestone = await storage.createMilestone(validatedData);
      res.status(201).json(milestone);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Invalid milestone data", errors: error.errors });
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
        validatedData.dependsOnTaskId,
      );

      if (hasCircularDependency) {
        return res
          .status(400)
          .json({ message: "Circular dependency detected" });
      }

      const dependency = await storage.createTaskDependency(validatedData);
      res.status(201).json(dependency);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Invalid dependency data", errors: error.errors });
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
      const notifications = await storage.getUnreadNotifications(
        req.params.userId,
      );
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch unread notifications" });
    }
  });

  app.post("/api/notifications", async (req, res) => {
    try {
      // Clean and prepare notification data
      const notificationData = {
        ...req.body,
        read: req.body.read !== undefined ? req.body.read : false,
        entityType:
          req.body.entityType === null ? undefined : req.body.entityType,
        entityId: req.body.entityId === null ? undefined : req.body.entityId,
      };

      const validatedData = insertNotificationSchema.parse(notificationData);
      const notification = await storage.createNotification(validatedData);
      res.status(201).json(notification);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Invalid notification data", errors: error.errors });
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
      res
        .status(500)
        .json({ message: "Failed to mark all notifications as read" });
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
      console.error('Error in /api/users:', error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Permissions routes

  // Adicionar usuário a projeto
  app.post(
    "/api/projects/:projectId/users",
    requireAuth,
    requireProjectPermission("admin"),
    async (req: AuthenticatedRequest, res) => {
      try {
        const { userId, permission = "read" } = req.body;
        const { projectId } = req.params;

        if (!userId) {
          return res.status(400).json({ message: "User ID is required" });
        }

        // This functionality would need proper permission system implementation
        res
          .status(501)
          .json({ message: "User project permissions not yet implemented" });
      } catch (error) {
        res.status(500).json({ message: "Failed to add user to project" });
      }
    },
  );

  // Remover usuário de projeto
  app.delete(
    "/api/projects/:projectId/users/:userId",
    requireAuth,
    requireProjectPermission("admin"),
    async (req: AuthenticatedRequest, res) => {
      try {
        const { projectId, userId } = req.params;

        // This functionality would need proper permission system implementation
        res
          .status(501)
          .json({ message: "User project permissions not yet implemented" });
      } catch (error) {
        res.status(500).json({ message: "Failed to remove user from project" });
      }
    },
  );

  // Listar usuários de um projeto
  app.get(
    "/api/projects/:projectId/users",
    requireAuth,
    requireProjectPermission("read"),
    async (req: AuthenticatedRequest, res) => {
      try {
        const { projectId } = req.params;
        // This functionality would need proper permission system implementation
        res
          .status(501)
          .json({ message: "User project permissions not yet implemented" });
      } catch (error) {
        res.status(500).json({ message: "Failed to fetch project users" });
      }
    },
  );

  // Listar projetos de um usuário
  app.get(
    "/api/users/:userId/projects",
    requireAuth,
    async (req: AuthenticatedRequest, res) => {
      try {
        const { userId } = req.params;

        // Usuários só podem ver seus próprios projetos, exceto admins
        if (req.user?.id !== userId && req.user?.role !== "admin") {
          return res.status(403).json({ message: "Access denied" });
        }

        // This functionality would need proper permission system implementation
        res
          .status(501)
          .json({ message: "User project permissions not yet implemented" });
      } catch (error) {
        res.status(500).json({ message: "Failed to fetch user projects" });
      }
    },
  );

  // Verificar permissão específica
  app.get(
    "/api/users/:userId/projects/:projectId/permission",
    requireAuth,
    async (req: AuthenticatedRequest, res) => {
      try {
        const { userId, projectId } = req.params;

        // Usuários só podem ver suas próprias permissões, exceto admins
        if (req.user?.id !== userId && req.user?.role !== "admin") {
          return res.status(403).json({ message: "Access denied" });
        }

        // This functionality would need proper permission system implementation
        res
          .status(501)
          .json({ message: "User project permissions not yet implemented" });
      } catch (error) {
        res.status(500).json({ message: "Failed to fetch user permission" });
      }
    },
  );

  // Atualizar role de usuário (apenas admins)
  app.put(
    "/api/users/:userId/role",
    requireAuth,
    requireRole(["admin"]),
    async (req: AuthenticatedRequest, res) => {
      try {
        const { userId } = req.params;
        const { role } = req.body;

        if (!role || !["admin", "manager", "member", "viewer"].includes(role)) {
          return res.status(400).json({ message: "Invalid role" });
        }

        // This functionality would need proper permission system implementation
        const success = false;

        if (!success) {
          return res
            .status(400)
            .json({ message: "Failed to update user role" });
        }

        res.json({ message: "User role updated successfully" });
      } catch (error) {
        res.status(500).json({ message: "Failed to update user role" });
      }
    },
  );

  // Verificar se usuário pode executar ação
  app.get(
    "/api/users/:userId/can/:action",
    requireAuth,
    async (req: AuthenticatedRequest, res) => {
      try {
        const { userId, action } = req.params;
        const { resourceId } = req.query;

        // Usuários só podem verificar suas próprias permissões, exceto admins
        if (req.user?.id !== userId && req.user?.role !== "admin") {
          return res.status(403).json({ message: "Access denied" });
        }

        // This functionality would need proper permission system implementation
        const canPerform = false;

        res.json({ canPerform });
      } catch (error) {
        res.status(500).json({ message: "Failed to check user permissions" });
      }
    },
  );

  // Comments routes
  app.get("/api/comments/:ticketId", async (req, res) => {
    try {
      const comments = await storage.getComments(req.params.ticketId);
      res.json(comments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  app.post(
    "/api/comments",
    requireAuth,
    async (req: AuthenticatedRequest, res) => {
      try {
        const result = insertCommentSchema.safeParse(req.body);
        if (!result.success) {
          return res.status(400).json({
            message: "Invalid comment data",
            errors: result.error.errors,
          });
        }

        const comment = await storage.createComment(result.data);
        res.status(201).json(comment);
      } catch (error) {
        res.status(500).json({ message: "Failed to create comment" });
      }
    },
  );

  app.patch(
    "/api/comments/:id",
    requireAuth,
    async (req: AuthenticatedRequest, res) => {
      try {
        const updates = req.body;
        const comment = await storage.updateComment(req.params.id, updates);
        res.json(comment);
      } catch (error) {
        res.status(500).json({ message: "Failed to update comment" });
      }
    },
  );

  app.delete(
    "/api/comments/:id",
    requireAuth,
    async (req: AuthenticatedRequest, res) => {
      try {
        await storage.deleteComment(req.params.id);
        res.status(204).send();
      } catch (error) {
        res.status(500).json({ message: "Failed to delete comment" });
      }
    },
  );

  // Task Dependencies routes
  app.get("/api/tasks/:taskId/dependencies", async (req, res) => {
    try {
      const dependencies = await storage.getTaskDependencies(req.params.taskId);
      res.json(dependencies);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch task dependencies" });
    }
  });

  app.post(
    "/api/task-dependencies",
    requireAuth,
    async (req: AuthenticatedRequest, res) => {
      try {
        const result = insertTaskDependencySchema.safeParse(req.body);
        if (!result.success) {
          return res.status(400).json({
            message: "Invalid dependency data",
            errors: result.error.errors,
          });
        }

        const isCircular = await storage.checkCircularDependency(
          result.data.taskId,
          result.data.dependsOnTaskId,
        );

        if (isCircular) {
          return res
            .status(400)
            .json({ message: "Circular dependency detected" });
        }

        const dependency = await storage.createTaskDependency(result.data);
        res.status(201).json(dependency);
      } catch (error) {
        res.status(500).json({ message: "Failed to create task dependency" });
      }
    },
  );

  app.delete(
    "/api/task-dependencies/:id",
    requireAuth,
    async (req: AuthenticatedRequest, res) => {
      try {
        await storage.deleteTaskDependency(req.params.id);
        res.status(204).send();
      } catch (error) {
        res.status(500).json({ message: "Failed to delete task dependency" });
      }
    },
  );


  // Endpoint de Busca Global
  app.get("/api/search", async (req, res) => {
    try {
      const { q, type = 'all', limit = '20', offset = '0' } = req.query;

      if (!q || typeof q !== 'string' || q.trim().length < 2) {
        return res.json({ 
          results: [], 
          totalCount: 0, 
          hasMore: false 
        });
      }

      const searchType = ['all', 'projects', 'tickets', 'tasks'].includes(type as string) 
        ? (type as 'all' | 'projects' | 'tickets' | 'tasks') 
        : 'all';

      const limitNum = Math.min(50, Math.max(1, parseInt(limit as string, 10) || 20));
      const offsetNum = Math.max(0, parseInt(offset as string, 10) || 0);

      const searchResults = await storage.globalSearch(
        q.trim(),
        searchType,
        limitNum,
        offsetNum
      );

      res.json(searchResults);
    } catch (error) {
      console.error('Error in /api/search:', error);
      res.status(500).json({ 
        message: "Failed to perform search",
        results: [],
        totalCount: 0,
        hasMore: false
      });
    }
  });

  // Endpoints de Relatórios
  app.get("/api/reports/productivity", async (req, res) => {
    try {
      const { startDate, endDate, userId, projectId } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({ 
          message: "startDate and endDate are required" 
        });
      }

      const start = new Date(startDate as string);
      const end = new Date(endDate as string);

      const report = await storage.getProductivityReport(
        start,
        end,
        userId as string | undefined,
        projectId as string | undefined
      );

      res.json(report);
    } catch (error) {
      console.error('Error in /api/reports/productivity:', error);
      res.status(500).json({ message: "Failed to fetch productivity report" });
    }
  });

  app.get("/api/reports/project-status", async (req, res) => {
    try {
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({ 
          message: "startDate and endDate are required" 
        });
      }

      const start = new Date(startDate as string);
      const end = new Date(endDate as string);

      const report = await storage.getProjectStatusReport(start, end);

      res.json(report);
    } catch (error) {
      console.error('Error in /api/reports/project-status:', error);
      res.status(500).json({ message: "Failed to fetch project status report" });
    }
  });

  app.get("/api/reports/time-tracking", async (req, res) => {
    try {
      const { startDate, endDate, userId, projectId } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({ 
          message: "startDate and endDate are required" 
        });
      }

      const start = new Date(startDate as string);
      const end = new Date(endDate as string);

      const report = await storage.getTimeTrackingReport(
        start,
        end,
        userId as string | undefined,
        projectId as string | undefined
      );

      res.json(report);
    } catch (error) {
      console.error('Error in /api/reports/time-tracking:', error);
      res.status(500).json({ message: "Failed to fetch time tracking report" });
    }
  });

  // Register user management routes
  registerUserRoutes(app);

  const httpServer = createServer(app);
  return httpServer;
}