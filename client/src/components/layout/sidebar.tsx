import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useKeyboardNavigation } from "@/lib/accessibility";
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
  Settings
} from "lucide-react";
import { useRef } from "react";

const getNavigation = (role?: string) => {
  const baseNavigation = [
    { name: "Painel", href: "/", icon: Home },
    { name: "Projetos", href: "/projects", icon: FolderKanban },
    { name: "Chamados", href: "/tickets", icon: Ticket },
    { name: "Tarefas", href: "/tasks", icon: CheckSquare },
    { name: "Kanban", href: "/kanban", icon: Kanban },
    { name: "Gráficos de Gantt", href: "/gantt", icon: BarChart3 },
    { name: "Calendário", href: "/calendar", icon: Calendar },
    { name: "Relatórios", href: "/reports", icon: FileText },
  ];
  
  // Adiciona administração apenas para admins
  if (role === 'admin') {
    baseNavigation.push({ name: "Administração", href: "/admin", icon: Settings });
  }
  
  return baseNavigation;
};

interface SidebarProps {
  role?: string;
  'aria-label'?: string;
}

export default function Sidebar({ role, 'aria-label': ariaLabel }: SidebarProps = {}) {
  const [location] = useLocation();
  const navRef = useRef<HTMLElement>(null);
  const navigation = getNavigation(role);
  
  useKeyboardNavigation({
    containerRef: navRef,
    selector: 'a[href]',
    loop: true
  });

  return (
    <aside 
      className="hidden md:flex w-64 bg-white border-r border-gray-200 flex-col" 
      data-testid="sidebar"
      role={role}
      aria-label={ariaLabel}
    >
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <FolderKanban className="text-white text-sm" />
          </div>
          <span className="text-xl font-semibold text-text">ProjectFlow</span>
        </div>
      </div>

      {/* Navigation */}
      <nav 
        ref={navRef}
        className="flex-1 p-4 space-y-2" 
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
                "flex items-center space-x-3 px-3 py-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                isActive
                  ? "bg-primary text-white"
                  : "text-gray-600 hover:bg-gray-100"
              )}
              data-testid={`nav-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
              aria-current={isActive ? "page" : undefined}
              role="menuitem"
            >
              <item.icon className="w-5 h-5" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center">
            <User className="text-white text-sm" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium" data-testid="user-name">Gerente de Projeto</p>
            <p className="text-xs text-gray-500" data-testid="user-role">Admin</p>
          </div>
        </div>
      </div>
    </aside>
  );
}