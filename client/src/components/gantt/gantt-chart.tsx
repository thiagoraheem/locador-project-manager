import { useMemo } from "react";
import type { Project, Task } from "@shared/schema";

interface GanttChartProps {
  projects: Project[];
  tasks: Task[];
}

export default function GanttChart({ projects, tasks }: GanttChartProps) {
  // Generate months for the timeline
  const months = useMemo(() => {
    const monthsArray = [];
    for (let i = 0; i < 12; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() + i);
      monthsArray.push(date.toLocaleDateString('en-US', { month: 'short' }));
    }
    return monthsArray;
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning': return 'bg-primary';
      case 'in_progress': return 'bg-secondary';
      case 'review': return 'bg-accent';
      case 'completed': return 'bg-success';
      case 'on_hold': return 'bg-gray-500';
      default: return 'bg-gray-400';
    }
  };

  const calculateBarPosition = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const now = new Date();
    
    // Calculate position based on current year
    const yearStart = new Date(now.getFullYear(), 0, 1);
    const yearEnd = new Date(now.getFullYear(), 11, 31);
    
    const totalDays = (yearEnd.getTime() - yearStart.getTime()) / (1000 * 60 * 60 * 24);
    const startDays = Math.max(0, (start.getTime() - yearStart.getTime()) / (1000 * 60 * 60 * 24));
    const duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    
    const startPercent = (startDays / totalDays) * 100;
    const widthPercent = Math.min((duration / totalDays) * 100, 100 - startPercent);
    
    return { left: `${startPercent}%`, width: `${widthPercent}%` };
  };

  return (
    <div className="overflow-x-auto" data-testid="gantt-chart">
      <div className="min-w-full">
        {/* Gantt Chart Header */}
        <div className="flex border-b border-gray-200 pb-2 mb-4">
          <div className="w-60 text-sm font-medium text-gray-500">Project / Task</div>
          <div className="flex-1 grid grid-cols-12 gap-1 text-xs text-gray-500">
            {months.map((month, index) => (
              <div key={index} className="text-center">
                {month}
              </div>
            ))}
          </div>
        </div>

        {/* Gantt Chart Rows */}
        <div className="space-y-3">
          {projects.map((project) => {
            const projectTasks = tasks.filter(task => task.projectId === project.id);
            const position = calculateBarPosition(project.startDate, project.endDate);
            
            return (
              <div key={project.id} className="space-y-2">
                {/* Project Row */}
                <div className="flex items-center" data-testid={`gantt-project-${project.id}`}>
                  <div className="w-60 pr-4">
                    <div className="text-sm font-medium text-text">{project.name}</div>
                    <div className="text-xs text-gray-500">Project Timeline</div>
                  </div>
                  <div className="flex-1 relative h-8">
                    <div 
                      className={`absolute top-1 h-6 ${getStatusColor(project.status)} rounded-lg flex items-center px-2`}
                      style={position}
                    >
                      <div className="text-xs text-white font-medium truncate">
                        {project.name}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Task Rows */}
                {projectTasks.map((task) => {
                  if (!task.startDate || !task.endDate) return null;
                  
                  const taskPosition = calculateBarPosition(task.startDate, task.endDate);
                  
                  return (
                    <div key={task.id} className="flex items-center ml-4" data-testid={`gantt-task-${task.id}`}>
                      <div className="w-56 pr-4">
                        <div className="text-sm text-text">└ {task.title}</div>
                        <div className="text-xs text-gray-500">Task</div>
                      </div>
                      <div className="flex-1 relative h-6">
                        <div 
                          className={`absolute top-1 h-4 ${getStatusColor(task.status)} rounded flex items-center px-1`}
                          style={taskPosition}
                        >
                          <div className="text-xs text-white font-medium truncate">
                            {task.title}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-8 pt-4 border-t border-gray-200">
          <div className="text-sm font-medium text-gray-700 mb-2">Status Legend:</div>
          <div className="flex flex-wrap gap-4 text-xs">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-primary rounded mr-2"></div>
              <span>Planning</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-secondary rounded mr-2"></div>
              <span>In Progress</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-accent rounded mr-2"></div>
              <span>Review</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-success rounded mr-2"></div>
              <span>Completed</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-gray-500 rounded mr-2"></div>
              <span>On Hold</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
