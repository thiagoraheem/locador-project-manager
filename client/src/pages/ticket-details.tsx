import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  ArrowLeft, 
  Calendar, 
  User, 
  AlertCircle, 
  Clock, 
  CheckCircle,
  Edit,
  Trash2,
  MessageSquare,
  UserCheck,
  Building,
  Activity,
  ExternalLink
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { apiRequest } from "@/lib/queryClient";
import type { SelectTicket, SelectUser, SelectProject } from "@shared/schema";
import AdvancedCommentSystem from "@/components/ticket/advanced-comment-system";

type TicketWithRelations = SelectTicket & {
  project?: SelectProject;
  reporter?: SelectUser;
  assignee?: SelectUser;
};

import EditTicketModal from "@/components/modals/edit-ticket-modal";
import DeleteTicketModal from "@/components/modals/delete-ticket-modal";

const getStatusColor = (status: string) => {
  switch (status) {
    case 'open': return 'bg-red-100 text-red-800';
    case 'in_progress': return 'bg-blue-100 text-blue-800';
    case 'resolved': return 'bg-green-100 text-green-800';
    case 'closed': return 'bg-gray-100 text-gray-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'open': return 'Aberto';
    case 'in_progress': return 'Em Progresso';
    case 'resolved': return 'Resolvido';
    case 'closed': return 'Fechado';
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

const getPriorityIcon = (priority: string) => {
  switch (priority) {
    case 'critical':
    case 'high':
      return <AlertCircle className="w-4 h-4" />;
    case 'medium':
      return <Clock className="w-4 h-4" />;
    case 'low':
      return <CheckCircle className="w-4 h-4" />;
    default:
      return <AlertCircle className="w-4 h-4" />;
  }
};

export default function TicketDetails() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const { toast } = useToast();
  
  const { data: ticket, isLoading, error } = useQuery<TicketWithRelations>({
    queryKey: ["/api/tickets", id],
    queryFn: async () => {
      if (!id) throw new Error("No ticket ID provided");
      const response = await apiRequest('GET', `/api/tickets/${id}`);
      return response.json();
    },
    enabled: !!id,
  });

  // Fetch users for assignee info
  const { data: users = [] } = useQuery<SelectUser[]>({
    queryKey: ["/api/users"],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/users');
      return response.json();
    },
  });

  // Fetch projects for project info
  const { data: projects = [] } = useQuery<SelectProject[]>({
    queryKey: ["/api/projects"],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/projects');
      return response.json();
    },
  });

  // Update ticket status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      if (!id) throw new Error("No ticket ID provided");
      const response = await apiRequest('PUT', `/api/tickets/${id}`, {
        ...ticket,
        status: newStatus,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tickets", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
      toast({
        title: "Status atualizado",
        description: "Status do ticket foi atualizado com sucesso.",
      });
    },
    onError: (error) => {
      console.error("Error updating ticket status:", error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar status. Tente novamente.",
        variant: "destructive",
      });
    },
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

  if (!ticket) {
    return (
      <div className="flex-1 overflow-y-auto">
        <div className="p-6">
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900">Chamado não encontrado</h3>
            <p className="mt-2 text-sm text-gray-500">
              O chamado que você está procurando não existe ou foi removido.
            </p>
            <Link href="/tickets">
              <Button className="mt-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar aos Chamados
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatRelativeDate = (date: string) => {
    try {
      return formatDistanceToNow(new Date(date), {
        addSuffix: true,
        locale: ptBR,
      });
    } catch {
      return "Data inválida";
    }
  };

  // Get enriched ticket data
  const enrichedTicket = ticket ? {
    ...ticket,
    project: projects.find(p => p.id === ticket.projectId),
    reporter: users.find(u => u.id === ticket.reporterId),
    assignee: users.find(u => u.id === ticket.assigneeId),
  } : null;



  if (!enrichedTicket) {
    return (
      <div className="flex-1 overflow-y-auto">
        <div className="p-6">
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900">Chamado não encontrado</h3>
            <p className="mt-2 text-sm text-gray-500">
              O chamado que você está procurando não existe ou foi removido.
            </p>
            <Link href="/tickets">
              <Button className="mt-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar aos Chamados
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 md:p-6 space-y-6 min-h-full">
          {/* Breadcrumb Navigation */}
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/">Dashboard</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="/tickets">Tickets</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{enrichedTicket.title}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

        {/* Header */}
        <div className="bg-white border rounded-lg p-6">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <div className={`p-2 rounded-lg ${getPriorityColor(enrichedTicket.priority)} bg-opacity-10`}>
                  {getPriorityIcon(enrichedTicket.priority)}
                </div>
                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-gray-900 break-words">{enrichedTicket.title}</h1>
                  <p className="text-sm text-gray-500">Ticket #{enrichedTicket.id.slice(0, 8)}</p>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-4 mt-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-600">Status:</span>
                  <Select 
                    value={enrichedTicket.status} 
                    onValueChange={(value) => updateStatusMutation.mutate(value)}
                  >
                    <SelectTrigger className="w-auto">
                      <Badge className={getStatusColor(enrichedTicket.status)}>
                        {getStatusLabel(enrichedTicket.status)}
                      </Badge>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Aberto</SelectItem>
                      <SelectItem value="in_progress">Em Progresso</SelectItem>
                      <SelectItem value="resolved">Resolvido</SelectItem>
                      <SelectItem value="closed">Fechado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-600">Prioridade:</span>
                  <Badge className={getPriorityColor(enrichedTicket.priority)}>
                    {getPriorityLabel(enrichedTicket.priority)}
                  </Badge>
                </div>
                
                {enrichedTicket.assignee && (
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-600">Assignee:</span>
                    <div className="flex items-center gap-2">
                      <Avatar className="w-6 h-6">
                        <AvatarFallback className="text-xs">
                          {enrichedTicket.assignee.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-gray-700">{enrichedTicket.assignee.name}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditModalOpen(true)}
              >
                <Edit className="w-4 h-4 mr-2" />
                Editar
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setIsDeleteModalOpen(true)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="xl:col-span-3 space-y-6">
            {/* Ticket Description */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Descrição
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  {enrichedTicket.description ? (
                    <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                      {enrichedTicket.description}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p>Nenhuma descrição fornecida para este ticket.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Comments Section */}
            <AdvancedCommentSystem 
              ticketId={id!} 
              currentUserId="user-1" // TODO: Get from auth context
            />

          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Ticket Metadata */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Metadados
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Reporter */}
                <div className="flex items-start gap-3">
                  <User className="w-4 h-4 text-gray-500 mt-1" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Reportado por</p>
                    <div className="flex items-center gap-2 mt-1">
                      {enrichedTicket.reporter ? (
                        <>
                          <Avatar className="w-6 h-6">
                            <AvatarFallback className="text-xs">
                              {enrichedTicket.reporter.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm text-gray-700">{enrichedTicket.reporter.name}</p>
                            <p className="text-xs text-gray-500">{enrichedTicket.reporter.email}</p>
                          </div>
                        </>
                      ) : (
                        <p className="text-sm text-gray-500">Usuário não encontrado</p>
                      )}
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                {/* Assignee */}
                <div className="flex items-start gap-3">
                  <UserCheck className="w-4 h-4 text-gray-500 mt-1" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Responsável</p>
                    <div className="flex items-center gap-2 mt-1">
                      {enrichedTicket.assignee ? (
                        <>
                          <Avatar className="w-6 h-6">
                            <AvatarFallback className="text-xs">
                              {enrichedTicket.assignee.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm text-gray-700">{enrichedTicket.assignee.name}</p>
                            <p className="text-xs text-gray-500">{enrichedTicket.assignee.email}</p>
                          </div>
                        </>
                      ) : (
                        <p className="text-sm text-gray-500">Não atribuído</p>
                      )}
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                {/* Project */}
                {enrichedTicket.project && (
                  <>
                    <div className="flex items-start gap-3">
                      <Building className="w-4 h-4 text-gray-500 mt-1" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">Projeto</p>
                        <Link href={`/projects/${enrichedTicket.project.id}`}>
                          <Button variant="link" className="p-0 h-auto text-sm text-blue-600 hover:text-blue-800">
                            <ExternalLink className="w-3 h-3 mr-1" />
                            {enrichedTicket.project.name}
                          </Button>
                        </Link>
                        <p className="text-xs text-gray-500 mt-1">
                          Status: {enrichedTicket.project.status}
                        </p>
                      </div>
                    </div>
                    <Separator />
                  </>
                )}
                
                {/* Dates */}
                <div className="flex items-start gap-3">
                  <Calendar className="w-4 h-4 text-gray-500 mt-1" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Criado</p>
                    <p className="text-sm text-gray-700">
                      {formatDate(enrichedTicket.createdAt.toString())}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatRelativeDate(enrichedTicket.createdAt.toString())}
                    </p>
                    
                    {enrichedTicket.updatedAt !== enrichedTicket.createdAt && (
                      <div className="mt-2">
                        <p className="text-sm font-medium text-gray-900">Última atualização</p>
                        <p className="text-sm text-gray-700">
                          {formatDate(enrichedTicket.updatedAt.toString())}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatRelativeDate(enrichedTicket.updatedAt.toString())}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Activity Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Timeline de Atividades
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Creation Event */}
                  <div className="flex items-start gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <div className="w-px h-8 bg-gray-200"></div>
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-blue-500" />
                        <p className="text-sm font-medium text-gray-900">Ticket criado</p>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDate(enrichedTicket.createdAt.toString())}
                      </p>
                      <p className="text-xs text-gray-400">
                        por {enrichedTicket.reporter?.name || 'Usuário desconhecido'}
                      </p>
                    </div>
                  </div>
                  
                  {/* Current Status */}
                  <div className="flex items-start gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full ${
                        enrichedTicket.status === 'open' ? 'bg-red-500' :
                        enrichedTicket.status === 'in_progress' ? 'bg-blue-500' :
                        enrichedTicket.status === 'resolved' ? 'bg-green-500' :
                        'bg-gray-500'
                      }`}></div>
                      {enrichedTicket.updatedAt !== enrichedTicket.createdAt && (
                        <div className="w-px h-8 bg-gray-200"></div>
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-gray-500" />
                        <p className="text-sm font-medium text-gray-900">
                          Status: {getStatusLabel(enrichedTicket.status)}
                        </p>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {enrichedTicket.updatedAt !== enrichedTicket.createdAt ? (
                          <>
                            Atualizado {formatRelativeDate(enrichedTicket.updatedAt.toString())}
                          </>
                        ) : (
                          'Sem alterações desde a criação'
                        )}
                      </p>
                    </div>
                  </div>
                  
                  {/* Assignment Event */}
                  {enrichedTicket.assignee && (
                    <div className="flex items-start gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <UserCheck className="w-4 h-4 text-purple-500" />
                          <p className="text-sm font-medium text-gray-900">Atribuído</p>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Responsável: {enrichedTicket.assignee.name}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Edit Modal */}
        {enrichedTicket && (
          <EditTicketModal
            open={isEditModalOpen}
            onOpenChange={setIsEditModalOpen}
            ticket={enrichedTicket}
          />
        )}

        {/* Delete Modal */}
        {enrichedTicket && (
          <DeleteTicketModal
            open={isDeleteModalOpen}
            onOpenChange={setIsDeleteModalOpen}
            ticket={enrichedTicket}
          />
        )}
        </div>
      </div>
    </div>
  );
}