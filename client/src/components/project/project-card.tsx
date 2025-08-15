import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FolderKanban, Calendar, Users, MoreHorizontal } from "lucide-react";
import { Link } from "wouter";
import type { Project } from "@shared/schema";

interface ProjectCardProps {
  project: Project;
}

export default function ProjectCard({ project }: ProjectCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'review': return 'bg-purple-100 text-purple-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'on_hold': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'planning': return 'Planejamento';
      case 'in_progress': return 'Em Progresso';
      case 'review': return 'Em Revisão';
      case 'completed': return 'Concluído';
      case 'on_hold': return 'Pausado';
      default: return status;
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
    <Card 
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
                {getStatusLabel(project.status)}
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
            <span>Término: {formatDate(project.endDate.toString())}</span>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
          <div className="flex items-center text-xs text-gray-500">
            <Users className="w-3 h-3 mr-1" />
            <span>Equipe</span>
          </div>
          <Link href={`/projects/${project.id}`}>
            <Button 
              variant="outline" 
              size="sm"
              data-testid={`view-project-${project.id}`}
            >
              Ver Detalhes
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
