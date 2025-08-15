import { useQuery } from '@tanstack/react-query';
import { useState, useMemo } from 'react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays, subWeeks, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface ReportData {
  id: string;
  name: string;
  description: string;
  type: 'productivity' | 'project-status' | 'team-performance' | 'time-tracking' | 'custom';
  period: {
    start: Date;
    end: Date;
  };
  data: any;
  generatedAt: Date;
}

export interface ProductivityReport {
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
  totalTickets: number;
  resolvedTickets: number;
  resolutionRate: number;
  averageTaskTime: number;
  teamMembers: {
    id: string;
    name: string;
    tasksCompleted: number;
    tasksAssigned: number;
    ticketsResolved: number;
    productivity: number;
  }[];
}

export interface ProjectStatusReport {
  totalProjects: number;
  projectsByStatus: {
    status: string;
    count: number;
    percentage: number;
  }[];
  projectsOnTime: number;
  projectsDelayed: number;
  averageProjectDuration: number;
  projects: {
    id: string;
    name: string;
    status: string;
    progress: number;
    startDate: string;
    endDate: string;
    isDelayed: boolean;
  }[];
}

export interface TimeTrackingReport {
  totalHours: number;
  billableHours: number;
  nonBillableHours: number;
  averageHoursPerDay: number;
  timeByProject: {
    projectId: string;
    projectName: string;
    hours: number;
    percentage: number;
  }[];
  timeByMember: {
    memberId: string;
    memberName: string;
    hours: number;
    efficiency: number;
  }[];
}

type ReportPeriod = 'today' | 'yesterday' | 'this-week' | 'last-week' | 'this-month' | 'last-month' | 'custom';

