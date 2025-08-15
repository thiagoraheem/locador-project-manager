import { Search, Plus, Command } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Notifications } from "@/components/notifications";
import { GlobalSearch } from "@/components/search/global-search";
import { useGlobalSearch } from "@/hooks/use-global-search";

interface HeaderProps {
  title: string;
  subtitle?: string;
  onCreateNew?: () => void;
  createButtonText?: string;
}

export default function Header({ title, subtitle, onCreateNew, createButtonText = "New Project" }: HeaderProps) {
  const { isOpen, openSearch, closeSearch, handleSelect } = useGlobalSearch();

  return (
    <header className="bg-white border-b border-gray-200 px-4 md:px-6 py-4" data-testid="header">
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div className="flex-1">
          <h1 className="text-xl md:text-2xl font-semibold text-text" data-testid="page-title">{title}</h1>
          {subtitle && (
            <p className="text-gray-500 text-sm mt-1" data-testid="page-subtitle">{subtitle}</p>
          )}
        </div>
        
        <div className="flex items-center space-x-2 md:space-x-4">
          {/* Search Button - Shows search trigger */}
          <Button 
            variant="outline" 
            onClick={openSearch}
            className="hidden md:flex items-center space-x-2 w-64 lg:w-80 justify-start text-muted-foreground"
            data-testid="search-trigger"
          >
            <Search className="w-4 h-4" />
            <span className="flex-1 text-left">Search projects, tickets...</span>
            <div className="flex items-center space-x-1 text-xs">
              <Command className="w-3 h-3" />
              <span>K</span>
            </div>
          </Button>
          
          {/* Mobile Search Button */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden" 
            onClick={openSearch}
            data-testid="mobile-search-button"
          >
            <Search className="w-5 h-5 text-gray-400" />
          </Button>
          
          {/* Global Search Modal */}
          <GlobalSearch 
            isOpen={isOpen}
            onClose={closeSearch}
            onSelect={handleSelect}
          />
          
          {/* Notifications */}
          <Notifications userId="user-1" />

          {/* Create Button */}
          {onCreateNew && (
            <Button 
              onClick={onCreateNew} 
              className="bg-primary text-white hover:bg-primary/90"
              size="sm"
              data-testid="create-new-button"
            >
              <Plus className="w-4 h-4 md:mr-2" />
              <span className="hidden md:inline">{createButtonText}</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
