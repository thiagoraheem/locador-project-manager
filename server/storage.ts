import { drizzleStorage } from "./storage-drizzle";

// Type definitions
export interface User {
  id: string;
  username: string;
  password: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  status: string;
  startDate: string;
  endDate?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  projectId: string;
  assigneeId?: string;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Ticket {
  id: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  projectId?: string;
  reporterId: string;
  assigneeId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Milestone {
  id: string;
  title: string;
  description?: string;
  dueDate: string;
  projectId: string;
  completed: boolean;
  createdAt: string;
}

export interface Comment {
  id: string;
  content: string;
  ticketId: string;
  authorId: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaskDependency {
  id: string;
  taskId: string;
  dependsOnTaskId: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  userId: string;
  entityType?: string;
  entityId?: string;
  read: boolean;
  createdAt: string;
}

// Insert types
export type InsertUser = Omit<User, 'id' | 'createdAt'>;
export type InsertProject = Omit<Project, 'id' | 'createdAt' | 'updatedAt'>;
export type InsertTask = Omit<Task, 'id' | 'createdAt' | 'updatedAt'>;
export type InsertTicket = Omit<Ticket, 'id' | 'createdAt' | 'updatedAt'>;
export type InsertMilestone = Omit<Milestone, 'id' | 'createdAt'>;
export type InsertComment = Omit<Comment, 'id' | 'createdAt' | 'updatedAt'>;
export type InsertTaskDependency = Omit<TaskDependency, 'id' | 'createdAt'>;
export type InsertNotification = Omit<Notification, 'id' | 'createdAt'>;

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
  
  // Notifications
  getNotifications(userId: string): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: string): Promise<void>;
  markAllNotificationsAsRead(userId: string): Promise<void>;
  deleteNotification(id: string): Promise<void>;
  
  // Dashboard stats
  getDashboardStats(): Promise<{
    activeProjects: number;
    openTickets: number;
    completedTasks: number;
    teamMembers: number;
  }>;
}

// Export the Drizzle storage as the main storage
export const storage = drizzleStorage;