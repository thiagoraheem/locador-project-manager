import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FolderKanban, Calendar, Users, MoreHorizontal } from "lucide-react";
import type { Project } from "@shared/schema";

interface ProjectCardProps {
  project: Project;
}

export default function ProjectCard({ project }: ProjectCardProps) {
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
    return new Date(date).toLocaleDateString('en-US', {
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
                {project.status.replace('_', ' ')}
              </Badge>
            </div>
          </div>
          <Button variant="ghost" size="icon" data-testid={`project-menu-${project.id}`}>
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </div>

        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
          {project.description || "No description provided"}
        </p>

        <div className="space-y-2 text-xs text-gray-500">
          <div className="flex items-center">
            <Calendar className="w-3 h-3 mr-2" />
            <span>Start: {formatDate(project.startDate)}</span>
          </div>
          <div className="flex items-center">
            <Calendar className="w-3 h-3 mr-2" />
            <span>End: {formatDate(project.endDate)}</span>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
          <div className="flex items-center text-xs text-gray-500">
            <Users className="w-3 h-3 mr-1" />
            <span>Team</span>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            data-testid={`view-project-${project.id}`}
          >
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
