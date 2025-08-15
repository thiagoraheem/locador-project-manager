import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import CreateProjectModal from "@/components/project/create-project-modal";
import { CreateTaskModal } from "@/components/task/create-task-modal";
import { ResponsiveProjectList } from "@/components/responsive/responsive-project-list";
import { EmptyState } from "@/components/ui/empty-state";
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
        <ResponsiveProjectList projects={projects} isLoading={isLoading} />
        {!isLoading && projects.length === 0 && (
          <EmptyState
            icon={FolderKanban}
            title="Nenhum projeto encontrado"
            description="Comece criando seu primeiro projeto para organizar suas tarefas."
            action={{
              label: "Criar Primeiro Projeto",
              onClick: () => setShowCreateModal(true)
            }}
          />
        )}
      </div>

      <CreateProjectModal 
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
      />
    </div>
  );
}