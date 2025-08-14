export interface DashboardStats {
  activeProjects: number;
  openTickets: number;
  completedTasks: number;
  teamMembers: number;
}

export type ProjectStatus = 'planning' | 'in_progress' | 'review' | 'completed' | 'on_hold';
export type TicketPriority = 'low' | 'medium' | 'high' | 'critical';
export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type TaskStatus = 'todo' | 'in_progress' | 'completed';
