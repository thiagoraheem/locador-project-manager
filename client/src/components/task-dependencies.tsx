import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Trash2, Plus, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Task, TaskDependency } from '@shared/schema';

interface TaskDependenciesProps {
  taskId: string;
  projectId: string;
}

interface TaskWithDependencies extends Task {
  dependencies?: TaskDependency[];
}

export function TaskDependencies({ taskId, projectId }: TaskDependenciesProps) {
  const [dependencies, setDependencies] = useState<TaskDependency[]>([]);
  const [availableTasks, setAvailableTasks] = useState<Task[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchDependencies();
    fetchAvailableTasks();
  }, [taskId, projectId]);

  const fetchDependencies = async () => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/dependencies`);
      if (response.ok) {
        const data = await response.json();
        setDependencies(data);
      }
    } catch (error) {
      console.error('Failed to fetch dependencies:', error);
    }
  };

  const fetchAvailableTasks = async () => {
    try {
      const response = await fetch(`/api/tasks?projectId=${projectId}`);
      if (response.ok) {
        const data = await response.json();
        // Filter out the current task and already dependent tasks
        const filtered = data.filter((task: Task) => 
          task.id !== taskId && 
          !dependencies.some(dep => dep.dependsOnTaskId === task.id)
        );
        setAvailableTasks(filtered);
      }
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    }
  };

  const addDependency = async () => {
    if (!selectedTaskId) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/tasks/${taskId}/dependencies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dependsOnTaskId: selectedTaskId,
        }),
      });

      if (response.ok) {
        toast({
          title: 'Dependência adicionada',
          description: 'A dependência foi criada com sucesso.',
        });
        setSelectedTaskId('');
        fetchDependencies();
        fetchAvailableTasks();
      } else {
        const error = await response.json();
        toast({
          title: 'Erro ao criar dependência',
          description: error.message || 'Ocorreu um erro inesperado.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Erro ao criar dependência',
        description: 'Ocorreu um erro inesperado.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const removeDependency = async (dependencyId: string) => {
    try {
      const response = await fetch(`/api/task-dependencies/${dependencyId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: 'Dependência removida',
          description: 'A dependência foi removida com sucesso.',
        });
        fetchDependencies();
        fetchAvailableTasks();
      } else {
        toast({
          title: 'Erro ao remover dependência',
          description: 'Ocorreu um erro inesperado.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Erro ao remover dependência',
        description: 'Ocorreu um erro inesperado.',
        variant: 'destructive',
      });
    }
  };

  const getTaskTitle = (taskId: string) => {
    const task = availableTasks.find(t => t.id === taskId) || 
                dependencies.find(d => d.dependsOnTaskId === taskId);
    return task ? `Tarefa: ${taskId.slice(0, 8)}...` : 'Tarefa não encontrada';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          Dependências da Tarefa
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add new dependency */}
        <div className="flex gap-2">
          <Select value={selectedTaskId} onValueChange={setSelectedTaskId}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Selecione uma tarefa..." />
            </SelectTrigger>
            <SelectContent>
              {availableTasks.map((task) => (
                <SelectItem key={task.id} value={task.id}>
                  {task.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button 
            onClick={addDependency} 
            disabled={!selectedTaskId || loading}
            size="sm"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Current dependencies */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Esta tarefa depende de:</h4>
          {dependencies.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma dependência configurada.
            </p>
          ) : (
            <div className="space-y-2">
              {dependencies.map((dependency) => {
                const dependentTask = availableTasks.find(t => t.id === dependency.dependsOnTaskId);
                return (
                  <div key={dependency.id} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {dependentTask?.title || getTaskTitle(dependency.dependsOnTaskId)}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        Status: {dependentTask?.status || 'Desconhecido'}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeDependency(dependency.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {dependencies.length > 0 && (
          <div className="text-xs text-muted-foreground p-2 bg-muted rounded">
            <AlertCircle className="h-3 w-3 inline mr-1" />
            Esta tarefa só pode ser iniciada quando todas as dependências estiverem concluídas.
          </div>
        )}
      </CardContent>
    </Card>
  );
}