import { useQuery } from '@tanstack/react-query';
import { useState, useMemo } from 'react';

interface DashboardAnalytics {
  projectProgress: {
    name: string;
    value: number;
    color: string;
  }[];
  productivity: {
    name: string;
    tarefasConcluidas: number;
    tarefasAtribuidas: number;
    chamadosResolvidos: number;
  }[];
  timeline: {
    date: string;
    projetos: number;
    tarefas: number;
    chamados: number;
  }[];
}

interface Widget {
  id: string;
  title: string;
  type: 'stat' | 'progress' | 'list' | 'calendar';
  visible: boolean;
  data?: any;
}

export function useDashboardAnalytics() {
  const [widgets, setWidgets] = useState<Widget[]>([
    {
      id: 'active-projects',
      title: 'Projetos Ativos',
      type: 'stat',
      visible: true,
      data: { value: 12, change: 8, description: 'vs último mês' }
    },
    {
      id: 'team-performance',
      title: 'Performance da Equipe',
      type: 'progress',
      visible: true,
      data: {
        items: [
          { name: 'João Silva', progress: 85 },
          { name: 'Maria Santos', progress: 92 },
          { name: 'Pedro Costa', progress: 78 }
        ]
      }
    },
    {
      id: 'urgent-tasks',
      title: 'Tarefas Urgentes',
      type: 'list',
      visible: true,
      data: {
        items: [
          { title: 'Corrigir bug crítico', type: 'task', priority: 'high' },
          { title: 'Revisar código', type: 'task', priority: 'medium' },
          { title: 'Deadline projeto X', type: 'deadline', priority: 'high' }
        ]
      }
    },
    {
      id: 'upcoming-events',
      title: 'Próximos Eventos',
      type: 'calendar',
      visible: true,
      data: {
        events: [
          { title: 'Reunião de Sprint', date: new Date().toISOString() },
          { title: 'Entrega do Projeto', date: new Date(Date.now() + 86400000).toISOString() }
        ]
      }
    },
    {
      id: 'completed-tasks',
      title: 'Tarefas Concluídas',
      type: 'stat',
      visible: false,
      data: { value: 47, change: 15, description: 'esta semana' }
    },
    {
      id: 'project-health',
      title: 'Saúde dos Projetos',
      type: 'progress',
      visible: false,
      data: {
        items: [
          { name: 'Projeto Alpha', progress: 95 },
          { name: 'Projeto Beta', progress: 67 },
          { name: 'Projeto Gamma', progress: 43 }
        ]
      }
    }
  ]);

  // Simular dados de analytics (em produção, viria da API)
  const analyticsData: DashboardAnalytics = useMemo(() => ({
    projectProgress: [
      { name: 'Concluídos', value: 8, color: '#10b981' },
      { name: 'Em Progresso', value: 12, color: '#3b82f6' },
      { name: 'Planejamento', value: 5, color: '#f59e0b' },
      { name: 'Em Revisão', value: 3, color: '#8b5cf6' }
    ],
    productivity: [
      { name: 'João', tarefasConcluidas: 12, tarefasAtribuidas: 15, chamadosResolvidos: 8 },
      { name: 'Maria', tarefasConcluidas: 18, tarefasAtribuidas: 20, chamadosResolvidos: 12 },
      { name: 'Pedro', tarefasConcluidas: 9, tarefasAtribuidas: 12, chamadosResolvidos: 5 },
      { name: 'Ana', tarefasConcluidas: 15, tarefasAtribuidas: 18, chamadosResolvidos: 10 }
    ],
    timeline: [
      { date: '01/01', projetos: 2, tarefas: 8, chamados: 5 },
      { date: '02/01', projetos: 1, tarefas: 12, chamados: 7 },
      { date: '03/01', projetos: 3, tarefas: 15, chamados: 4 },
      { date: '04/01', projetos: 0, tarefas: 10, chamados: 8 },
      { date: '05/01', projetos: 2, tarefas: 18, chamados: 6 },
      { date: '06/01', projetos: 1, tarefas: 14, chamados: 9 },
      { date: '07/01', projetos: 4, tarefas: 20, chamados: 3 }
    ]
  }), []);

  const toggleWidget = (widgetId: string) => {
    setWidgets(prev => prev.map(widget => 
      widget.id === widgetId 
        ? { ...widget, visible: !widget.visible }
        : widget
    ));
  };

  const configureWidget = (widgetId: string) => {
    // Implementar configuração específica do widget
    console.log('Configurando widget:', widgetId);
  };

  return {
    analyticsData,
    widgets,
    toggleWidget,
    configureWidget,
    isLoading: false // Em produção, seria baseado no estado das queries
  };
}