import { useState, useRef } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { useKeyboardNavigation, ARIA_LABELS } from "@/lib/accessibility";
import {
  Menu,
  X,
  Home,
  FolderKanban,
  CheckSquare,
  Headphones,
  Calendar,
  BarChart3,
  Settings,
  User,
  Search,
  FileText
} from "lucide-react";
import { Notifications } from "@/components/notifications";

interface MobileNavigationProps {
  className?: string;
}

export function MobileNavigation({ className }: MobileNavigationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [location] = useLocation();
  const sideNavRef = useRef<HTMLElement>(null);
  const bottomNavRef = useRef<HTMLDivElement>(null);
  
  useKeyboardNavigation({
    containerRef: sideNavRef,
    selector: 'button, a',
    loop: true
  });
  
  useKeyboardNavigation({
    containerRef: bottomNavRef,
    selector: 'button, a',
    loop: true
  });

  const navigationItems = [
    {
      title: "Dashboard",
      href: "/",
      icon: Home,
      badge: null
    },
    {
      title: "Projetos",
      href: "/projects",
      icon: FolderKanban,
      badge: null
    },
    {
      title: "Tarefas",
      href: "/tasks",
      icon: CheckSquare,
      badge: "3" // Exemplo de badge para tarefas pendentes
    },
    {
      title: "Chamados",
      href: "/tickets",
      icon: Headphones,
      badge: "2" // Exemplo de badge para chamados abertos
    },
    {
      title: "Gantt",
      href: "/gantt",
      icon: Calendar,
      badge: null
    },
    {
      title: "Kanban",
      href: "/kanban",
      icon: BarChart3,
      badge: null
    },
    {
      title: "Relatórios",
      href: "/reports",
      icon: FileText,
      badge: null
    }
  ];

  const isActive = (href: string) => {
    if (href === "/") {
      return location === "/";
    }
    return location.startsWith(href);
  };

  const handleLinkClick = () => {
    setIsOpen(false);
  };

  return (
    <>
      {/* Mobile Header */}
      <header 
        className={`md:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between ${className}`}
        role="banner"
        aria-label="Cabeçalho mobile"
      >
        <div className="flex items-center space-x-3">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="p-2"
                aria-label="Abrir menu de navegação"
                aria-expanded={isOpen}
                aria-controls="mobile-navigation-menu"
              >
                <Menu className="w-5 h-5" aria-hidden="true" />
              </Button>
            </SheetTrigger>
            <SheetContent 
              side="left" 
              className="w-80 p-0"
              id="mobile-navigation-menu"
              role="dialog"
              aria-label="Menu de navegação mobile"
            >
              <div className="flex flex-col h-full">
                {/* Header */}
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                        <FolderKanban className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h2 className="font-semibold text-gray-900">Locador PM</h2>
                        <p className="text-xs text-gray-500">Gerenciador de Projetos</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsOpen(false)}
                      className="p-2"
                      aria-label="Fechar menu"
                    >
                      <X className="w-4 h-4" aria-hidden="true" />
                    </Button>
                  </div>
                </div>

                {/* Navigation */}
                <div className="flex-1 py-4">
                  <nav 
                    ref={sideNavRef}
                    className="space-y-1 px-3"
                    role="navigation"
                    aria-label="Menu principal mobile"
                  >
                    {navigationItems.map((item) => {
                      const Icon = item.icon;
                      const active = isActive(item.href);
                      
                      return (
                        <Link key={item.href} href={item.href}>
                          <Button
                            variant={active ? "default" : "ghost"}
                            className={`w-full justify-start h-12 px-4 text-left focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                              active 
                                ? "bg-primary text-white" 
                                : "text-gray-700 hover:bg-gray-100"
                            }`}
                            onClick={handleLinkClick}
                            aria-current={active ? "page" : undefined}
                            role="menuitem"
                          >
                            <Icon className="w-5 h-5 mr-3 flex-shrink-0" />
                            <span className="flex-1">{item.title}</span>
                            {item.badge && (
                              <Badge 
                                variant={active ? "secondary" : "default"}
                                className="ml-2 text-xs"
                              >
                                {item.badge}
                              </Badge>
                            )}
                          </Button>
                        </Link>
                      );
                    })}
                  </nav>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-200 space-y-2">
                  <Link href="/settings">
                    <Button
                      variant="ghost"
                      className="w-full justify-start h-10 px-4 text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                      onClick={handleLinkClick}
                      role="menuitem"
                    >
                      <User className="w-4 h-4 mr-3" />
                      Perfil
                    </Button>
                  </Link>
                  <Link href="/profile">
                    <Button
                      variant="ghost"
                      className="w-full justify-start h-10 px-4 text-gray-700"
                      onClick={handleLinkClick}
                    >
                      <User className="w-4 h-4 mr-3" />
                      Perfil
                    </Button>
                  </Link>
                </div>
              </div>
            </SheetContent>
          </Sheet>
          
          <div>
            <h1 className="font-semibold text-gray-900 text-lg">Locador PM</h1>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className="p-2 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            aria-label="Buscar"
          >
            <Search className="w-5 h-5" aria-hidden="true" />
          </Button>
          <Notifications userId="user-1" />
        </div>
      </header>

      {/* Bottom Navigation for Mobile */}
      <nav 
        ref={bottomNavRef}
        className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 py-2 z-50"
        role="navigation"
        aria-label="Navegação inferior mobile"
      >
        <div className="flex items-center justify-around">
          {navigationItems.slice(0, 5).map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`flex flex-col items-center justify-center h-12 w-16 p-1 relative focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                    active 
                      ? "text-primary bg-primary/10" 
                      : "text-gray-600"
                  }`}
                  aria-current={active ? "page" : undefined}
                  aria-label={`${item.title}${item.badge ? ` (${item.badge} pendentes)` : ''}`}
                >
                  <Icon className="w-5 h-5 mb-1" aria-hidden="true" />
                  <span className="text-xs font-medium truncate" aria-hidden="true">{item.title}</span>
                  {item.badge && (
                    <Badge 
                      variant="destructive"
                      className="absolute -top-1 -right-1 w-4 h-4 p-0 text-xs flex items-center justify-center"
                    >
                      {item.badge}
                    </Badge>
                  )}
                </Button>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}