import { db } from './db';
import { eq, desc, and } from 'drizzle-orm';
import {
  users,
  projects,
  tickets,
  tasks,
  milestones,
  comments,
  taskDependencies,
  notifications,
} from '../shared/schema';
import type {
  User,
  Project,
  Task,
  Ticket,
  Milestone,
  Comment,
  TaskDependency,
  Notification,
  InsertUser,
  InsertProject,
  InsertTask,
  InsertTicket,
  InsertMilestone,
  InsertComment,
  InsertTaskDependency,
  InsertNotification,
  IStorage
} from './storage';

export class DrizzleStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    if (!result[0]) return undefined;
    return {
      ...result[0],
      createdAt: result[0].createdAt.toISOString()
    } as User;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    if (!result[0]) return undefined;
    return {
      ...result[0],
      createdAt: result[0].createdAt.toISOString()
    } as User;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email));
    if (!result[0]) return undefined;
    return {
      ...result[0],
      createdAt: result[0].createdAt.toISOString()
    } as User;
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return {
      ...result[0],
      createdAt: result[0].createdAt.toISOString()
    } as User;
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User> {
    const result = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return {
      ...result[0],
      createdAt: result[0].createdAt.toISOString()
    } as User;
  }

  async deleteUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  async getUsers(): Promise<User[]> {
    const result = await db.select().from(users).orderBy(desc(users.createdAt));
    return result.map(user => ({
      ...user,
      createdAt: user.createdAt.toISOString()
    })) as User[];
  }

  // Projects
  async getProjects(): Promise<Project[]> {
    const result = await db.select().from(projects).orderBy(desc(projects.createdAt));
    return result as Project[];
  }

  async getProject(id: string): Promise<Project | undefined> {
    const result = await db.select().from(projects).where(eq(projects.id, id));
    return result[0] as Project | undefined;
  }

  async createProject(project: InsertProject): Promise<Project> {
    const result = await db.insert(projects).values({
      ...project,
      startDate: new Date(project.startDate),
      endDate: project.endDate ? new Date(project.endDate) : null,
    }).returning();
    return result[0] as Project;
  }

  async updateProject(id: string, updates: Partial<InsertProject>): Promise<Project> {
    const updateData: any = { ...updates };
    if (updates.startDate) {
      updateData.startDate = new Date(updates.startDate);
    }
    if (updates.endDate) {
      updateData.endDate = new Date(updates.endDate);
    }
    
    const result = await db.update(projects).set(updateData).where(eq(projects.id, id)).returning();
    return result[0] as Project;
  }

  async deleteProject(id: string): Promise<void> {
    await db.delete(projects).where(eq(projects.id, id));
  }

  // Tickets
  async getTickets(projectId?: string): Promise<Ticket[]> {
    const query = db.select().from(tickets);
    if (projectId) {
      const result = await query.where(eq(tickets.projectId, projectId)).orderBy(desc(tickets.createdAt));
      return result as Ticket[];
    }
    const result = await query.orderBy(desc(tickets.createdAt));
    return result as Ticket[];
  }

  async getTicket(id: string): Promise<Ticket | undefined> {
    const result = await db.select().from(tickets).where(eq(tickets.id, id));
    return result[0] as Ticket | undefined;
  }

  async createTicket(ticket: InsertTicket): Promise<Ticket> {
    const result = await db.insert(tickets).values(ticket).returning();
    return result[0] as Ticket;
  }

  async updateTicket(id: string, updates: Partial<InsertTicket>): Promise<Ticket> {
    const result = await db.update(tickets).set(updates).where(eq(tickets.id, id)).returning();
    return result[0] as Ticket;
  }

  async deleteTicket(id: string): Promise<void> {
    await db.delete(tickets).where(eq(tickets.id, id));
  }

  // Tasks
  async getTasks(projectId?: string): Promise<Task[]> {
    const query = db.select().from(tasks);
    if (projectId) {
      const result = await query.where(eq(tasks.projectId, projectId)).orderBy(desc(tasks.createdAt));
      return result as Task[];
    }
    const result = await query.orderBy(desc(tasks.createdAt));
    return result as Task[];
  }

  async getTask(id: string): Promise<Task | undefined> {
    const result = await db.select().from(tasks).where(eq(tasks.id, id));
    return result[0] as Task | undefined;
  }

  async createTask(task: InsertTask): Promise<Task> {
    const taskData: any = { ...task };
    if (task.startDate) {
      taskData.startDate = new Date(task.startDate);
    }
    if (task.endDate) {
      taskData.endDate = new Date(task.endDate);
    }
    
    const result = await db.insert(tasks).values(taskData).returning();
    return result[0] as Task;
  }

  async updateTask(id: string, updates: Partial<InsertTask>): Promise<Task> {
    const updateData: any = { ...updates };
    if (updates.startDate) {
      updateData.startDate = new Date(updates.startDate);
    }
    if (updates.endDate) {
      updateData.endDate = new Date(updates.endDate);
    }
    
    const result = await db.update(tasks).set(updateData).where(eq(tasks.id, id)).returning();
    return result[0] as Task;
  }

  async deleteTask(id: string): Promise<void> {
    await db.delete(tasks).where(eq(tasks.id, id));
  }

  // Milestones
  async getMilestones(projectId?: string): Promise<Milestone[]> {
    const query = db.select().from(milestones);
    if (projectId) {
      const result = await query.where(eq(milestones.projectId, projectId)).orderBy(desc(milestones.createdAt));
      return result as Milestone[];
    }
    const result = await query.orderBy(desc(milestones.createdAt));
    return result as Milestone[];
  }

  async createMilestone(milestone: InsertMilestone): Promise<Milestone> {
    const result = await db.insert(milestones).values({
      ...milestone,
      dueDate: new Date(milestone.dueDate),
    }).returning();
    return result[0] as Milestone;
  }

  // Comments
  async getComments(ticketId: string): Promise<Comment[]> {
    const result = await db.select().from(comments).where(eq(comments.ticketId, ticketId)).orderBy(desc(comments.createdAt));
    return result as Comment[];
  }

  async createComment(comment: InsertComment): Promise<Comment> {
    const result = await db.insert(comments).values(comment).returning();
    return result[0] as Comment;
  }

  async updateComment(id: string, updates: Partial<InsertComment>): Promise<Comment> {
    const result = await db.update(comments).set(updates).where(eq(comments.id, id)).returning();
    return result[0] as Comment;
  }

  async deleteComment(id: string): Promise<void> {
    await db.delete(comments).where(eq(comments.id, id));
  }

  // Task Dependencies
  async getTaskDependencies(taskId: string): Promise<TaskDependency[]> {
    const result = await db.select().from(taskDependencies).where(eq(taskDependencies.taskId, taskId)).orderBy(desc(taskDependencies.createdAt));
    return result as TaskDependency[];
  }

  async createTaskDependency(dependency: InsertTaskDependency): Promise<TaskDependency> {
    const result = await db.insert(taskDependencies).values(dependency).returning();
    return result[0] as TaskDependency;
  }

  async deleteTaskDependency(id: string): Promise<void> {
    await db.delete(taskDependencies).where(eq(taskDependencies.id, id));
  }

  // Notifications
  async getNotifications(userId: string): Promise<Notification[]> {
    const result = await db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt));
    return result as Notification[];
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const result = await db.insert(notifications).values(notification).returning();
    return result[0] as Notification;
  }

  async markNotificationAsRead(id: string): Promise<void> {
    await db.update(notifications).set({ read: true }).where(eq(notifications.id, id));
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    await db.update(notifications).set({ read: true }).where(eq(notifications.userId, userId));
  }

  async deleteNotification(id: string): Promise<void> {
    await db.delete(notifications).where(eq(notifications.id, id));
  }

  // Dashboard stats
  async getDashboardStats(): Promise<{
    activeProjects: number;
    openTickets: number;
    completedTasks: number;
    teamMembers: number;
  }> {
    const [activeProjectsResult] = await db.select({ count: projects.id }).from(projects).where(eq(projects.status, 'in_progress'));
    const [openTicketsResult] = await db.select({ count: tickets.id }).from(tickets).where(eq(tickets.status, 'open'));
    const [completedTasksResult] = await db.select({ count: tasks.id }).from(tasks).where(eq(tasks.status, 'completed'));
    const [teamMembersResult] = await db.select({ count: users.id }).from(users);

    // Count the actual results since Drizzle doesn't have a direct count function in this context
    const activeProjectsCount = await db.select().from(projects).where(eq(projects.status, 'in_progress'));
    const openTicketsCount = await db.select().from(tickets).where(eq(tickets.status, 'open'));
    const completedTasksCount = await db.select().from(tasks).where(eq(tasks.status, 'completed'));
    const teamMembersCount = await db.select().from(users);

    return {
      activeProjects: activeProjectsCount.length,
      openTickets: openTicketsCount.length,
      completedTasks: completedTasksCount.length,
      teamMembers: teamMembersCount.length,
    };
  }
}

// Export a singleton instance
export const drizzleStorage = new DrizzleStorage();