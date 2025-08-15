import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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
  Send
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import type { Ticket, Comment } from "@shared/schema";
import CommentItem from "@/components/comment-item";

type TicketWithRelations = Ticket & {
  project?: {
    id: string;
    name: string;
  };
};

type CommentWithAuthor = Comment & {
  author?: {
    id: string;
    name: string;
    email: string;
  };
};

const commentSchema = z.object({
  content: z.string().min(1, "Comentário é obrigatório"),
  authorId: z.string().min(1, "Autor é obrigatório"),
});

type CommentFormData = z.infer<typeof commentSchema>;
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
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  const commentForm = useForm<CommentFormData>({
    resolver: zodResolver(commentSchema),
    defaultValues: {
      content: "",
      authorId: "user-1", // TODO: Get from auth context
    },
  });
  
  const { data: ticket, isLoading, error } = useQuery<TicketWithRelations>({
    queryKey: ["ticket", id],
    queryFn: async () => {
      if (!id) throw new Error("No ticket ID provided");
      const response = await fetch(`/api/tickets/${id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch ticket");
      }
      return response.json();
    },
    enabled: !!id,
  });

  const { data: comments = [], isLoading: isLoadingComments } = useQuery<CommentWithAuthor[]>({
    queryKey: ["comments", id],
    queryFn: async () => {
      if (!id) throw new Error("No ticket ID provided");
      const response = await fetch(`/api/tickets/${id}/comments`);
      if (!response.ok) {
        throw new Error("Failed to fetch comments");
      }
      return response.json();
    },
    enabled: !!id,
  });

  const createCommentMutation = useMutation({
    mutationFn: async (data: CommentFormData) => {
      if (!id) throw new Error("No ticket ID provided");
      const response = await fetch(`/api/tickets/${id}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to create comment");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", id] });
      toast.success("Comentário adicionado com sucesso!");
      commentForm.reset();
    },
    onError: (error) => {
      console.error("Error creating comment:", error);
      toast.error("Erro ao adicionar comentário. Tente novamente.");
    },
  });

  const onSubmitComment = async (data: CommentFormData) => {
    setIsSubmittingComment(true);
    try {
      await createCommentMutation.mutateAsync(data);
    } finally {
      setIsSubmittingComment(false);
    }
  };

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



  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Link href="/tickets">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{ticket.title}</h1>
              <p className="text-sm text-gray-500">Chamado #{ticket.id.slice(0, 8)}</p>
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
              variant="destructive"
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
            {/* Ticket Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Detalhes do Chamado
                  <div className="flex items-center space-x-2">
                    <div className={`p-2 rounded-lg ${getPriorityColor(ticket.priority)} bg-opacity-10`}>
                      {getPriorityIcon(ticket.priority)}
                    </div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Descrição</h4>
                  <p className="text-gray-700 leading-relaxed">
                    {ticket.description || "Nenhuma descrição fornecida."}
                  </p>
                </div>
                
                <Separator />
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Status</h4>
                    <Badge className={getStatusColor(ticket.status)}>
                      {getStatusLabel(ticket.status)}
                    </Badge>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Prioridade</h4>
                    <Badge className={getPriorityColor(ticket.priority)}>
                      {getPriorityLabel(ticket.priority)}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Comments Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MessageSquare className="w-5 h-5" />
                  <span>Comentários ({comments.length})</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Comments List */}
                <div className="space-y-4">
                  {isLoadingComments ? (
                    <div className="animate-pulse space-y-3">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="flex space-x-3">
                          <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                            <div className="h-16 bg-gray-200 rounded"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : comments.length > 0 ? (
                     comments.map((comment) => (
                       <CommentItem
                         key={comment.id}
                         comment={comment}
                         ticketId={id!}
                         currentUserId="user-1" // TODO: Get from auth context
                       />
                     ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p>Nenhum comentário ainda.</p>
                      <p className="text-sm">Seja o primeiro a comentar!</p>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Add Comment Form */}
                <Form {...commentForm}>
                  <form onSubmit={commentForm.handleSubmit(onSubmitComment)} className="space-y-4">
                    <FormField
                      control={commentForm.control}
                      name="content"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Adicionar comentário</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Digite seu comentário..."
                              className="min-h-[100px] resize-none"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex justify-end">
                      <Button
                        type="submit"
                        disabled={isSubmittingComment || !commentForm.watch('content')?.trim()}
                        size="sm"
                      >
                        {isSubmittingComment ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                            Enviando...
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4 mr-2" />
                            Comentar
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>

          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informações</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium">Criado em</p>
                    <p className="text-xs text-gray-500">
                      {formatDate(ticket.createdAt.toString())}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <User className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium">Criado por</p>
                    <p className="text-xs text-gray-500">{ticket.createdBy}</p>
                  </div>
                </div>

                {ticket.projectId && (
                  <div className="flex items-center space-x-3">
                    <AlertCircle className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium">Projeto</p>
                      <Link href={`/projects/${ticket.projectId}`}>
                        <Button variant="link" className="p-0 h-auto text-xs text-blue-600">
                          Ver projeto relacionado
                        </Button>
                      </Link>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm font-medium">Chamado criado</p>
                      <p className="text-xs text-gray-500">
                        {formatDate(ticket.createdAt.toString())}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-gray-300 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm font-medium">Status atual</p>
                      <p className="text-xs text-gray-500">
                        {getStatusLabel(ticket.status)}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Edit Modal */}
        {ticket && (
          <EditTicketModal
            open={isEditModalOpen}
            onOpenChange={setIsEditModalOpen}
            ticket={ticket}
          />
        )}

        {/* Delete Modal */}
        {ticket && (
          <DeleteTicketModal
            open={isDeleteModalOpen}
            onOpenChange={setIsDeleteModalOpen}
            ticket={ticket}
          />
        )}
      </div>
    </div>
  );
}