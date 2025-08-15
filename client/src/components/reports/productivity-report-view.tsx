import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Users, CheckCircle, Clock, TrendingUp } from 'lucide-react';
import type { ProductivityReport } from '@/hooks/use-reports';

interface ProductivityReportViewProps {
  data: ProductivityReport;
}

export function ProductivityReportView({ data }: ProductivityReportViewProps) {
  // Dados para gráfico de barras de produtividade por membro
  const productivityChartData = data.teamMembers.map(member => ({
    name: member.name.split(' ')[0], // Apenas primeiro nome para economizar espaço
    concluidas: member.tasksCompleted,
    atribuidas: member.tasksAssigned,
    chamados: member.ticketsResolved,
    produtividade: member.productivity
  }));

  // Dados para gráfico de pizza de conclusão de tarefas
  const taskCompletionData = [
    { name: 'Concluídas', value: data.completedTasks, color: '#10b981' },
    { name: 'Pendentes', value: data.totalTasks - data.completedTasks, color: '#f59e0b' }
  ];

  // Dados para gráfico de pizza de resolução de chamados
  const ticketResolutionData = [
    { name: 'Resolvidos', value: data.resolvedTickets, color: '#3b82f6' },
    { name: 'Pendentes', value: data.totalTickets - data.resolvedTickets, color: '#ef4444' }
  ];

  const getProductivityColor = (productivity: number) => {
    if (productivity >= 90) return 'text-green-600 bg-green-50';
    if (productivity >= 80) return 'text-blue-600 bg-blue-50';
    if (productivity >= 70) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getProductivityLevel = (productivity: number) => {
    if (productivity >= 90) return 'Excelente';
    if (productivity >= 80) return 'Boa';
    if (productivity >= 70) return 'Regular';
    return 'Baixa';
  };

  return (
    <div className="space-y-6">
      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Taxa de Conclusão</p>
                <p className="text-2xl font-bold text-gray-900">{data.completionRate.toFixed(1)}%</p>
                <p className="text-xs text-gray-500">{data.completedTasks}/{data.totalTasks} tarefas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Users className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Taxa de Resolução</p>
                <p className="text-2xl font-bold text-gray-900">{data.resolutionRate.toFixed(1)}%</p>
                <p className="text-xs text-gray-500">{data.resolvedTickets}/{data.totalTickets} chamados</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Clock className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Tempo Médio</p>
                <p className="text-2xl font-bold text-gray-900">{data.averageTaskTime.toFixed(1)}h</p>
                <p className="text-xs text-gray-500">por tarefa</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Produtividade Média</p>
                <p className="text-2xl font-bold text-gray-900">
                  {(data.teamMembers.reduce((acc, member) => acc + member.productivity, 0) / data.teamMembers.length).toFixed(1)}%
                </p>
                <p className="text-xs text-gray-500">da equipe</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Conclusão de Tarefas */}
        <Card>
          <CardHeader>
            <CardTitle>Conclusão de Tarefas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={taskCompletionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {taskCompletionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} tarefas`, 'Quantidade']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center space-x-4 mt-4">
              {taskCompletionData.map((entry, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-sm text-gray-600">{entry.name}: {entry.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Gráfico de Resolução de Chamados */}
        <Card>
          <CardHeader>
            <CardTitle>Resolução de Chamados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={ticketResolutionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {ticketResolutionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} chamados`, 'Quantidade']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center space-x-4 mt-4">
              {ticketResolutionData.map((entry, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-sm text-gray-600">{entry.name}: {entry.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Produtividade por Membro */}
      <Card>
        <CardHeader>
          <CardTitle>Produtividade por Membro da Equipe</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={productivityChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => {
                    const labels: Record<string, string> = {
                      concluidas: 'Tarefas Concluídas',
                      atribuidas: 'Tarefas Atribuídas',
                      chamados: 'Chamados Resolvidos'
                    };
                    return [value, labels[name] || name];
                  }}
                />
                <Bar dataKey="concluidas" fill="#10b981" name="concluidas" />
                <Bar dataKey="atribuidas" fill="#3b82f6" name="atribuidas" />
                <Bar dataKey="chamados" fill="#8b5cf6" name="chamados" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Tabela Detalhada de Membros */}
      <Card>
        <CardHeader>
          <CardTitle>Detalhes por Membro da Equipe</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Membro</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-900">Tarefas</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-900">Chamados</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-900">Produtividade</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-900">Nível</th>
                </tr>
              </thead>
              <tbody>
                {data.teamMembers.map((member, index) => (
                  <tr key={member.id} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-900">{member.name}</div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="space-y-1">
                        <div className="text-sm text-gray-900">
                          {member.tasksCompleted}/{member.tasksAssigned}
                        </div>
                        <Progress 
                          value={(member.tasksCompleted / member.tasksAssigned) * 100} 
                          className="h-2"
                        />
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-sm font-medium text-gray-900">
                        {member.ticketsResolved}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="space-y-1">
                        <div className="text-sm font-medium text-gray-900">
                          {member.productivity.toFixed(1)}%
                        </div>
                        <Progress value={member.productivity} className="h-2" />
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge 
                        variant="secondary" 
                        className={getProductivityColor(member.productivity)}
                      >
                        {getProductivityLevel(member.productivity)}
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