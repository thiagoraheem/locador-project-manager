import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Plus, Edit, Trash2, Tag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface TaskType {
  id: string;
  name: string;
  description?: string;
  color: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

const taskTypeSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, "Cor deve estar no formato hexadecimal (#RRGGBB)"),
  active: z.boolean().default(true),
});

type TaskTypeFormData = z.infer<typeof taskTypeSchema>;

export default function TaskTypeManagement() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTaskType, setEditingTaskType] = useState<TaskType | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: taskTypes = [], isLoading } = useQuery<TaskType[]>({
    queryKey: ["/api/task-types"],
  });

  const createForm = useForm<TaskTypeFormData>({
    resolver: zodResolver(taskTypeSchema),
    defaultValues: {
      name: "",
      description: "",
      color: "#3B82F6",
      active: true,
    },
  });

  const editForm = useForm<TaskTypeFormData>({
    resolver: zodResolver(taskTypeSchema),
    defaultValues: {
      name: "",
      description: "",
      color: "#3B82F6",
      active: true,
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: TaskTypeFormData) => apiRequest("/api/task-types", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/task-types"] });
      toast({
        title: "Tipo de Tarefa Criado",
        description: "O tipo de tarefa foi criado com sucesso.",
      });
      setIsCreateOpen(false);
      createForm.reset();
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível criar o tipo de tarefa.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TaskTypeFormData> }) =>
      apiRequest(`/api/task-types/${id}`, "PUT", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/task-types"] });
      toast({
        title: "Tipo de Tarefa Atualizado",
        description: "O tipo de tarefa foi atualizado com sucesso.",
      });
      setEditingTaskType(null);
      editForm.reset();
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o tipo de tarefa.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/task-types/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/task-types"] });
      toast({
        title: "Tipo de Tarefa Removido",
        description: "O tipo de tarefa foi desativado com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível remover o tipo de tarefa.",
        variant: "destructive",
      });
    },
  });

  const onCreateSubmit = (data: TaskTypeFormData) => {
    createMutation.mutate(data);
  };

  const onEditSubmit = (data: TaskTypeFormData) => {
    if (editingTaskType) {
      updateMutation.mutate({ id: editingTaskType.id, data });
    }
  };

  const handleEdit = (taskType: TaskType) => {
    setEditingTaskType(taskType);
    editForm.reset({
      name: taskType.name,
      description: taskType.description || "",
      color: taskType.color,
      active: taskType.active,
    });
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Tag className="w-5 h-5" />
              Tipos de Tarefa
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Gerencie os tipos de tarefa disponíveis no sistema
            </p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Novo Tipo
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] max-w-md mx-4 md:mx-auto">
              <DialogHeader>
                <DialogTitle>Criar Novo Tipo de Tarefa</DialogTitle>
              </DialogHeader>
              <Form {...createForm}>
                <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4">
                  <FormField
                    control={createForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Bug, Melhoria, Epic..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={createForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descrição (Opcional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Descrição do tipo de tarefa"
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={createForm.control}
                    name="color"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cor</FormLabel>
                        <FormControl>
                          <div className="flex items-center gap-2">
                            <Input
                              type="color"
                              {...field}
                              className="w-16 h-10 p-1 cursor-pointer"
                            />
                            <Input
                              placeholder="#3B82F6"
                              {...field}
                              className="flex-1"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsCreateOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={createMutation.isPending}>
                      {createMutation.isPending ? "Criando..." : "Criar Tipo"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {taskTypes.length === 0 ? (
          <div className="text-center py-8">
            <Tag className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum tipo de tarefa</h3>
            <p className="mt-1 text-sm text-gray-500">
              Crie o primeiro tipo de tarefa para começar.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {taskTypes.map((taskType) => (
              <div
                key={taskType.id}
                className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: taskType.color }}
                    />
                    <h3 className="font-medium">{taskType.name}</h3>
                  </div>
                  <Badge variant={taskType.active ? "default" : "secondary"}>
                    {taskType.active ? "Ativo" : "Inativo"}
                  </Badge>
                </div>
                
                {taskType.description && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {taskType.description}
                  </p>
                )}
                
                <div className="flex items-center justify-end gap-2">
                  <Dialog
                    open={editingTaskType?.id === taskType.id}
                    onOpenChange={(open) => !open && setEditingTaskType(null)}
                  >
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(taskType)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="w-[95vw] max-w-md mx-4 md:mx-auto">
                      <DialogHeader>
                        <DialogTitle>Editar Tipo de Tarefa</DialogTitle>
                      </DialogHeader>
                      <Form {...editForm}>
                        <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
                          <FormField
                            control={editForm.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Nome</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={editForm.control}
                            name="description"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Descrição (Opcional)</FormLabel>
                                <FormControl>
                                  <Textarea rows={3} {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={editForm.control}
                            name="color"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Cor</FormLabel>
                                <FormControl>
                                  <div className="flex items-center gap-2">
                                    <Input
                                      type="color"
                                      {...field}
                                      className="w-16 h-10 p-1 cursor-pointer"
                                    />
                                    <Input {...field} className="flex-1" />
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-4">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setEditingTaskType(null)}
                            >
                              Cancelar
                            </Button>
                            <Button type="submit" disabled={updateMutation.isPending}>
                              {updateMutation.isPending ? "Salvando..." : "Salvar Alterações"}
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Desativar Tipo de Tarefa</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja desativar o tipo de tarefa "{taskType.name}"?
                          Ele não será deletado, apenas marcado como inativo.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(taskType.id)}
                          disabled={deleteMutation.isPending}
                        >
                          {deleteMutation.isPending ? "Desativando..." : "Desativar"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}