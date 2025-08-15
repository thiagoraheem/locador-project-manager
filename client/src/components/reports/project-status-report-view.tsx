import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { FolderKanban, Clock, CheckCircle, AlertTriangle, Calendar } from 'lucide-react';
import type { ProjectStatusReport } from '@/hooks/use-reports';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ProjectStatusReportViewProps {
  data: ProjectStatusReport;
}

export function ProjectStatusReportView({ data }: ProjectStatusReportViewProps) {
  // Dados para gráfico de pizza de status
  const statusChartData = data.projectsByStatus.map(status => ({
    name: getStatusDisplayName(status.status),
    value: status.count,
    percentage: status.percentage,
    color: getStatusColor(status.status)
  }));

  // Dados para gráfico de barras de progresso
  const progressChartData = data.projects.map(project => ({
    name: project.name.length > 15 ? project.name.substring(0, 15) + '...' : project.name,
    progress: project.progress,
    status: getStatusDisplayName(project.status),
    isDelayed: project.isDelayed
  }));

  const onTimePercentage = (data.projectsOnTime / data.totalProjects) * 100;
  const delayedPercentage = (data.projectsDelayed / data.totalProjects) * 100;

  return (
    <div className="space-y-6">
      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FolderKanban className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total de Projetos</p>
                <p className="text-2xl font-bold text-gray-900">{data.totalProjects}</p>
                <p className="text-xs text-gray-500">ativos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">No Prazo</p>
                <p className="text-2xl font-bold text-gray-900">{data.projectsOnTime}</p>
                <p className="text-xs text-gray-500">{onTimePercentage.toFixed(1)}% do total</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Atrasados</p>
                <p className="text-2xl font-bold text-gray-900">{data.projectsDelayed}</p>
                <p className="text-xs text-gray-500">{delayedPercentage.toFixed(1)}% do total</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Calendar className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Duração Média</p>
                <p className="text-2xl font-bold text-gray-900">{data.averageProjectDuration}</p>
                <p className="text-xs text-gray-500">dias</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Status dos Projetos */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {statusChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value, name, props) => [
                      `${value} projetos (${props.payload.percentage.toFixed(1)}%)`, 
                      'Quantidade'
                    ]} 
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4">
              {statusChartData.map((entry, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-sm text-gray-600">
                    {entry.name}: {entry.value} ({entry.percentage.toFixed(1)}%)
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Gráfico de Progresso dos Projetos */}
        <Card>
          <CardHeader>
            <CardTitle>Progresso dos Projetos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={progressChartData} 
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  layout="horizontal"
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 100]} />
                  <YAxis dataKey="name" type="category" width={100} />
                  <Tooltip 
                    formatter={(value) => [`${value}%`, 'Progresso']}
                    labelFormatter={(label) => `Projeto: ${label}`}
                  />
                  <Bar 
                    dataKey="progress" 
                    fill={(entry) => entry.isDelayed ? '#ef4444' : '#10b981'}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Resumo de Status */}
      <Card>
        <CardHeader>
          <CardTitle>Resumo por Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {data.projectsByStatus.map((status, index) => {
              const statusName = getStatusDisplayName(status.status);
              const statusColor = getStatusColor(status.status);
              
              return (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{statusName}</h4>
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: statusColor }}
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Quantidade:</span>
                      <span className="font-medium">{status.count}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Percentual:</span>
                      <span className="font-medium">{status.percentage.toFixed(1)}%</span>
                    </div>
                    <Progress value={status.percentage} className="h-2 mt-2" />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Tabela Detalhada de Projetos */}
      <Card>
        <CardHeader>
          <CardTitle>Detalhes dos Projetos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Projeto</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-900">Status</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-900">Progresso</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-900">Data Início</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-900">Data Fim</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-900">Situação</th>
                </tr>
              </thead>
              <tbody>
                {data.projects.map((project, index) => (
                  <tr key={project.id} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-900">{project.name}</div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge 
                        variant="secondary" 
                        style={{ 
                          backgroundColor: getStatusColor(project.status) + '20',
                          color: getStatusColor(project.status),
                          border: `1px solid ${getStatusColor(project.status)}40`
                        }}
                      >
                        {getStatusDisplayName(project.status)}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="space-y-1">
                        <div className="text-sm font-medium text-gray-900">
                          {project.progress}%
                        </div>
                        <Progress value={project.progress} className="h-2" />
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-sm text-gray-600">
                        {format(new Date(project.startDate), 'dd/MM/yyyy', { locale: ptBR })}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-sm text-gray-600">
                        {format(new Date(project.endDate), 'dd/MM/yyyy', { locale: ptBR })}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge 
                        variant={project.isDelayed ? 'destructive' : 'default'}
                        className={project.isDelayed ? '' : 'bg-green-100 text-green-800 hover:bg-green-200'}
                      >
                        {project.isDelayed ? 'Atrasado' : 'No Prazo'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Funções auxiliares
function getStatusDisplayName(status: string): string {
  const statusMap: Record<string, string> = {
    'planning': 'Planejamento',
    'in_progress': 'Em Progresso',
    'review': 'Em Revisão',
    'completed': 'Concluído',
    'on_hold': 'Em Espera'
  };
  
  return statusMap[status] || status;
}

function getStatusColor(status: string): string {
  const colorMap: Record<string, string> = {
    'planning': '#f59e0b',
    'in_progress': '#3b82f6',
    'review': '#8b5cf6',
    'completed': '#10b981',
    'on_hold': '#6b7280'
  };
  
  return colorMap[status] || '#6b7280';
}