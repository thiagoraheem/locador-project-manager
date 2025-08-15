import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { 
  ArrowLeft, 
  Calendar, 
  Users, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Edit,
  Trash2,
  Plus
} from "lucide-react";
import EditProjectModal from "@/components/project/edit-project-modal";
import DeleteProjectModal from "@/components/project/delete-project-modal";
import type { Project, Task, Ticket } from "@shared/schema";

interface ProjectWithRelations extends Project {
  tasks?: Task[];
  tickets?: Ticket[];
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

  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: [`/api/tasks?projectId=${id}`],
    enabled: !!id,
  });

  const { data: tickets = [] } = useQuery<Ticket[]>({
    queryKey: [`/api/tickets?projectId=${id}`],
    enabled: !!id,
  });

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

  const completedTasks = tasks.filter(task => task.status === 'completed').length;
  const totalTasks = tasks.length;
  const progressPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  const openTickets = tickets.filter(ticket => ticket.status === 'open').length;
  const inProgressTickets = tickets.filter(ticket => ticket.status === 'in_progress').length;
  const resolvedTickets = tickets.filter(ticket => ticket.status === 'resolved').length;

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Link href="/projects">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
              <p className="text-sm text-gray-500">Detalhes do projeto</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
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
                <CardTitle className="flex items-center justify-between">
                  Informações do Projeto
                  <Badge className={getStatusColor(project.status)}>
                    {getStatusLabel(project.status)}
                  </Badge>
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
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Data de Início</p>
                      <p className="text-sm text-gray-600">{formatDate(project.startDate)}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Data de Término</p>
                      <p className="text-sm text-gray-600">{formatDate(project.endDate)}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tasks */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Tarefas ({tasks.length})
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Nova Tarefa
                  </Button>
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
                  Chamados ({tickets.length})
                  <Button size="sm">
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
                    <span>{completedTasks}/{totalTasks}</span>
                  </div>
                  <Progress value={progressPercentage} className="h-2" />
                  <p className="text-xs text-gray-500 mt-1">
                    {Math.round(progressPercentage)}% concluído
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Statistics */}
            <Card>
              <CardHeader>
                <CardTitle>Estatísticas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{totalTasks}</div>
                    <div className="text-xs text-gray-500">Total de Tarefas</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{completedTasks}</div>
                    <div className="text-xs text-gray-500">Concluídas</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{tickets.length}</div>
                    <div className="text-xs text-gray-500">Chamados</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{openTickets}</div>
                    <div className="text-xs text-gray-500">Em Aberto</div>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Chamados Abertos</span>
                    <span className="font-medium">{openTickets}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Em Progresso</span>
                    <span className="font-medium">{inProgressTickets}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Resolvidos</span>
                    <span className="font-medium">{resolvedTickets}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm font-medium">Projeto criado</p>
                      <p className="text-xs text-gray-500">
                        {formatDate(project.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm font-medium">Início do projeto</p>
                      <p className="text-xs text-gray-500">
                        {formatDate(project.startDate)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-gray-300 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm font-medium">Término previsto</p>
                      <p className="text-xs text-gray-500">
                        {formatDate(project.endDate)}
                      </p>
                    </div>
                  </div>
                </div>
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
    </div>
  );
}