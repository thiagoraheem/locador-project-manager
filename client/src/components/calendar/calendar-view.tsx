import React, { useState, useEffect } from 'react';
import { Calendar, dateFns } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarDays, Clock, AlertTriangle, CheckCircle, Download } from 'lucide-react';
import { format, isSameDay, parseISO, addDays, startOfMonth, endOfMonth } from 'date-fns';
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

interface CalendarViewProps {
  events?: CalendarEvent[];
  onEventClick?: (event: CalendarEvent) => void;
  onDateSelect?: (date: Date) => void;
}

const mockEvents: CalendarEvent[] = [
  {
    id: '1',
    title: 'Entrega do Módulo de Autenticação',
    date: new Date(2024, 0, 15),
    type: 'project',
    status: 'pending',
    priority: 'high',
    description: 'Finalizar implementação do sistema de login e registro',
    projectName: 'Sistema de Gestão'
  },
  {
    id: '2',
    title: 'Revisão de Código - Frontend',
    date: new Date(2024, 0, 18),
    type: 'task',
    status: 'in_progress',
    priority: 'medium',
    description: 'Code review dos componentes React implementados',
    projectName: 'Sistema de Gestão'
  },
  {
    id: '3',
    title: 'Bug: Erro no carregamento de dados',
    date: new Date(2024, 0, 12),
    type: 'ticket',
    status: 'overdue',
    priority: 'high',
    description: 'Corrigir erro 500 na API de usuários',
    projectName: 'Sistema de Gestão'
  },
  {
    id: '4',
    title: 'Deploy em Produção',
    date: new Date(2024, 0, 25),
    type: 'project',
    status: 'pending',
    priority: 'high',
    description: 'Deploy da versão 2.0 do sistema',
    projectName: 'Sistema de Gestão'
  }
];

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed': return 'bg-green-100 text-green-800 border-green-200';
    case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'overdue': return 'bg-red-100 text-red-800 border-red-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getPriorityColor = (priority?: string) => {
  switch (priority) {
    case 'high': return 'bg-red-100 text-red-800';
    case 'medium': return 'bg-yellow-100 text-yellow-800';
    case 'low': return 'bg-green-100 text-green-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'project': return <CalendarDays className="w-4 h-4" />;
    case 'task': return <CheckCircle className="w-4 h-4" />;
    case 'ticket': return <AlertTriangle className="w-4 h-4" />;
    default: return <Clock className="w-4 h-4" />;
  }
};

