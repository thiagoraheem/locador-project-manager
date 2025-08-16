import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MessageCircle, Send, Edit, Trash2, Calendar, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { apiRequest } from "@/lib/queryClient";
import type { SelectComment, InsertComment } from "@shared/schema";

interface AdvancedCommentSystemProps {
  ticketId: string;
  currentUserId: string;
}

interface CommentWithAuthor extends SelectComment {
  author?: {
    id: string;
    name: string;
    email: string;
  };
}

export default function AdvancedCommentSystem({ ticketId, currentUserId }: AdvancedCommentSystemProps) {
  const [newComment, setNewComment] = useState("");
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch comments for the ticket
  const { data: comments = [], isLoading } = useQuery({
    queryKey: ['/api/comments', ticketId],
    enabled: !!ticketId
  });

  // Create comment mutation
  const createCommentMutation = useMutation({
    mutationFn: async (comment: InsertComment) => {
      return await apiRequest(`/api/comments`, {
        method: 'POST',
        body: JSON.stringify(comment)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/comments', ticketId] });
      setNewComment("");
      toast({
        title: "Comentário adicionado",
        description: "Seu comentário foi adicionado com sucesso."
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao adicionar comentário.",
        variant: "destructive"
      });
    }
  });

  // Update comment mutation
  const updateCommentMutation = useMutation({
    mutationFn: async ({ id, content }: { id: string; content: string }) => {
      return await apiRequest(`/api/comments/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ content })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/comments', ticketId] });
      setEditingComment(null);
      setEditContent("");
      toast({
        title: "Comentário atualizado",
        description: "Seu comentário foi atualizado com sucesso."
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao atualizar comentário.",
        variant: "destructive"
      });
    }
  });

  // Delete comment mutation
  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      return await apiRequest(`/api/comments/${commentId}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/comments', ticketId] });
      toast({
        title: "Comentário removido",
        description: "Comentário foi removido com sucesso."
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao remover comentário.",
        variant: "destructive"
      });
    }
  });

  const handleAddComment = () => {
    if (!newComment.trim()) return;

    createCommentMutation.mutate({
      content: newComment,
      ticketId,
      authorId: currentUserId
    });
  };

  const handleEditComment = (comment: CommentWithAuthor) => {
    setEditingComment(comment.id);
    setEditContent(comment.content);
  };

  const handleSaveEdit = () => {
    if (!editContent.trim() || !editingComment) return;

    updateCommentMutation.mutate({
      id: editingComment,
      content: editContent
    });
  };

  const handleDeleteComment = (commentId: string) => {
    if (window.confirm("Tem certeza que deseja excluir este comentário?")) {
      deleteCommentMutation.mutate(commentId);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    } catch {
      return "Data inválida";
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Comentários
          </h3>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Comentários ({comments.length})
        </h3>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Comment list */}
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {comments.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              Nenhum comentário ainda. Seja o primeiro a comentar!
            </p>
          ) : (
            comments.map((comment: CommentWithAuthor) => (
              <div key={comment.id} className="border rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {comment.author?.name?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-sm">
                        {comment.author?.name || 'Usuário Desconhecido'}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(comment.createdAt)}
                      </p>
                    </div>
                  </div>
                  
                  {comment.authorId === currentUserId && (
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditComment(comment)}
                        disabled={editingComment === comment.id}
                        data-testid={`edit-comment-${comment.id}`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteComment(comment.id)}
                        data-testid={`delete-comment-${comment.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>

                {editingComment === comment.id ? (
                  <div className="space-y-2">
                    <Textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      placeholder="Edite seu comentário..."
                      data-testid="edit-comment-textarea"
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={handleSaveEdit}
                        disabled={updateCommentMutation.isPending}
                        data-testid="save-edit-comment"
                      >
                        Salvar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingComment(null);
                          setEditContent("");
                        }}
                        data-testid="cancel-edit-comment"
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
                )}

                {comment.updatedAt !== comment.createdAt && editingComment !== comment.id && (
                  <Badge variant="secondary" className="text-xs">
                    Editado
                  </Badge>
                )}
              </div>
            ))
          )}
        </div>

        <Separator />

        {/* Add new comment */}
        <div className="space-y-3">
          <h4 className="font-semibold text-sm">Adicionar Comentário</h4>
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Digite seu comentário..."
            rows={3}
            data-testid="new-comment-textarea"
          />
          <Button
            onClick={handleAddComment}
            disabled={createCommentMutation.isPending || !newComment.trim()}
            className="w-full"
            data-testid="add-comment-button"
          >
            {createCommentMutation.isPending ? (
              "Adicionando..."
            ) : (
              <span className="flex items-center gap-2">
                <Send className="h-4 w-4" />
                Adicionar Comentário
              </span>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}