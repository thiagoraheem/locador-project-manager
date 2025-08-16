import { 
  users, projects, tickets, tasks, milestones, comments, taskDependencies, notifications,
  type SelectUser as User, type InsertUser,
  type SelectProject as Project, type InsertProject,
  type SelectTicket as Ticket, type InsertTicket,
  type SelectTask as Task, type InsertTask,
  type SelectMilestone as Milestone, type InsertMilestone,
  type SelectComment as Comment, type InsertComment,
  type SelectTaskDependency as TaskDependency, type InsertTaskDependency,
  type SelectNotification as Notification, type InsertNotification
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, count, sql } from "drizzle-orm";

// Storage interface definition
export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<InsertUser>): Promise<User>;
  deleteUser(id: string): Promise<void>;
  getUsers(): Promise<User[]>;
  
  // Projects
  getProjects(): Promise<Project[]>;
  getProject(id: string): Promise<Project | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: string, updates: Partial<InsertProject>): Promise<Project>;
  deleteProject(id: string): Promise<void>;
  
  // Tickets
  getTickets(projectId?: string): Promise<Ticket[]>;
  getTicket(id: string): Promise<Ticket | undefined>;
  createTicket(ticket: InsertTicket): Promise<Ticket>;
  updateTicket(id: string, updates: Partial<InsertTicket>): Promise<Ticket>;
  deleteTicket(id: string): Promise<void>;
  
  // Tasks
  getTasks(projectId?: string): Promise<Task[]>;
  getTask(id: string): Promise<Task | undefined>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: string, updates: Partial<InsertTask>): Promise<Task>;
  deleteTask(id: string): Promise<void>;
  
  // Milestones
  getMilestones(projectId?: string): Promise<Milestone[]>;
  createMilestone(milestone: InsertMilestone): Promise<Milestone>;
  
  // Comments
  getComments(ticketId: string): Promise<Comment[]>;
  createComment(comment: InsertComment): Promise<Comment>;
  updateComment(id: string, updates: Partial<InsertComment>): Promise<Comment>;
  deleteComment(id: string): Promise<void>;
  
  // Task Dependencies
  getTaskDependencies(taskId: string): Promise<TaskDependency[]>;
  createTaskDependency(dependency: InsertTaskDependency): Promise<TaskDependency>;
  deleteTaskDependency(id: string): Promise<void>;
  checkCircularDependency(taskId: string, dependsOnTaskId: string): Promise<boolean>;
  
  // Notifications
  getNotifications(userId: string): Promise<Notification[]>;
  getUnreadNotifications(userId: string): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: string): Promise<void>;
  markAllNotificationsAsRead(userId: string): Promise<void>;
  deleteNotification(id: string): Promise<void>;
  
  // Dashboard Stats
  getDashboardStats(): Promise<{
    activeProjects: number;
    openTickets: number;
    completedTasks: number;
    teamMembers: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  async deleteUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  async getUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  // Projects
  async getProjects(): Promise<Project[]> {
    return await db.select().from(projects);
  }

  async getProject(id: string): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project || undefined;
  }

  async createProject(project: InsertProject): Promise<Project> {
    // Generate a simple UUID for SQLite compatibility
    const id = 'proj_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
    const projectWithId = {
      ...project,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const [newProject] = await db
      .insert(projects)
      .values(projectWithId)
      .returning();
    return newProject;
  }

  async updateProject(id: string, updates: Partial<InsertProject>): Promise<Project> {
    const [updatedProject] = await db
      .update(projects)
      .set({ ...updates, updatedAt: new Date().toISOString() })
      .where(eq(projects.id, id))
      .returning();
    return updatedProject;
  }

  async deleteProject(id: string): Promise<void> {
    await db.delete(projects).where(eq(projects.id, id));
  }

  // Tickets
  async getTickets(projectId?: string): Promise<Ticket[]> {
    if (projectId) {
      return await db.select().from(tickets).where(eq(tickets.projectId, projectId));
    }
    return await db.select().from(tickets);
  }

  async getTicket(id: string): Promise<Ticket | undefined> {
    const [ticket] = await db.select().from(tickets).where(eq(tickets.id, id));
    return ticket || undefined;
  }

  async createTicket(ticket: InsertTicket): Promise<Ticket> {
    // Generate a simple UUID for SQLite compatibility
    const id = 'tick_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
    const ticketWithId = {
      ...ticket,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const [newTicket] = await db
      .insert(tickets)
      .values(ticketWithId)
      .returning();
    return newTicket;
  }

  async updateTicket(id: string, updates: Partial<InsertTicket>): Promise<Ticket> {
    const [updatedTicket] = await db
      .update(tickets)
      .set({ ...updates, updatedAt: new Date().toISOString() })
      .where(eq(tickets.id, id))
      .returning();
    return updatedTicket;
  }

  async deleteTicket(id: string): Promise<void> {
    await db.delete(tickets).where(eq(tickets.id, id));
  }

  // Tasks
  async getTasks(projectId?: string): Promise<Task[]> {
    if (projectId) {
      return await db.select().from(tasks).where(eq(tasks.projectId, projectId));
    }
    return await db.select().from(tasks);
  }

  async getTask(id: string): Promise<Task | undefined> {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
    return task || undefined;
  }

  async createTask(task: InsertTask): Promise<Task> {
    // Generate a simple UUID for SQLite compatibility
    const id = 'task_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
    const taskWithId = {
      ...task,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const [newTask] = await db
      .insert(tasks)
      .values(taskWithId)
      .returning();
    return newTask;
  }

  async updateTask(id: string, updates: Partial<InsertTask>): Promise<Task> {
    const [updatedTask] = await db
      .update(tasks)
      .set({ ...updates, updatedAt: new Date().toISOString() })
      .where(eq(tasks.id, id))
      .returning();
    return updatedTask;
  }

  async deleteTask(id: string): Promise<void> {
    await db.delete(tasks).where(eq(tasks.id, id));
  }

  // Milestones
  async getMilestones(projectId?: string): Promise<Milestone[]> {
    if (projectId) {
      return await db.select().from(milestones).where(eq(milestones.projectId, projectId));
    }
    return await db.select().from(milestones);
  }

  async createMilestone(milestone: InsertMilestone): Promise<Milestone> {
    // Generate a simple UUID for SQLite compatibility
    const id = 'mile_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
    const milestoneWithId = {
      ...milestone,
      id,
      createdAt: new Date().toISOString()
    };
    
    const [newMilestone] = await db
      .insert(milestones)
      .values(milestoneWithId)
      .returning();
    return newMilestone;
  }

  // Dashboard Stats
  async getDashboardStats() {
    const [activeProjectsResult] = await db
      .select({ count: count() })
      .from(projects)
      .where(sql`${projects.status} IN ('planning', 'in_progress', 'review')`);
    
    const [openTicketsResult] = await db
      .select({ count: count() })
      .from(tickets)
      .where(eq(tickets.status, 'open'));
    
    const [completedTasksResult] = await db
      .select({ count: count() })
      .from(tasks)
      .where(eq(tasks.status, 'completed'));
    
    const [teamMembersResult] = await db
      .select({ count: count() })
      .from(users);

    return {
      activeProjects: activeProjectsResult.count,
      openTickets: openTicketsResult.count,
      completedTasks: completedTasksResult.count,
      teamMembers: teamMembersResult.count,
    };
  }

  // Comments
  async getComments(ticketId: string): Promise<Comment[]> {
    return await db.select().from(comments).where(eq(comments.ticketId, ticketId));
  }

  async createComment(comment: InsertComment): Promise<Comment> {
    // Generate a simple UUID for SQLite compatibility
    const id = 'comm_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
    const commentWithId = {
      ...comment,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const [newComment] = await db
      .insert(comments)
      .values(commentWithId)
      .returning();
    return newComment;
  }

  async updateComment(id: string, updates: Partial<InsertComment>): Promise<Comment> {
    const [updatedComment] = await db
      .update(comments)
      .set({ ...updates, updatedAt: new Date().toISOString() })
      .where(eq(comments.id, id))
      .returning();
    return updatedComment;
  }

  async deleteComment(id: string): Promise<void> {
    await db.delete(comments).where(eq(comments.id, id));
  }

  // Task Dependencies
  async getTaskDependencies(taskId: string): Promise<TaskDependency[]> {
    return await db.select().from(taskDependencies).where(eq(taskDependencies.taskId, taskId));
  }

  async createTaskDependency(dependency: InsertTaskDependency): Promise<TaskDependency> {
    // Generate a simple UUID for SQLite compatibility
    const id = 'dep_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
    const dependencyWithId = {
      ...dependency,
      id,
      createdAt: new Date().toISOString()
    };
    
    const [newDependency] = await db
      .insert(taskDependencies)
      .values(dependencyWithId)
      .returning();
    return newDependency;
  }

  async deleteTaskDependency(id: string): Promise<void> {
    await db.delete(taskDependencies).where(eq(taskDependencies.id, id));
  }

  async checkCircularDependency(taskId: string, dependsOnTaskId: string): Promise<boolean> {
    // Simple check - for a full implementation, we'd need recursive checking
    const existingDependency = await db
      .select()
      .from(taskDependencies)
      .where(
        and(
          eq(taskDependencies.taskId, dependsOnTaskId),
          eq(taskDependencies.dependsOnTaskId, taskId)
        )
      );
    return existingDependency.length > 0;
  }

  // Notifications
  async getNotifications(userId: string): Promise<Notification[]> {
    return await db.select().from(notifications).where(eq(notifications.userId, userId));
  }

  async getUnreadNotifications(userId: string): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.read, false)
        )
      );
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    // Generate a simple UUID for SQLite compatibility
    const id = 'notif_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
    const notificationWithId = {
      ...notification,
      id,
      createdAt: new Date().toISOString()
    };
    
    const [newNotification] = await db
      .insert(notifications)
      .values(notificationWithId)
      .returning();
    return newNotification;
  }

  async markNotificationAsRead(id: string): Promise<void> {
    await db
      .update(notifications)
      .set({ read: true })
      .where(eq(notifications.id, id));
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    await db
      .update(notifications)
      .set({ read: true })
      .where(eq(notifications.userId, userId));
  }

  async deleteNotification(id: string): Promise<void> {
    await db.delete(notifications).where(eq(notifications.id, id));
  }
}

// Export storage instance
export const storage = new DatabaseStorage();