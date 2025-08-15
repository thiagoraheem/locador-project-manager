import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { ArrowLeft, Calendar, User, Clock, Edit, Trash2, CheckSquare, Network } from "lucide-react";
import EditTaskModal from "@/components/edit-task-modal";
import DeleteTaskModal from "@/components/delete-task-modal";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { TaskDependencies } from "@/components/task-dependencies";
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

const getStatusColor = (status: string) => {
  switch (status) {
    case "completed":
      return "bg-green-500 text-white";
    case "in_progress":
      return "bg-blue-500 text-white";
    case "todo":
      return "bg-gray-500 text-white";
    default:
      return "bg-gray-500 text-white";
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case "completed":
      return "Concluída";
    case "in_progress":
      return "Em Progresso";
    case "todo":
      return "A Fazer";
    default:
      return status;
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case "completed":
      return <CheckSquare className="w-4 h-4" />;
    case "in_progress":
      return <Clock className="w-4 h-4" />;
    case "todo":
      return <Calendar className="w-4 h-4" />;
    default:
      return <Calendar className="w-4 h-4" />;
  }
};

export default function TaskDetails() {
  const { id } = useParams();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const { data: task, isLoading } = useQuery<TaskWithRelations>({
    queryKey: [`/api/tasks/${id}`],
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex-1 overflow-y-auto">
        <Header title="Carregando..." />
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="flex-1 overflow-y-auto">
        <Header title="Tarefa não encontrada" />
        <div className="p-6">
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Tarefa não encontrada
            </h2>
            <p className="text-gray-600 mb-4">
              A tarefa que você está procurando não existe ou foi removida.
            </p>
            <Link href="/tasks">
              <Button>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar para Tarefas
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const formatDate = (date: string | null) => {
    if (!date) return "Não definida";
    return new Date(date).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatDateTime = (date: string) => {
    return new Date(date).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <Header title="Detalhes da Tarefa" />
      <div className="p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/tasks">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{task.title}</h1>
                <p className="text-sm text-gray-500">Tarefa #{task.id.slice(0, 8)}</p>
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

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Task Details */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Informações da Tarefa</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Descrição</h3>
                    <p className="text-gray-700">
                      {task.description || "Nenhuma descrição fornecida."}
                    </p>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">Status</h4>
                      <Badge className={getStatusColor(task.status)}>
                        <span className="flex items-center gap-1">
                          {getStatusIcon(task.status)}
                          {getStatusLabel(task.status)}
                        </span>
                      </Badge>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">Projeto</h4>
                      <p className="text-gray-700">
                        {task.project ? (
                          <Link href={`/projects/${task.project.id}`}>
                            <Button variant="link" className="p-0 h-auto text-blue-600">
                              {task.project.name}
                            </Button>
                          </Link>
                        ) : (
                          "Não associado"
                        )}
                      </p>
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">Data de Início</h4>
                      <div className="flex items-center text-gray-700">
                        <Calendar className="w-4 h-4 mr-2" />
                        {formatDate(task.startDate)}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">Data de Fim</h4>
                      <div className="flex items-center text-gray-700">
                        <Calendar className="w-4 h-4 mr-2" />
                        {formatDate(task.endDate)}
                      </div>
                    </div>
                  </div>

                  {task.assignee && (
                    <>
                      <Separator />
                      <div>
                        <h4 className="font-medium text-gray-900 mb-1">Responsável</h4>
                        <div className="flex items-center text-gray-700">
                          <User className="w-4 h-4 mr-2" />
                          <span>{task.assignee.name}</span>
                          <span className="text-gray-500 ml-2">({task.assignee.email})</span>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Task Dependencies */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Network className="h-5 w-5" />
                    Dependências da Tarefa
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <TaskDependencies taskId={task.id} />
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Informações do Sistema</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Criado em</h4>
                    <div className="flex items-center text-gray-700">
                      <Clock className="w-4 h-4 mr-2" />
                      {formatDateTime(task.createdAt)}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Última atualização</h4>
                    <div className="flex items-center text-gray-700">
                      <Clock className="w-4 h-4 mr-2" />
                      {formatDateTime(task.updatedAt)}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Progress Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Progresso</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Status atual</span>
                      <span className="font-medium">{getStatusLabel(task.status)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          task.status === "completed"
                            ? "bg-green-500 w-full"
                            : task.status === "in_progress"
                            ? "bg-blue-500 w-1/2"
                            : "bg-gray-400 w-0"
                        }`}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {task.status === "completed"
                        ? "Tarefa concluída"
                        : task.status === "in_progress"
                        ? "Em desenvolvimento"
                        : "Aguardando início"}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Task Modal */}
      {task && (
        <EditTaskModal
          open={isEditModalOpen}
          onOpenChange={setIsEditModalOpen}
          task={task}
        />
      )}

      {/* Delete Task Modal */}
      {task && (
        <DeleteTaskModal
          open={isDeleteModalOpen}
          onOpenChange={setIsDeleteModalOpen}
          task={task}
        />
      )}
    </div>
  );
}