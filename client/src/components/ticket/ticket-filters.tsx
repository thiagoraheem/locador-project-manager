import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Filter, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { Project } from "@shared/schema";

export interface TicketFilters {
  search: string;
  status: string;
  priority: string;
  projectId: string;
}

interface TicketFiltersProps {
  filters: TicketFilters;
  onFiltersChange: (filters: TicketFilters) => void;
  onClearFilters: () => void;
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

export default function TicketFilters({ filters, onFiltersChange, onClearFilters }: TicketFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchValue, setSearchValue] = useState(filters.search);

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      onFiltersChange({ ...filters, search: searchValue });
    }, 300);

    return () => clearTimeout(timer);
  }, [searchValue]);

  const handleFilterChange = (key: keyof TicketFilters, value: string) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.search) count++;
    if (filters.status !== "all") count++;
    if (filters.priority !== "all") count++;
    if (filters.projectId !== "all") count++;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  const getStatusLabel = (status: string) => {
    return statusOptions.find(option => option.value === status)?.label || status;
  };

  const getPriorityLabel = (priority: string) => {
    return priorityOptions.find(option => option.value === priority)?.label || priority;
  };

  const getProjectLabel = (projectId: string) => {
    if (projectId === "all") return "Todos os Projetos";
    return projects.find(project => project.id === projectId)?.name || projectId;
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          placeholder="Buscar chamados por título, descrição ou ID..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          className="pl-10 pr-4"
        />
      </div>

      {/* Filters Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="relative">
                <Filter className="w-4 h-4 mr-2" />
                Filtros
                {activeFiltersCount > 0 && (
                  <Badge className="ml-2 h-5 w-5 p-0 text-xs bg-blue-500">
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="start">
              <Card>
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Filtros Avançados</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsOpen(false)}
                      className="h-6 w-6 p-0"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>

                  <Separator />

                  {/* Status Filter */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Status</label>
                    <Select
                      value={filters.status}
                      onValueChange={(value) => handleFilterChange("status", value)}
                    >
                      <SelectTrigger>
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

                  {/* Priority Filter */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Prioridade</label>
                    <Select
                      value={filters.priority}
                      onValueChange={(value) => handleFilterChange("priority", value)}
                    >
                      <SelectTrigger>
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

                  {/* Project Filter */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Projeto</label>
                    <Select
                      value={filters.projectId}
                      onValueChange={(value) => handleFilterChange("projectId", value)}
                    >
                      <SelectTrigger>
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

                  <Separator />

                  <Button
                    variant="outline"
                    onClick={onClearFilters}
                    className="w-full"
                    disabled={activeFiltersCount === 0}
                  >
                    Limpar Filtros
                  </Button>
                </CardContent>
              </Card>
            </PopoverContent>
          </Popover>

          {/* Active Filters Display */}
          {activeFiltersCount > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">Filtros ativos:</span>
              <div className="flex items-center space-x-1">
                {filters.status !== "all" && (
                  <Badge variant="secondary" className="text-xs">
                    Status: {getStatusLabel(filters.status)}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleFilterChange("status", "all")}
                      className="ml-1 h-3 w-3 p-0 hover:bg-transparent"
                    >
                      <X className="w-2 h-2" />
                    </Button>
                  </Badge>
                )}
                {filters.priority !== "all" && (
                  <Badge variant="secondary" className="text-xs">
                    Prioridade: {getPriorityLabel(filters.priority)}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleFilterChange("priority", "all")}
                      className="ml-1 h-3 w-3 p-0 hover:bg-transparent"
                    >
                      <X className="w-2 h-2" />
                    </Button>
                  </Badge>
                )}
                {filters.projectId !== "all" && (
                  <Badge variant="secondary" className="text-xs">
                    Projeto: {getProjectLabel(filters.projectId)}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleFilterChange("projectId", "all")}
                      className="ml-1 h-3 w-3 p-0 hover:bg-transparent"
                    >
                      <X className="w-2 h-2" />
                    </Button>
                  </Badge>
                )}
                {filters.search && (
                  <Badge variant="secondary" className="text-xs">
                    Busca: "{filters.search}"
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSearchValue("");
                        handleFilterChange("search", "");
                      }}
                      className="ml-1 h-3 w-3 p-0 hover:bg-transparent"
                    >
                      <X className="w-2 h-2" />
                    </Button>
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>

        {activeFiltersCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="text-gray-500 hover:text-gray-700"
          >
            Limpar Todos
          </Button>
        )}
      </div>
    </div>
  );
}