import { 
  users, projects, tickets, tasks, milestones,
  type User, type InsertUser,
  type Project, type InsertProject,
  type Ticket, type InsertTicket,
  type Task, type InsertTask,
  type Milestone, type InsertMilestone
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, count, sql } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
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

  // Projects
  async getProjects(): Promise<Project[]> {
    return await db.select().from(projects).orderBy(desc(projects.createdAt));
  }

  async getProject(id: string): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project || undefined;
  }

  async createProject(project: InsertProject): Promise<Project> {
    const [newProject] = await db
      .insert(projects)
      .values(project)
      .returning();
    return newProject;
  }

  async updateProject(id: string, updates: Partial<InsertProject>): Promise<Project> {
    const [updatedProject] = await db
      .update(projects)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(projects.id, id))
      .returning();
    return updatedProject;
  }

  async deleteProject(id: string): Promise<void> {
    await db.delete(projects).where(eq(projects.id, id));
  }

  // Tickets
  async getTickets(projectId?: string): Promise<Ticket[]> {
    const query = db.select().from(tickets).orderBy(desc(tickets.createdAt));
    if (projectId) {
      return await query.where(eq(tickets.projectId, projectId));
    }
    return await query;
  }

  async getTicket(id: string): Promise<Ticket | undefined> {
    const [ticket] = await db.select().from(tickets).where(eq(tickets.id, id));
    return ticket || undefined;
  }

  async createTicket(ticket: InsertTicket): Promise<Ticket> {
    const [newTicket] = await db
      .insert(tickets)
      .values(ticket)
      .returning();
    return newTicket;
  }

  async updateTicket(id: string, updates: Partial<InsertTicket>): Promise<Ticket> {
    const [updatedTicket] = await db
      .update(tickets)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(tickets.id, id))
      .returning();
    return updatedTicket;
  }

  async deleteTicket(id: string): Promise<void> {
    await db.delete(tickets).where(eq(tickets.id, id));
  }

  // Tasks
  async getTasks(projectId?: string): Promise<Task[]> {
    const query = db.select().from(tasks).orderBy(desc(tasks.createdAt));
    if (projectId) {
      return await query.where(eq(tasks.projectId, projectId));
    }
    return await query;
  }

  async getTask(id: string): Promise<Task | undefined> {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
    return task || undefined;
  }

  async createTask(task: InsertTask): Promise<Task> {
    const [newTask] = await db
      .insert(tasks)
      .values(task)
      .returning();
    return newTask;
  }

  async updateTask(id: string, updates: Partial<InsertTask>): Promise<Task> {
    const [updatedTask] = await db
      .update(tasks)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(tasks.id, id))
      .returning();
    return updatedTask;
  }

  async deleteTask(id: string): Promise<void> {
    await db.delete(tasks).where(eq(tasks.id, id));
  }

  // Milestones
  async getMilestones(projectId?: string): Promise<Milestone[]> {
    const query = db.select().from(milestones).orderBy(milestones.dueDate);
    if (projectId) {
      return await query.where(eq(milestones.projectId, projectId));
    }
    return await query;
  }

  async createMilestone(milestone: InsertMilestone): Promise<Milestone> {
    const [newMilestone] = await db
      .insert(milestones)
      .values(milestone)
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
}

export const storage = new DatabaseStorage();
