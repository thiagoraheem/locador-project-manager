export interface DashboardStats {
  activeProjects: number;
  openTickets: number;
  completedTasks: number;
  teamMembers: number;
  totalProjects: number;
  totalTasks: number;
  projectProgress: Array<{status: string; count: number}>;
  recentActivity: Array<{type: string; message: string; timestamp: string}>;
}

export type ProjectStatus = 'planning' | 'in_progress' | 'review' | 'completed' | 'on_hold';
export type TicketPriority = 'low' | 'medium' | 'high' | 'critical';
export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type TaskStatus = 'todo' | 'in_progress' | 'completed';
