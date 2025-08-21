import { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface Project {
  id: string;
  name: string;
  description?: string;
  status: string;
  startDate: string;
  endDate: string;
  createdBy: string;
}

interface ProjectStats {
  tasksCount: number;
  ticketsCount: number;
}

interface DeleteProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project | null;
}

export default function DeleteProjectModal({ open, onOpenChange, project }: DeleteProjectModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch project statistics when modal opens
  const { data: projectStats, isLoading: isLoadingStats } = useQuery({
    queryKey: [`/api/projects/${project?.id}/stats`],
    queryFn: async (): Promise<ProjectStats> => {
      const [tasksResponse, ticketsResponse] = await Promise.all([
        apiRequest('GET', `/api/tasks?projectId=${project?.id}`),
        apiRequest('GET', `/api/tickets?projectId=${project?.id}`)
      ]);
      
      const tasks = await tasksResponse.json();
      const tickets = await ticketsResponse.json();
      
      return {
        tasksCount: tasks.length,
        ticketsCount: tickets.length
      };
    },
    enabled: open && !!project?.id,
    staleTime: 0, // Always fetch fresh data
  });

  const deleteProjectMutation = useMutation({
    mutationFn: async () => {
      if (!project) throw new Error("Projeto não encontrado");
      
      setIsDeleting(true);
      const response = await apiRequest('DELETE', `/api/projects/${project.id}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Falha ao excluir projeto");
      }
      
      return response;
    },
    onSuccess: () => {
      // Invalidate all relevant queries
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tickets'] });
      
      toast({
        title: "Projeto excluído com sucesso",
        description: `O projeto "${project?.name}" e todos os dados associados foram removidos.`,
      });
      
      onOpenChange(false);
      // Redirect to projects page after deletion
      setLocation("/projects");
    },
    onError: (error: any) => {
      const errorMessage = error.message || "Falha ao excluir projeto";
      let description = errorMessage;
      
      // Handle specific error cases
      if (errorMessage.includes('dependenc')) {
        description = "Este projeto possui dependências ativas e não pode ser excluído no momento.";
      } else if (errorMessage.includes('permission')) {
        description = "Você não tem permissão para excluir este projeto.";
      }
      
      toast({
        title: "Erro ao excluir projeto",
        description,
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsDeleting(false);
    },
  });

  const handleDelete = () => {
    deleteProjectMutation.mutate();
  };

  if (!project) return null;

  const totalItems = (projectStats?.tasksCount || 0) + (projectStats?.ticketsCount || 0);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md" data-testid="delete-project-modal">
        <AlertDialogHeader>
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-6 h-6 text-red-500" />
            <AlertDialogTitle>Excluir Projeto</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-base">
            Esta ação não pode ser desfeita. Isso excluirá permanentemente o projeto
            <span className="font-semibold"> "{project.name}"</span> e todos os dados associados.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* Project Impact Statistics */}
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Impacto da Exclusão
              </h3>
              
              {isLoadingStats ? (
                <div className="mt-2 text-sm text-red-700">
                  <p>Carregando informações do projeto...</p>
                </div>
              ) : (
                <div className="mt-2 text-sm text-red-700">
                  <p className="font-medium mb-2">
                    Este projeto contém <span className="font-bold">{totalItems}</span> item(ns) que serão excluídos:
                  </p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>
                      <span className="font-medium">{projectStats?.tasksCount || 0}</span> tarefa(s)
                    </li>
                    <li>
                      <span className="font-medium">{projectStats?.ticketsCount || 0}</span> ticket(s)
                    </li>
                    <li>Todos os comentários e histórico</li>
                    <li>Marcos e dependências</li>
                    <li>Permissões de usuário</li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel 
            disabled={isDeleting}
            data-testid="cancel-delete-button"
          >
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting || isLoadingStats}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            data-testid="confirm-delete-button"
          >
            {isDeleting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Excluindo...
              </>
            ) : (
              "Excluir Projeto"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}