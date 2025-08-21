import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import Header from "@/components/layout/header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search, Calendar, AlertCircle, Clock, CheckCircle, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import type { SelectTask, SelectProject, SelectUser } from "@shared/schema";

type TaskWithRelations = SelectTask & {
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

// Componente do Card Arrastável
function TaskCard({ task }: { task: TaskWithRelations }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
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

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`cursor-grab active:cursor-grabbing transition-all duration-200 ${
        isDragging ? 'shadow-lg scale-105 rotate-2 z-50' : 'hover:shadow-md'
      }`}
      data-testid={`task-card-${task.id}`}
    >
      <CardContent className="p-3">
        <div className="space-y-2">
          {/* Header com título e ações */}
          <div className="flex items-start gap-2">
            <h4 className="font-medium text-sm leading-tight flex-1 min-w-0">
              {task.title}
            </h4>
            <div className="flex items-center gap-1 flex-shrink-0">
              <Badge 
                variant={getPriorityColor(task.priority)}
                className="text-xs px-1.5 py-0.5 h-auto flex items-center gap-1"
              >
                {getPriorityIcon(task.priority)}
                <span className="hidden sm:inline">{task.priority}</span>
              </Badge>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <MoreHorizontal className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>Editar</DropdownMenuItem>
                  <DropdownMenuItem className="text-red-600">Excluir</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Descrição */}
          {task.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {task.description}
            </p>
          )}

          {/* Meta informações */}
          <div className="flex flex-col gap-1.5">
            {/* Projeto */}
            {task.project && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                <span className="truncate">{task.project.name}</span>
              </div>
            )}
            
            {/* Responsável */}
            {task.assignee && (
              <div className="flex items-center gap-1.5 text-xs">
                <Avatar className="w-4 h-4 flex-shrink-0">
                  <AvatarFallback className="text-xs bg-muted">
                    {task.assignee.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="truncate text-muted-foreground">{task.assignee.name}</span>
              </div>
            )}

            {/* Datas */}
            {(task.startDate || task.endDate) && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Calendar className="w-3 h-3 flex-shrink-0" />
                <div className="flex gap-2 min-w-0">
                  {task.startDate && (
                    <span className="truncate">{formatDate(task.startDate.toString())}</span>
                  )}
                  {task.startDate && task.endDate && <span>-</span>}
                  {task.endDate && (
                    <span className="truncate">{formatDate(task.endDate.toString())}</span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Componente da Coluna
function KanbanColumn({ 
  column, 
  tasks
}: { 
  column: { id: string; title: string; color: string }, 
  tasks: TaskWithRelations[]
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  });

  return (
    <div className="flex flex-col min-h-0">
      <div className={`${column.color} rounded-t-lg p-3 border-b flex-shrink-0`}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-800 text-sm">{column.title}</h3>
          <Badge variant="secondary" className="bg-white/80 text-xs px-2 py-0.5">
            {tasks.length}
          </Badge>
        </div>
      </div>

      <SortableContext items={tasks.map(task => task.id)} strategy={verticalListSortingStrategy}>
        <div
          ref={setNodeRef}
          className={`flex-1 p-3 space-y-3 min-h-[400px] bg-gray-50/50 rounded-b-lg transition-colors ${
            isOver ? 'bg-blue-50 border-2 border-blue-300 border-dashed' : ''
          }`}
        >
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
          
          {tasks.length === 0 && (
            <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
              {isOver ? 'Solte a tarefa aqui' : 'Nenhuma tarefa'}
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
}

export default function Kanban() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProject, setSelectedProject] = useState<string>("all");
  const [selectedAssignee, setSelectedAssignee] = useState<string>("all");
  const [activeId, setActiveId] = useState<string | null>(null);

  // Configurar sensores para drag & drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const { data: tasks = [], isLoading } = useQuery<TaskWithRelations[]>({
    queryKey: ["/api/tasks"],
  });

  const { data: projects = [] } = useQuery<SelectProject[]>({
    queryKey: ["/api/projects"],
  });

  const { data: users = [] } = useQuery<SelectUser[]>({
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

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;
    
    // Se o over é uma coluna (começar com um dos status)
    const overColumn = statusColumns.find(col => overId === col.id);
    if (overColumn) {
      const activeTask = tasks.find(task => task.id === activeId);
      if (activeTask && activeTask.status !== overColumn.id) {
        updateTaskMutation.mutate({ taskId: activeId, status: overColumn.id });
      }
    }
  };

  const activeTask = activeId ? tasks.find(task => task.id === activeId) : null;

  if (isLoading) {
    return (
      <div className="flex-1 overflow-y-auto">
        <Header
          title="Kanban Board"
          subtitle="Visualize e gerencie tarefas em um quadro Kanban interativo."
        />
        <div className="p-6">
          <div className="animate-pulse">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
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
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="relative flex-1 w-full max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar tarefas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full"
                data-testid="search-tasks"
              />
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger className="w-full sm:w-48">
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
                <SelectTrigger className="w-full sm:w-48">
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
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="text-sm text-muted-foreground">
              Mostrando {filteredTasks.length} de {tasks.length} tarefas
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-4">
              {statusColumns.map((column) => (
                <div key={column.id} className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${column.color.replace('bg-', 'bg-').replace('-100', '-500')}`}></div>
                  <span className="text-sm text-muted-foreground whitespace-nowrap">
                    {column.title}: {tasksByStatus[column.id]?.length || 0}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Kanban Board */}
        <DndContext 
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 auto-rows-fr">
            {statusColumns.map((column) => (
              <div key={column.id} className="flex flex-col min-h-[500px]" data-testid={`column-${column.id}`}>
                <KanbanColumn
                  column={column}
                  tasks={tasksByStatus[column.id] || []}
                />
              </div>
            ))}
          </div>
          
          <DragOverlay>
            {activeTask && <TaskCard task={activeTask} />}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
}