export function useReports() {
  const [selectedPeriod, setSelectedPeriod] = useState<ReportPeriod>('this-month');
  const [customDateRange, setCustomDateRange] = useState<{ start: Date; end: Date }>({ 
    start: startOfMonth(new Date()), 
    end: endOfMonth(new Date()) 
  });
  const [selectedReportType, setSelectedReportType] = useState<ReportData['type']>('productivity');

  // Calcular período baseado na seleção
  const dateRange = useMemo(() => {
    const now = new Date();
    
    switch (selectedPeriod) {
      case 'today':
        return { start: now, end: now };
      case 'yesterday':
        const yesterday = subDays(now, 1);
        return { start: yesterday, end: yesterday };
      case 'this-week':
        return { start: startOfWeek(now, { locale: ptBR }), end: endOfWeek(now, { locale: ptBR }) };
      case 'last-week':
        const lastWeekStart = startOfWeek(subWeeks(now, 1), { locale: ptBR });
        const lastWeekEnd = endOfWeek(subWeeks(now, 1), { locale: ptBR });
        return { start: lastWeekStart, end: lastWeekEnd };
      case 'this-month':
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case 'last-month':
        const lastMonthStart = startOfMonth(subMonths(now, 1));
        const lastMonthEnd = endOfMonth(subMonths(now, 1));
        return { start: lastMonthStart, end: lastMonthEnd };
      case 'custom':
        return customDateRange;
      default:
        return { start: startOfMonth(now), end: endOfMonth(now) };
    }
  }, [selectedPeriod, customDateRange]);

  // Query para dados de produtividade
  const { data: productivityData, isLoading: productivityLoading } = useQuery<ProductivityReport>({
    queryKey: ['/api/reports/productivity', dateRange],
    queryFn: async () => {
      // Simular dados de produtividade
      return {
        totalTasks: 156,
        completedTasks: 134,
        completionRate: 85.9,
        totalTickets: 89,
        resolvedTickets: 76,
        resolutionRate: 85.4,
        averageTaskTime: 4.2,
        teamMembers: [
          {
            id: '1',
            name: 'João Silva',
            tasksCompleted: 28,
            tasksAssigned: 32,
            ticketsResolved: 15,
            productivity: 87.5
          },
          {
            id: '2',
            name: 'Maria Santos',
            tasksCompleted: 35,
            tasksAssigned: 38,
            ticketsResolved: 22,
            productivity: 92.1
          },
          {
            id: '3',
            name: 'Pedro Costa',
            tasksCompleted: 24,
            tasksAssigned: 30,
            ticketsResolved: 18,
            productivity: 80.0
          },
          {
            id: '4',
            name: 'Ana Oliveira',
            tasksCompleted: 31,
            tasksAssigned: 34,
            ticketsResolved: 21,
            productivity: 91.2
          }
        ]
      };
    }
  });

  // Query para dados de status de projetos
  const { data: projectStatusData, isLoading: projectStatusLoading } = useQuery<ProjectStatusReport>({
    queryKey: ['/api/reports/project-status', dateRange],
    queryFn: async () => {
      return {
        totalProjects: 12,
        projectsByStatus: [
          { status: 'completed', count: 3, percentage: 25 },
          { status: 'in_progress', count: 6, percentage: 50 },
          { status: 'planning', count: 2, percentage: 16.7 },
          { status: 'on_hold', count: 1, percentage: 8.3 }
        ],
        projectsOnTime: 8,
        projectsDelayed: 4,
        averageProjectDuration: 45,
        projects: [
          {
            id: '1',
            name: 'Sistema de Gestão',
            status: 'in_progress',
            progress: 75,
            startDate: '2024-01-15',
            endDate: '2024-03-15',
            isDelayed: false
          },
          {
            id: '2',
            name: 'App Mobile',
            status: 'completed',
            progress: 100,
            startDate: '2023-11-01',
            endDate: '2024-01-30',
            isDelayed: true
          }
        ]
      };
    }
  });

  // Query para dados de controle de tempo
  const { data: timeTrackingData, isLoading: timeTrackingLoading } = useQuery<TimeTrackingReport>({
    queryKey: ['/api/reports/time-tracking', dateRange],
    queryFn: async () => {
      return {
        totalHours: 320,
        billableHours: 280,
        nonBillableHours: 40,
        averageHoursPerDay: 8.2,
        timeByProject: [
          {
            projectId: '1',
            projectName: 'Sistema de Gestão',
            hours: 120,
            percentage: 37.5
          },
          {
            projectId: '2',
            projectName: 'App Mobile',
            hours: 80,
            percentage: 25
          },
          {
            projectId: '3',
            projectName: 'Website Corporativo',
            hours: 60,
            percentage: 18.75
          }
        ],
        timeByMember: [
          {
            memberId: '1',
            memberName: 'João Silva',
            hours: 85,
            efficiency: 92
          },
          {
            memberId: '2',
            memberName: 'Maria Santos',
            hours: 95,
            efficiency: 88
          }
        ]
      };
    }
  });

  // Função para gerar relatório
  const generateReport = (type: ReportData['type']): ReportData | null => {
    const baseReport = {
      id: `report-${Date.now()}`,
      generatedAt: new Date(),
      period: dateRange
    };

    switch (type) {
      case 'productivity':
        if (!productivityData) return null;
        return {
          ...baseReport,
          name: 'Relatório de Produtividade',
          description: `Análise de produtividade da equipe de ${format(dateRange.start, 'dd/MM/yyyy', { locale: ptBR })} a ${format(dateRange.end, 'dd/MM/yyyy', { locale: ptBR })}`,
          type: 'productivity',
          data: productivityData
        };
      
      case 'project-status':
        if (!projectStatusData) return null;
        return {
          ...baseReport,
          name: 'Relatório de Status de Projetos',
          description: `Status e progresso dos projetos de ${format(dateRange.start, 'dd/MM/yyyy', { locale: ptBR })} a ${format(dateRange.end, 'dd/MM/yyyy', { locale: ptBR })}`,
          type: 'project-status',
          data: projectStatusData
        };
      
      case 'time-tracking':
        if (!timeTrackingData) return null;
        return {
          ...baseReport,
          name: 'Relatório de Controle de Tempo',
          description: `Análise de horas trabalhadas de ${format(dateRange.start, 'dd/MM/yyyy', { locale: ptBR })} a ${format(dateRange.end, 'dd/MM/yyyy', { locale: ptBR })}`,
          type: 'time-tracking',
          data: timeTrackingData
        };
      
      default:
        return null;
    }
  };

  const isLoading = productivityLoading || projectStatusLoading || timeTrackingLoading;

  return {
    // Estado
    selectedPeriod,
    setSelectedPeriod,
    customDateRange,
    setCustomDateRange,
    selectedReportType,
    setSelectedReportType,
    dateRange,
    
    // Dados
    productivityData,
    projectStatusData,
    timeTrackingData,
    
    // Status
    isLoading,
    
    // Funções
    generateReport
  };
}