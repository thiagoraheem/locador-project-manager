import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { Trash2, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { Task } from "@shared/schema";

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

interface DeleteTaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: TaskWithRelations;
}

export default function DeleteTaskModal({ open, onOpenChange, task }: DeleteTaskModalProps) {
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [isDeleting, setIsDeleting] = useState(false);

  const deleteTaskMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete task");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["task", task.id] });
      toast.success("Tarefa excluída com sucesso!");
      onOpenChange(false);
      // Redirect to tasks page
      setLocation("/tasks");
    },
    onError: (error) => {
      console.error("Error deleting task:", error);
      toast.error("Erro ao excluir tarefa. Tente novamente.");
    },
  });

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteTaskMutation.mutateAsync();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <Trash2 className="h-5 w-5" />
            Excluir Tarefa
          </DialogTitle>
          <DialogDescription>
            Esta ação não pode ser desfeita. A tarefa será permanentemente removida do sistema.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Você está prestes a excluir a tarefa <strong>"{task.title}"</strong>.
              {task.project && (
                <span className="block mt-1">
                  Projeto: <strong>{task.project.name}</strong>
                </span>
              )}
              {task.assignee && (
                <span className="block mt-1">
                  Responsável: <strong>{task.assignee.name}</strong>
                </span>
              )}
            </AlertDescription>
          </Alert>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-sm text-gray-900 mb-2">Detalhes da Tarefa:</h4>
            <div className="space-y-1 text-sm text-gray-600">
              <p><span className="font-medium">Título:</span> {task.title}</p>
              {task.description && (
                <p><span className="font-medium">Descrição:</span> {task.description}</p>
              )}
              <p><span className="font-medium">Status:</span> {task.status}</p>
              <p><span className="font-medium">Prioridade:</span> {task.priority}</p>
              {task.startDate && (
                <p>
                  <span className="font-medium">Data de Início:</span>{" "}
                  {new Date(task.startDate).toLocaleDateString("pt-BR")}
                </p>
              )}
              {task.endDate && (
                <p>
                  <span className="font-medium">Data de Fim:</span>{" "}
                  {new Date(task.endDate).toLocaleDateString("pt-BR")}
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isDeleting}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex items-center gap-2"
            >
              {isDeleting ? (
                "Excluindo..."
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  Excluir Tarefa
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}