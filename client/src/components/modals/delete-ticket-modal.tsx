import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import type { Ticket } from "@shared/schema";

interface DeleteTicketModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticket: Ticket;
}

export default function DeleteTicketModal({
  open,
  onOpenChange,
  ticket,
}: DeleteTicketModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const deleteTicketMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/tickets/${ticket.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Falha ao excluir chamado");
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success("Chamado excluído com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
      onOpenChange(false);
      setLocation("/tickets");
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao excluir chamado");
    },
    onSettled: () => {
      setIsLoading(false);
    },
  });

  const handleDelete = () => {
    setIsLoading(true);
    deleteTicketMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-red-600">Confirmar Exclusão</DialogTitle>
          <DialogDescription>
            Esta ação não pode ser desfeita. Isso excluirá permanentemente o ticket
            <strong className="font-medium"> "{ticket?.title}"</strong> e todos os dados associados.
          </DialogDescription>
        </DialogHeader>

        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <h4 className="font-medium text-destructive mb-2">⚠️ Esta ação é irreversível</h4>
          <p className="text-sm text-muted-foreground">
            Ao excluir este chamado, as seguintes informações serão perdidas permanentemente:
          </p>
          <ul className="text-sm text-muted-foreground mt-2 space-y-1">
            <li>• Todos os dados do chamado</li>
            <li>• Histórico de alterações</li>
            <li>• Comentários associados (quando implementados)</li>
            <li>• Anexos relacionados (quando implementados)</li>
          </ul>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isLoading}
          >
            {isLoading ? "Excluindo..." : "Excluir Chamado"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}