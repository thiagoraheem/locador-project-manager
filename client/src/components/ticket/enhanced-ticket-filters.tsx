import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Search, Filter, X, ChevronDown, Star, Save, Calendar, User, Flag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { SelectProject, SelectUser } from "@shared/schema";

export interface AdvancedTicketFilters {
  search: string;
  status: string;
  priority: string;
  projectId: string;
  assigneeId: string;
  reporterId: string;
  dateRange: {
    from?: string;
    to?: string;
  };
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

interface EnhancedTicketFiltersProps {
  filters: AdvancedTicketFilters;
  onFiltersChange: (filters: AdvancedTicketFilters) => void;
  onSaveFilters?: (name: string, filters: AdvancedTicketFilters) => void;
  savedFilters?: Array<{ name: string; filters: AdvancedTicketFilters }>;
}

const statusOptions = [
  { value: "all", label: "Todos os Status" },
  { value: "open", label: "Aberto" },
  { value: "in_progress", label: "Em Progresso" },
  { value: "resolved", label: "Resolvido" },
  { value: "closed", label: "Fechado" },
];

const priorityOptions = [
  { value: "all", label: "Todas as Prioridades" },
  { value: "low", label: "Baixa" },
  { value: "medium", label: "Média" },
  { value: "high", label: "Alta" },
  { value: "critical", label: "Crítica" },
];

const sortOptions = [
  { value: "createdAt", label: "Data de Criação" },
  { value: "updatedAt", label: "Última Atualização" },
  { value: "priority", label: "Prioridade" },
  { value: "status", label: "Status" },
  { value: "title", label: "Título" },
];

export default function EnhancedTicketFilters({
  filters,
  onFiltersChange,
  onSaveFilters,
  savedFilters = []
}: EnhancedTicketFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [saveFilterName, setSaveFilterName] = useState("");
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const { toast } = useToast();

  // Fetch projects for filter dropdown
  const { data: projects = [] } = useQuery<SelectProject[]>({
    queryKey: ['/api/projects']
  });

  // Fetch users for assignee/reporter filters
  const { data: users = [] } = useQuery<SelectUser[]>({
    queryKey: ['/api/users']
  });

  const updateFilter = (key: keyof AdvancedTicketFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      search: "",
      status: "all",
      priority: "all",
      projectId: "all",
      assigneeId: "all",
      reporterId: "all",
      dateRange: {},
      sortBy: "createdAt",
      sortOrder: "desc"
    });
  };

  const handleSaveFilters = () => {
    if (!saveFilterName.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Por favor, digite um nome para o filtro.",
        variant: "destructive"
      });
      return;
    }

    if (onSaveFilters) {
      onSaveFilters(saveFilterName, filters);
      setSaveFilterName("");
      setShowSaveDialog(false);
      toast({
        title: "Filtro salvo",
        description: `Filtro "${saveFilterName}" foi salvo com sucesso.`
      });
    }
  };

  const loadSavedFilter = (savedFilter: { name: string; filters: AdvancedTicketFilters }) => {
    onFiltersChange(savedFilter.filters);
    toast({
      title: "Filtro carregado",
      description: `Filtro "${savedFilter.name}" foi aplicado.`
    });
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.search) count++;
    if (filters.status !== "all") count++;
    if (filters.priority !== "all") count++;
    if (filters.projectId !== "all") count++;
    if (filters.assigneeId !== "all") count++;
    if (filters.reporterId !== "all") count++;
    if (filters.dateRange.from || filters.dateRange.to) count++;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros Avançados
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" data-testid="active-filters-count">
                {activeFiltersCount}
              </Badge>
            )}
          </CardTitle>
          <div className="flex gap-2">
            {activeFiltersCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearAllFilters}
                data-testid="clear-all-filters"
              >
                <X className="h-4 w-4 mr-1" />
                Limpar
              </Button>
            )}
            <Collapsible open={isOpen} onOpenChange={setIsOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="outline" size="sm" data-testid="toggle-advanced-filters">
                  <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </Button>
              </CollapsibleTrigger>
            </Collapsible>
          </div>
        </div>
      </CardHeader>

      {/* Basic search - always visible */}
      <CardContent className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar tickets..."
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
            className="pl-10"
            data-testid="search-input"
          />
        </div>

        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleContent className="space-y-4">
            {/* Quick filters row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium">Status</label>
                <Select
                  value={filters.status}
                  onValueChange={(value) => updateFilter('status', value)}
                >
                  <SelectTrigger data-testid="status-filter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Prioridade</label>
                <Select
                  value={filters.priority}
                  onValueChange={(value) => updateFilter('priority', value)}
                >
                  <SelectTrigger data-testid="priority-filter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {priorityOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Projeto</label>
                <Select
                  value={filters.projectId}
                  onValueChange={(value) => updateFilter('projectId', value)}
                >
                  <SelectTrigger data-testid="project-filter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Projetos</SelectItem>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Advanced filters row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Responsável</label>
                <Select
                  value={filters.assigneeId}
                  onValueChange={(value) => updateFilter('assigneeId', value)}
                >
                  <SelectTrigger data-testid="assignee-filter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Responsáveis</SelectItem>
                    <SelectItem value="unassigned">Não Atribuído</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Reportado por</label>
                <Select
                  value={filters.reporterId}
                  onValueChange={(value) => updateFilter('reporterId', value)}
                >
                  <SelectTrigger data-testid="reporter-filter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Repórteres</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Sorting options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Ordenar por</label>
                <Select
                  value={filters.sortBy}
                  onValueChange={(value) => updateFilter('sortBy', value)}
                >
                  <SelectTrigger data-testid="sort-by-filter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {sortOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Ordem</label>
                <Select
                  value={filters.sortOrder}
                  onValueChange={(value: 'asc' | 'desc') => updateFilter('sortOrder', value)}
                >
                  <SelectTrigger data-testid="sort-order-filter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desc">Decrescente</SelectItem>
                    <SelectItem value="asc">Crescente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Saved filters and save functionality */}
            <div className="border-t pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm">Filtros Salvos</h4>
                <Popover open={showSaveDialog} onOpenChange={setShowSaveDialog}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" data-testid="save-filter-button">
                      <Save className="h-4 w-4 mr-1" />
                      Salvar Filtro
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80">
                    <div className="space-y-3">
                      <h4 className="font-medium">Salvar Filtro Atual</h4>
                      <Input
                        placeholder="Nome do filtro..."
                        value={saveFilterName}
                        onChange={(e) => setSaveFilterName(e.target.value)}
                        data-testid="save-filter-name-input"
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={handleSaveFilters}
                          data-testid="confirm-save-filter"
                        >
                          Salvar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setShowSaveDialog(false);
                            setSaveFilterName("");
                          }}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              {savedFilters.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {savedFilters.map((savedFilter, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => loadSavedFilter(savedFilter)}
                      className="text-xs"
                      data-testid={`saved-filter-${index}`}
                    >
                      <Star className="h-3 w-3 mr-1" />
                      {savedFilter.name}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}