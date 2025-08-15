import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import CalendarView from '@/components/calendar/calendar-view';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarDays, Clock, TrendingUp, AlertTriangle, Plus } from 'lucide-react';
import { format, isAfter, isBefore, addDays, startOfWeek, endOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  type: 'project' | 'task' | 'ticket';
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  priority?: 'low' | 'medium' | 'high';
  description?: string;
  projectName?: string;
}

interface Project {
  id: string;
  name: string;
  deadline?: string;
  status: string;
}

interface Task {
  id: string;
  title: string;
  dueDate?: string;
  status: string;
  priority: string;
  projectId: string;
}

interface Ticket {
  id: string;
  title: string;
  dueDate?: string;
  status: string;
  priority: string;
  projectId: string;
}

export default function Calendar() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedView, setSelectedView] = useState<'calendar' | 'timeline' | 'upcoming'>('calendar');

  // Buscar dados dos projetos
  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
    queryFn: async () => {
      const response = await fetch('/api/projects');
      if (!response.ok) throw new Error('Failed to fetch projects');
      return response.json();
    },
  });

  // Buscar dados das tarefas
  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: ['/api/tasks'],
    queryFn: async () => {
      const response = await fetch('/api/tasks');
      if (!response.ok) throw new Error('Failed to fetch tasks');
      return response.json();
    },
  });

  // Buscar dados dos chamados
  const { data: tickets = [] } = useQuery<Ticket[]>({
    queryKey: ['/api/tickets'],
    queryFn: async () => {
      const response = await fetch('/api/tickets');
      if (!response.ok) throw new Error('Failed to fetch tickets');
      return response.json();
    },
  });

  // Converter dados para eventos do calendário
  useEffect(() => {
    const calendarEvents: CalendarEvent[] = [];

    // Adicionar projetos com deadline
    projects.forEach(project => {
      if (project.deadline) {
        const deadline = new Date(project.deadline);
        const now = new Date();
        let status: CalendarEvent['status'] = 'pending';
        
        if (project.status === 'completed') {
          status = 'completed';
        } else if (isAfter(now, deadline)) {
          status = 'overdue';
        } else if (project.status === 'in_progress') {
          status = 'in_progress';
        }

        calendarEvents.push({
          id: `project-${project.id}`,
          title: `Deadline: ${project.name}`,
          date: deadline,
          type: 'project',
          status,
          priority: 'high',
          description: `Deadline do projeto ${project.name}`,
          projectName: project.name
        });
      }
    });

    // Adicionar tarefas com data de vencimento
    tasks.forEach(task => {
      if (task.dueDate) {
        const dueDate = new Date(task.dueDate);
        const now = new Date();
        let status: CalendarEvent['status'] = 'pending';
        
        if (task.status === 'completed') {
          status = 'completed';
        } else if (isAfter(now, dueDate)) {
          status = 'overdue';
        } else if (task.status === 'in_progress') {
          status = 'in_progress';
        }

        const project = projects.find(p => p.id === task.projectId);
        
        calendarEvents.push({
          id: `task-${task.id}`,
          title: task.title,
          date: dueDate,
          type: 'task',
          status,
          priority: task.priority as CalendarEvent['priority'],
          description: `Tarefa: ${task.title}`,
          projectName: project?.name
        });
      }
    });

    // Adicionar chamados com data de vencimento
    tickets.forEach(ticket => {
      if (ticket.dueDate) {
        const dueDate = new Date(ticket.dueDate);
        const now = new Date();
        let status: CalendarEvent['status'] = 'pending';
        
        if (ticket.status === 'resolved') {
          status = 'completed';
        } else if (isAfter(now, dueDate)) {
          status = 'overdue';
        } else if (ticket.status === 'in_progress') {
          status = 'in_progress';
        }

        const project = projects.find(p => p.id === ticket.projectId);
        
        calendarEvents.push({
          id: `ticket-${ticket.id}`,
          title: ticket.title,
          date: dueDate,
          type: 'ticket',
          status,
          priority: ticket.priority as CalendarEvent['priority'],
          description: `Chamado: ${ticket.title}`,
          projectName: project?.name
        });
      }
    });

    setEvents(calendarEvents);
  }, [projects, tasks, tickets]);

  const handleEventClick = (event: CalendarEvent) => {
    // Navegar para o item específico
    const [type, id] = event.id.split('-');
    switch (type) {
      case 'project':
        window.location.href = `/projects/${id}`;
        break;
      case 'task':
        window.location.href = `/tasks/${id}`;
        break;
      case 'ticket':
        window.location.href = `/tickets/${id}`;
        break;
    }
  };

  // Estatísticas para o dashboard
  const now = new Date();
  const nextWeek = addDays(now, 7);
  const upcomingEvents = events.filter(event => 
    isAfter(event.date, now) && isBefore(event.date, nextWeek)
  );
  const overdueEvents = events.filter(event => event.status === 'overdue');
  const thisWeekEvents = events.filter(event => {
    const weekStart = startOfWeek(now, { locale: ptBR });
    const weekEnd = endOfWeek(now, { locale: ptBR });
    return event.date >= weekStart && event.date <= weekEnd;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Calendário</h1>
          <p className="text-gray-600">Gerencie deadlines e marcos importantes dos seus projetos</p>
        </div>
        
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Novo Evento
        </Button>
      </div>

      {/* Estatísticas Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Esta Semana</p>
                <p className="text-2xl font-bold text-gray-900">{thisWeekEvents.length}</p>
              </div>
              <CalendarDays className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Próximos 7 Dias</p>
                <p className="text-2xl font-bold text-gray-900">{upcomingEvents.length}</p>
              </div>
              <Clock className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Em Atraso</p>
                <p className="text-2xl font-bold text-red-600">{overdueEvents.length}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Eventos</p>
                <p className="text-2xl font-bold text-gray-900">{events.length}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Conteúdo Principal */}
      <Tabs value={selectedView} onValueChange={(value) => setSelectedView(value as any)}>
        <TabsList>
          <TabsTrigger value="calendar">Calendário</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="upcoming">Próximos Eventos</TabsTrigger>
        </TabsList>
        
        <TabsContent value="calendar" className="mt-6">
          <CalendarView 
            events={events} 
            onEventClick={handleEventClick}
          />
        </TabsContent>
        
        <TabsContent value="timeline" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Timeline de Eventos</CardTitle>
              <CardDescription>
                Visualização cronológica dos próximos eventos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {events
                  .filter(event => isAfter(event.date, now))
                  .sort((a, b) => a.date.getTime() - b.date.getTime())
                  .slice(0, 10)
                  .map(event => (
                    <div 
                      key={event.id} 
                      className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => handleEventClick(event)}
                    >
                      <div className="flex-shrink-0">
                        <div className={`w-3 h-3 rounded-full ${
                          event.status === 'overdue' ? 'bg-red-500' :
                          event.status === 'in_progress' ? 'bg-blue-500' :
                          event.status === 'completed' ? 'bg-green-500' :
                          'bg-gray-400'
                        }`} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium truncate">{event.title}</h4>
                          <Badge variant="outline" className="text-xs">
                            {event.type}
                          </Badge>
                          {event.priority && (
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${
                                event.priority === 'high' ? 'border-red-200 text-red-700' :
                                event.priority === 'medium' ? 'border-yellow-200 text-yellow-700' :
                                'border-green-200 text-green-700'
                              }`}
                            >
                              {event.priority}
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>{format(event.date, 'dd/MM/yyyy', { locale: ptBR })}</span>
                          {event.projectName && (
                            <span>• {event.projectName}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                }
                
                {events.filter(event => isAfter(event.date, now)).length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <CalendarDays className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>Nenhum evento futuro encontrado</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="upcoming" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Próximos 7 dias */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Próximos 7 Dias
                </CardTitle>
                <CardDescription>
                  {upcomingEvents.length} evento(s) nos próximos 7 dias
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {upcomingEvents.map(event => (
                    <div 
                      key={event.id}
                      className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => handleEventClick(event)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium truncate">{event.title}</h4>
                          <p className="text-sm text-gray-600 mt-1">
                            {format(event.date, 'dd/MM/yyyy', { locale: ptBR })}
                          </p>
                          {event.projectName && (
                            <p className="text-xs text-gray-500 mt-1">
                              {event.projectName}
                            </p>
                          )}
                        </div>
                        
                        <div className="flex flex-col gap-1 ml-2">
                          <Badge variant="outline" className="text-xs">
                            {event.type}
                          </Badge>
                          {event.priority && (
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${
                                event.priority === 'high' ? 'border-red-200 text-red-700' :
                                event.priority === 'medium' ? 'border-yellow-200 text-yellow-700' :
                                'border-green-200 text-green-700'
                              }`}
                            >
                              {event.priority}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {upcomingEvents.length === 0 && (
                    <div className="text-center py-6 text-gray-500">
                      <p className="text-sm">Nenhum evento nos próximos 7 dias</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            {/* Eventos em atraso */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  Em Atraso
                </CardTitle>
                <CardDescription>
                  {overdueEvents.length} evento(s) em atraso
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {overdueEvents.map(event => (
                    <div 
                      key={event.id}
                      className="p-3 border border-red-200 bg-red-50 rounded-lg hover:bg-red-100 cursor-pointer transition-colors"
                      onClick={() => handleEventClick(event)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium truncate text-red-900">{event.title}</h4>
                          <p className="text-sm text-red-700 mt-1">
                            Venceu em: {format(event.date, 'dd/MM/yyyy', { locale: ptBR })}
                          </p>
                          {event.projectName && (
                            <p className="text-xs text-red-600 mt-1">
                              {event.projectName}
                            </p>
                          )}
                        </div>
                        
                        <div className="flex flex-col gap-1 ml-2">
                          <Badge variant="outline" className="text-xs border-red-300 text-red-700">
                            {event.type}
                          </Badge>
                          {event.priority && (
                            <Badge variant="outline" className="text-xs border-red-300 text-red-700">
                              {event.priority}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {overdueEvents.length === 0 && (
                    <div className="text-center py-6 text-green-600">
                      <p className="text-sm">🎉 Nenhum evento em atraso!</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}