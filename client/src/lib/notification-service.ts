import type { InsertNotification } from '@shared/schema';

interface NotificationService {
  createTaskAssignedNotification: (taskId: string, taskTitle: string, assignedUserId: string, assignedByUserId: string) => Promise<void>;
  createStatusChangedNotification: (taskId: string, taskTitle: string, newStatus: string, userId: string) => Promise<void>;
  createDeadlineApproachingNotification: (taskId: string, taskTitle: string, deadline: Date, userId: string) => Promise<void>;
  createCommentAddedNotification: (taskId: string, taskTitle: string, commentAuthor: string, userId: string) => Promise<void>;
}

class NotificationServiceImpl implements NotificationService {
  private async createNotification(notification: Omit<InsertNotification, 'id' | 'createdAt'>) {
    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(notification),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create notification');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  async createTaskAssignedNotification(
    taskId: string,
    taskTitle: string,
    assignedUserId: string,
    assignedByUserId: string
  ) {
    const notification: Omit<InsertNotification, 'id' | 'createdAt'> = {
      type: 'task_assigned',
      title: 'Nova tarefa atribuída',
      message: `Você foi atribuído à tarefa "${taskTitle}"`,
      userId: assignedUserId,
      entityType: 'task',
      entityId: taskId,
      read: false,
    };

    await this.createNotification(notification);
  }

  async createStatusChangedNotification(
    taskId: string,
    taskTitle: string,
    newStatus: string,
    userId: string
  ) {
    const statusLabels: Record<string, string> = {
      'todo': 'Para Fazer',
      'in_progress': 'Em Progresso',
      'review': 'Em Revisão',
      'done': 'Concluída',
    };

    const notification: Omit<InsertNotification, 'id' | 'createdAt'> = {
      type: 'status_changed',
      title: 'Status da tarefa alterado',
      message: `A tarefa "${taskTitle}" foi alterada para ${statusLabels[newStatus] || newStatus}`,
      userId,
      entityType: 'task',
      entityId: taskId,
      read: false,
    };

    await this.createNotification(notification);
  }

  async createDeadlineApproachingNotification(
    taskId: string,
    taskTitle: string,
    deadline: Date,
    userId: string
  ) {
    const daysUntilDeadline = Math.ceil(
      (deadline.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );

    let message: string;
    if (daysUntilDeadline === 0) {
      message = `A tarefa "${taskTitle}" vence hoje!`;
    } else if (daysUntilDeadline === 1) {
      message = `A tarefa "${taskTitle}" vence amanhã`;
    } else {
      message = `A tarefa "${taskTitle}" vence em ${daysUntilDeadline} dias`;
    }

    const notification: Omit<InsertNotification, 'id' | 'createdAt'> = {
      type: 'deadline_approaching',
      title: 'Prazo se aproximando',
      message,
      userId,
      entityType: 'task',
      entityId: taskId,
      read: false,
    };

    await this.createNotification(notification);
  }

  async createCommentAddedNotification(
    taskId: string,
    taskTitle: string,
    commentAuthor: string,
    userId: string
  ) {
    const notification: Omit<InsertNotification, 'id' | 'createdAt'> = {
      type: 'comment_added',
      title: 'Novo comentário',
      message: `${commentAuthor} comentou na tarefa "${taskTitle}"`,
      userId,
      entityType: 'task',
      entityId: taskId,
      read: false,
    };

    await this.createNotification(notification);
  }
}

export const notificationService = new NotificationServiceImpl();