import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Clock, DollarSign, TrendingUp, Users } from 'lucide-react';
import type { TimeTrackingReport } from '@/hooks/use-reports';

interface TimeTrackingReportViewProps {
  data: TimeTrackingReport;
}

export function TimeTrackingReportView({ data }: TimeTrackingReportViewProps) {
  // Dados para gráfico de pizza de horas faturáveis vs não faturáveis
  const billableHoursData = [
    { name: 'Faturáveis', value: data.billableHours, color: '#10b981' },
    { name: 'Não Faturáveis', value: data.nonBillableHours, color: '#f59e0b' }
  ];

  // Dados para gráfico de barras de tempo por projeto
  const projectTimeChartData = data.timeByProject.map(project => ({
    name: project.projectName.length > 15 ? project.projectName.substring(0, 15) + '...' : project.projectName,
    fullName: project.projectName,
    hours: project.hours,
    percentage: project.percentage
  }));

  // Dados para gráfico de barras de eficiência por membro
  const memberEfficiencyData = data.timeByMember.map(member => ({
    name: member.memberName.split(' ')[0], // Apenas primeiro nome
    fullName: member.memberName,
    hours: member.hours,
    efficiency: member.efficiency
  }));

  const billablePercentage = (data.billableHours / data.totalHours) * 100;
  const averageEfficiency = data.timeByMember.reduce((acc, member) => acc + member.efficiency, 0) / data.timeByMember.length;

  const getEfficiencyColor = (efficiency: number) => {
    if (efficiency >= 90) return 'text-green-600 bg-green-50';
    if (efficiency >= 80) return 'text-blue-600 bg-blue-50';
    if (efficiency >= 70) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getEfficiencyLevel = (efficiency: number) => {
    if (efficiency >= 90) return 'Excelente';
    if (efficiency >= 80) return 'Boa';
    if (efficiency >= 70) return 'Regular';
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
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total de Horas</p>
                <p className="text-2xl font-bold text-gray-900">{data.totalHours}h</p>
                <p className="text-xs text-gray-500">no período</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Horas Faturáveis</p>
                <p className="text-2xl font-bold text-gray-900">{data.billableHours}h</p>
                <p className="text-xs text-gray-500">{billablePercentage.toFixed(1)}% do total</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Média Diária</p>
                <p className="text-2xl font-bold text-gray-900">{data.averageHoursPerDay.toFixed(1)}h</p>
                <p className="text-xs text-gray-500">por dia</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Users className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Eficiência Média</p>
                <p className="text-2xl font-bold text-gray-900">{averageEfficiency.toFixed(1)}%</p>
                <p className="text-xs text-gray-500">da equipe</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Horas Faturáveis */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição de Horas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={billableHoursData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {billableHoursData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value}h`, 'Horas']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center space-x-4 mt-4">
              {billableHoursData.map((entry, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-sm text-gray-600">
                    {entry.name}: {entry.value}h ({((entry.value / data.totalHours) * 100).toFixed(1)}%)
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Gráfico de Eficiência por Membro */}
        <Card>
          <CardHeader>
            <CardTitle>Eficiência por Membro</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={memberEfficiencyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip 
                    formatter={(value, name) => {
                      if (name === 'efficiency') return [`${value}%`, 'Eficiência'];
                      if (name === 'hours') return [`${value}h`, 'Horas Trabalhadas'];
                      return [value, name];
                    }}
                    labelFormatter={(label) => {
                      const member = memberEfficiencyData.find(m => m.name === label);
                      return member ? member.fullName : label;
                    }}
                  />
                  <Bar dataKey="efficiency" fill="#3b82f6" name="efficiency" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Tempo por Projeto */}
      <Card>
        <CardHeader>
          <CardTitle>Distribuição de Tempo por Projeto</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={projectTimeChartData} 
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                layout="horizontal"
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={120} />
                <Tooltip 
                  formatter={(value, name) => {
                    if (name === 'hours') return [`${value}h`, 'Horas'];
                    if (name === 'percentage') return [`${value}%`, 'Percentual'];
                    return [value, name];
                  }}
                  labelFormatter={(label) => {
                    const project = projectTimeChartData.find(p => p.name === label);
                    return project ? project.fullName : label;
                  }}
                />
                <Bar dataKey="hours" fill="#10b981" name="hours" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Resumo por Projeto */}
      <Card>
        <CardHeader>
          <CardTitle>Resumo por Projeto</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.timeByProject.map((project, index) => (
              <div key={index} className="p-4 border rounded-lg">
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900 truncate" title={project.projectName}>
                    {project.projectName}
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Horas:</span>
                      <span className="font-medium">{project.hours}h</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Percentual:</span>
                      <span className="font-medium">{project.percentage.toFixed(1)}%</span>
                    </div>
                    <Progress value={project.percentage} className="h-2" />
                  </div>
                </div>
              </div>
            ))}
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
                  <th className="text-center py-3 px-4 font-medium text-gray-900">Horas Trabalhadas</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-900">Eficiência</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-900">Nível</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-900">Participação</th>
                </tr>
              </thead>
              <tbody>
                {data.timeByMember.map((member, index) => {
                  const participation = (member.hours / data.totalHours) * 100;
                  
                  return (
                    <tr key={member.memberId} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-900">{member.memberName}</div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-sm font-medium text-gray-900">
                          {member.hours}h
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="space-y-1">
                          <div className="text-sm font-medium text-gray-900">
                            {member.efficiency}%
                          </div>
                          <Progress value={member.efficiency} className="h-2" />
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge 
                          variant="secondary" 
                          className={getEfficiencyColor(member.efficiency)}
                        >
                          {getEfficiencyLevel(member.efficiency)}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="space-y-1">
                          <div className="text-sm font-medium text-gray-900">
                            {participation.toFixed(1)}%
                          </div>
                          <Progress value={participation} className="h-2" />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}