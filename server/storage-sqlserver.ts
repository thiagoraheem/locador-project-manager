
import { getDb } from './db';
import sql from 'mssql';
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

export class SqlServerStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const request = getDb().request();
    const result = await request
      .input('id', sql.NVarChar, id)
      .query('SELECT * FROM users WHERE id = @id');
    
    if (!result.recordset[0]) return undefined;
    
    const user = result.recordset[0];
    return {
      ...user,
      createdAt: user.createdAt.toISOString()
    } as User;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const request = getDb().request();
    const result = await request
      .input('username', sql.NVarChar, username)
      .query('SELECT * FROM users WHERE username = @username');
    
    if (!result.recordset[0]) return undefined;
    
    const user = result.recordset[0];
    return {
      ...user,
      createdAt: user.createdAt.toISOString()
    } as User;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const request = getDb().request();
    const result = await request
      .input('email', sql.NVarChar, email)
      .query('SELECT * FROM users WHERE email = @email');
    
    if (!result.recordset[0]) return undefined;
    
    const user = result.recordset[0];
    return {
      ...user,
      createdAt: user.createdAt.toISOString()
    } as User;
  }

  async createUser(user: InsertUser): Promise<User> {
    const request = getDb().request();
    const result = await request
      .input('username', sql.NVarChar, user.username)
      .input('password', sql.NVarChar, user.password)
      .input('name', sql.NVarChar, user.name)
      .input('email', sql.NVarChar, user.email)
      .input('role', sql.NVarChar, user.role)
      .query(`
        INSERT INTO users (username, password, name, email, role)
        OUTPUT INSERTED.*
        VALUES (@username, @password, @name, @email, @role)
      `);
    
    const newUser = result.recordset[0];
    return {
      ...newUser,
      createdAt: newUser.createdAt.toISOString()
    } as User;
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User> {
    const request = getDb().request();
    let query = 'UPDATE users SET ';
    const setParts = [];
    
    if (updates.username) {
      request.input('username', sql.NVarChar, updates.username);
      setParts.push('username = @username');
    }
    if (updates.password) {
      request.input('password', sql.NVarChar, updates.password);
      setParts.push('password = @password');
    }
    if (updates.name) {
      request.input('name', sql.NVarChar, updates.name);
      setParts.push('name = @name');
    }
    if (updates.email) {
      request.input('email', sql.NVarChar, updates.email);
      setParts.push('email = @email');
    }
    if (updates.role) {
      request.input('role', sql.NVarChar, updates.role);
      setParts.push('role = @role');
    }
    
    query += setParts.join(', ') + ' OUTPUT INSERTED.* WHERE id = @id';
    
    request.input('id', sql.NVarChar, id);
    const result = await request.query(query);
    
    const user = result.recordset[0];
    return {
      ...user,
      createdAt: user.createdAt.toISOString()
    } as User;
  }

  async deleteUser(id: string): Promise<void> {
    const request = getDb().request();
    await request
      .input('id', sql.NVarChar, id)
      .query('DELETE FROM users WHERE id = @id');
  }

  async getUsers(): Promise<User[]> {
    const request = getDb().request();
    const result = await request.query('SELECT * FROM users ORDER BY createdAt DESC');
    
    return result.recordset.map(user => ({
      ...user,
      createdAt: user.createdAt.toISOString()
    })) as User[];
  }

  // Projects
  async getProjects(): Promise<Project[]> {
    const request = getDb().request();
    const result = await request.query('SELECT * FROM projects ORDER BY createdAt DESC');
    return result.recordset as Project[];
  }

  async getProject(id: string): Promise<Project | undefined> {
    const request = getDb().request();
    const result = await request
      .input('id', sql.NVarChar, id)
      .query('SELECT * FROM projects WHERE id = @id');
    
    return result.recordset[0] as Project | undefined;
  }

  async createProject(project: InsertProject): Promise<Project> {
    const request = getDb().request();
    const result = await request
      .input('name', sql.NVarChar, project.name)
      .input('description', sql.NVarChar, project.description || null)
      .input('status', sql.NVarChar, project.status)
      .input('startDate', sql.DateTime2, new Date(project.startDate))
      .input('endDate', sql.DateTime2, project.endDate ? new Date(project.endDate) : null)
      .input('createdBy', sql.NVarChar, project.createdBy)
      .query(`
        INSERT INTO projects (name, description, status, startDate, endDate, createdBy)
        OUTPUT INSERTED.*
        VALUES (@name, @description, @status, @startDate, @endDate, @createdBy)
      `);
    
    return result.recordset[0] as Project;
  }

  async updateProject(id: string, updates: Partial<InsertProject>): Promise<Project> {
    const request = getDb().request();
    let query = 'UPDATE projects SET ';
    const setParts = [];
    
    if (updates.name) {
      request.input('name', sql.NVarChar, updates.name);
      setParts.push('name = @name');
    }
    if (updates.description !== undefined) {
      request.input('description', sql.NVarChar, updates.description);
      setParts.push('description = @description');
    }
    if (updates.status) {
      request.input('status', sql.NVarChar, updates.status);
      setParts.push('status = @status');
    }
    if (updates.startDate) {
      request.input('startDate', sql.DateTime2, new Date(updates.startDate));
      setParts.push('startDate = @startDate');
    }
    if (updates.endDate !== undefined) {
      request.input('endDate', sql.DateTime2, updates.endDate ? new Date(updates.endDate) : null);
      setParts.push('endDate = @endDate');
    }
    
    setParts.push('updatedAt = GETDATE()');
    query += setParts.join(', ') + ' OUTPUT INSERTED.* WHERE id = @id';
    
    request.input('id', sql.NVarChar, id);
    const result = await request.query(query);
    
    return result.recordset[0] as Project;
  }

  async deleteProject(id: string): Promise<void> {
    const request = getDb().request();
    await request
      .input('id', sql.NVarChar, id)
      .query('DELETE FROM projects WHERE id = @id');
  }

  // Tickets
  async getTickets(projectId?: string): Promise<Ticket[]> {
    const request = getDb().request();
    let query = 'SELECT * FROM tickets';
    
    if (projectId) {
      request.input('projectId', sql.NVarChar, projectId);
      query += ' WHERE projectId = @projectId';
    }
    
    query += ' ORDER BY createdAt DESC';
    const result = await request.query(query);
    return result.recordset as Ticket[];
  }

  async getTicket(id: string): Promise<Ticket | undefined> {
    const request = getDb().request();
    const result = await request
      .input('id', sql.NVarChar, id)
      .query('SELECT * FROM tickets WHERE id = @id');
    
    return result.recordset[0] as Ticket | undefined;
  }

  async createTicket(ticket: InsertTicket): Promise<Ticket> {
    const request = getDb().request();
    const result = await request
      .input('title', sql.NVarChar, ticket.title)
      .input('description', sql.NVarChar, ticket.description)
      .input('priority', sql.NVarChar, ticket.priority)
      .input('status', sql.NVarChar, ticket.status)
      .input('projectId', sql.NVarChar, ticket.projectId || null)
      .input('reporterId', sql.NVarChar, ticket.reporterId)
      .input('assigneeId', sql.NVarChar, ticket.assigneeId || null)
      .query(`
        INSERT INTO tickets (title, description, priority, status, projectId, reporterId, assigneeId)
        OUTPUT INSERTED.*
        VALUES (@title, @description, @priority, @status, @projectId, @reporterId, @assigneeId)
      `);
    
    return result.recordset[0] as Ticket;
  }

  async updateTicket(id: string, updates: Partial<InsertTicket>): Promise<Ticket> {
    const request = getDb().request();
    let query = 'UPDATE tickets SET ';
    const setParts = [];
    
    if (updates.title) {
      request.input('title', sql.NVarChar, updates.title);
      setParts.push('title = @title');
    }
    if (updates.description) {
      request.input('description', sql.NVarChar, updates.description);
      setParts.push('description = @description');
    }
    if (updates.priority) {
      request.input('priority', sql.NVarChar, updates.priority);
      setParts.push('priority = @priority');
    }
    if (updates.status) {
      request.input('status', sql.NVarChar, updates.status);
      setParts.push('status = @status');
    }
    if (updates.assigneeId !== undefined) {
      request.input('assigneeId', sql.NVarChar, updates.assigneeId);
      setParts.push('assigneeId = @assigneeId');
    }
    
    setParts.push('updatedAt = GETDATE()');
    query += setParts.join(', ') + ' OUTPUT INSERTED.* WHERE id = @id';
    
    request.input('id', sql.NVarChar, id);
    const result = await request.query(query);
    
    return result.recordset[0] as Ticket;
  }

  async deleteTicket(id: string): Promise<void> {
    const request = getDb().request();
    await request
      .input('id', sql.NVarChar, id)
      .query('DELETE FROM tickets WHERE id = @id');
  }

  // Tasks
  async getTasks(projectId?: string): Promise<Task[]> {
    const request = getDb().request();
    let query = 'SELECT * FROM tasks';
    
    if (projectId) {
      request.input('projectId', sql.NVarChar, projectId);
      query += ' WHERE projectId = @projectId';
    }
    
    query += ' ORDER BY createdAt DESC';
    const result = await request.query(query);
    return result.recordset as Task[];
  }

  async getTask(id: string): Promise<Task | undefined> {
    const request = getDb().request();
    const result = await request
      .input('id', sql.NVarChar, id)
      .query('SELECT * FROM tasks WHERE id = @id');
    
    return result.recordset[0] as Task | undefined;
  }

  async createTask(task: InsertTask): Promise<Task> {
    const request = getDb().request();
    const result = await request
      .input('title', sql.NVarChar, task.title)
      .input('description', sql.NVarChar, task.description || null)
      .input('status', sql.NVarChar, task.status)
      .input('priority', sql.NVarChar, task.priority)
      .input('projectId', sql.NVarChar, task.projectId)
      .input('assigneeId', sql.NVarChar, task.assigneeId || null)
      .input('startDate', sql.DateTime2, task.startDate ? new Date(task.startDate) : null)
      .input('endDate', sql.DateTime2, task.endDate ? new Date(task.endDate) : null)
      .query(`
        INSERT INTO tasks (title, description, status, priority, projectId, assigneeId, startDate, endDate)
        OUTPUT INSERTED.*
        VALUES (@title, @description, @status, @priority, @projectId, @assigneeId, @startDate, @endDate)
      `);
    
    return result.recordset[0] as Task;
  }

  async updateTask(id: string, updates: Partial<InsertTask>): Promise<Task> {
    const request = getDb().request();
    let query = 'UPDATE tasks SET ';
    const setParts = [];
    
    if (updates.title) {
      request.input('title', sql.NVarChar, updates.title);
      setParts.push('title = @title');
    }
    if (updates.description !== undefined) {
      request.input('description', sql.NVarChar, updates.description);
      setParts.push('description = @description');
    }
    if (updates.status) {
      request.input('status', sql.NVarChar, updates.status);
      setParts.push('status = @status');
    }
    if (updates.priority) {
      request.input('priority', sql.NVarChar, updates.priority);
      setParts.push('priority = @priority');
    }
    if (updates.assigneeId !== undefined) {
      request.input('assigneeId', sql.NVarChar, updates.assigneeId);
      setParts.push('assigneeId = @assigneeId');
    }
    if (updates.startDate !== undefined) {
      request.input('startDate', sql.DateTime2, updates.startDate ? new Date(updates.startDate) : null);
      setParts.push('startDate = @startDate');
    }
    if (updates.endDate !== undefined) {
      request.input('endDate', sql.DateTime2, updates.endDate ? new Date(updates.endDate) : null);
      setParts.push('endDate = @endDate');
    }
    
    setParts.push('updatedAt = GETDATE()');
    query += setParts.join(', ') + ' OUTPUT INSERTED.* WHERE id = @id';
    
    request.input('id', sql.NVarChar, id);
    const result = await request.query(query);
    
    return result.recordset[0] as Task;
  }

  async deleteTask(id: string): Promise<void> {
    const request = getDb().request();
    await request
      .input('id', sql.NVarChar, id)
      .query('DELETE FROM tasks WHERE id = @id');
  }

  // Milestones
  async getMilestones(projectId?: string): Promise<Milestone[]> {
    const request = getDb().request();
    let query = 'SELECT * FROM milestones';
    
    if (projectId) {
      request.input('projectId', sql.NVarChar, projectId);
      query += ' WHERE projectId = @projectId';
    }
    
    query += ' ORDER BY createdAt DESC';
    const result = await request.query(query);
    return result.recordset as Milestone[];
  }

  async createMilestone(milestone: InsertMilestone): Promise<Milestone> {
    const request = getDb().request();
    const result = await request
      .input('title', sql.NVarChar, milestone.title)
      .input('description', sql.NVarChar, milestone.description || null)
      .input('projectId', sql.NVarChar, milestone.projectId)
      .input('dueDate', sql.DateTime2, new Date(milestone.dueDate))
      .query(`
        INSERT INTO milestones (title, description, projectId, dueDate)
        OUTPUT INSERTED.*
        VALUES (@title, @description, @projectId, @dueDate)
      `);
    
    return result.recordset[0] as Milestone;
  }

  // Comments
  async getComments(ticketId: string): Promise<Comment[]> {
    const request = getDb().request();
    const result = await request
      .input('ticketId', sql.NVarChar, ticketId)
      .query('SELECT * FROM comments WHERE ticketId = @ticketId ORDER BY createdAt DESC');
    
    return result.recordset as Comment[];
  }

  async createComment(comment: InsertComment): Promise<Comment> {
    const request = getDb().request();
    const result = await request
      .input('content', sql.NVarChar, comment.content)
      .input('ticketId', sql.NVarChar, comment.ticketId)
      .input('authorId', sql.NVarChar, comment.authorId)
      .query(`
        INSERT INTO comments (content, ticketId, authorId)
        OUTPUT INSERTED.*
        VALUES (@content, @ticketId, @authorId)
      `);
    
    return result.recordset[0] as Comment;
  }

  async updateComment(id: string, updates: Partial<InsertComment>): Promise<Comment> {
    const request = getDb().request();
    let query = 'UPDATE comments SET updatedAt = GETDATE()';
    
    if (updates.content) {
      request.input('content', sql.NVarChar, updates.content);
      query += ', content = @content';
    }
    
    query += ' OUTPUT INSERTED.* WHERE id = @id';
    
    request.input('id', sql.NVarChar, id);
    const result = await request.query(query);
    
    return result.recordset[0] as Comment;
  }

  async deleteComment(id: string): Promise<void> {
    const request = getDb().request();
    await request
      .input('id', sql.NVarChar, id)
      .query('DELETE FROM comments WHERE id = @id');
  }

  // Task Dependencies
  async getTaskDependencies(taskId: string): Promise<TaskDependency[]> {
    const request = getDb().request();
    const result = await request
      .input('taskId', sql.NVarChar, taskId)
      .query('SELECT * FROM taskDependencies WHERE taskId = @taskId ORDER BY createdAt DESC');
    
    return result.recordset as TaskDependency[];
  }

  async createTaskDependency(dependency: InsertTaskDependency): Promise<TaskDependency> {
    const request = getDb().request();
    const result = await request
      .input('taskId', sql.NVarChar, dependency.taskId)
      .input('dependsOnTaskId', sql.NVarChar, dependency.dependsOnTaskId)
      .query(`
        INSERT INTO taskDependencies (taskId, dependsOnTaskId)
        OUTPUT INSERTED.*
        VALUES (@taskId, @dependsOnTaskId)
      `);
    
    return result.recordset[0] as TaskDependency;
  }

  async deleteTaskDependency(id: string): Promise<void> {
    const request = getDb().request();
    await request
      .input('id', sql.NVarChar, id)
      .query('DELETE FROM taskDependencies WHERE id = @id');
  }

  // Notifications
  async getNotifications(userId: string): Promise<Notification[]> {
    const request = getDb().request();
    const result = await request
      .input('userId', sql.NVarChar, userId)
      .query('SELECT * FROM notifications WHERE userId = @userId ORDER BY createdAt DESC');
    
    return result.recordset as Notification[];
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const request = getDb().request();
    const result = await request
      .input('type', sql.NVarChar, notification.type)
      .input('title', sql.NVarChar, notification.title)
      .input('message', sql.NVarChar, notification.message)
      .input('userId', sql.NVarChar, notification.userId)
      .input('entityType', sql.NVarChar, notification.entityType || null)
      .input('entityId', sql.NVarChar, notification.entityId || null)
      .query(`
        INSERT INTO notifications (type, title, message, userId, entityType, entityId)
        OUTPUT INSERTED.*
        VALUES (@type, @title, @message, @userId, @entityType, @entityId)
      `);
    
    return result.recordset[0] as Notification;
  }

  async markNotificationAsRead(id: string): Promise<void> {
    const request = getDb().request();
    await request
      .input('id', sql.NVarChar, id)
      .query('UPDATE notifications SET read = 1 WHERE id = @id');
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    const request = getDb().request();
    await request
      .input('userId', sql.NVarChar, userId)
      .query('UPDATE notifications SET read = 1 WHERE userId = @userId');
  }

  async deleteNotification(id: string): Promise<void> {
    const request = getDb().request();
    await request
      .input('id', sql.NVarChar, id)
      .query('DELETE FROM notifications WHERE id = @id');
  }

  // Dashboard stats
  async getDashboardStats(): Promise<{
    activeProjects: number;
    openTickets: number;
    completedTasks: number;
    teamMembers: number;
  }> {
    const request = getDb().request();
    
    const [activeProjects, openTickets, completedTasks, teamMembers] = await Promise.all([
      request.query("SELECT COUNT(*) as count FROM projects WHERE status = 'in_progress'"),
      request.query("SELECT COUNT(*) as count FROM tickets WHERE status = 'open'"),
      request.query("SELECT COUNT(*) as count FROM tasks WHERE status = 'completed'"),
      request.query("SELECT COUNT(*) as count FROM users")
    ]);

    return {
      activeProjects: activeProjects.recordset[0].count,
      openTickets: openTickets.recordset[0].count,
      completedTasks: completedTasks.recordset[0].count,
      teamMembers: teamMembers.recordset[0].count,
    };
  }
}

// Export a singleton instance
export const sqlServerStorage = new SqlServerStorage();
