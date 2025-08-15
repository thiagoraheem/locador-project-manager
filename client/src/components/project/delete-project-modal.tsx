import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
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

  const deleteProjectMutation = useMutation({
    mutationFn: async () => {
      if (!project) throw new Error("Projeto não encontrado");
      
      setIsDeleting(true);
      const response = await apiRequest('DELETE', `/api/projects/${project.id}`);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      toast({
        title: "Projeto excluído",
        description: "O projeto foi excluído com sucesso.",
      });
      onOpenChange(false);
      // Redirect to projects page after deletion
      setLocation("/projects");
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Falha ao excluir projeto",
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" data-testid="delete-project-modal">
        <DialogHeader>
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <DialogTitle>Excluir Projeto</DialogTitle>
          </div>
          <DialogDescription>
            Esta ação não pode ser desfeita. Isso excluirá permanentemente o projeto
            <span className="font-semibold"> "{project.name}"</span> e todos os dados associados.
          </DialogDescription>
        </DialogHeader>

        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Atenção: Esta ação é irreversível
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>
                  Ao excluir este projeto, você também excluirá:
                </p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Todas as tarefas associadas</li>
                  <li>Todos os chamados relacionados</li>
                  <li>Histórico e comentários</li>
                  <li>Marcos e dependências</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex justify-end space-x-2">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
            data-testid="cancel-delete-button"
          >
            Cancelar
          </Button>
          <Button 
            type="button" 
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
            data-testid="confirm-delete-button"
          >
            {isDeleting ? "Excluindo..." : "Excluir Projeto"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}