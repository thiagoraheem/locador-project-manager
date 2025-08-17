import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckSquare, Calendar, User, Clock, MoreVertical } from "lucide-react";
import type { tasks } from "@shared/schema";
import { formatDate } from "@/lib/utils";

type Task = typeof tasks.$inferSelect;

interface ResponsiveTaskListProps {
  tasks: Task[];
  isLoading: boolean;
}

export function ResponsiveTaskList({ tasks, isLoading }: ResponsiveTaskListProps) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500 text-white';
      case 'medium': return 'bg-yellow-500 text-white';
      case 'low': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500 text-white';
      case 'in_progress': return 'bg-blue-500 text-white';
      case 'review': return 'bg-purple-500 text-white';
      case 'todo': return 'bg-gray-500 text-white';
      case 'blocked': return 'bg-red-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'high': return 'Alta';
      case 'medium': return 'Média';
      case 'low': return 'Baixa';
      default: return priority;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Concluída';
      case 'in_progress': return 'Em Progresso';
      case 'review': return 'Em Revisão';
      case 'todo': return 'A Fazer';
      case 'blocked': return 'Bloqueada';
      default: return status;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-gray-200 rounded"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  <div className="flex space-x-2">
                    <div className="h-5 bg-gray-200 rounded w-16"></div>
                    <div className="h-5 bg-gray-200 rounded w-20"></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="text-center py-12">
        <CheckSquare className="mx-auto h-16 w-16 text-gray-400" />
        <h3 className="mt-4 text-lg font-medium text-gray-900">Nenhuma tarefa encontrada</h3>
        <p className="mt-2 text-sm text-gray-500">
          Comece criando sua primeira tarefa para organizar seu trabalho.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {tasks.map((task) => (
        <Card
          key={task.id}
          className="hover:shadow-lg transition-shadow cursor-pointer group"
          data-testid={`task-card-${task.id}`}
        >
          <CardContent className="p-4 md:p-6">
            {/* Mobile Layout */}
            <div className="block md:hidden">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start space-x-3 flex-1">
                  <div className="w-8 h-8 bg-primary bg-opacity-10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckSquare className="text-primary w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm text-text line-clamp-2 mb-1">{task.title}</h3>
                    <p className="text-xs text-gray-600 line-clamp-2">{task.description}</p>
                  </div>
                </div>
                <Link href={`/tasks/${task.id}`}>
                  <Button variant="ghost" size="sm" className="p-1 h-8 w-8 flex-shrink-0">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
              
              <div className="flex flex-wrap gap-2 mb-3">
                <Badge className={`text-xs ${getPriorityColor(task.priority)}`}>
                  {getPriorityText(task.priority)}
                </Badge>
                <Badge className={`text-xs ${getStatusColor(task.status)}`}>
                  {getStatusText(task.status)}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                <div className="flex items-center">
                  <Calendar className="w-3 h-3 mr-1" />
                  {task.dueDate ? formatDate(task.dueDate) : 'Sem prazo'}
                </div>
                {task.assignedTo && (
                  <div className="flex items-center">
                    <User className="w-3 h-3 mr-1" />
                    <span className="truncate max-w-20">Atribuída</span>
                  </div>
                )}
              </div>
              
              <div className="pt-2 border-t border-gray-100">
                <Link href={`/tasks/${task.id}`}>
                  <Button variant="outline" size="sm" className="w-full text-xs">
                    Ver Tarefa
                  </Button>
                </Link>
              </div>
            </div>

            {/* Desktop Layout */}
            <div className="hidden md:block">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start space-x-4 flex-1">
                  <div className="w-12 h-12 bg-primary bg-opacity-10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <CheckSquare className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-text mb-2">{task.title}</h3>
                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">{task.description}</p>
                    
                    <div className="flex flex-wrap gap-2">
                      <Badge className={getPriorityColor(task.priority)}>
                        Prioridade {getPriorityText(task.priority)}
                      </Badge>
                      <Badge className={getStatusColor(task.status)}>
                        {getStatusText(task.status)}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mb-4 text-sm text-gray-500">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    <span>{task.dueDate ? formatDate(task.dueDate) : 'Sem prazo definido'}</span>
                  </div>
                  {task.assignedTo && (
                    <div className="flex items-center">
                      <User className="w-4 h-4 mr-1" />
                      <span>Atribuída</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  <span>Criada em {formatDate(task.createdAt)}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <Link href={`/tasks/${task.id}`}>
                  <Button 
                    variant="outline" 
                    className="w-full group-hover:bg-primary group-hover:text-white transition-colors"
                    data-testid={`view-task-${task.id}`}
                  >
                    Ver Detalhes da Tarefa
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}