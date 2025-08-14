import { Search, Bell, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface HeaderProps {
  title: string;
  subtitle?: string;
  onCreateNew?: () => void;
  createButtonText?: string;
}

export default function Header({ title, subtitle, onCreateNew, createButtonText = "New Project" }: HeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4" data-testid="header">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text" data-testid="page-title">{title}</h1>
          {subtitle && (
            <p className="text-gray-500 text-sm" data-testid="page-subtitle">{subtitle}</p>
          )}
        </div>
        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="relative">
            <Input
              type="text"
              placeholder="Search projects, tickets..."
              className="pl-10 pr-4 py-2 w-80"
              data-testid="search-input"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          </div>
          
          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative" data-testid="notifications-button">
            <Bell className="w-5 h-5 text-gray-400" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-accent rounded-full"></span>
          </Button>

          {/* Create Button */}
          {onCreateNew && (
            <Button 
              onClick={onCreateNew} 
              className="bg-primary text-white hover:bg-primary/90"
              data-testid="create-new-button"
            >
              <Plus className="w-4 h-4 mr-2" />
              {createButtonText}
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
