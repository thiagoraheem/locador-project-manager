import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  Home, 
  FolderKanban, 
  Ticket, 
  CheckSquare,
  Calendar, 
  BarChart3,
  Kanban,
  User,
  FileText,
  Settings,
  Menu,
  X
} from "lucide-react";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { SelectTask, SelectTicket } from "@shared/schema";

const getNavigation = (role?: string, taskCount?: number, ticketCount?: number) => {
  const baseNavigation = [
    { name: "Painel", href: "/", icon: Home, badge: null },
    { name: "Projetos", href: "/projects", icon: FolderKanban, badge: null },
    { name: "Chamados", href: "/tickets", icon: Ticket, badge: ticketCount ? String(ticketCount) : null },
    { name: "Tarefas", href: "/tasks", icon: CheckSquare, badge: taskCount ? String(taskCount) : null },
    { name: "Kanban", href: "/kanban", icon: Kanban, badge: null },
    { name: "Gráficos de Gantt", href: "/gantt", icon: BarChart3, badge: null },
    { name: "Calendário", href: "/calendar", icon: Calendar, badge: null },
    { name: "Relatórios", href: "/reports", icon: FileText, badge: null },
  ];
  
  // Adiciona administração apenas para admins
  if (role === 'admin') {
    baseNavigation.push({ name: "Administração", href: "/admin", icon: Settings, badge: null });
  }
  
  return baseNavigation;
};

interface SidebarProps {
  role?: string;
  'aria-label'?: string;
}

export default function Sidebar({ role, 'aria-label': ariaLabel }: SidebarProps = {}) {
  const [location] = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  // Buscar dados para badges dinâmicos
  const { data: tasks = [] } = useQuery<SelectTask[]>({
    queryKey: ["/api/tasks"],
  });
  
  const { data: tickets = [] } = useQuery<SelectTicket[]>({
    queryKey: ["/api/tickets"],
  });
  
  // Contar tarefas pendentes e chamados abertos
  const pendingTaskCount = tasks.filter(task => 
    task.status === 'todo' || task.status === 'in_progress'
  ).length;
  
  const openTicketCount = tickets.filter(ticket => 
    ticket.status === 'open' || ticket.status === 'in_progress'
  ).length;
  
  const navigation = getNavigation(role, pendingTaskCount, openTicketCount);
  
  // Salvar estado do collapse no localStorage
  useEffect(() => {
    const savedState = localStorage.getItem('sidebar-collapsed');
    if (savedState !== null) {
      setIsCollapsed(JSON.parse(savedState));
    }
  }, []);
  
  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', JSON.stringify(isCollapsed));
  }, [isCollapsed]);

  return (
    <aside 
      className={cn(
        "hidden md:flex bg-white border-r border-gray-200 flex-col transition-all duration-300",
        isCollapsed ? "w-16" : "w-64"
      )}
      data-testid="sidebar"
      role={role}
      aria-label={ariaLabel}
    >
      {/* Logo */}
      <div className={cn(
        "border-b border-gray-200 flex items-center justify-between",
        isCollapsed ? "p-3" : "p-6"
      )}>
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
            <FolderKanban className="text-white text-sm" />
          </div>
          {!isCollapsed && (
            <span className="text-xl font-semibold text-gray-900 whitespace-nowrap">
              ProjectFlow
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="h-8 w-8 p-0 flex-shrink-0"
          data-testid="sidebar-toggle"
        >
          {isCollapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav 
        className={cn(
          "flex-1 space-y-1",
          isCollapsed ? "p-2" : "p-4"
        )}
        data-testid="navigation"
        role="navigation"
        aria-label="Menu de navegação principal"
      >
        {navigation.map((item) => {
          const isActive = location === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 relative group",
                isCollapsed ? "p-2 justify-center" : "px-3 py-2 space-x-3",
                isActive
                  ? "bg-primary text-white"
                  : "text-gray-600 hover:bg-gray-100"
              )}
              data-testid={`nav-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
              aria-current={isActive ? "page" : undefined}
              role="menuitem"
              title={isCollapsed ? item.name : undefined}
            >
              <div className="relative flex-shrink-0">
                <item.icon className="w-5 h-5" />
                {item.badge && (
                  <Badge 
                    variant="destructive"
                    className={cn(
                      "absolute flex items-center justify-center text-xs font-medium",
                      isCollapsed 
                        ? "-top-1 -right-1 h-4 w-4 p-0 min-w-[16px]"
                        : "-top-1 -right-1 h-4 w-4 p-0 min-w-[16px]"
                    )}
                  >
                    {item.badge}
                  </Badge>
                )}
              </div>
              {!isCollapsed && (
                <span className="flex-1 whitespace-nowrap">{item.name}</span>
              )}
              {!isCollapsed && item.badge && (
                <Badge 
                  variant="secondary"
                  className="ml-auto text-xs px-1.5 py-0.5 h-5 bg-gray-200 text-gray-700"
                >
                  {item.badge}
                </Badge>
              )}
              
              {/* Tooltip para modo collapsed */}
              {isCollapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                  {item.name}
                  {item.badge && ` (${item.badge})`}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className={cn(
        "border-t border-gray-200",
        isCollapsed ? "p-2" : "p-4"
      )}>
        <div className={cn(
          "flex items-center",
          isCollapsed ? "justify-center" : "space-x-3"
        )}>
          <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center flex-shrink-0">
            <User className="text-white text-sm" />
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" data-testid="user-name">Gerente de Projeto</p>
              <p className="text-xs text-gray-500 truncate" data-testid="user-role">Admin</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}