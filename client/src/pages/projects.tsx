import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import CreateProjectModal from "@/components/project/create-project-modal";
import { CreateTaskModal } from "@/components/task/create-task-modal";
import { FolderKanban, Calendar, Users, MoreHorizontal, Plus } from "lucide-react";
import type { Project } from "@shared/schema";

export default function Projects() {
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { data: projects = [], isLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_progress': return 'bg-success text-white';
      case 'review': return 'bg-yellow-500 text-white';
      case 'planning': return 'bg-blue-500 text-white';
      case 'completed': return 'bg-green-500 text-white';
      case 'on_hold': return 'bg-gray-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <Header 
        title="Projetos" 
        subtitle="Gerencie seus projetos de desenvolvimento e acompanhe seu progresso."
        onCreateNew={() => setShowCreateModal(true)}
        createButtonText="Novo Projeto"
      />

      <div className="p-6">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-gray-200 rounded mb-4"></div>
                  <div className="h-3 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded mb-4"></div>
                  <div className="flex justify-between">
                    <div className="h-5 bg-gray-200 rounded w-20"></div>
                    <div className="h-5 bg-gray-200 rounded w-16"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-12">
            <FolderKanban className="mx-auto h-16 w-16 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">Nenhum projeto ainda</h3>
            <p className="mt-2 text-sm text-gray-500">
              Comece criando seu primeiro projeto para acompanhar o progresso do desenvolvimento.
            </p>
            <Button 
              onClick={() => setShowCreateModal(true)}
              className="mt-4 bg-primary text-white hover:bg-primary/90"
              data-testid="create-first-project-button"
            >
              Crie Seu Primeiro Projeto
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Card 
                key={project.id} 
                className="hover:shadow-lg transition-shadow cursor-pointer"
                data-testid={`project-card-${project.id}`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary bg-opacity-10 rounded-lg flex items-center justify-center">
                        <FolderKanban className="text-primary w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-text">{project.name}</h3>
                        <Badge className={getStatusColor(project.status)}>
                          {project.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" data-testid={`project-menu-${project.id}`}>
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </div>

                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {project.description || "Nenhuma descrição fornecida"}
                  </p>

                  <div className="space-y-2 text-xs text-gray-500">
                    <div className="flex items-center">
                      <Calendar className="w-3 h-3 mr-2" />
                      <span>Início: {formatDate(project.startDate.toString())}</span>
                    </div>
                    <div className="flex items-center">
                      <Calendar className="w-3 h-3 mr-2" />
                      <span>Fim: {formatDate(project.endDate.toString())}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                    <div className="flex items-center text-xs text-gray-500">
                      <Users className="w-3 h-3 mr-1" />
                      <span>Equipe</span>
                    </div>
                    <div className="flex gap-2">
                      <CreateTaskModal projectId={project.id}>
                        <Button 
                          variant="outline" 
                          size="sm"
                          data-testid={`create-task-${project.id}`}
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Tarefa
                        </Button>
                      </CreateTaskModal>
                      <Button 
                        variant="outline" 
                        size="sm"
                        data-testid={`view-project-${project.id}`}
                      >
                        Detalhes
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <CreateProjectModal 
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
      />
    </div>
  );
}