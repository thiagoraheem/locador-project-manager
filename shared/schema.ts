import { sql, relations } from "drizzle-orm";
import { pgTable, text, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Type definitions for enums
export const projectStatuses = ['planning', 'in_progress', 'review', 'completed', 'on_hold'] as const;
export const ticketPriorities = ['low', 'medium', 'high', 'critical'] as const;
export const ticketStatuses = ['open', 'in_progress', 'resolved', 'closed'] as const;
export const taskStatuses = ['todo', 'in_progress', 'completed'] as const;
export const taskPriorities = ['low', 'medium', 'high'] as const;
export const notificationTypes = ['task_assigned', 'task_status_changed', 'ticket_assigned', 'ticket_status_changed', 'deadline_approaching', 'comment_added', 'dependency_completed'] as const;
export const userRoles = ['admin', 'manager', 'member', 'viewer'] as const;
export const permissionLevels = ['read', 'write', 'admin'] as const;

export type ProjectStatus = typeof projectStatuses[number];
export type TicketPriority = typeof ticketPriorities[number];
export type TicketStatus = typeof ticketStatuses[number];
export type TaskStatus = typeof taskStatuses[number];
export type TaskPriority = typeof taskPriorities[number];
export type NotificationType = typeof notificationTypes[number];
export type UserRole = typeof userRoles[number];
export type PermissionLevel = typeof permissionLevels[number];

// Table definitions
export const users = pgTable("users", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  role: text("role").notNull().default('member'),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
});

export const projects = pgTable("projects", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  status: text("status").notNull().default('planning'),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  createdBy: text("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`now()`).notNull(),
});

export const tickets = pgTable("tickets", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  priority: text("priority").notNull().default('medium'),
  status: text("status").notNull().default('open'),
  projectId: text("project_id").references(() => projects.id),
  reporterId: text("reporter_id").references(() => users.id).notNull(),
  assigneeId: text("assignee_id").references(() => users.id),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`now()`).notNull(),
});

export const tasks = pgTable("tasks", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").notNull().default('todo'),
  priority: text("priority").notNull().default('medium'),
  projectId: text("project_id").references(() => projects.id).notNull(),
  assigneeId: text("assignee_id").references(() => users.id),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`now()`).notNull(),
});

export const milestones = pgTable("milestones", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  projectId: text("project_id").references(() => projects.id).notNull(),
  dueDate: timestamp("due_date").notNull(),
  completed: boolean("completed").notNull().default(false),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
});

export const notifications = pgTable("notifications", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  type: text("type").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  entityType: text("entity_type"), // 'task', 'ticket', 'project'
  entityId: text("entity_id"), // ID da entidade relacionada
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
});

export const taskDependencies = pgTable("task_dependencies", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  taskId: text("task_id").references(() => tasks.id, { onDelete: "cascade" }).notNull(),
  dependsOnTaskId: text("depends_on_task_id").references(() => tasks.id, { onDelete: "cascade" }).notNull(),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
});

export const comments = pgTable("comments", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  content: text("content").notNull(),
  ticketId: text("ticket_id").notNull().references(() => tickets.id, { onDelete: "cascade" }),
  authorId: text("author_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`now()`).notNull(),
});

export const projectUserPermissions = pgTable("project_user_permissions", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  projectId: text("project_id").references(() => projects.id, { onDelete: "cascade" }).notNull(),
  permission: text("permission").notNull().default('read'),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`now()`).notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  projects: many(projects),
  reportedTickets: many(tickets, { relationName: "reporter" }),
  assignedTickets: many(tickets, { relationName: "assignee" }),
  assignedTasks: many(tasks),
  notifications: many(notifications),
  comments: many(comments),
  projectPermissions: many(projectUserPermissions),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  creator: one(users, {
    fields: [projects.createdBy],
    references: [users.id],
  }),
  tickets: many(tickets),
  tasks: many(tasks),
  milestones: many(milestones),
  userPermissions: many(projectUserPermissions),
}));

export const ticketsRelations = relations(tickets, ({ one, many }) => ({
  project: one(projects, {
    fields: [tickets.projectId],
    references: [projects.id],
  }),
  reporter: one(users, {
    fields: [tickets.reporterId],
    references: [users.id],
    relationName: "reporter",
  }),
  assignee: one(users, {
    fields: [tickets.assigneeId],
    references: [users.id],
    relationName: "assignee",
  }),
  comments: many(comments),
}));

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  project: one(projects, {
    fields: [tasks.projectId],
    references: [projects.id],
  }),
  assignee: one(users, {
    fields: [tasks.assigneeId],
    references: [users.id],
  }),
  dependencies: many(taskDependencies, { relationName: "task" }),
  dependents: many(taskDependencies, { relationName: "dependsOnTask" }),
}));

export const milestonesRelations = relations(milestones, ({ one }) => ({
  project: one(projects, {
    fields: [milestones.projectId],
    references: [projects.id],
  }),
}));

export const taskDependenciesRelations = relations(taskDependencies, ({ one }) => ({
  task: one(tasks, {
    fields: [taskDependencies.taskId],
    references: [tasks.id],
    relationName: "task",
  }),
  dependsOnTask: one(tasks, {
    fields: [taskDependencies.dependsOnTaskId],
    references: [tasks.id],
    relationName: "dependsOnTask",
  }),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  ticket: one(tickets, {
    fields: [comments.ticketId],
    references: [tickets.id],
  }),
  author: one(users, {
    fields: [comments.authorId],
    references: [users.id],
  }),
}));

export const projectUserPermissionsRelations = relations(projectUserPermissions, ({ one }) => ({
  user: one(users, {
    fields: [projectUserPermissions.userId],
    references: [users.id],
  }),
  project: one(projects, {
    fields: [projectUserPermissions.projectId],
    references: [projects.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  startDate: z.string(),
  endDate: z.string().optional(),
});

export const insertTicketSchema = createInsertSchema(tickets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export const insertMilestoneSchema = createInsertSchema(milestones).omit({
  id: true,
  createdAt: true,
}).extend({
  dueDate: z.string(),
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

export const insertCommentSchema = createInsertSchema(comments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTaskDependencySchema = createInsertSchema(taskDependencies).omit({
  id: true,
  createdAt: true,
});

export const insertProjectUserPermissionSchema = createInsertSchema(projectUserPermissions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type InsertTicket = z.infer<typeof insertTicketSchema>;
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type InsertMilestone = z.infer<typeof insertMilestoneSchema>;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type InsertComment = z.infer<typeof insertCommentSchema>;
export type InsertTaskDependency = z.infer<typeof insertTaskDependencySchema>;
export type InsertProjectUserPermission = z.infer<typeof insertProjectUserPermissionSchema>;

export type SelectUser = typeof users.$inferSelect;
export type SelectProject = typeof projects.$inferSelect;
export type SelectTicket = typeof tickets.$inferSelect;
export type SelectTask = typeof tasks.$inferSelect;
export type SelectMilestone = typeof milestones.$inferSelect;
export type SelectNotification = typeof notifications.$inferSelect;
export type SelectComment = typeof comments.$inferSelect;
export type SelectTaskDependency = typeof taskDependencies.$inferSelect;
export type SelectProjectUserPermission = typeof projectUserPermissions.$inferSelect;