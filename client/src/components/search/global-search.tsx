import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, X, FolderKanban, CheckSquare, Ticket, Clock, User, Calendar } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { FocusTrap } from '@/components/accessibility/focus-trap';
import { useKeyboardNavigation, announceToScreenReader, ARIA_LABELS } from '@/lib/accessibility';

interface SearchResult {
  id: string;
  type: 'project' | 'task' | 'ticket';
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  createdAt: string;
  assignedTo?: string;
  projectName?: string;
}

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect?: (result: SearchResult) => void;
}

export function GlobalSearch({ isOpen, onClose, onSelect }: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Simular dados de busca (em produção, viria da API)
  const { data: results = [], isLoading } = useQuery<SearchResult[]>({
    queryKey: ['/api/search', query],
    queryFn: async () => {
      if (!query.trim()) return [];
      
      // Simular delay da API
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Dados simulados
      const mockResults: SearchResult[] = [
        {
          id: '1',
          type: 'project',
          title: 'Sistema de Locação',
          description: 'Desenvolvimento do sistema principal de locação de equipamentos',
          status: 'em_progresso',
          createdAt: '2024-01-15T10:00:00Z'
        },
        {
          id: '2',
          type: 'task',
          title: 'Implementar autenticação',
          description: 'Criar sistema de login e registro de usuários',
          status: 'concluida',
          priority: 'alta',
          assignedTo: 'João Silva',
          projectName: 'Sistema de Locação',
          createdAt: '2024-01-16T14:30:00Z'
        },
        {
          id: '3',
          type: 'ticket',
          title: 'Bug no formulário de cadastro',
          description: 'Campos não estão sendo validados corretamente',
          status: 'aberto',
          priority: 'media',
          createdAt: '2024-01-17T09:15:00Z'
        },
        {
          id: '4',
          type: 'project',
          title: 'Dashboard Analytics',
          description: 'Painel de controle com métricas e relatórios',
          status: 'planejamento',
          createdAt: '2024-01-18T11:45:00Z'
        },
        {
          id: '5',
          type: 'task',
          title: 'Criar componentes de gráficos',
          description: 'Desenvolver componentes reutilizáveis para visualização de dados',
          status: 'em_progresso',
          priority: 'alta',
          assignedTo: 'Maria Santos',
          projectName: 'Dashboard Analytics',
          createdAt: '2024-01-19T16:20:00Z'
        }
      ];
      
      // Filtrar resultados baseado na query
      return mockResults.filter(item => 
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        item.description?.toLowerCase().includes(query.toLowerCase()) ||
        item.projectName?.toLowerCase().includes(query.toLowerCase())
      );
    },
    enabled: query.trim().length > 0
  });

  // Focus no input quando abrir
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Reset quando fechar
  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Anunciar resultados para screen readers
  useEffect(() => {
    if (results.length > 0) {
      announceToScreenReader(
        `${results.length} resultado${results.length > 1 ? 's' : ''} encontrado${results.length > 1 ? 's' : ''}`
      );
    } else if (query.trim() && !isLoading) {
      announceToScreenReader('Nenhum resultado encontrado');
    }
  }, [results.length, query, isLoading]);

  // Navegação por teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => Math.max(prev - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (results[selectedIndex]) {
            handleSelect(results[selectedIndex]);
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex, onClose]);

  const handleSelect = (result: SearchResult) => {
    onSelect?.(result);
    onClose();
  };

  const getTypeIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'project':
        return <FolderKanban className="w-4 h-4" />;
      case 'task':
        return <CheckSquare className="w-4 h-4" />;
      case 'ticket':
        return <Ticket className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: SearchResult['type']) => {
    switch (type) {
      case 'project':
        return 'bg-blue-100 text-blue-800';
      case 'task':
        return 'bg-green-100 text-green-800';
      case 'ticket':
        return 'bg-orange-100 text-orange-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'concluida':
      case 'resolvido':
        return 'bg-green-100 text-green-800';
      case 'em_progresso':
      case 'aberto':
        return 'bg-blue-100 text-blue-800';
      case 'planejamento':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'alta':
        return 'bg-red-100 text-red-800';
      case 'media':
        return 'bg-yellow-100 text-yellow-800';
      case 'baixa':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center pt-20"
      role="dialog"
      aria-modal="true"
      aria-labelledby="search-title"
      aria-describedby="search-description"
    >
      <FocusTrap isActive={isOpen}>
        <Card className="w-full max-w-2xl mx-4 max-h-[70vh] overflow-hidden">
        <div className="p-4 border-b">
          <div className="flex items-center space-x-2">
            <Search className="w-5 h-5 text-gray-400" aria-hidden="true" />
            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar projetos, tarefas e chamados..."
              className="border-0 focus-visible:ring-0 text-lg"
              aria-label="Campo de busca"
              aria-describedby="search-instructions"
              role="searchbox"
              aria-autocomplete="list"
              aria-expanded={results.length > 0}
              aria-activedescendant={results.length > 0 ? `search-result-${selectedIndex}` : undefined}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
              aria-label={ARIA_LABELS.close}
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </Button>
          </div>
          <div id="search-instructions" className="sr-only">
            Use as setas para navegar pelos resultados e Enter para selecionar
          </div>
        </div>

        <CardContent 
          className="p-0 max-h-96 overflow-y-auto" 
          ref={resultsRef}
          role="listbox"
          aria-label="Resultados da busca"
        >
          {query.trim() === '' ? (
            <div className="p-8 text-center text-gray-500" role="status">
              <Search className="w-12 h-12 mx-auto mb-4 text-gray-300" aria-hidden="true" />
              <p id="search-title">Digite para buscar projetos, tarefas e chamados</p>
              <p className="text-sm mt-2" id="search-description">Use ↑↓ para navegar e Enter para selecionar</p>
            </div>
          ) : isLoading ? (
            <div className="p-4 space-y-3" role="status" aria-live="polite" aria-label="Carregando resultados">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center space-x-3">
                  <Skeleton className="w-8 h-8 rounded" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-3/4 mb-2" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : results.length === 0 ? (
            <div className="p-8 text-center text-gray-500" role="status">
              <Search className="w-12 h-12 mx-auto mb-4 text-gray-300" aria-hidden="true" />
              <p>Nenhum resultado encontrado</p>
              <p className="text-sm mt-2">Tente usar termos diferentes</p>
            </div>
          ) : (
            <div className="divide-y">
              {results.map((result, index) => (
                <div
                  key={result.id}
                  id={`search-result-${index}`}
                  className={cn(
                    'p-4 cursor-pointer transition-colors',
                    index === selectedIndex ? 'bg-gray-50' : 'hover:bg-gray-50'
                  )}
                  onClick={() => handleSelect(result)}
                  role="option"
                  aria-selected={index === selectedIndex}
                  tabIndex={-1}
                >
                  <div className="flex items-start space-x-3">
                    <div className={cn('p-2 rounded-lg', getTypeColor(result.type))}>
                      {getTypeIcon(result.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="font-medium text-gray-900 truncate">
                          {result.title}
                        </h3>
                        <Badge variant="secondary" className="text-xs">
                          {result.type === 'project' ? 'Projeto' : 
                           result.type === 'task' ? 'Tarefa' : 'Chamado'}
                        </Badge>
                      </div>
                      
                      {result.description && (
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                          {result.description}
                        </p>
                      )}
                      
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        {result.status && (
                          <Badge className={cn('text-xs', getStatusColor(result.status))}>
                            {result.status.replace('_', ' ')}
                          </Badge>
                        )}
                        
                        {result.priority && (
                          <Badge className={cn('text-xs', getPriorityColor(result.priority))}>
                            {result.priority}
                          </Badge>
                        )}
                        
                        {result.assignedTo && (
                          <div className="flex items-center space-x-1">
                            <User className="w-3 h-3" />
                            <span>{result.assignedTo}</span>
                          </div>
                        )}
                        
                        {result.projectName && (
                          <div className="flex items-center space-x-1">
                            <FolderKanban className="w-3 h-3" />
                            <span>{result.projectName}</span>
                          </div>
                        )}
                        
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>{formatDate(result.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
        </Card>
      </FocusTrap>
    </div>
  );
}