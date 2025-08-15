import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Edit, Trash2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import type { Comment } from "@shared/schema";

type CommentWithAuthor = Comment & {
  author?: {
    id: string;
    name: string;
    email: string;
  };
};

interface CommentItemProps {
  comment: CommentWithAuthor;
  ticketId: string;
  currentUserId?: string;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

  if (diffInHours < 1) {
    return "Agora mesmo";
  } else if (diffInHours < 24) {
    return `${diffInHours}h atrás`;
  } else if (diffInHours < 48) {
    return "Ontem";
  } else {
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }
}

export default function CommentItem({ comment, ticketId, currentUserId = "user-1" }: CommentItemProps) {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [isDeleting, setIsDeleting] = useState(false);

  const updateCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await fetch(`/api/comments/${comment.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        throw new Error("Failed to update comment");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", ticketId] });
      toast.success("Comentário atualizado com sucesso!");
      setIsEditing(false);
    },
    onError: (error) => {
      console.error("Error updating comment:", error);
      toast.error("Erro ao atualizar comentário. Tente novamente.");
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/comments/${comment.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete comment");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", ticketId] });
      toast.success("Comentário excluído com sucesso!");
    },
    onError: (error) => {
      console.error("Error deleting comment:", error);
      toast.error("Erro ao excluir comentário. Tente novamente.");
    },
  });

  const handleSaveEdit = () => {
    if (editContent.trim() && editContent !== comment.content) {
      updateCommentMutation.mutate(editContent.trim());
    } else {
      setIsEditing(false);
      setEditContent(comment.content);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditContent(comment.content);
  };

  const handleDelete = () => {
    if (window.confirm("Tem certeza que deseja excluir este comentário?")) {
      setIsDeleting(true);
      deleteCommentMutation.mutate();
    }
  };

  const isAuthor = comment.authorId === currentUserId;

  return (
    <div className="flex space-x-3 p-4 bg-gray-50 rounded-lg group">
      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
        {comment.author?.name?.charAt(0) || 'U'}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center space-x-2">
            <span className="font-medium text-sm">
              {comment.author?.name || 'Usuário'}
            </span>
            <span className="text-xs text-gray-500">
              {formatDate(comment.createdAt.toString())}
            </span>
            {comment.updatedAt !== comment.createdAt && (
              <span className="text-xs text-gray-400 italic">
                (editado)
              </span>
            )}
          </div>
          {isAuthor && (
            <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {!isEditing && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                    className="h-6 w-6 p-0"
                  >
                    <Edit className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
        
        {isEditing ? (
          <div className="space-y-2">
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="min-h-[80px] text-sm"
              autoFocus
            />
            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                onClick={handleSaveEdit}
                disabled={updateCommentMutation.isPending || !editContent.trim()}
                className="h-7 px-2"
              >
                <Check className="w-3 h-3 mr-1" />
                Salvar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancelEdit}
                disabled={updateCommentMutation.isPending}
                className="h-7 px-2"
              >
                <X className="w-3 h-3 mr-1" />
                Cancelar
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
            {comment.content}
          </p>
        )}
      </div>
    </div>
  );
}