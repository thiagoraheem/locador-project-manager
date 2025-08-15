import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useReports, type ReportData } from '@/hooks/use-reports';
import { exportToExcel, exportToPDF } from '@/lib/export-utils';
import { ProductivityReportView } from './productivity-report-view';
import { ProjectStatusReportView } from './project-status-report-view';
import { TimeTrackingReportView } from './time-tracking-report-view';
import { 
  FileText, 
  Download, 
  Calendar as CalendarIcon, 
  BarChart3, 
  Clock, 
  Users,
  FileSpreadsheet,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export function ReportsDashboard() {
  const {
    selectedPeriod,
    setSelectedPeriod,
    customDateRange,
    setCustomDateRange,
    selectedReportType,
    setSelectedReportType,
    dateRange,
    productivityData,
    projectStatusData,
    timeTrackingData,
    isLoading,
    generateReport
  } = useReports();

  const [isExporting, setIsExporting] = useState(false);
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);

  const reportTypes = [
    {
      id: 'productivity' as const,
      name: 'Produtividade',
      description: 'Análise de produtividade da equipe',
      icon: Users,
      color: 'bg-blue-500'
    },
    {
      id: 'project-status' as const,
      name: 'Status de Projetos',
      description: 'Progresso e status dos projetos',
      icon: BarChart3,
      color: 'bg-green-500'
    },
    {
      id: 'time-tracking' as const,
      name: 'Controle de Tempo',
      description: 'Análise de horas trabalhadas',
      icon: Clock,
      color: 'bg-purple-500'
    }
  ];

  const periodOptions = [
    { value: 'today', label: 'Hoje' },
    { value: 'yesterday', label: 'Ontem' },
    { value: 'this-week', label: 'Esta Semana' },
    { value: 'last-week', label: 'Semana Passada' },
    { value: 'this-month', label: 'Este Mês' },
    { value: 'last-month', label: 'Mês Passado' },
    { value: 'custom', label: 'Período Personalizado' }
  ];

  const handleExport = async (format: 'excel' | 'pdf') => {
    const report = generateReport(selectedReportType);
    if (!report) {
      console.error('Não foi possível gerar o relatório');
      return;
    }

    setIsExporting(true);
    try {
      if (format === 'excel') {
        exportToExcel(report);
      } else {
        exportToPDF(report);
      }
    } catch (error) {
      console.error('Erro ao exportar relatório:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const getCurrentData = () => {
    switch (selectedReportType) {
      case 'productivity':
        return productivityData;
      case 'project-status':
        return projectStatusData;
      case 'time-tracking':
        return timeTrackingData;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Relatórios</h1>
          <p className="text-gray-600">Gere e exporte relatórios detalhados de produtividade</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button
            onClick={() => handleExport('excel')}
            disabled={isExporting || isLoading || !getCurrentData()}
            variant="outline"
            className="flex items-center space-x-2"
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileSpreadsheet className="h-4 w-4" />
            )}
            <span>Excel</span>
          </Button>
          
          <Button
            onClick={() => handleExport('pdf')}
            disabled={isExporting || isLoading || !getCurrentData()}
            className="flex items-center space-x-2"
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileText className="h-4 w-4" />
            )}
            <span>PDF</span>
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CalendarIcon className="h-5 w-5" />
            <span>Configurações do Relatório</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Seleção de Período */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Período</label>
              <Select value={selectedPeriod} onValueChange={(value: any) => setSelectedPeriod(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o período" />
                </SelectTrigger>
                <SelectContent>
                  {periodOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Data Personalizada */}
            {selectedPeriod === 'custom' && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Período Personalizado</label>
                <Popover open={showCustomDatePicker} onOpenChange={setShowCustomDatePicker}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !customDateRange && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {customDateRange ? (
                        `${format(customDateRange.start, 'dd/MM/yyyy', { locale: ptBR })} - ${format(customDateRange.end, 'dd/MM/yyyy', { locale: ptBR })}`
                      ) : (
                        "Selecione as datas"
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="range"
                      selected={{
                        from: customDateRange.start,
                        to: customDateRange.end
                      }}
                      onSelect={(range) => {
                        if (range?.from && range?.to) {
                          setCustomDateRange({ start: range.from, end: range.to });
                          setShowCustomDatePicker(false);
                        }
                      }}
                      numberOfMonths={2}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}
          </div>

          {/* Período Selecionado */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Período selecionado:</span>
            <Badge variant="secondary">
              {format(dateRange.start, 'dd/MM/yyyy', { locale: ptBR })} - {format(dateRange.end, 'dd/MM/yyyy', { locale: ptBR })}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Tipos de Relatório */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {reportTypes.map(type => {
          const Icon = type.icon;
          const isSelected = selectedReportType === type.id;
          
          return (
            <Card 
              key={type.id} 
              className={cn(
                "cursor-pointer transition-all hover:shadow-md",
                isSelected && "ring-2 ring-primary shadow-md"
              )}
              onClick={() => setSelectedReportType(type.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <div className={cn("p-2 rounded-lg", type.color)}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{type.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{type.description}</p>
                  </div>
                  {isSelected && (
                    <div className="h-2 w-2 bg-primary rounded-full" />
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Conteúdo do Relatório */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>{reportTypes.find(t => t.id === selectedReportType)?.name}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-600">Carregando dados...</span>
            </div>
          ) : (
            <Tabs value={selectedReportType} onValueChange={(value: any) => setSelectedReportType(value)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="productivity">Produtividade</TabsTrigger>
                <TabsTrigger value="project-status">Projetos</TabsTrigger>
                <TabsTrigger value="time-tracking">Tempo</TabsTrigger>
              </TabsList>
              
              <TabsContent value="productivity" className="mt-6">
                {productivityData && <ProductivityReportView data={productivityData} />}
              </TabsContent>
              
              <TabsContent value="project-status" className="mt-6">
                {projectStatusData && <ProjectStatusReportView data={projectStatusData} />}
              </TabsContent>
              
              <TabsContent value="time-tracking" className="mt-6">
                {timeTrackingData && <TimeTrackingReportView data={timeTrackingData} />}
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
}