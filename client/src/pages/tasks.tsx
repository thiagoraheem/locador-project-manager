import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CheckSquare, Calendar, User, Filter, Plus } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { type Task, type Project } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Header from "@/components/layout/header";
import { CreateTaskModal } from "@/components/task/create-task-modal";

type TaskWithProject = Task & {
  project?: Project;
  assignee?: { name: string; email: string };
};

export default function Tasks() {
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: tasks = [], isLoading } = useQuery<TaskWithProject[]>({
    queryKey: ["/api/tasks"],
  });

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500 text-white';
      case 'in_progress': return 'bg-blue-500 text-white';
      case 'todo': return 'bg-gray-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Concluída';
      case 'in_progress': return 'Em Progresso';
      case 'todo': return 'A Fazer';
      default: return status;
    }
  };

  const filteredTasks = tasks.filter(task => {
    if (statusFilter !== "all" && task.status !== statusFilter) return false;
    return true;
  });

  const formatDate = (date: Date | string | null) => {
    if (!date) return "Não definida";
    try {
      return format(new Date(date), "dd/MM/yyyy", { locale: ptBR });
    } catch {
      return "Data inválida";
    }
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-6 border-b border-gray-200 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-text">Tarefas</h1>
          <p className="text-gray-600">Gerencie e acompanhe todas as tarefas dos seus projetos.</p>
        </div>
        <CreateTaskModal>
          <Button className="bg-primary text-white hover:bg-primary/90" data-testid="create-task-button">
            <Plus className="h-4 w-4 mr-2" />
            Nova Tarefa
          </Button>
        </CreateTaskModal>
      </div>
      
      <div className="p-6">
        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48" data-testid="filter-task-status">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Status</SelectItem>
              <SelectItem value="todo">A Fazer</SelectItem>
              <SelectItem value="in_progress">Em Progresso</SelectItem>
              <SelectItem value="completed">Concluídas</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="h-4 bg-gray-200 rounded mb-3"></div>
                  <div className="h-3 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded mb-4"></div>
                  <div className="flex justify-between">
                    <div className="h-5 bg-gray-200 rounded w-20"></div>
                    <div className="h-5 bg-gray-200 rounded w-16"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="text-center py-12">
            <CheckSquare className="mx-auto h-16 w-16 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              {statusFilter === "all" ? "Nenhuma tarefa encontrada" : `Nenhuma tarefa ${getStatusText(statusFilter).toLowerCase()}`}
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              {statusFilter === "all" 
                ? "Comece criando sua primeira tarefa para acompanhar o progresso."
                : "Tente ajustar os filtros ou criar uma nova tarefa."
              }
            </p>
            <CreateTaskModal>
              <Button 
                className="mt-4 bg-primary text-white hover:bg-primary/90"
                data-testid="create-first-task-button"
              >
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeira Tarefa
              </Button>
            </CreateTaskModal>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTasks.map((task) => (
              <Card 
                key={task.id} 
                className="hover:shadow-lg transition-shadow cursor-pointer"
                data-testid={`task-card-${task.id}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-medium text-text mb-1 line-clamp-2">
                        {task.title}
                      </h3>
                      <Badge className={getStatusColor(task.status)}>
                        {getStatusText(task.status)}
                      </Badge>
                    </div>
                  </div>

                  {task.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {task.description}
                    </p>
                  )}

                  <div className="space-y-2 text-xs text-gray-500">
                    <div className="flex items-center">
                      <Calendar className="w-3 h-3 mr-2" />
                      <span>Início: {formatDate(task.startDate)}</span>
                    </div>
                    <div className="flex items-center">
                      <Calendar className="w-3 h-3 mr-2" />
                      <span>Fim: {formatDate(task.endDate)}</span>
                    </div>
                    {task.assignee && (
                      <div className="flex items-center">
                        <User className="w-3 h-3 mr-2" />
                        <span>{task.assignee.name}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="text-xs text-gray-500">
                      Projeto: {task.project?.name || "Não definido"}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>


    </div>
  );
}