export default function CalendarView({ events = mockEvents, onEventClick, onDateSelect }: CalendarViewProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');
  const [filteredEvents, setFilteredEvents] = useState<CalendarEvent[]>(events);
  const [filterType, setFilterType] = useState<'all' | 'project' | 'task' | 'ticket'>('all');

  useEffect(() => {
    if (filterType === 'all') {
      setFilteredEvents(events);
    } else {
      setFilteredEvents(events.filter(event => event.type === filterType));
    }
  }, [events, filterType]);

  const getEventsForDate = (date: Date) => {
    return filteredEvents.filter(event => isSameDay(event.date, date));
  };

  const getEventsForMonth = (date: Date) => {
    const start = startOfMonth(date);
    const end = endOfMonth(date);
    return filteredEvents.filter(event => 
      event.date >= start && event.date <= end
    );
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      onDateSelect?.(date);
    }
  };

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    onEventClick?.(event);
  };

  const exportToCalendar = () => {
    // Simula exportação para calendário externo (Google Calendar, Outlook, etc.)
    const icsContent = generateICSContent(filteredEvents);
    const blob = new Blob([icsContent], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'project-calendar.ics';
    a.click();
    URL.revokeObjectURL(url);
  };

  const generateICSContent = (events: CalendarEvent[]) => {
    let icsContent = 'BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//ProjectFlow//Calendar//EN\n';
    
    events.forEach(event => {
      const dateStr = format(event.date, 'yyyyMMdd');
      icsContent += `BEGIN:VEVENT\n`;
      icsContent += `UID:${event.id}@projectflow.com\n`;
      icsContent += `DTSTART:${dateStr}\n`;
      icsContent += `SUMMARY:${event.title}\n`;
      icsContent += `DESCRIPTION:${event.description || ''}\n`;
      icsContent += `END:VEVENT\n`;
    });
    
    icsContent += 'END:VCALENDAR';
    return icsContent;
  };

  const todayEvents = getEventsForDate(new Date());
  const selectedDateEvents = getEventsForDate(selectedDate);
  const monthEvents = getEventsForMonth(selectedDate);

  return (
    <div className="space-y-6">
      {/* Header com filtros e ações */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Calendário de Projetos</h2>
          <p className="text-gray-600">Visualize deadlines e marcos importantes</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Tabs value={filterType} onValueChange={(value) => setFilterType(value as any)} className="w-auto">
            <TabsList>
              <TabsTrigger value="all">Todos</TabsTrigger>
              <TabsTrigger value="project">Projetos</TabsTrigger>
              <TabsTrigger value="task">Tarefas</TabsTrigger>
              <TabsTrigger value="ticket">Chamados</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <Button onClick={exportToCalendar} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendário Principal */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="w-5 h-5" />
                {format(selectedDate, 'MMMM yyyy', { locale: ptBR })}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                locale={ptBR}
                className="rounded-md border"
                modifiers={{
                  hasEvents: (date) => getEventsForDate(date).length > 0,
                  overdue: (date) => getEventsForDate(date).some(e => e.status === 'overdue')
                }}
                modifiersStyles={{
                  hasEvents: { backgroundColor: '#dbeafe', fontWeight: 'bold' },
                  overdue: { backgroundColor: '#fee2e2', color: '#dc2626' }
                }}
              />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar com eventos */}
        <div className="space-y-4">
          {/* Eventos de Hoje */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Hoje</CardTitle>
              <CardDescription>
                {todayEvents.length} evento(s) para hoje
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {todayEvents.length === 0 ? (
                <p className="text-gray-500 text-sm">Nenhum evento para hoje</p>
              ) : (
                todayEvents.map(event => (
                  <div
                    key={event.id}
                    className="p-2 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => handleEventClick(event)}
                  >
                    <div className="flex items-start gap-2">
                      {getTypeIcon(event.type)}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{event.title}</p>
                        <div className="flex gap-1 mt-1">
                          <Badge variant="outline" className={`text-xs ${getStatusColor(event.status)}`}>
                            {event.status}
                          </Badge>
                          {event.priority && (
                            <Badge variant="outline" className={`text-xs ${getPriorityColor(event.priority)}`}>
                              {event.priority}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Eventos da Data Selecionada */}
          {!isSameDay(selectedDate, new Date()) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {format(selectedDate, 'dd/MM/yyyy')}
                </CardTitle>
                <CardDescription>
                  {selectedDateEvents.length} evento(s) para esta data
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {selectedDateEvents.length === 0 ? (
                  <p className="text-gray-500 text-sm">Nenhum evento para esta data</p>
                ) : (
                  selectedDateEvents.map(event => (
                    <div
                      key={event.id}
                      className="p-2 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => handleEventClick(event)}
                    >
                      <div className="flex items-start gap-2">
                        {getTypeIcon(event.type)}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{event.title}</p>
                          <div className="flex gap-1 mt-1">
                            <Badge variant="outline" className={`text-xs ${getStatusColor(event.status)}`}>
                              {event.status}
                            </Badge>
                            {event.priority && (
                              <Badge variant="outline" className={`text-xs ${getPriorityColor(event.priority)}`}>
                                {event.priority}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          )}

          {/* Resumo do Mês */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Resumo do Mês</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Total de eventos:</span>
                  <span className="font-medium">{monthEvents.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Projetos:</span>
                  <span className="font-medium">
                    {monthEvents.filter(e => e.type === 'project').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Tarefas:</span>
                  <span className="font-medium">
                    {monthEvents.filter(e => e.type === 'task').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Chamados:</span>
                  <span className="font-medium">
                    {monthEvents.filter(e => e.type === 'ticket').length}
                  </span>
                </div>
                <div className="flex justify-between text-red-600">
                  <span>Em atraso:</span>
                  <span className="font-medium">
                    {monthEvents.filter(e => e.status === 'overdue').length}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialog de Detalhes do Evento */}
      <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedEvent && getTypeIcon(selectedEvent.type)}
              {selectedEvent?.title}
            </DialogTitle>
            <DialogDescription>
              {selectedEvent?.projectName && (
                <span className="text-sm text-gray-600">
                  Projeto: {selectedEvent.projectName}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          
          {selectedEvent && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <Badge variant="outline" className={getStatusColor(selectedEvent.status)}>
                  {selectedEvent.status}
                </Badge>
                {selectedEvent.priority && (
                  <Badge variant="outline" className={getPriorityColor(selectedEvent.priority)}>
                    Prioridade: {selectedEvent.priority}
                  </Badge>
                )}
                <Badge variant="outline">
                  {selectedEvent.type}
                </Badge>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Data:</h4>
                <p className="text-sm text-gray-600">
                  {format(selectedEvent.date, 'dd/MM/yyyy', { locale: ptBR })}
                </p>
              </div>
              
              {selectedEvent.description && (
                <div>
                  <h4 className="font-medium mb-2">Descrição:</h4>
                  <p className="text-sm text-gray-600">{selectedEvent.description}</p>
                </div>
              )}
              
              <div className="flex gap-2 pt-4">
                <Button size="sm" onClick={() => setSelectedEvent(null)}>
                  Fechar
                </Button>
                <Button size="sm" variant="outline">
                  Ver Detalhes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}