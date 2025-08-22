import sql from 'mssql';
import { format } from 'date-fns';

let sqlServerPool: sql.ConnectionPool | null = null;

export function getDb(): sql.ConnectionPool {
  if (!sqlServerPool) {
    throw new Error('Database not initialized');
  }
  return sqlServerPool;
}

// Setter para o pool (usado pelo db.ts)
export function setDb(pool: sql.ConnectionPool) {
  sqlServerPool = pool;
}

import type {
  User,
  Project,
  Task,
  TaskType,
  Ticket,
  Milestone,
  Comment,
  TaskDependency,
  Notification,
  InsertUser,
  InsertProject,
  InsertTask,
  InsertTaskType,
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
      createdAt: user.created_at?.toISOString() || user.createdAt
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
      createdAt: user.created_at?.toISOString() || user.createdAt
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
      createdAt: user.created_at?.toISOString() || user.createdAt
    } as User;
  }

  async createUser(user: InsertUser & { id?: string }): Promise<User> {
    const request = getDb().request();
    
    let query;
    if (user.id) {
      request.input('id', sql.NVarChar, user.id);
      query = `
        INSERT INTO users (id, username, password, name, email, role)
        OUTPUT INSERTED.*
        VALUES (@id, @username, @password, @name, @email, @role)
      `;
    } else {
      query = `
        INSERT INTO users (username, password, name, email, role)
        OUTPUT INSERTED.*
        VALUES (@username, @password, @name, @email, @role)
      `;
    }
    
    const result = await request
      .input('username', sql.NVarChar, user.username)
      .input('password', sql.NVarChar, user.password)
      .input('name', sql.NVarChar, user.name)
      .input('email', sql.NVarChar, user.email)
      .input('role', sql.NVarChar, user.role)
      .query(query);

    const newUser = result.recordset[0];
    return {
      ...newUser,
      createdAt: newUser.created_at?.toISOString() || newUser.createdAt
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
      createdAt: user.created_at?.toISOString() || user.createdAt
    } as User;
  }

  async deleteUser(id: string): Promise<void> {
    const request = getDb().request();
    await request
      .input('id', sql.NVarChar, id)
      .query('DELETE FROM users WHERE id = @id');
  }

  async getUsers(): Promise<User[]> {
    try {
      const request = getDb().request();
      const result = await request.query('SELECT * FROM users ORDER BY created_at DESC');

      return result.recordset.map((user: any) => ({
        ...user,
        createdAt: user.created_at.toISOString()
      })) as User[];
    } catch (error) {
      console.error('Error in getUsers:', error);
      throw error;
    }
  }

  // Task Types
  async getTaskTypes(): Promise<TaskType[]> {
    try {
      const request = getDb().request();
      const result = await request.query('SELECT * FROM task_types WHERE active = 1 ORDER BY name ASC');

      return result.recordset.map((taskType: any) => ({
        ...taskType,
        active: Boolean(taskType.active),
        createdAt: taskType.created_at.toISOString(),
        updatedAt: taskType.updated_at.toISOString()
      })) as TaskType[];
    } catch (error) {
      console.error('Error fetching task types:', error);
      throw error;
    }
  }

  async getTaskType(id: string): Promise<TaskType | undefined> {
    const request = getDb().request();
    const result = await request
      .input('id', sql.NVarChar, id)
      .query('SELECT * FROM task_types WHERE id = @id');

    if (!result.recordset[0]) return undefined;

    const taskType = result.recordset[0];
    return {
      ...taskType,
      active: Boolean(taskType.active),
      createdAt: taskType.created_at.toISOString(),
      updatedAt: taskType.updated_at.toISOString()
    } as TaskType;
  }

  async createTaskType(taskType: InsertTaskType): Promise<TaskType> {
    const request = getDb().request();
    const result = await request
      .input('name', sql.NVarChar, taskType.name)
      .input('description', sql.NVarChar, taskType.description || null)
      .input('color', sql.NVarChar, taskType.color)
      .input('active', sql.Bit, taskType.active ?? true)
      .query(`
        INSERT INTO task_types (name, description, color, active)
        OUTPUT INSERTED.*
        VALUES (@name, @description, @color, @active)
      `);

    const newTaskType = result.recordset[0];
    return {
      ...newTaskType,
      active: Boolean(newTaskType.active),
      createdAt: newTaskType.created_at.toISOString(),
      updatedAt: newTaskType.updated_at.toISOString()
    } as TaskType;
  }

  async updateTaskType(id: string, updates: Partial<InsertTaskType>): Promise<TaskType> {
    const request = getDb().request();
    let query = 'UPDATE task_types SET ';
    const setParts = [];

    if (updates.name) {
      request.input('name', sql.NVarChar, updates.name);
      setParts.push('name = @name');
    }
    if (updates.description !== undefined) {
      request.input('description', sql.NVarChar, updates.description);
      setParts.push('description = @description');
    }
    if (updates.color) {
      request.input('color', sql.NVarChar, updates.color);
      setParts.push('color = @color');
    }
    if (updates.active !== undefined) {
      request.input('active', sql.Bit, updates.active);
      setParts.push('active = @active');
    }

    setParts.push('updated_at = GETUTCDATE()');
    query += setParts.join(', ') + ' OUTPUT INSERTED.* WHERE id = @id';

    request.input('id', sql.NVarChar, id);
    const result = await request.query(query);

    const taskType = result.recordset[0];
    return {
      ...taskType,
      active: Boolean(taskType.active),
      createdAt: taskType.created_at.toISOString(),
      updatedAt: taskType.updated_at.toISOString()
    } as TaskType;
  }

  async deleteTaskType(id: string): Promise<void> {
    // Soft delete - marca como inativo ao invés de deletar
    const request = getDb().request();
    await request
      .input('id', sql.NVarChar, id)
      .query('UPDATE task_types SET active = 0, updated_at = GETUTCDATE() WHERE id = @id');
  }

  // Projects
  async getProjects(): Promise<Project[]> {
    try {
      const request = getDb().request();
      const result = await request.query('SELECT * FROM projects ORDER BY created_at DESC');
      return result.recordset.map((project: any) => ({
        ...project,
        createdAt: project.created_at.toISOString(),
        updatedAt: project.updated_at.toISOString()
      })) as Project[];
    } catch (error) {
      console.error('Error in getProjects:', error);
      throw error;
    }
  }

  async getProject(id: string): Promise<Project | undefined> {
    const request = getDb().request();
    const result = await request
      .input('id', sql.NVarChar, id)
      .query('SELECT * FROM projects WHERE id = @id');

    if (!result.recordset[0]) return undefined;

    const project = result.recordset[0];
    return {
      ...project,
      startDate: project.start_date,
      endDate: project.end_date,
      createdBy: project.created_by,
      createdAt: project.created_at?.toISOString() || project.createdAt,
      updatedAt: project.updated_at?.toISOString() || project.updatedAt
    } as Project;
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
        INSERT INTO projects (name, description, status, start_date, end_date, created_by)
        OUTPUT INSERTED.*
        VALUES (@name, @description, @status, @startDate, @endDate, @createdBy)
      `);

    const rawProject = result.recordset[0];
    return {
      ...rawProject,
      startDate: rawProject.start_date,
      endDate: rawProject.end_date,
      createdBy: rawProject.created_by,
      createdAt: rawProject.created_at?.toISOString() || rawProject.createdAt,
      updatedAt: rawProject.updated_at?.toISOString() || rawProject.updatedAt
    } as Project;
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
      setParts.push('start_date = @startDate');
    }
    if (updates.endDate !== undefined) {
      request.input('endDate', sql.DateTime2, updates.endDate ? new Date(updates.endDate) : null);
      setParts.push('end_date = @endDate');
    }

    setParts.push('updated_at = GETDATE()');
    query += setParts.join(', ') + ' OUTPUT INSERTED.* WHERE id = @id';

    request.input('id', sql.NVarChar, id);
    const result = await request.query(query);

    const rawProject = result.recordset[0];
    return {
      ...rawProject,
      startDate: rawProject.start_date,
      endDate: rawProject.end_date,
      createdBy: rawProject.created_by,
      createdAt: rawProject.created_at?.toISOString() || rawProject.createdAt,
      updatedAt: rawProject.updated_at?.toISOString() || rawProject.updatedAt
    } as Project;
  }

  async deleteProject(id: string): Promise<void> {
    const request = getDb().request();
    await request
      .input('id', sql.NVarChar, id)
      .query('DELETE FROM projects WHERE id = @id');
  }

  // Tickets
  async getTickets(projectId?: string): Promise<Ticket[]> {
    try {
      const request = getDb().request();
      let query = 'SELECT * FROM tickets';

      if (projectId) {
        request.input('projectId', sql.NVarChar, projectId);
        query += ' WHERE project_id = @projectId';
      }

      query += ' ORDER BY created_at DESC';
      const result = await request.query(query);
      return result.recordset.map((ticket: any) => ({
        ...ticket,
        projectId: ticket.project_id,
        reporterId: ticket.reporter_id,
        assigneeId: ticket.assignee_id,
        createdAt: ticket.created_at?.toISOString() || ticket.createdAt,
        updatedAt: ticket.updated_at?.toISOString() || ticket.updatedAt
      })) as Ticket[];
    } catch (error) {
      console.error('Error in getTickets:', error);
      throw error;
    }
  }

  async getTicket(id: string): Promise<Ticket | undefined> {
    const request = getDb().request();
    const result = await request
      .input('id', sql.NVarChar, id)
      .query('SELECT * FROM tickets WHERE id = @id');

    if (!result.recordset[0]) return undefined;

    const ticket = result.recordset[0];
    return {
      ...ticket,
      projectId: ticket.project_id,
      reporterId: ticket.reporter_id,
      assigneeId: ticket.assignee_id,
      createdAt: ticket.created_at?.toISOString() || ticket.createdAt,
      updatedAt: ticket.updated_at?.toISOString() || ticket.updatedAt
    } as Ticket;
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
        INSERT INTO tickets (title, description, priority, status, project_id, reporter_id, assignee_id)
        OUTPUT INSERTED.*
        VALUES (@title, @description, @priority, @status, @projectId, @reporterId, @assigneeId)
      `);

    const rawTicket = result.recordset[0];
    return {
      ...rawTicket,
      projectId: rawTicket.project_id,
      reporterId: rawTicket.reporter_id,
      assigneeId: rawTicket.assignee_id,
      createdAt: rawTicket.created_at?.toISOString() || rawTicket.createdAt,
      updatedAt: rawTicket.updated_at?.toISOString() || rawTicket.updatedAt
    } as Ticket;
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
      setParts.push('assignee_id = @assigneeId');
    }

    setParts.push('updated_at = GETDATE()');
    query += setParts.join(', ') + ' OUTPUT INSERTED.* WHERE id = @id';

    request.input('id', sql.NVarChar, id);
    const result = await request.query(query);

    const rawTicket = result.recordset[0];
    return {
      ...rawTicket,
      projectId: rawTicket.project_id,
      reporterId: rawTicket.reporter_id,
      assigneeId: rawTicket.assignee_id,
      createdAt: rawTicket.created_at?.toISOString() || rawTicket.createdAt,
      updatedAt: rawTicket.updated_at?.toISOString() || rawTicket.updatedAt
    } as Ticket;
  }

  async deleteTicket(id: string): Promise<void> {
    const request = getDb().request();
    await request
      .input('id', sql.NVarChar, id)
      .query('DELETE FROM tickets WHERE id = @id');
  }

  // Tasks
  async getTasks(projectId?: string): Promise<Task[]> {
    try {
      const request = getDb().request();
      let query = 'SELECT * FROM tasks';

      if (projectId) {
        request.input('projectId', sql.NVarChar, projectId);
        query += ' WHERE project_id = @projectId';
      }

      query += ' ORDER BY created_at DESC';
      const result = await request.query(query);
      return result.recordset.map((task: any) => ({
        ...task,
        taskTypeId: task.task_type_id,
        projectId: task.project_id,
        assigneeId: task.assignee_id,
        startDate: task.start_date,
        endDate: task.end_date,
        expectedEndDate: task.expected_end_date,
        createdAt: task.created_at?.toISOString() || task.createdAt,
        updatedAt: task.updated_at?.toISOString() || task.updatedAt
      })) as Task[];
    } catch (error) {
      console.error('Error in getTasks:', error);
      throw error;
    }
  }

  async getTask(id: string): Promise<Task | undefined> {
    const request = getDb().request();
    const result = await request
      .input('id', sql.NVarChar, id)
      .query('SELECT * FROM tasks WHERE id = @id');

    if (!result.recordset[0]) return undefined;

    const task = result.recordset[0];
    return {
      ...task,
      taskTypeId: task.task_type_id,
      projectId: task.project_id,
      assigneeId: task.assignee_id,
      startDate: task.start_date,
      endDate: task.end_date,
      expectedEndDate: task.expected_end_date,
      createdAt: task.created_at?.toISOString() || task.createdAt,
      updatedAt: task.updated_at?.toISOString() || task.updatedAt
    } as Task;
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    try {
      console.log('SqlServerStorage.createTask called with:', insertTask);
      
      const request = getDb().request();
      
      // Validar dados obrigatórios
      if (!insertTask.id || !insertTask.title || !insertTask.projectId) {
        throw new Error('Missing required fields: id, title, or projectId');
      }
      
      console.log('Preparing SQL query with parameters...');
      
      const result = await request
        .input('id', sql.NVarChar, insertTask.id)
        .input('title', sql.NVarChar, insertTask.title)
        .input('description', sql.NVarChar, insertTask.description || null)
        .input('status', sql.NVarChar, insertTask.status || 'todo')
        .input('priority', sql.NVarChar, insertTask.priority || 'medium')
        .input('taskTypeId', sql.NVarChar, insertTask.taskTypeId || null)
        .input('projectId', sql.NVarChar, insertTask.projectId)
        .input('assigneeId', sql.NVarChar, insertTask.assigneeId || null)
        .input('startDate', sql.DateTime2, insertTask.startDate ? new Date(insertTask.startDate) : null)
        .input('endDate', sql.DateTime2, insertTask.endDate ? new Date(insertTask.endDate) : null)
        .input('expectedEndDate', sql.DateTime2, insertTask.expectedEndDate ? new Date(insertTask.expectedEndDate) : null)
        .query(`
          INSERT INTO tasks (id, title, description, status, priority, task_type_id, project_id, assignee_id, start_date, end_date, expected_end_date)
          VALUES (@id, @title, @description, @status, @priority, @taskTypeId, @projectId, @assigneeId, @startDate, @endDate, @expectedEndDate);
          SELECT * FROM tasks WHERE id = @id;
        `);
      
      console.log('SQL query executed successfully');
      
      if (!result.recordset[0]) {
        throw new Error('Task was not created - no record returned');
      }
      
      const rawTask = result.recordset[0];
      const task = {
        ...rawTask,
        taskTypeId: rawTask.task_type_id,
        projectId: rawTask.project_id,
        assigneeId: rawTask.assignee_id,
        startDate: rawTask.start_date,
        endDate: rawTask.end_date,
        expectedEndDate: rawTask.expected_end_date,
        createdAt: rawTask.created_at?.toISOString() || rawTask.createdAt,
        updatedAt: rawTask.updated_at?.toISOString() || rawTask.updatedAt
      } as Task;
      
      console.log('Task created and formatted successfully:', task.id);
      return task;
      
    } catch (error: any) {
      console.error('Error in SqlServerStorage.createTask:', error);
      console.error('Error message:', error.message);
      console.error('Original error details:', error.originalError || error);
      
      // Re-throw com mais contexto
      throw new Error(`Failed to create task in database: ${error.message}`);
    }
  }

  async updateTask(id: string, updates: Partial<InsertTask>): Promise<Task> {
    const request = getDb().request();
    let query = 'UPDATE tasks SET ';
    const updateFields = [];

    for (const [key, value] of Object.entries(updates)) {
      if (value === undefined) continue; // Pular valores undefined
      
      if (key === 'startDate' || key === 'endDate' || key === 'expectedEndDate') {
        const dbFieldName = key === 'startDate' ? 'start_date' : 
                           key === 'endDate' ? 'end_date' : 
                           'expected_end_date';
        updateFields.push(`${dbFieldName} = @${key}`);
        request.input(key, sql.DateTime2, value ? new Date(value) : null);
      } else if (key === 'projectId') {
        updateFields.push('project_id = @projectId');
        request.input('projectId', sql.NVarChar, value || null);
      } else if (key === 'assigneeId') {
        updateFields.push('assignee_id = @assigneeId');
        request.input('assigneeId', sql.NVarChar, value || null);
      } else if (key === 'taskTypeId') {
        updateFields.push('task_type_id = @taskTypeId');
        request.input('taskTypeId', sql.NVarChar, value || null);
      } else if (key === 'title' || key === 'description' || key === 'status' || key === 'priority') {
        updateFields.push(`${key} = @${key}`);
        request.input(key, sql.NVarChar, value || null);
      }
    }

    if (updateFields.length > 0) {
      updateFields.push('updated_at = GETUTCDATE()');
      query += updateFields.join(', ') + ' WHERE id = @id';

      request.input('id', sql.NVarChar, id);
      await request.query(query);

      // Buscar a tarefa atualizada
      const selectResult = await getDb().request()
        .input('id', sql.NVarChar, id)
        .query('SELECT * FROM tasks WHERE id = @id');

      if (!selectResult.recordset[0]) {
        throw new Error('Task not found after update');
      }

      return selectResult.recordset[0] as Task;
    }

    // Se não há campos para atualizar, apenas retornar a tarefa existente
    request.input('id', sql.NVarChar, id);
    const result = await request.query('SELECT * FROM tasks WHERE id = @id');
    
    if (!result.recordset[0]) {
      throw new Error('Task not found');
    }
    
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
      query += ' WHERE project_id = @projectId';
    }

    query += ' ORDER BY created_at DESC';
    const result = await request.query(query);
    return result.recordset.map((milestone: any) => ({
      ...milestone,
      projectId: milestone.project_id,
      dueDate: milestone.due_date,
      createdAt: milestone.created_at?.toISOString() || milestone.createdAt
    })) as Milestone[];
  }

  async createMilestone(milestone: InsertMilestone): Promise<Milestone> {
    const request = getDb().request();
    const result = await request
      .input('title', sql.NVarChar, milestone.title)
      .input('description', sql.NVarChar, milestone.description || null)
      .input('projectId', sql.NVarChar, milestone.projectId)
      .input('dueDate', sql.DateTime2, new Date(milestone.dueDate))
      .query(`
        INSERT INTO milestones (title, description, project_id, due_date)
        OUTPUT INSERTED.*
        VALUES (@title, @description, @projectId, @dueDate)
      `);

    const rawMilestone = result.recordset[0];
    return {
      ...rawMilestone,
      projectId: rawMilestone.project_id,
      dueDate: rawMilestone.due_date,
      createdAt: rawMilestone.created_at?.toISOString() || rawMilestone.createdAt
    } as Milestone;
  }

  // Comments
  async getComments(ticketId: string): Promise<Comment[]> {
    const request = getDb().request();
    const result = await request
      .input('ticketId', sql.NVarChar, ticketId)
      .query('SELECT * FROM comments WHERE ticket_id = @ticketId ORDER BY created_at DESC');

    return result.recordset.map((comment: any) => ({
      ...comment,
      ticketId: comment.ticket_id,
      authorId: comment.author_id,
      createdAt: comment.created_at?.toISOString() || comment.createdAt,
      updatedAt: comment.updated_at?.toISOString() || comment.updatedAt
    })) as Comment[];
  }

  async createComment(comment: InsertComment): Promise<Comment> {
    const request = getDb().request();
    const result = await request
      .input('content', sql.NVarChar, comment.content)
      .input('ticketId', sql.NVarChar, comment.ticketId)
      .input('authorId', sql.NVarChar, comment.authorId)
      .query(`
        INSERT INTO comments (content, ticket_id, author_id)
        OUTPUT INSERTED.*
        VALUES (@content, @ticketId, @authorId)
      `);

    const rawComment = result.recordset[0];
    return {
      ...rawComment,
      ticketId: rawComment.ticket_id,
      authorId: rawComment.author_id,
      createdAt: rawComment.created_at?.toISOString() || rawComment.createdAt,
      updatedAt: rawComment.updated_at?.toISOString() || rawComment.updatedAt
    } as Comment;
  }

  async updateComment(id: string, updates: Partial<InsertComment>): Promise<Comment> {
    const request = getDb().request();
    let query = 'UPDATE comments SET updated_at = GETDATE()';

    if (updates.content) {
      request.input('content', sql.NVarChar, updates.content);
      query += ', content = @content';
    }

    query += ' OUTPUT INSERTED.* WHERE id = @id';

    request.input('id', sql.NVarChar, id);
    const result = await request.query(query);

    const rawComment = result.recordset[0];
    return {
      ...rawComment,
      ticketId: rawComment.ticket_id,
      authorId: rawComment.author_id,
      createdAt: rawComment.created_at?.toISOString() || rawComment.createdAt,
      updatedAt: rawComment.updated_at?.toISOString() || rawComment.updatedAt
    } as Comment;
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
      .query('SELECT * FROM task_dependencies WHERE task_id = @taskId ORDER BY created_at DESC');

    return result.recordset.map((dependency: any) => ({
      ...dependency,
      taskId: dependency.task_id,
      dependsOnTaskId: dependency.depends_on_task_id,
      createdAt: dependency.created_at?.toISOString() || dependency.createdAt
    })) as TaskDependency[];
  }

  async createTaskDependency(dependency: InsertTaskDependency): Promise<TaskDependency> {
    const request = getDb().request();
    const result = await request
      .input('taskId', sql.NVarChar, dependency.taskId)
      .input('dependsOnTaskId', sql.NVarChar, dependency.dependsOnTaskId)
      .query(`
        INSERT INTO task_dependencies (task_id, depends_on_task_id)
        OUTPUT INSERTED.*
        VALUES (@taskId, @dependsOnTaskId)
      `);

    const rawDependency = result.recordset[0];
    return {
      ...rawDependency,
      taskId: rawDependency.task_id,
      dependsOnTaskId: rawDependency.depends_on_task_id,
      createdAt: rawDependency.created_at?.toISOString() || rawDependency.createdAt
    } as TaskDependency;
  }

  async deleteTaskDependency(id: string): Promise<void> {
    const request = getDb().request();
    await request
      .input('id', sql.NVarChar, id)
      .query('DELETE FROM task_dependencies WHERE id = @id');
  }

  // Notifications
  async getNotifications(userId: string): Promise<Notification[]> {
    try {
      const request = getDb().request();
      const result = await request
        .input('userId', sql.NVarChar, userId)
        .query('SELECT * FROM notifications WHERE user_id = @userId ORDER BY created_at DESC');

      return result.recordset.map((notification: any) => ({
        ...notification,
        userId: notification.user_id,
        entityType: notification.entity_type,
        entityId: notification.entity_id,
        read: Boolean(notification.read),
        createdAt: notification.created_at?.toISOString() || notification.createdAt
      })) as Notification[];
    } catch (error) {
      console.error('Error in getNotifications:', error);
      throw error;
    }
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
        INSERT INTO notifications (type, title, message, user_id, entity_type, entity_id)
        OUTPUT INSERTED.*
        VALUES (@type, @title, @message, @userId, @entityType, @entityId)
      `);

    const rawNotification = result.recordset[0];
    return {
      ...rawNotification,
      userId: rawNotification.user_id,
      entityType: rawNotification.entity_type,
      entityId: rawNotification.entity_id,
      read: Boolean(rawNotification.read),
      createdAt: rawNotification.created_at?.toISOString() || rawNotification.createdAt
    } as Notification;
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
      .query('UPDATE notifications SET read = 1 WHERE user_id = @userId');
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

  // Relatórios - Produtividade
  async getProductivityReport(startDate: Date, endDate: Date, userId?: string, projectId?: string) {
    const request = getDb().request();
    request
      .input('startDate', sql.DateTime, startDate)
      .input('endDate', sql.DateTime, endDate);
    
    let whereClause = 'WHERE 1=1';
    if (userId) {
      request.input('userId', sql.NVarChar, userId);
      whereClause += ' AND (tasks.assignee_id = @userId OR tickets.assignee_id = @userId)';
    }
    if (projectId) {
      request.input('projectId', sql.NVarChar, projectId);
      whereClause += ' AND (tasks.project_id = @projectId OR tickets.project_id = @projectId)';
    }
    
    // Estatísticas gerais de tarefas
    const taskStatsQuery = `
      SELECT 
        COUNT(*) as totalTasks,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completedTasks,
        AVG(CASE WHEN status = 'completed' THEN DATEDIFF(hour, created_at, updated_at) END) as averageTaskTime
      FROM tasks 
      ${whereClause}
      AND created_at BETWEEN @startDate AND @endDate
    `;
    
    const taskStats = await request.query(taskStatsQuery);
    
    // Estatísticas gerais de tickets
    const ticketStatsQuery = `
      SELECT 
        COUNT(*) as totalTickets,
        COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolvedTickets
      FROM tickets 
      ${whereClause}
      AND created_at BETWEEN @startDate AND @endDate
    `;
    
    const ticketStats = await request.query(ticketStatsQuery);
    
    // Produtividade por membro da equipe
    const teamProductivityQuery = `
      SELECT 
        u.id,
        u.name,
        COUNT(DISTINCT t.id) as tasksAssigned,
        COUNT(DISTINCT CASE WHEN t.status = 'completed' THEN t.id END) as tasksCompleted,
        COUNT(DISTINCT CASE WHEN tk.status = 'resolved' THEN tk.id END) as ticketsResolved
      FROM users u
      LEFT JOIN tasks t ON u.id = t.assignee_id AND t.created_at BETWEEN @startDate AND @endDate
      LEFT JOIN tickets tk ON u.id = tk.assignee_id AND tk.created_at BETWEEN @startDate AND @endDate
      GROUP BY u.id, u.name
      HAVING COUNT(DISTINCT t.id) > 0 OR COUNT(DISTINCT tk.id) > 0
      ORDER BY u.name
    `;
    
    const teamProductivity = await request.query(teamProductivityQuery);
    
    const taskData = taskStats.recordset[0];
    const ticketData = ticketStats.recordset[0];
    
    return {
      totalTasks: taskData.totalTasks || 0,
      completedTasks: taskData.completedTasks || 0,
      completionRate: taskData.totalTasks ? ((taskData.completedTasks / taskData.totalTasks) * 100) : 0,
      totalTickets: ticketData.totalTickets || 0,
      resolvedTickets: ticketData.resolvedTickets || 0,
      resolutionRate: ticketData.totalTickets ? ((ticketData.resolvedTickets / ticketData.totalTickets) * 100) : 0,
      averageTaskTime: taskData.averageTaskTime || 0,
      teamMembers: teamProductivity.recordset.map(member => ({
        id: member.id,
        name: member.name,
        tasksCompleted: member.tasksCompleted || 0,
        tasksAssigned: member.tasksAssigned || 0,
        ticketsResolved: member.ticketsResolved || 0,
        productivity: member.tasksAssigned > 0 ? ((member.tasksCompleted / member.tasksAssigned) * 100) : 0
      }))
    };
  }

  // Relatórios - Status de Projetos
  async getProjectStatusReport(startDate: Date, endDate: Date) {
    const request = getDb().request();
    request
      .input('startDate', sql.DateTime, startDate)
      .input('endDate', sql.DateTime, endDate);
    
    // Estatísticas gerais de projetos
    const projectStatsQuery = `
      SELECT 
        COUNT(*) as totalProjects,
        status,
        COUNT(*) as count
      FROM projects 
      WHERE created_at BETWEEN @startDate AND @endDate OR updated_at BETWEEN @startDate AND @endDate
      GROUP BY status
    `;
    
    const projectStats = await request.query(projectStatsQuery);
    
    // Projetos detalhados
    const projectsDetailQuery = `
      SELECT 
        id,
        name,
        status,
        start_date as startDate,
        end_date as endDate,
        created_at,
        CASE 
          WHEN end_date < GETDATE() AND status != 'completed' THEN 1
          ELSE 0
        END as isDelayed,
        CASE 
          WHEN status = 'completed' THEN 100
          WHEN status = 'in_progress' THEN 50
          WHEN status = 'planning' THEN 25
          ELSE 0
        END as progress
      FROM projects 
      WHERE created_at BETWEEN @startDate AND @endDate OR updated_at BETWEEN @startDate AND @endDate
      ORDER BY created_at DESC
    `;
    
    const projectsDetail = await request.query(projectsDetailQuery);
    
    // Calcular duração média dos projetos
    const durationQuery = `
      SELECT AVG(DATEDIFF(day, start_date, COALESCE(end_date, GETDATE()))) as avgDuration
      FROM projects 
      WHERE start_date IS NOT NULL
      AND (created_at BETWEEN @startDate AND @endDate OR updated_at BETWEEN @startDate AND @endDate)
    `;
    
    const duration = await request.query(durationQuery);
    
    const totalProjects = projectStats.recordset.reduce((sum, row) => sum + row.count, 0);
    const projectsByStatus = projectStats.recordset.map(row => ({
      status: row.status,
      count: row.count,
      percentage: totalProjects > 0 ? ((row.count / totalProjects) * 100) : 0
    }));
    
    const projectsOnTime = projectsDetail.recordset.filter(p => !p.isDelayed).length;
    const projectsDelayed = projectsDetail.recordset.filter(p => p.isDelayed).length;
    
    return {
      totalProjects,
      projectsByStatus,
      projectsOnTime,
      projectsDelayed,
      averageProjectDuration: duration.recordset[0]?.avgDuration || 0,
      projects: projectsDetail.recordset.map(project => ({
        id: project.id,
        name: project.name,
        status: project.status,
        progress: project.progress,
        startDate: project.startDate?.toISOString() || '',
        endDate: project.endDate?.toISOString() || '',
        isDelayed: !!project.isDelayed
      }))
    };
  }

  // Relatórios - Controle de Tempo
  async getTimeTrackingReport(startDate: Date, endDate: Date, userId?: string, projectId?: string) {
    const request = getDb().request();
    request
      .input('startDate', sql.DateTime, startDate)
      .input('endDate', sql.DateTime, endDate);
    
    let whereClause = 'WHERE t.created_at BETWEEN @startDate AND @endDate';
    if (userId) {
      request.input('userId', sql.NVarChar, userId);
      whereClause += ' AND t.assignee_id = @userId';
    }
    if (projectId) {
      request.input('projectId', sql.NVarChar, projectId);
      whereClause += ' AND t.project_id = @projectId';
    }
    
    // Simular horas baseado em tarefas (estimativa: cada tarefa = 8 horas)
    const totalHoursQuery = `
      SELECT 
        COUNT(*) * 8 as totalHours,
        COUNT(CASE WHEN t.status = 'completed' THEN 1 END) * 8 as billableHours
      FROM tasks t
      ${whereClause}
    `;
    
    const hoursData = await request.query(totalHoursQuery);
    
    // Tempo por projeto
    const timeByProjectQuery = `
      SELECT 
        p.id as projectId,
        p.name as projectName,
        COUNT(t.id) * 8 as hours
      FROM projects p
      LEFT JOIN tasks t ON p.id = t.project_id ${whereClause.replace('WHERE t.created_at', 'AND t.created_at')}
      GROUP BY p.id, p.name
      HAVING COUNT(t.id) > 0
      ORDER BY hours DESC
    `;
    
    const timeByProject = await request.query(timeByProjectQuery);
    
    // Tempo por membro
    const timeByMemberQuery = `
      SELECT 
        u.id as memberId,
        u.name as memberName,
        COUNT(t.id) * 8 as hours
      FROM users u
      LEFT JOIN tasks t ON u.id = t.assignee_id ${whereClause.replace('WHERE t.created_at', 'AND t.created_at')}
      GROUP BY u.id, u.name
      HAVING COUNT(t.id) > 0
      ORDER BY hours DESC
    `;
    
    const timeByMember = await request.query(timeByMemberQuery);
    
    const totalHours = hoursData.recordset[0]?.totalHours || 0;
    const billableHours = hoursData.recordset[0]?.billableHours || 0;
    const nonBillableHours = totalHours - billableHours;
    
    // Calcular média de horas por dia
    const daysDiff = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
    const averageHoursPerDay = totalHours / daysDiff;
    
    return {
      totalHours,
      billableHours,
      nonBillableHours,
      averageHoursPerDay,
      timeByProject: timeByProject.recordset.map(item => ({
        projectId: item.projectId,
        projectName: item.projectName,
        hours: item.hours,
        percentage: totalHours > 0 ? ((item.hours / totalHours) * 100) : 0
      })),
      timeByMember: timeByMember.recordset.map(item => ({
        memberId: item.memberId,
        memberName: item.memberName,
        hours: item.hours,
        efficiency: Math.min(100, Math.max(0, (item.hours / (daysDiff * 8)) * 100)) // Baseado em 8h/dia
      }))
    };
  }

  // Busca global
  async globalSearch(
    query: string, 
    type: 'all' | 'projects' | 'tickets' | 'tasks' = 'all',
    limit: number = 20,
    offset: number = 0
  ) {
    const request = getDb().request();
    const searchTerm = `%${query}%`;
    request.input('searchTerm', sql.NVarChar, searchTerm);
    request.input('limit', sql.Int, limit);
    request.input('offset', sql.Int, offset);
    
    const results: any[] = [];
    let totalCount = 0;
    
    if (type === 'all' || type === 'projects') {
      const projectQuery = `
        SELECT 
          'project' as type,
          id,
          name as title,
          description,
          status,
          NULL as priority,
          NULL as assignedTo,
          NULL as projectName,
          created_at as createdAt,
          (
            CASE 
              WHEN name LIKE @searchTerm THEN 3
              WHEN description LIKE @searchTerm THEN 2
              ELSE 1
            END
          ) as relevance
        FROM projects 
        WHERE name LIKE @searchTerm OR description LIKE @searchTerm
        ORDER BY relevance DESC, created_at DESC
        OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
      `;
      
      const projectResults = await request.query(projectQuery);
      results.push(...projectResults.recordset);
      
      // Contar total de projetos
      const projectCountQuery = `
        SELECT COUNT(*) as count FROM projects 
        WHERE name LIKE @searchTerm OR description LIKE @searchTerm
      `;
      const projectCount = await request.query(projectCountQuery);
      totalCount += projectCount.recordset[0].count;
    }
    
    if (type === 'all' || type === 'tasks') {
      const taskQuery = `
        SELECT 
          'task' as type,
          t.id,
          t.title,
          t.description,
          t.status,
          t.priority,
          u.name as assignedTo,
          p.name as projectName,
          t.created_at as createdAt,
          (
            CASE 
              WHEN t.title LIKE @searchTerm THEN 3
              WHEN t.description LIKE @searchTerm THEN 2
              ELSE 1
            END
          ) as relevance
        FROM tasks t
        LEFT JOIN users u ON t.assigned_to = u.id
        LEFT JOIN projects p ON t.project_id = p.id
        WHERE t.title LIKE @searchTerm OR t.description LIKE @searchTerm
        ORDER BY relevance DESC, t.created_at DESC
        OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
      `;
      
      const taskResults = await request.query(taskQuery);
      results.push(...taskResults.recordset);
      
      // Contar total de tarefas
      const taskCountQuery = `
        SELECT COUNT(*) as count FROM tasks 
        WHERE title LIKE @searchTerm OR description LIKE @searchTerm
      `;
      const taskCount = await request.query(taskCountQuery);
      totalCount += taskCount.recordset[0].count;
    }
    
    if (type === 'all' || type === 'tickets') {
      const ticketQuery = `
        SELECT 
          'ticket' as type,
          tk.id,
          tk.title,
          tk.description,
          tk.status,
          tk.priority,
          u.name as assignedTo,
          p.name as projectName,
          tk.created_at as createdAt,
          (
            CASE 
              WHEN tk.title LIKE @searchTerm THEN 3
              WHEN tk.description LIKE @searchTerm THEN 2
              ELSE 1
            END
          ) as relevance
        FROM tickets tk
        LEFT JOIN users u ON tk.assigned_to = u.id
        LEFT JOIN projects p ON tk.project_id = p.id
        WHERE tk.title LIKE @searchTerm OR tk.description LIKE @searchTerm
        ORDER BY relevance DESC, tk.created_at DESC
        OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
      `;
      
      const ticketResults = await request.query(ticketQuery);
      results.push(...ticketResults.recordset);
      
      // Contar total de tickets
      const ticketCountQuery = `
        SELECT COUNT(*) as count FROM tickets 
        WHERE title LIKE @searchTerm OR description LIKE @searchTerm
      `;
      const ticketCount = await request.query(ticketCountQuery);
      totalCount += ticketCount.recordset[0].count;
    }
    
    // Ordenar todos os resultados por relevância e data
    const sortedResults = results
      .sort((a, b) => {
        if (a.relevance !== b.relevance) {
          return b.relevance - a.relevance;
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      })
      .map(item => ({
        id: item.id,
        type: item.type,
        title: item.title,
        description: item.description,
        status: item.status,
        priority: item.priority,
        assignedTo: item.assignedTo,
        projectName: item.projectName,
        createdAt: item.createdAt?.toISOString() || item.createdAt
      }));
    
    return {
      results: sortedResults,
      totalCount,
      hasMore: offset + limit < totalCount
    };
  }

  // Utilitário para verificação de dependência circular
  async checkCircularDependency(taskId: string, dependsOnTaskId: string): Promise<boolean> {
    const request = getDb().request();
    request
      .input('taskId', sql.NVarChar, taskId)
      .input('dependsOnTaskId', sql.NVarChar, dependsOnTaskId);

    // Verifica se o dependsOnTaskId já depende do taskId (direta ou indiretamente)
    const query = `
      WITH TaskDependencyTree AS (
        -- Caso base: dependências diretas
        SELECT task_id, depends_on_task_id, 1 as level
        FROM task_dependencies
        WHERE task_id = @dependsOnTaskId
        
        UNION ALL
        
        -- Caso recursivo: dependências transitivas
        SELECT td.task_id, td.depends_on_task_id, tdt.level + 1
        FROM task_dependencies td
        INNER JOIN TaskDependencyTree tdt ON td.task_id = tdt.depends_on_task_id
        WHERE tdt.level < 10 -- Limita a profundidade para evitar loops infinitos
      )
      SELECT COUNT(*) as count
      FROM TaskDependencyTree
      WHERE depends_on_task_id = @taskId
    `;
    
    const result = await request.query(query);
    return (result.recordset[0]?.count || 0) > 0;
  }
}

// Export a singleton instance
export const sqlServerStorage = new SqlServerStorage();