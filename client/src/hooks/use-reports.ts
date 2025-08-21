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
  const [selectedUserId, setSelectedUserId] = useState<string | undefined>(undefined);
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>(undefined);

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
  const { data: productivityData, isLoading: productivityLoading, error: productivityError } = useQuery<ProductivityReport>({
    queryKey: ['/api/reports/productivity', dateRange, selectedUserId, selectedProjectId],
    queryFn: async () => {
      const params = new URLSearchParams({
        startDate: dateRange.start.toISOString(),
        endDate: dateRange.end.toISOString()
      });
      
      if (selectedUserId) {
        params.append('userId', selectedUserId);
      }
      if (selectedProjectId) {
        params.append('projectId', selectedProjectId);
      }
      
      const response = await fetch(`/api/reports/productivity?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch productivity report');
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    refetchInterval: 10 * 60 * 1000 // Refetch a cada 10 minutos
  });

  // Query para dados de status de projetos
  const { data: projectStatusData, isLoading: projectStatusLoading } = useQuery<ProjectStatusReport>({
    queryKey: ['/api/reports/project-status', dateRange],
    queryFn: async () => {
      const params = new URLSearchParams({
        startDate: dateRange.start.toISOString(),
        endDate: dateRange.end.toISOString()
      });
      
      const response = await fetch(`/api/reports/project-status?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch project status report');
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000
  });

  // Query para dados de controle de tempo
  const { data: timeTrackingData, isLoading: timeTrackingLoading, error: timeTrackingError } = useQuery<TimeTrackingReport>({
    queryKey: ['/api/reports/time-tracking', dateRange, selectedUserId, selectedProjectId],
    queryFn: async () => {
      const params = new URLSearchParams({
        startDate: dateRange.start.toISOString(),
        endDate: dateRange.end.toISOString()
      });
      
      if (selectedUserId) {
        params.append('userId', selectedUserId);
      }
      if (selectedProjectId) {
        params.append('projectId', selectedProjectId);
      }
      
      const response = await fetch(`/api/reports/time-tracking?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch time tracking report');
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000
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

  // Função para exportar dados
  const exportReport = (reportData: any, reportType: string, format: 'csv' | 'json' = 'json') => {
    const filename = `${reportType}-${format(dateRange.start, 'yyyy-MM-dd', { locale: ptBR })}-${format(dateRange.end, 'yyyy-MM-dd', { locale: ptBR })}.${format}`;
    
    if (format === 'json') {
      const dataStr = JSON.stringify(reportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      
      URL.revokeObjectURL(url);
    } else if (format === 'csv') {
      // Implementação de CSV baseada no tipo de relatório
      let csvContent = '';
      
      if (reportType === 'productivity' && reportData.teamMembers) {
        csvContent = 'Nome,Tarefas Atribuídas,Tarefas Concluídas,Tickets Resolvidos,Produtividade\n';
        csvContent += reportData.teamMembers.map((member: any) => 
          `${member.name},${member.tasksAssigned},${member.tasksCompleted},${member.ticketsResolved},${member.productivity.toFixed(1)}%`
        ).join('\n');
      }
      
      const dataBlob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      
      URL.revokeObjectURL(url);
    }
  };

  return {
    // Estado
    selectedPeriod,
    setSelectedPeriod,
    customDateRange,
    setCustomDateRange,
    selectedReportType,
    setSelectedReportType,
    selectedUserId,
    setSelectedUserId,
    selectedProjectId,
    setSelectedProjectId,
    dateRange,
    
    // Dados
    productivityData,
    projectStatusData,
    timeTrackingData,
    
    // Status
    isLoading,
    hasError: !!(productivityError || timeTrackingError),
    
    // Funções
    generateReport,
    exportReport
  };
}