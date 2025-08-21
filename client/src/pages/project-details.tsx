import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { 
  ArrowLeft, 
  Calendar, 
  Users, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Edit,
  Trash2,
  Plus,
  Activity,
  BarChart3,
  Target
} from "lucide-react";
import EditProjectModal from "@/components/project/edit-project-modal";
import DeleteProjectModal from "@/components/project/delete-project-modal";
import { CreateTaskModal } from "@/components/task/create-task-modal";
import CreateTicketModal from "@/components/ticket/create-ticket-modal";
import type { SelectProject, SelectTask, SelectTicket, SelectUser } from "@shared/schema";

interface ProjectWithRelations extends SelectProject {
  tasks?: SelectTask[];
  tickets?: SelectTicket[];
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'planning': return 'bg-blue-100 text-blue-800';
    case 'in_progress': return 'bg-yellow-100 text-yellow-800';
    case 'review': return 'bg-purple-100 text-purple-800';
    case 'completed': return 'bg-green-100 text-green-800';
    case 'on_hold': return 'bg-gray-100 text-gray-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'planning': return 'Planejamento';
    case 'in_progress': return 'Em Progresso';
    case 'review': return 'Em Revisão';
    case 'completed': return 'Concluído';
    case 'on_hold': return 'Pausado';
    default: return status;
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'low': return 'bg-green-100 text-green-800';
    case 'medium': return 'bg-yellow-100 text-yellow-800';
    case 'high': return 'bg-orange-100 text-orange-800';
    case 'critical': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const getPriorityLabel = (priority: string) => {
  switch (priority) {
    case 'low': return 'Baixa';
    case 'medium': return 'Média';
    case 'high': return 'Alta';
    case 'critical': return 'Crítica';
    default: return priority;
  }
};

const getTicketStatusLabel = (status: string) => {
  switch (status) {
    case 'open': return 'Aberto';
    case 'in_progress': return 'Em Progresso';
    case 'resolved': return 'Resolvido';
    case 'closed': return 'Fechado';
    default: return status;
  }
};

const getTaskStatusLabel = (status: string) => {
  switch (status) {
    case 'todo': return 'A Fazer';
    case 'in_progress': return 'Em Progresso';
    case 'completed': return 'Concluído';
    default: return status;
  }
};

export default function ProjectDetails() {
  const { id } = useParams();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  const { data: project, isLoading } = useQuery<ProjectWithRelations>({
    queryKey: [`/api/projects/${id}`],
    enabled: !!id,
  });

  const { data: tasks = [] } = useQuery<SelectTask[]>({
    queryKey: [`/api/tasks?projectId=${id}`],
    enabled: !!id,
  });

  const { data: tickets = [] } = useQuery<SelectTicket[]>({
    queryKey: [`/api/tickets?projectId=${id}`],
    enabled: !!id,
  });

  const { data: users = [] } = useQuery<SelectUser[]>({
    queryKey: ["/api/users"],
  });

  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);
  const [isCreateTicketModalOpen, setIsCreateTicketModalOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex-1 overflow-y-auto">
        <div className="p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="h-64 bg-gray-200 rounded"></div>
                <div className="h-48 bg-gray-200 rounded"></div>
              </div>
              <div className="space-y-6">
                <div className="h-32 bg-gray-200 rounded"></div>
                <div className="h-48 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex-1 overflow-y-auto">
        <div className="p-6">
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900">Projeto não encontrado</h3>
            <p className="mt-2 text-sm text-gray-500">
              O projeto que você está procurando não existe ou foi removido.
            </p>
            <Link href="/projects">
              <Button className="mt-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar aos Projetos
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const totalTasks = tasks.length;
  const openTickets = tickets.filter(ticket => ticket.status === 'open').length;
  const inProgressTickets = tickets.filter(ticket => ticket.status === 'in_progress').length;
  const resolvedTickets = tickets.filter(ticket => ticket.status === 'resolved').length;
  const completedTasksCount = tasks.filter(task => task.status === 'completed').length;
  
  const progressPercentage = totalTasks > 0 ? (completedTasksCount / totalTasks) * 100 : 0;

  const formatDate = (date: string | undefined) => {
    if (!date) return 'Não definida';
    return new Date(date).toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (date: string) => {
    return new Date(date).toLocaleString('pt-BR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Enhanced statistics
  const todoTasks = tasks.filter(task => task.status === 'todo').length;
  const inProgressTasks = tasks.filter(task => task.status === 'in_progress').length;
  
  const lowPriorityTickets = tickets.filter(ticket => ticket.priority === 'low').length;
  const mediumPriorityTickets = tickets.filter(ticket => ticket.priority === 'medium').length;
  const highPriorityTickets = tickets.filter(ticket => ticket.priority === 'high').length;
  const criticalPriorityTickets = tickets.filter(ticket => ticket.priority === 'critical').length;
  
  // Get creator information
  const creator = users.find(user => user.id === (project?.createdBy || ''));
  
  // Recent activities timeline
  const recentActivities = [
    ...tasks.map(task => ({
      id: task.id,
      type: 'task' as const,
      title: task.title,
      action: 'criada',
      date: task.createdAt,
      status: task.status,
      priority: task.priority || 'medium'
    })),
    ...tickets.map(ticket => ({
      id: ticket.id,
      type: 'ticket' as const,
      title: ticket.title,
      action: 'criado',
      date: ticket.createdAt,
      status: ticket.status,
      priority: ticket.priority
    }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-6">
        {/* Breadcrumb */}
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/">Dashboard</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/projects">Projetos</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{project?.name || 'Carregando...'}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
            <div className="flex flex-wrap items-center gap-4 mt-2">
              <Badge className={getStatusColor(project.status)}>
                {getStatusLabel(project.status)}
              </Badge>
              {creator && (
                <div className="flex items-center text-sm text-gray-500">
                  <Users className="w-4 h-4 mr-1" />
                  Criado por {creator.name}
                </div>
              )}
              <div className="flex items-center text-sm text-gray-500">
                <Calendar className="w-4 h-4 mr-1" />
                {formatDate(project.startDate)}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <CreateTaskModal projectId={id}>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Nova Tarefa
              </Button>
            </CreateTaskModal>
            <Button 
              size="sm"
              variant="outline"
              onClick={() => setIsCreateTicketModalOpen(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo Chamado
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setIsEditModalOpen(true)}
            >
              <Edit className="w-4 h-4 mr-2" />
              Editar
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setIsDeleteModalOpen(true)}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Excluir
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Project Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Informações do Projeto
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Descrição</h4>
                  <p className="text-gray-600">
                    {project.description || 'Nenhuma descrição fornecida.'}
                  </p>
                </div>
                
                <Separator />
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-blue-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Data de Início</p>
                      <p className="text-sm text-gray-600">{formatDate(project.startDate)}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-green-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Data de Término</p>
                      <p className="text-sm text-gray-600">{formatDate(project.endDate)}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-purple-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Criado em</p>
                      <p className="text-sm text-gray-600">{formatDate(project.createdAt)}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tasks */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    Tarefas ({tasks.length})
                  </div>
                  <CreateTaskModal projectId={id}>
                    <Button size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Nova Tarefa
                    </Button>
                  </CreateTaskModal>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {tasks.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma tarefa</h3>
                    <p className="mt-1 text-sm text-gray-500">Comece criando uma nova tarefa.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {tasks.slice(0, 5).map((task) => (
                      <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <CheckCircle className={`w-5 h-5 ${
                            task.status === 'completed' ? 'text-green-500' : 'text-gray-300'
                          }`} />
                          <div>
                            <p className="font-medium text-gray-900">{task.title}</p>
                            <p className="text-sm text-gray-500">{task.description}</p>
                          </div>
                        </div>
                        <Badge className={getStatusColor(task.status)}>
                          {getTaskStatusLabel(task.status)}
                        </Badge>
                      </div>
                    ))}
                    {tasks.length > 5 && (
                      <div className="text-center pt-2">
                        <Button variant="link" size="sm">
                          Ver todas as {tasks.length} tarefas
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tickets */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    Chamados ({tickets.length})
                  </div>
                  <Button size="sm" onClick={() => setIsCreateTicketModalOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Novo Chamado
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {tickets.length === 0 ? (
                  <div className="text-center py-8">
                    <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum chamado</h3>
                    <p className="mt-1 text-sm text-gray-500">Comece criando um novo chamado.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {tickets.slice(0, 5).map((ticket) => (
                      <div key={ticket.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <AlertCircle className={`w-5 h-5 ${
                            ticket.priority === 'critical' ? 'text-red-500' :
                            ticket.priority === 'high' ? 'text-orange-500' :
                            ticket.priority === 'medium' ? 'text-yellow-500' : 'text-green-500'
                          }`} />
                          <div>
                            <p className="font-medium text-gray-900">{ticket.title}</p>
                            <p className="text-sm text-gray-500">{ticket.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={getPriorityColor(ticket.priority)}>
                            {getPriorityLabel(ticket.priority)}
                          </Badge>
                          <Badge className={getStatusColor(ticket.status)}>
                            {getTicketStatusLabel(ticket.status)}
                          </Badge>
                        </div>
                      </div>
                    ))}
                    {tickets.length > 5 && (
                      <div className="text-center pt-2">
                        <Button variant="link" size="sm">
                          Ver todos os {tickets.length} chamados
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Progress */}
            <Card>
              <CardHeader>
                <CardTitle>Progresso do Projeto</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Tarefas Concluídas</span>
                    <span>{completedTasksCount}/{totalTasks}</span>
                  </div>
                  <Progress value={progressPercentage} className="h-2" />
                  <p className="text-xs text-gray-500 mt-1">
                    {Math.round(progressPercentage)}% concluído
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Enhanced Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Estatísticas Detalhadas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Task Statistics */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Breakdown de Tarefas</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-lg font-bold text-gray-600">{todoTasks}</div>
                      <div className="text-xs text-gray-500">A Fazer</div>
                    </div>
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-lg font-bold text-blue-600">{inProgressTasks}</div>
                      <div className="text-xs text-gray-500">Em Progresso</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-lg font-bold text-green-600">{completedTasksCount}</div>
                      <div className="text-xs text-gray-500">Concluídas</div>
                    </div>
                    <div className="text-center p-3 bg-slate-50 rounded-lg">
                      <div className="text-lg font-bold text-slate-600">{totalTasks}</div>
                      <div className="text-xs text-gray-500">Total</div>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                {/* Ticket Statistics */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Breakdown de Chamados</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        Baixa Prioridade
                      </span>
                      <span className="font-medium text-green-600">{lowPriorityTickets}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm flex items-center gap-2">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                        Média Prioridade
                      </span>
                      <span className="font-medium text-yellow-600">{mediumPriorityTickets}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm flex items-center gap-2">
                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                        Alta Prioridade
                      </span>
                      <span className="font-medium text-orange-600">{highPriorityTickets}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm flex items-center gap-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        Crítica
                      </span>
                      <span className="font-medium text-red-600">{criticalPriorityTickets}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activities Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Atividades Recentes
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recentActivities.length === 0 ? (
                  <div className="text-center py-8">
                    <Activity className="mx-auto h-8 w-8 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma atividade</h3>
                    <p className="mt-1 text-sm text-gray-500">As atividades aparecerão aqui.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentActivities.map((activity) => (
                      <div key={`${activity.type}-${activity.id}`} className="flex items-start space-x-3">
                        <div className={`w-2 h-2 rounded-full mt-2 ${
                          activity.type === 'task' 
                            ? activity.status === 'completed' ? 'bg-green-500' : 'bg-blue-500'
                            : activity.priority === 'critical' ? 'bg-red-500' : 
                              activity.priority === 'high' ? 'bg-orange-500' : 'bg-yellow-500'
                        }`}></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {activity.type === 'task' ? 'Tarefa' : 'Chamado'} "{activity.title}" {activity.action}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${
                                activity.type === 'task' 
                                  ? getStatusColor(activity.status)
                                  : getPriorityColor(activity.priority)
                              }`}
                            >
                              {activity.type === 'task' 
                                ? getTaskStatusLabel(activity.status)
                                : getPriorityLabel(activity.priority)
                              }
                            </Badge>
                            <p className="text-xs text-gray-500">
                              {formatDateTime(activity.date)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      {/* Edit Project Modal */}
      <EditProjectModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        project={project}
      />
      
      {/* Delete Project Modal */}
      <DeleteProjectModal
        open={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        project={project}
      />
      
      {/* Create Ticket Modal */}
      <CreateTicketModal
        open={isCreateTicketModalOpen}
        onOpenChange={setIsCreateTicketModalOpen}
      />
    </div>
  );
}