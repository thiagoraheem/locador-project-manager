import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FolderKanban, Calendar, Users, MoreVertical } from "lucide-react";
import type { Project } from "@shared/schema";
import { formatDate } from "@/lib/utils";

interface ResponsiveProjectListProps {
  projects: Project[];
  isLoading: boolean;
}

export function ResponsiveProjectList({ projects, isLoading }: ResponsiveProjectListProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500 text-white';
      case 'in_progress': return 'bg-blue-500 text-white';
      case 'review': return 'bg-purple-500 text-white';
      case 'planning': return 'bg-yellow-500 text-white';
      case 'on_hold': return 'bg-gray-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Concluído';
      case 'in_progress': return 'Em Progresso';
      case 'review': return 'Em Revisão';
      case 'planning': return 'Planejamento';
      case 'on_hold': return 'Pausado';
      default: return status;
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4 md:p-6">
              <div className="h-4 bg-gray-200 rounded mb-3"></div>
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
    );
  }

  if (projects.length === 0) {
    return (
      <div className="text-center py-12">
        <FolderKanban className="mx-auto h-16 w-16 text-gray-400" />
        <h3 className="mt-4 text-lg font-medium text-gray-900">Nenhum projeto encontrado</h3>
        <p className="mt-2 text-sm text-gray-500">
          Comece criando seu primeiro projeto para organizar suas tarefas.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
      {projects.map((project) => (
        <Card
          key={project.id}
          className="hover:shadow-lg transition-shadow cursor-pointer group"
          data-testid={`project-card-${project.id}`}
        >
          <CardContent className="p-4 md:p-6">
            {/* Mobile Layout */}
            <div className="block md:hidden">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2 flex-1">
                  <div className="w-8 h-8 bg-primary bg-opacity-10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FolderKanban className="text-primary w-4 h-4" />
                  </div>
                  <h3 className="font-semibold text-sm text-text line-clamp-1 flex-1">{project.name}</h3>
                </div>
                <Link href={`/projects/${project.id}`}>
                  <Button variant="ghost" size="sm" className="p-1 h-8 w-8">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
              
              <p className="text-xs text-gray-600 mb-3 line-clamp-2">{project.description}</p>
              
              <div className="flex items-center justify-between mb-3">
                <Badge className={`text-xs ${getStatusColor(project.status)}`}>
                  {getStatusText(project.status)}
                </Badge>
                <div className="flex items-center text-xs text-gray-500">
                  <Calendar className="w-3 h-3 mr-1" />
                  {project.endDate ? formatDate(project.endDate.toString()) : 'Sem prazo'}
                </div>
              </div>
              
              <div className="pt-2 border-t border-gray-100">
                <Link href={`/projects/${project.id}`}>
                  <Button variant="outline" size="sm" className="w-full text-xs">
                    Ver Projeto
                  </Button>
                </Link>
              </div>
            </div>

            {/* Desktop Layout */}
            <div className="hidden md:block">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-primary bg-opacity-10 rounded-lg flex items-center justify-center">
                    <FolderKanban className="text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-text mb-1">{project.name}</h3>
                    <p className="text-sm text-gray-600 line-clamp-2">{project.description}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mb-4">
                <Badge className={getStatusColor(project.status)}>
                  {getStatusText(project.status)}
                </Badge>
                <div className="flex items-center text-sm text-gray-500">
                  <Calendar className="w-4 h-4 mr-1" />
                  {project.endDate ? formatDate(project.endDate.toString()) : 'Sem prazo definido'}
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <Link href={`/projects/${project.id}`}>
                  <Button 
                    variant="outline" 
                    className="w-full group-hover:bg-primary group-hover:text-white transition-colors"
                    data-testid={`view-project-${project.id}`}
                  >
                    Ver Projeto
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}