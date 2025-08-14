import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import GanttChart from "@/components/gantt/gantt-chart";
import { Download, Calendar } from "lucide-react";
import type { Project, Task } from "@shared/schema";

export default function GanttCharts() {
  const { data: projects = [], isLoading: projectsLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const { data: tasks = [], isLoading: tasksLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  return (
    <div className="flex-1 overflow-y-auto">
      <Header 
        title="Gantt Charts" 
        subtitle="Visualize project timelines and track progress with interactive Gantt charts."
      />
      
      <div className="p-6">
        <Card>
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-text">Project Timeline - Gantt View</h3>
              <div className="flex items-center space-x-3">
                <Select defaultValue="all">
                  <SelectTrigger className="w-48" data-testid="project-filter">
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Projects</SelectItem>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button 
                  variant="outline" 
                  size="sm"
                  data-testid="export-gantt-button"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          </div>
          
          <CardContent className="p-6">
            {projectsLoading || tasksLoading ? (
              <div className="space-y-4">
                <div className="animate-pulse">
                  <div className="h-8 bg-gray-200 rounded mb-4"></div>
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-12 bg-gray-200 rounded mb-2"></div>
                  ))}
                </div>
              </div>
            ) : projects.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="mx-auto h-16 w-16 text-gray-400" />
                <h3 className="mt-4 text-lg font-medium text-gray-900">No project data</h3>
                <p className="mt-2 text-sm text-gray-500">
                  Create some projects and tasks to see them in the Gantt chart.
                </p>
              </div>
            ) : (
              <GanttChart projects={projects} tasks={tasks} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
