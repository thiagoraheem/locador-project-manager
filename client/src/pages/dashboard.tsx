import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardSkeleton } from "@/components/loading/dashboard-skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ProjectProgressChart } from "@/components/charts/project-progress-chart";
import { ProductivityChart } from "@/components/charts/productivity-chart";
import { TimelineChart } from "@/components/charts/timeline-chart";
import { DashboardWidgets } from "@/components/widgets/dashboard-widgets";
import { useDashboardAnalytics } from "@/hooks/use-dashboard-analytics";
import { 
  FolderKanban, 
  Ticket, 
  CheckCircle, 
  Users, 
  ArrowUp,
  Plus,
  Calendar,
  BarChart3,
  Database,
  Smartphone,
  TrendingUp,
  Activity
} from "lucide-react";
import type { DashboardStats } from "@/lib/types";
import type { Project, Ticket as TicketType } from "@shared/schema";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: projects = [], isLoading: projectsLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const { data: tickets = [], isLoading: ticketsLoading } = useQuery<TicketType[]>({
    queryKey: ["/api/tickets"],
  });

  const { analyticsData, widgets, toggleWidget, configureWidget, isLoading: analyticsLoading } = useDashboardAnalytics();

  const recentProjects = projects.slice(0, 3);
  const recentTickets = tickets.slice(0, 3);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_progress': return 'bg-success bg-opacity-10 text-success';
      case 'review': return 'bg-yellow-100 text-yellow-800';
      case 'planning': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-blue-100 text-blue-800';
      case 'low': return 'bg-green-100 text-green-800';
      case 'critical': return 'bg-red-200 text-red-900';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatTimeAgo = (date: string) => {
    const now = new Date();
    const created = new Date(date);
    const diffHours = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60));

    if (diffHours < 1) return 'Agora mesmo';
    if (diffHours < 24) return `${diffHours}h atrás`;
    return `${Math.floor(diffHours / 24)}d atrás`;
  };

  const renderDashboard = () => (
    <>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Projetos Ativos</p>
                <p className="text-2xl font-semibold text-text" data-testid="stat-active-projects">
                  {statsLoading ? '...' : stats?.activeProjects || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-primary bg-opacity-10 rounded-lg flex items-center justify-center">
                <FolderKanban className="text-primary text-lg" />
              </div>
            </div>
            <div className="flex items-center mt-4 text-sm">
              <ArrowUp className="text-success mr-1 w-4 h-4" />
              <span className="text-success">+8%</span>
              <span className="text-gray-500 ml-2">vs último mês</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Chamados Abertos</p>
                <p className="text-2xl font-semibold text-text" data-testid="stat-open-tickets">
                  {statsLoading ? '...' : stats?.openTickets || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-secondary bg-opacity-10 rounded-lg flex items-center justify-center">
                <Ticket className="text-secondary text-lg" />
              </div>
            </div>
            <div className="flex items-center mt-4 text-sm">
              <ArrowUp className="text-success mr-1 w-4 h-4" />
              <span className="text-success">+12%</span>
              <span className="text-gray-500 ml-2">vs última semana</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Tarefas Completas</p>
                <p className="text-2xl font-semibold text-text" data-testid="stat-completed-tasks">
                  {statsLoading ? '...' : stats?.completedTasks || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-success bg-opacity-10 rounded-lg flex items-center justify-center">
                <CheckCircle className="text-success text-lg" />
              </div>
            </div>
            <div className="flex items-center mt-4 text-sm">
              <ArrowUp className="text-success mr-1 w-4 h-4" />
              <span className="text-success">+24%</span>
              <span className="text-gray-500 ml-2">vs último mês</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Membros da Equipe</p>
                <p className="text-2xl font-semibold text-text" data-testid="stat-team-members">
                  {statsLoading ? '...' : stats?.teamMembers || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-accent bg-opacity-10 rounded-lg flex items-center justify-center">
                <Users className="text-accent text-lg" />
              </div>
            </div>
            <div className="flex items-center mt-4 text-sm">
              <ArrowUp className="text-success mr-1 w-4 h-4" />
              <span className="text-success">+3</span>
              <span className="text-gray-500 ml-2">novos este mês</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-4 mb-8">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="widgets">Widgets</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ProjectProgressChart data={analyticsData?.projectProgress} />
            <ProductivityChart data={analyticsData?.productivity} />
          </div>
          <TimelineChart data={analyticsData?.timeline} />
        </TabsContent>
        
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-text">Métricas de Performance</h3>
              </div>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Taxa de Conclusão</span>
                    <span className="text-lg font-semibold text-text">87%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Tempo Médio de Resolução</span>
                    <span className="text-lg font-semibold text-text">2.3 dias</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Satisfação do Cliente</span>
                    <span className="text-lg font-semibold text-text">4.8/5</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-text">Tendências</h3>
              </div>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <TrendingUp className="text-success w-5 h-5" />
                    <div>
                      <p className="text-sm font-medium text-text">Produtividade</p>
                      <p className="text-xs text-gray-500">+15% este mês</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Activity className="text-primary w-5 h-5" />
                    <div>
                      <p className="text-sm font-medium text-text">Atividade da Equipe</p>
                      <p className="text-xs text-gray-500">+8% esta semana</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="widgets" className="space-y-4">
          <DashboardWidgets 
            widgets={widgets}
            onToggleWidget={toggleWidget}
            onConfigureWidget={configureWidget}
            isLoading={analyticsLoading}
          />
        </TabsContent>
      </Tabs>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Projects */}
        <div className="lg:col-span-2">
          <Card>
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-text">Projetos Recentes</h3>
                <Button variant="link" className="text-primary text-sm font-medium">
                  Ver Todos
                </Button>
              </div>
            </div>
            <CardContent className="p-6">
              {recentProjects.length === 0 ? (
                <EmptyState
                  icon={FolderKanban}
                  title="Nenhum projeto"
                  description="Comece criando um novo projeto."
                />
              ) : (
                <div className="space-y-4">
                  {recentProjects.map((project) => (
                    <div
                      key={project.id}
                      className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors"
                      data-testid={`project-card-${project.id}`}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-primary bg-opacity-10 rounded-lg flex items-center justify-center">
                          <Database className="text-primary" />
                        </div>
                        <div>
                          <h4 className="font-medium text-text">{project.name}</h4>
                          <p className="text-sm text-gray-500">{project.description}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                          {project.status.replace('_', ' ')}
                        </span>
                        <p className="text-sm text-gray-500 mt-1">
                          {project.endDate ? `Devido em ${formatDate(project.endDate.toString())}` : 'Data não definida'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Tickets */}
        <div>
          <Card>
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-text">Chamados Recentes</h3>
                <Button size="sm" className="bg-primary text-white hover:bg-primary/90">
                  Novo Chamado
                </Button>
              </div>
            </div>
            <CardContent className="p-6">
              {recentTickets.length === 0 ? (
                 <EmptyState
                   icon={Ticket}
                   title="Nenhum chamado"
                   description="Crie um novo chamado para começar."
                 />
              ) : (
                <div className="space-y-4">
                  {recentTickets.map((ticket) => (
                    <div
                      key={ticket.id}
                      className="p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors"
                      data-testid={`ticket-card-${ticket.id}`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-sm text-text">{ticket.title}</h4>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                          {ticket.priority}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mb-2">{ticket.description}</p>
                      <div className="flex items-center justify-between text-xs text-gray-400">
                        <span>#{ticket.id.slice(0, 8)}</span>
                        <span>{formatTimeAgo(ticket.createdAt.toString())}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Button
          variant="outline"
          className="h-auto p-6 text-left justify-start bg-white hover:shadow-md transition-shadow group"
          data-testid="quick-action-create-project"
        >
          <div>
            <div className="w-12 h-12 bg-primary bg-opacity-10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-opacity-20">
              <Plus className="text-primary text-lg" />
            </div>
            <h4 className="font-semibold text-text mb-2">Criar Projeto</h4>
            <p className="text-sm text-gray-500">Inicie um novo projeto de desenvolvimento com cronograma e marcos</p>
          </div>
        </Button>

        <Button
          variant="outline"
          className="h-auto p-6 text-left justify-start bg-white hover:shadow-md transition-shadow group"
          data-testid="quick-action-submit-ticket"
        >
          <div>
            <div className="w-12 h-12 bg-secondary bg-opacity-10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-opacity-20">
              <Ticket className="text-secondary text-lg" />
            </div>
            <h4 className="font-semibold text-text mb-2">Enviar Chamado</h4>
            <p className="text-sm text-gray-500">Reporte bugs, solicite recursos ou peça suporte</p>
          </div>
        </Button>

        <Button
          variant="outline"
          className="h-auto p-6 text-left justify-start bg-white hover:shadow-md transition-shadow group"
          data-testid="quick-action-view-schedule"
        >
          <div>
            <div className="w-12 h-12 bg-success bg-opacity-10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-opacity-20">
              <Calendar className="text-success text-lg" />
            </div>
            <h4 className="font-semibold text-text mb-2">Ver Agenda</h4>
            <p className="text-sm text-gray-500">Verifique os prazos de entrega e marcos futuros</p>
          </div>
        </Button>

        <Button
          variant="outline"
          className="h-auto p-6 text-left justify-start bg-white hover:shadow-md transition-shadow group"
          data-testid="quick-action-generate-report"
        >
          <div>
            <div className="w-12 h-12 bg-accent bg-opacity-10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-opacity-20">
              <BarChart3 className="text-accent text-lg" />
            </div>
            <h4 className="font-semibold text-text mb-2">Gerar Relatório</h4>
            <p className="text-sm text-gray-500">Exporte o progresso do projeto e os dados de desempenho da equipe</p>
          </div>
        </Button>
      </div>
    </>
  );

  return (
    <div className="flex-1 overflow-y-auto">
      <Header 
        title="Painel" 
        subtitle="Bem-vindo de volta! Veja o que está acontecendo em seus projetos."
      />

      <div className="p-6">
        {statsLoading && projectsLoading && ticketsLoading ? (
          <DashboardSkeleton />
        ) : (
          renderDashboard()
        )}
      </div>
    </div>
  );
}