import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search, Plus, Calendar, User, AlertCircle, Clock, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import type { Task, Project, User as UserType } from "@shared/schema";

type TaskWithRelations = Task & {
  project?: {
    id: string;
    name: string;
  };
  assignee?: {
    id: string;
    name: string;
    email: string;
  };
};

const statusColumns = [
  { id: "todo", title: "A Fazer", color: "bg-gray-100" },
  { id: "in_progress", title: "Em Progresso", color: "bg-blue-100" },
  { id: "review", title: "Em Revisão", color: "bg-yellow-100" },
  { id: "done", title: "Concluído", color: "bg-green-100" },
];

export default function Kanban() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProject, setSelectedProject] = useState<string>("all");
  const [selectedAssignee, setSelectedAssignee] = useState<string>("all");

  const { data: tasks = [], isLoading } = useQuery<TaskWithRelations[]>({
    queryKey: ["/api/tasks"],
  });

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const { data: users = [] } = useQuery<UserType[]>({
    queryKey: ["/api/users"],
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ taskId, status }: { taskId: string; status: string }) => {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error("Failed to update task");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast.success("Tarefa atualizada com sucesso!");
    },
    onError: (error) => {
      console.error("Error updating task:", error);
      toast.error("Erro ao atualizar tarefa. Tente novamente.");
    },
  });

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchesSearch = searchTerm === "" || 
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesProject = selectedProject === "all" || task.projectId === selectedProject;
      const matchesAssignee = selectedAssignee === "all" || task.assigneeId === selectedAssignee;
      
      return matchesSearch && matchesProject && matchesAssignee;
    });
  }, [tasks, searchTerm, selectedProject, selectedAssignee]);

  const tasksByStatus = useMemo(() => {
    const grouped: Record<string, TaskWithRelations[]> = {};
    statusColumns.forEach(column => {
      grouped[column.id] = filteredTasks.filter(task => task.status === column.id);
    });
    return grouped;
  }, [filteredTasks]);

  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const newStatus = destination.droppableId;
    updateTaskMutation.mutate({ taskId: draggableId, status: newStatus });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-600 text-white';
      case 'high': return 'bg-red-500 text-white';
      case 'medium': return 'bg-blue-500 text-white';
      case 'low': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'critical':
      case 'high':
        return <AlertCircle className="w-3 h-3" />;
      case 'medium':
        return <Clock className="w-3 h-3" />;
      case 'low':
        return <CheckCircle className="w-3 h-3" />;
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="flex-1 overflow-y-auto">
        <Header
          title="Kanban Board"
          subtitle="Visualize e gerencie tarefas em um quadro Kanban interativo."
        />
        <div className="p-6">
          <div className="animate-pulse">
            <div className="grid grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="space-y-4">
                  <div className="h-8 bg-gray-200 rounded"></div>
                  {[1, 2, 3].map((j) => (
                    <div key={j} className="h-32 bg-gray-200 rounded"></div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <Header
        title="Kanban Board"
        subtitle="Visualize e gerencie tarefas em um quadro Kanban interativo."
      />

      <div className="p-6">
        {/* Filters */}
        <div className="mb-6 space-y-4">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar tarefas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={selectedProject} onValueChange={setSelectedProject}>
              <SelectTrigger className="w-48">
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

            <Select value={selectedAssignee} onValueChange={setSelectedAssignee}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por responsável" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Responsáveis</SelectItem>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Mostrando {filteredTasks.length} de {tasks.length} tarefas
            </div>
            <div className="flex items-center space-x-4">
              {statusColumns.map((column) => (
                <div key={column.id} className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${column.color.replace('bg-', 'bg-').replace('-100', '-500')}`}></div>
                  <span className="text-sm text-gray-600">
                    {column.title}: {tasksByStatus[column.id]?.length || 0}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Kanban Board */}
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-4 gap-6">
            {statusColumns.map((column) => (
              <div key={column.id} className="flex flex-col">
                <div className={`${column.color} rounded-t-lg p-4 border-b`}>
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-800">{column.title}</h3>
                    <Badge variant="secondary" className="bg-white/80">
                      {tasksByStatus[column.id]?.length || 0}
                    </Badge>
                  </div>
                </div>

                <Droppable droppableId={column.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex-1 p-4 space-y-3 min-h-[500px] bg-gray-50 rounded-b-lg transition-colors ${
                        snapshot.isDraggingOver ? 'bg-blue-50' : ''
                      }`}
                    >
                      {tasksByStatus[column.id]?.map((task, index) => (
                        <Draggable key={task.id} draggableId={task.id} index={index}>
                          {(provided, snapshot) => (
                            <Card
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`cursor-grab active:cursor-grabbing transition-shadow ${
                                snapshot.isDragging ? 'shadow-lg rotate-2' : 'hover:shadow-md'
                              }`}
                            >
                              <CardContent className="p-4">
                                <div className="space-y-3">
                                  <div className="flex items-start justify-between">
                                    <h4 className="font-medium text-sm leading-tight">{task.title}</h4>
                                    <Badge className={`${getPriorityColor(task.priority)} text-xs`}>
                                      <div className="flex items-center space-x-1">
                                        {getPriorityIcon(task.priority)}
                                        <span>{task.priority}</span>
                                      </div>
                                    </Badge>
                                  </div>

                                  {task.description && (
                                    <p className="text-xs text-gray-600 line-clamp-2">
                                      {task.description}
                                    </p>
                                  )}

                                  <div className="flex items-center justify-between text-xs text-gray-500">
                                    <div className="flex items-center space-x-2">
                                      {task.project && (
                                        <div className="flex items-center space-x-1">
                                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                          <span>{task.project.name}</span>
                                        </div>
                                      )}
                                    </div>
                                    
                                    {task.assignee && (
                                      <div className="flex items-center space-x-1">
                                        <Avatar className="w-5 h-5">
                                          <AvatarFallback className="text-xs">
                                            {task.assignee.name.charAt(0)}
                                          </AvatarFallback>
                                        </Avatar>
                                        <span>{task.assignee.name}</span>
                                      </div>
                                    )}
                                  </div>

                                  {(task.startDate || task.endDate) && (
                                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                                      <Calendar className="w-3 h-3" />
                                      {task.startDate && (
                                        <span>Início: {formatDate(task.startDate.toString())}</span>
                                      )}
                                      {task.endDate && (
                                        <span>Fim: {formatDate(task.endDate.toString())}</span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                      
                      {tasksByStatus[column.id]?.length === 0 && (
                        <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
                          Nenhuma tarefa
                        </div>
                      )}
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
          </div>
        </DragDropContext>
      </div>
    </div>
  );
}