import { useState, useEffect } from 'react';
import { Bell, Check, CheckCheck, X, Clock, User, MessageSquare, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNotifications } from '@/hooks/use-notifications';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Notification } from '@shared/schema';

interface NotificationsProps {
  userId: string;
}

function getNotificationIcon(type: string) {
  switch (type) {
    case 'task_assigned':
      return <User className="h-4 w-4 text-blue-500" />;
    case 'status_changed':
      return <CheckCheck className="h-4 w-4 text-green-500" />;
    case 'deadline_approaching':
      return <Clock className="h-4 w-4 text-orange-500" />;
    case 'comment_added':
      return <MessageSquare className="h-4 w-4 text-purple-500" />;
    default:
      return <AlertTriangle className="h-4 w-4 text-gray-500" />;
  }
}

function getNotificationColor(type: string) {
  switch (type) {
    case 'task_assigned':
      return 'bg-blue-50 border-blue-200';
    case 'status_changed':
      return 'bg-green-50 border-green-200';
    case 'deadline_approaching':
      return 'bg-orange-50 border-orange-200';
    case 'comment_added':
      return 'bg-purple-50 border-purple-200';
    default:
      return 'bg-gray-50 border-gray-200';
  }
}

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
}

function NotificationItem({ notification, onMarkAsRead, onDelete }: NotificationItemProps) {
  return (
    <div
      className={`p-3 border-l-4 ${
        notification.read ? 'bg-gray-50 border-gray-200' : getNotificationColor(notification.type)
      } hover:bg-gray-100 transition-colors`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 flex-1">
          {getNotificationIcon(notification.type)}
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-medium ${
              notification.read ? 'text-gray-600' : 'text-gray-900'
            }`}>
              {notification.title}
            </p>
            <p className={`text-xs mt-1 ${
              notification.read ? 'text-gray-500' : 'text-gray-700'
            }`}>
              {notification.message}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {formatDistanceToNow(new Date(notification.createdAt), {
                addSuffix: true,
                locale: ptBR,
              })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {!notification.read && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onMarkAsRead(notification.id)}
              className="h-6 w-6 p-0"
            >
              <Check className="h-3 w-3" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(notification.id)}
            className="h-6 w-6 p-0 text-gray-400 hover:text-red-500"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export function Notifications({ userId }: NotificationsProps) {
  const {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();

  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (userId) {
      fetchNotifications(userId);
    }
  }, [userId]);

  // Poll for new notifications every 30 seconds
  useEffect(() => {
    if (!userId) return;
    
    const interval = setInterval(() => {
      fetchNotifications(userId);
    }, 30000);

    return () => clearInterval(interval);
  }, [userId]);

  const handleMarkAsRead = async (id: string) => {
    await markAsRead(id);
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead(userId);
  };

  const handleDelete = async (id: string) => {
    await deleteNotification(id);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between p-2">
          <DropdownMenuLabel className="font-semibold">Notificações</DropdownMenuLabel>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              className="text-xs"
            >
              Marcar todas como lidas
            </Button>
          )}
        </div>
        <DropdownMenuSeparator />
        <ScrollArea className="h-96">
          {loading && (
            <div className="p-4 text-center text-sm text-gray-500">
              Carregando notificações...
            </div>
          )}
          {error && (
            <div className="p-4 text-center text-sm text-red-500">
              Erro ao carregar notificações
            </div>
          )}
          {!loading && !error && notifications.length === 0 && (
            <div className="p-4 text-center text-sm text-gray-500">
              Nenhuma notificação
            </div>
          )}
          {!loading && !error && notifications.length > 0 && (
            <div className="space-y-1">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={handleMarkAsRead}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}