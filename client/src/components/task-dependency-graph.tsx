import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Network, RefreshCw } from 'lucide-react';
import type { Task, TaskDependency } from '@shared/schema';

interface TaskDependencyGraphProps {
  projectId: string;
}

interface TaskNode {
  id: string;
  title: string;
  status: string;
  dependencies: string[];
  dependents: string[];
  level: number;
}

export function TaskDependencyGraph({ projectId }: TaskDependencyGraphProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [dependencies, setDependencies] = useState<TaskDependency[]>([]);
  const [taskNodes, setTaskNodes] = useState<TaskNode[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, [projectId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch tasks
      const tasksResponse = await fetch(`/api/tasks?projectId=${projectId}`);
      const tasksData = await tasksResponse.json();
      setTasks(tasksData);

      // Fetch all dependencies for the project
      const allDependencies: TaskDependency[] = [];
      for (const task of tasksData) {
        try {
          const depResponse = await fetch(`/api/tasks/${task.id}/dependencies`);
          if (depResponse.ok) {
            const deps = await depResponse.json();
            allDependencies.push(...deps);
          }
        } catch (error) {
          console.error(`Failed to fetch dependencies for task ${task.id}:`, error);
        }
      }
      setDependencies(allDependencies);

      // Build task nodes with dependency information
      buildTaskNodes(tasksData, allDependencies);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const buildTaskNodes = (tasks: Task[], dependencies: TaskDependency[]) => {
    const nodes: TaskNode[] = tasks.map(task => {
      const taskDependencies = dependencies
        .filter(dep => dep.taskId === task.id)
        .map(dep => dep.dependsOnTaskId);
      
      const taskDependents = dependencies
        .filter(dep => dep.dependsOnTaskId === task.id)
        .map(dep => dep.taskId);

      return {
        id: task.id,
        title: task.title,
        status: task.status,
        dependencies: taskDependencies,
        dependents: taskDependents,
        level: 0,
      };
    });

    // Calculate levels for hierarchical layout
    calculateLevels(nodes);
    setTaskNodes(nodes);
  };

  const calculateLevels = (nodes: TaskNode[]) => {
    const visited = new Set<string>();
    const calculating = new Set<string>();

    const calculateLevel = (nodeId: string): number => {
      if (calculating.has(nodeId)) {
        return 0; // Circular dependency, assign level 0
      }
      
      if (visited.has(nodeId)) {
        const node = nodes.find(n => n.id === nodeId);
        return node?.level || 0;
      }

      calculating.add(nodeId);
      const node = nodes.find(n => n.id === nodeId);
      
      if (!node || node.dependencies.length === 0) {
        const level = 0;
        if (node) node.level = level;
        visited.add(nodeId);
        calculating.delete(nodeId);
        return level;
      }

      const maxDependencyLevel = Math.max(
        ...node.dependencies.map(depId => calculateLevel(depId))
      );
      
      const level = maxDependencyLevel + 1;
      node.level = level;
      visited.add(nodeId);
      calculating.delete(nodeId);
      return level;
    };

    nodes.forEach(node => calculateLevel(node.id));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'todo':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Concluída';
      case 'in_progress':
        return 'Em Progresso';
      case 'todo':
        return 'A Fazer';
      default:
        return status;
    }
  };

  // Group tasks by level for hierarchical display
  const tasksByLevel = taskNodes.reduce((acc, node) => {
    if (!acc[node.level]) {
      acc[node.level] = [];
    }
    acc[node.level].push(node);
    return acc;
  }, {} as Record<number, TaskNode[]>);

  const maxLevel = Math.max(...Object.keys(tasksByLevel).map(Number), 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Network className="h-5 w-5" />
            Gráfico de Dependências
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {taskNodes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhuma tarefa encontrada neste projeto.
          </div>
        ) : (
          <div className="space-y-6">
            {Array.from({ length: maxLevel + 1 }, (_, level) => {
              const levelTasks = tasksByLevel[level] || [];
              if (levelTasks.length === 0) return null;

              return (
                <div key={level} className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">
                    Nível {level} {level === 0 ? '(Sem dependências)' : `(Depende do nível ${level - 1})`}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {levelTasks.map((node) => (
                      <div
                        key={node.id}
                        className={`p-3 rounded-lg border-2 ${getStatusColor(node.status)}`}
                      >
                        <div className="font-medium text-sm mb-2 truncate" title={node.title}>
                          {node.title}
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <Badge variant="outline" className="text-xs">
                            {getStatusText(node.status)}
                          </Badge>
                          <div className="text-muted-foreground">
                            {node.dependencies.length > 0 && (
                              <span>↑{node.dependencies.length}</span>
                            )}
                            {node.dependencies.length > 0 && node.dependents.length > 0 && ' | '}
                            {node.dependents.length > 0 && (
                              <span>↓{node.dependents.length}</span>
                            )}
                          </div>
                        </div>
                        {node.dependencies.length > 0 && (
                          <div className="mt-2 text-xs text-muted-foreground">
                            Depende de: {node.dependencies.length} tarefa(s)
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
            
            {dependencies.length > 0 && (
              <div className="mt-6 p-3 bg-muted rounded-lg">
                <div className="text-sm font-medium mb-2">Legenda:</div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <div>↑ Número de dependências (tarefas que devem ser concluídas primeiro)</div>
                  <div>↓ Número de dependentes (tarefas que dependem desta)</div>
                  <div>As tarefas são organizadas por níveis hierárquicos baseados em suas dependências</div>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}