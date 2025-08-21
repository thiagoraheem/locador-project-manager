import { db } from "./db";
import sql from 'mssql';

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

export interface TaskType {
  id: string;
  name: string;
  description?: string;
  color: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  taskTypeId?: string;
  projectId: string;
  assigneeId?: string;
  startDate?: string;
  endDate?: string;
  expectedEndDate?: string;
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
export type InsertTaskType = Omit<TaskType, 'id' | 'createdAt' | 'updatedAt'>;
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
  
  // Task Types
  getTaskTypes(): Promise<TaskType[]>;
  getTaskType(id: string): Promise<TaskType | undefined>;
  createTaskType(taskType: InsertTaskType): Promise<TaskType>;
  updateTaskType(id: string, updates: Partial<InsertTaskType>): Promise<TaskType>;
  deleteTaskType(id: string): Promise<void>;
  
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

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    if (!db) throw new Error('Database not connected');
    const result = await db.request()
      .input('id', sql.NVarChar, id)
      .query('SELECT * FROM users WHERE id = @id');
    return result.recordset[0] || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    if (!db) throw new Error('Database not connected');
    const result = await db.request()
      .input('username', sql.NVarChar, username)
      .query('SELECT * FROM users WHERE username = @username');
    return result.recordset[0] || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    if (!db) throw new Error('Database not connected');
    const id = 'user-' + Math.random().toString(36).substr(2, 9);
    const result = await db.request()
      .input('id', sql.NVarChar, id)
      .input('username', sql.NVarChar, insertUser.username)
      .input('password', sql.NVarChar, insertUser.password)
      .input('name', sql.NVarChar, insertUser.name)
      .input('email', sql.NVarChar, insertUser.email)
      .input('role', sql.NVarChar, insertUser.role)
      .query(`
        INSERT INTO users (id, username, password, name, email, role)
        VALUES (@id, @username, @password, @name, @email, @role);
        SELECT * FROM users WHERE id = @id;
      `);
    return result.recordset[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    if (!db) throw new Error('Database not connected');
    const result = await db.request()
      .input('email', sql.NVarChar, email)
      .query('SELECT * FROM users WHERE email = @email');
    return result.recordset[0] || undefined;
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User> {
    if (!db) throw new Error('Database not connected');
    const updateFields = Object.keys(updates).map(key => `${key} = @${key}`).join(', ');
    const request = db.request().input('id', sql.NVarChar, id);
    
    for (const [key, value] of Object.entries(updates)) {
      request.input(key, sql.NVarChar, value);
    }
    
    const result = await request.query(`
      UPDATE users SET ${updateFields} WHERE id = @id;
      SELECT * FROM users WHERE id = @id;
    `);
    return result.recordset[0];
  }

  async deleteUser(id: string): Promise<void> {
    if (!db) throw new Error('Database not connected');
    await db.request()
      .input('id', sql.NVarChar, id)
      .query('DELETE FROM users WHERE id = @id');
  }

  async getUsers(): Promise<User[]> {
    if (!db) throw new Error('Database not connected');
    const result = await db.request().query('SELECT * FROM users');
    return result.recordset;
  }

  // Projects
  async getProjects(): Promise<Project[]> {
    if (!db) throw new Error('Database not connected');
    const result = await db.request().query('SELECT * FROM projects ORDER BY created_at DESC');
    return result.recordset;
  }

  async getProject(id: string): Promise<Project | undefined> {
    if (!db) throw new Error('Database not connected');
    const result = await db.request()
      .input('id', sql.NVarChar, id)
      .query('SELECT * FROM projects WHERE id = @id');
    return result.recordset[0] || undefined;
  }

  async createProject(insertProject: InsertProject): Promise<Project> {
    if (!db) throw new Error('Database not connected');
    const id = 'proj_' + Math.random().toString(36).substr(2, 15);
    const result = await db.request()
      .input('id', sql.NVarChar, id)
      .input('name', sql.NVarChar, insertProject.name)
      .input('description', sql.NVarChar, insertProject.description || null)
      .input('status', sql.NVarChar, insertProject.status)
      .input('startDate', sql.DateTime2, new Date(insertProject.startDate))
      .input('endDate', sql.DateTime2, insertProject.endDate ? new Date(insertProject.endDate) : null)
      .input('createdBy', sql.NVarChar, insertProject.createdBy)
      .query(`
        INSERT INTO projects (id, name, description, status, start_date, end_date, created_by)
        VALUES (@id, @name, @description, @status, @startDate, @endDate, @createdBy);
        SELECT * FROM projects WHERE id = @id;
      `);
    return result.recordset[0];
  }

  async updateProject(id: string, updates: Partial<InsertProject>): Promise<Project> {
    if (!db) throw new Error('Database not connected');
    const updateFields = [];
    const request = db.request().input('id', sql.NVarChar, id);
    
    for (const [key, value] of Object.entries(updates)) {
      if (key === 'startDate' || key === 'endDate') {
        updateFields.push(`${key === 'startDate' ? 'start_date' : 'end_date'} = @${key}`);
        request.input(key, sql.DateTime2, value ? new Date(value) : null);
      } else {
        updateFields.push(`${key} = @${key}`);
        request.input(key, sql.NVarChar, value);
      }
    }
    
    if (updateFields.length > 0) {
      updateFields.push('updated_at = GETUTCDATE()');
      const result = await request.query(`
        UPDATE projects SET ${updateFields.join(', ')} WHERE id = @id;
        SELECT * FROM projects WHERE id = @id;
      `);
      return result.recordset[0];
    }
    
    const result = await request.query('SELECT * FROM projects WHERE id = @id');
    return result.recordset[0];
  }

  async deleteProject(id: string): Promise<void> {
    if (!db) throw new Error('Database not connected');
    await db.request()
      .input('id', sql.NVarChar, id)
      .query('DELETE FROM projects WHERE id = @id');
  }

  // Tasks
  async getTasks(projectId?: string): Promise<Task[]> {
    if (!db) throw new Error('Database not connected');
    let query = 'SELECT * FROM tasks';
    const request = db.request();
    
    if (projectId) {
      query += ' WHERE project_id = @projectId';
      request.input('projectId', sql.NVarChar, projectId);
    }
    
    query += ' ORDER BY created_at DESC';
    const result = await request.query(query);
    return result.recordset;
  }

  async getTask(id: string): Promise<Task | undefined> {
    if (!db) throw new Error('Database not connected');
    const result = await db.request()
      .input('id', sql.NVarChar, id)
      .query('SELECT * FROM tasks WHERE id = @id');
    return result.recordset[0] || undefined;
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    if (!db) throw new Error('Database not connected');
    const id = 'task_' + Math.random().toString(36).substr(2, 15);
    const result = await db.request()
      .input('id', sql.NVarChar, id)
      .input('title', sql.NVarChar, insertTask.title)
      .input('description', sql.NVarChar, insertTask.description || null)
      .input('status', sql.NVarChar, insertTask.status)
      .input('priority', sql.NVarChar, insertTask.priority)
      .input('projectId', sql.NVarChar, insertTask.projectId)
      .input('assigneeId', sql.NVarChar, insertTask.assigneeId || null)
      .input('startDate', sql.DateTime2, insertTask.startDate ? new Date(insertTask.startDate) : null)
      .input('endDate', sql.DateTime2, insertTask.endDate ? new Date(insertTask.endDate) : null)
      .query(`
        INSERT INTO tasks (id, title, description, status, priority, project_id, assignee_id, start_date, end_date)
        VALUES (@id, @title, @description, @status, @priority, @projectId, @assigneeId, @startDate, @endDate);
        SELECT * FROM tasks WHERE id = @id;
      `);
    return result.recordset[0];
  }

  async updateTask(id: string, updates: Partial<InsertTask>): Promise<Task> {
    if (!db) throw new Error('Database not connected');
    const updateFields = [];
    const request = db.request().input('id', sql.NVarChar, id);
    
    for (const [key, value] of Object.entries(updates)) {
      if (key === 'startDate' || key === 'endDate') {
        updateFields.push(`${key === 'startDate' ? 'start_date' : 'end_date'} = @${key}`);
        request.input(key, sql.DateTime2, value ? new Date(value) : null);
      } else if (key === 'projectId') {
        updateFields.push('project_id = @projectId');
        request.input('projectId', sql.NVarChar, value);
      } else if (key === 'assigneeId') {
        updateFields.push('assignee_id = @assigneeId');
        request.input('assigneeId', sql.NVarChar, value);
      } else {
        updateFields.push(`${key} = @${key}`);
        request.input(key, sql.NVarChar, value);
      }
    }
    
    if (updateFields.length > 0) {
      updateFields.push('updated_at = GETUTCDATE()');
      const result = await request.query(`
        UPDATE tasks SET ${updateFields.join(', ')} WHERE id = @id;
        SELECT * FROM tasks WHERE id = @id;
      `);
      return result.recordset[0];
    }
    
    const result = await request.query('SELECT * FROM tasks WHERE id = @id');
    return result.recordset[0];
  }

  async deleteTask(id: string): Promise<void> {
    if (!db) throw new Error('Database not connected');
    await db.request()
      .input('id', sql.NVarChar, id)
      .query('DELETE FROM tasks WHERE id = @id');
  }

  // Tickets
  async getTickets(projectId?: string): Promise<Ticket[]> {
    if (!db) throw new Error('Database not connected');
    let query = 'SELECT * FROM tickets';
    const request = db.request();
    
    if (projectId) {
      query += ' WHERE project_id = @projectId';
      request.input('projectId', sql.NVarChar, projectId);
    }
    
    query += ' ORDER BY created_at DESC';
    const result = await request.query(query);
    return result.recordset;
  }

  async getTicket(id: string): Promise<Ticket | undefined> {
    if (!db) throw new Error('Database not connected');
    const result = await db.request()
      .input('id', sql.NVarChar, id)
      .query('SELECT * FROM tickets WHERE id = @id');
    return result.recordset[0] || undefined;
  }

  async createTicket(insertTicket: InsertTicket): Promise<Ticket> {
    if (!db) throw new Error('Database not connected');
    const id = 'ticket_' + Math.random().toString(36).substr(2, 15);
    const result = await db.request()
      .input('id', sql.NVarChar, id)
      .input('title', sql.NVarChar, insertTicket.title)
      .input('description', sql.NVarChar, insertTicket.description)
      .input('priority', sql.NVarChar, insertTicket.priority)
      .input('status', sql.NVarChar, insertTicket.status)
      .input('projectId', sql.NVarChar, insertTicket.projectId || null)
      .input('reporterId', sql.NVarChar, insertTicket.reporterId)
      .input('assigneeId', sql.NVarChar, insertTicket.assigneeId || null)
      .query(`
        INSERT INTO tickets (id, title, description, priority, status, project_id, reporter_id, assignee_id)
        VALUES (@id, @title, @description, @priority, @status, @projectId, @reporterId, @assigneeId);
        SELECT * FROM tickets WHERE id = @id;
      `);
    return result.recordset[0];
  }

  async updateTicket(id: string, updates: Partial<InsertTicket>): Promise<Ticket> {
    if (!db) throw new Error('Database not connected');
    const updateFields = [];
    const request = db.request().input('id', sql.NVarChar, id);
    
    for (const [key, value] of Object.entries(updates)) {
      if (key === 'projectId') {
        updateFields.push('project_id = @projectId');
        request.input('projectId', sql.NVarChar, value);
      } else if (key === 'reporterId') {
        updateFields.push('reporter_id = @reporterId');
        request.input('reporterId', sql.NVarChar, value);
      } else if (key === 'assigneeId') {
        updateFields.push('assignee_id = @assigneeId');
        request.input('assigneeId', sql.NVarChar, value);
      } else {
        updateFields.push(`${key} = @${key}`);
        request.input(key, sql.NVarChar, value);
      }
    }
    
    if (updateFields.length > 0) {
      updateFields.push('updated_at = GETUTCDATE()');
      const result = await request.query(`
        UPDATE tickets SET ${updateFields.join(', ')} WHERE id = @id;
        SELECT * FROM tickets WHERE id = @id;
      `);
      return result.recordset[0];
    }
    
    const result = await request.query('SELECT * FROM tickets WHERE id = @id');
    return result.recordset[0];
  }

  async deleteTicket(id: string): Promise<void> {
    if (!db) throw new Error('Database not connected');
    await db.request()
      .input('id', sql.NVarChar, id)
      .query('DELETE FROM tickets WHERE id = @id');
  }

  // Milestones
  async getMilestones(projectId?: string): Promise<Milestone[]> {
    if (!db) throw new Error('Database not connected');
    // Note: Milestones table doesn't exist in current schema, returning empty array
    return [];
  }

  async createMilestone(milestone: InsertMilestone): Promise<Milestone> {
    if (!db) throw new Error('Database not connected');
    // Note: Milestones table doesn't exist in current schema, throwing error
    throw new Error('Milestones not implemented');
  }

  // Comments
  async getComments(ticketId: string): Promise<Comment[]> {
    if (!db) throw new Error('Database not connected');
    const result = await db.request()
      .input('ticketId', sql.NVarChar, ticketId)
      .query('SELECT * FROM comments WHERE ticket_id = @ticketId ORDER BY created_at ASC');
    return result.recordset;
  }

  async createComment(insertComment: InsertComment): Promise<Comment> {
    if (!db) throw new Error('Database not connected');
    const id = 'comment_' + Math.random().toString(36).substr(2, 15);
    const result = await db.request()
      .input('id', sql.NVarChar, id)
      .input('content', sql.NVarChar, insertComment.content)
      .input('ticketId', sql.NVarChar, insertComment.ticketId)
      .input('authorId', sql.NVarChar, insertComment.authorId)
      .query(`
        INSERT INTO comments (id, content, ticket_id, author_id)
        VALUES (@id, @content, @ticketId, @authorId);
        SELECT * FROM comments WHERE id = @id;
      `);
    return result.recordset[0];
  }

  async updateComment(id: string, updates: Partial<InsertComment>): Promise<Comment> {
    if (!db) throw new Error('Database not connected');
    const updateFields = [];
    const request = db.request().input('id', sql.NVarChar, id);
    
    for (const [key, value] of Object.entries(updates)) {
      if (key === 'ticketId') {
        updateFields.push('ticket_id = @ticketId');
        request.input('ticketId', sql.NVarChar, value);
      } else if (key === 'authorId') {
        updateFields.push('author_id = @authorId');
        request.input('authorId', sql.NVarChar, value);
      } else {
        updateFields.push(`${key} = @${key}`);
        request.input(key, sql.NVarChar, value);
      }
    }
    
    if (updateFields.length > 0) {
      updateFields.push('updated_at = GETUTCDATE()');
      const result = await request.query(`
        UPDATE comments SET ${updateFields.join(', ')} WHERE id = @id;
        SELECT * FROM comments WHERE id = @id;
      `);
      return result.recordset[0];
    }
    
    const result = await request.query('SELECT * FROM comments WHERE id = @id');
    return result.recordset[0];
  }

  async deleteComment(id: string): Promise<void> {
    if (!db) throw new Error('Database not connected');
    await db.request()
      .input('id', sql.NVarChar, id)
      .query('DELETE FROM comments WHERE id = @id');
  }

  // Task Dependencies
  async getTaskDependencies(taskId: string): Promise<TaskDependency[]> {
    if (!db) throw new Error('Database not connected');
    const result = await db.request()
      .input('taskId', sql.NVarChar, taskId)
      .query('SELECT * FROM task_dependencies WHERE task_id = @taskId');
    return result.recordset;
  }

  async createTaskDependency(dependency: InsertTaskDependency): Promise<TaskDependency> {
    if (!db) throw new Error('Database not connected');
    const id = 'dep_' + Math.random().toString(36).substr(2, 15);
    const result = await db.request()
      .input('id', sql.NVarChar, id)
      .input('taskId', sql.NVarChar, dependency.taskId)
      .input('dependsOnTaskId', sql.NVarChar, dependency.dependsOnTaskId)
      .query(`
        INSERT INTO task_dependencies (id, task_id, depends_on_task_id)
        VALUES (@id, @taskId, @dependsOnTaskId);
        SELECT * FROM task_dependencies WHERE id = @id;
      `);
    return result.recordset[0];
  }

  async deleteTaskDependency(id: string): Promise<void> {
    if (!db) throw new Error('Database not connected');
    await db.request()
      .input('id', sql.NVarChar, id)
      .query('DELETE FROM task_dependencies WHERE id = @id');
  }

  // Notifications
  async getNotifications(userId: string): Promise<Notification[]> {
    if (!db) throw new Error('Database not connected');
    const result = await db.request()
      .input('userId', sql.NVarChar, userId)
      .query('SELECT * FROM notifications WHERE user_id = @userId ORDER BY created_at DESC');
    return result.recordset;
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    if (!db) throw new Error('Database not connected');
    const id = 'notif_' + Math.random().toString(36).substr(2, 15);
    const result = await db.request()
      .input('id', sql.NVarChar, id)
      .input('type', sql.NVarChar, notification.type)
      .input('title', sql.NVarChar, notification.title)
      .input('message', sql.NVarChar, notification.message)
      .input('userId', sql.NVarChar, notification.userId)
      .input('entityType', sql.NVarChar, notification.entityType || null)
      .input('entityId', sql.NVarChar, notification.entityId || null)
      .input('read', sql.Bit, notification.read)
      .query(`
        INSERT INTO notifications (id, type, title, message, user_id, entity_type, entity_id, [read])
        VALUES (@id, @type, @title, @message, @userId, @entityType, @entityId, @read);
        SELECT * FROM notifications WHERE id = @id;
      `);
    return result.recordset[0];
  }

  async markNotificationAsRead(id: string): Promise<void> {
    if (!db) throw new Error('Database not connected');
    await db.request()
      .input('id', sql.NVarChar, id)
      .query('UPDATE notifications SET [read] = 1 WHERE id = @id');
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    if (!db) throw new Error('Database not connected');
    await db.request()
      .input('userId', sql.NVarChar, userId)
      .query('UPDATE notifications SET [read] = 1 WHERE user_id = @userId');
  }

  async deleteNotification(id: string): Promise<void> {
    if (!db) throw new Error('Database not connected');
    await db.request()
      .input('id', sql.NVarChar, id)
      .query('DELETE FROM notifications WHERE id = @id');
  }

  // Additional methods needed by routes
  async getUnreadNotifications(userId: string): Promise<Notification[]> {
    if (!db) throw new Error('Database not connected');
    const result = await db.request()
      .input('userId', sql.NVarChar, userId)
      .query('SELECT * FROM notifications WHERE user_id = @userId AND [read] = 0 ORDER BY created_at DESC');
    return result.recordset;
  }

  async checkCircularDependency(taskId: string, dependsOnTaskId: string): Promise<boolean> {
    if (!db) throw new Error('Database not connected');
    // Simple check to prevent direct circular dependencies
    const result = await db.request()
      .input('taskId', sql.NVarChar, taskId)
      .input('dependsOnTaskId', sql.NVarChar, dependsOnTaskId)
      .query(`
        SELECT COUNT(*) as count FROM task_dependencies 
        WHERE task_id = @dependsOnTaskId AND depends_on_task_id = @taskId
      `);
    return result.recordset[0].count > 0;
  }

  // Dashboard stats
  async getDashboardStats(): Promise<{
    activeProjects: number;
    openTickets: number;
    completedTasks: number;
    teamMembers: number;
    totalProjects: number;
    totalTasks: number;
    projectProgress: Array<{status: string; count: number}>;
    recentActivity: Array<{type: string; message: string; timestamp: string}>;
  }> {
    if (!db) throw new Error('Database not connected');
    
    const activeProjectsResult = await db.request().query("SELECT COUNT(*) as count FROM projects WHERE status IN ('planning', 'in_progress')");
    const openTicketsResult = await db.request().query("SELECT COUNT(*) as count FROM tickets WHERE status IN ('open', 'in_progress')");
    const completedTasksResult = await db.request().query("SELECT COUNT(*) as count FROM tasks WHERE status = 'completed'");
    const usersResult = await db.request().query("SELECT COUNT(*) as count FROM users");
    const totalProjectsResult = await db.request().query("SELECT COUNT(*) as count FROM projects");
    const totalTasksResult = await db.request().query("SELECT COUNT(*) as count FROM tasks");
    
    // Get project status distribution for progress chart
    const projectProgressResult = await db.request().query(`
      SELECT status, COUNT(*) as count 
      FROM projects 
      GROUP BY status
    `);
    
    // Get recent activity (simplified version)
    const recentProjectsResult = await db.request().query(`
      SELECT TOP 3 name, createdAt, 'projeto' as type 
      FROM projects 
      ORDER BY createdAt DESC
    `);
    const recentTasksResult = await db.request().query(`
      SELECT TOP 3 title, createdAt, 'tarefa' as type 
      FROM tasks 
      ORDER BY createdAt DESC
    `);
    
    const recentActivity = [
      ...recentProjectsResult.recordset.map((item: any) => ({
        type: item.type,
        message: `Projeto "${item.name}" foi criado`,
        timestamp: item.createdAt
      })),
      ...recentTasksResult.recordset.map((item: any) => ({
        type: item.type,
        message: `Tarefa "${item.title}" foi criada`,
        timestamp: item.createdAt
      }))
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 5);
    
    return {
      activeProjects: activeProjectsResult.recordset[0].count,
      openTickets: openTicketsResult.recordset[0].count,
      completedTasks: completedTasksResult.recordset[0].count,
      teamMembers: usersResult.recordset[0].count,
      totalProjects: totalProjectsResult.recordset[0].count,
      totalTasks: totalTasksResult.recordset[0].count,
      projectProgress: projectProgressResult.recordset || [],
      recentActivity: recentActivity
    };
  }
}

import { SqlServerStorage } from './storage-sqlserver';

export const storage = new SqlServerStorage();