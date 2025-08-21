import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider, useAuth } from "@/hooks/use-auth.tsx";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Projects from "@/pages/projects";
import ProjectDetails from "@/pages/project-details";
import Tickets from "@/pages/tickets";
import TicketDetails from "@/pages/ticket-details";
import TaskDetails from "@/pages/task-details";
import Tasks from "@/pages/tasks";
import Kanban from "@/pages/kanban";
import GanttCharts from "@/pages/gantt";
import Reports from "@/pages/reports";
import Admin from "@/pages/admin";
import Calendar from "@/pages/calendar";
import Sidebar from "@/components/layout/sidebar";
import { MobileNavigation } from "@/components/responsive/mobile-navigation";
import { SkipLink } from "@/components/accessibility/skip-link";

function Router() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex flex-col h-screen bg-background items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Skip Link para acessibilidade */}
      <SkipLink targetId="main-content" />

      {/* Mobile Navigation Header */}
      <MobileNavigation />

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar */}
        <Sidebar role={user?.role} aria-label="Menu principal" />

        {/* Main Content */}
        <main
          id="main-content"
          className="flex-1 overflow-hidden flex flex-col"
          role="main"
          aria-label="Conteúdo principal"
          tabIndex={-1}
        >
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/projects" component={Projects} />
            <Route path="/projects/:id" component={ProjectDetails} />
            <Route path="/tickets" component={Tickets} />
            <Route path="/tickets/:id" component={TicketDetails} />
            <Route path="/tasks" component={Tasks} />
            <Route path="/tasks/:id" component={TaskDetails} />
            <Route path="/kanban" component={Kanban} />
            <Route path="/gantt" component={GanttCharts} />
            <Route path="/reports" component={Reports} />
            <Route path="/admin" component={Admin} />
            <Route path="/calendar" component={Calendar} />
            <Route component={NotFound} />
          </Switch>
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;