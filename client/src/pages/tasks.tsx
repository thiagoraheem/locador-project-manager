import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { CheckSquare, Calendar, User, Filter, Plus, Network, List } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { type Task, type Project } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ResponsiveTaskList } from "@/components/responsive/responsive-task-list";
import { EmptyState } from "@/components/ui/empty-state";
import { TaskDependencyGraph } from "@/components/task-dependency-graph";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  const [selectedProjectId, setSelectedProjectId] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<string>("list");

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
    if (selectedProjectId !== "all" && task.projectId !== selectedProjectId) return false;
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

          <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
            <SelectTrigger className="w-48" data-testid="filter-task-project">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filtrar por projeto" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Projetos</SelectItem>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="list" className="flex items-center gap-2">
              <List className="h-4 w-4" />
              Lista de Tarefas
            </TabsTrigger>
            <TabsTrigger value="dependencies" className="flex items-center gap-2">
              <Network className="h-4 w-4" />
              Gráfico de Dependências
            </TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="mt-6">
            <ResponsiveTaskList tasks={filteredTasks} isLoading={isLoading} />
            {!isLoading && filteredTasks.length === 0 && (
              <EmptyState
                icon={CheckSquare}
                title={statusFilter === "all" ? "Nenhuma tarefa encontrada" : `Nenhuma tarefa ${getStatusText(statusFilter).toLowerCase()}`}
                description={statusFilter === "all" 
                  ? "Comece criando sua primeira tarefa para acompanhar o progresso."
                  : "Tente ajustar os filtros ou criar uma nova tarefa."
                }
                action={
                  <CreateTaskModal>
                    <Button 
                      className="bg-primary text-white hover:bg-primary/90"
                      data-testid="create-first-task-button"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Criar Primeira Tarefa
                    </Button>
                  </CreateTaskModal>
                }
              />
            )}
          </TabsContent>

          <TabsContent value="dependencies" className="mt-6">
            <TaskDependencyGraph projectId={selectedProjectId === "all" ? undefined : selectedProjectId} />
          </TabsContent>
        </Tabs>
      </div>


    </div>
  );
}