import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, X, FolderKanban, CheckSquare, Ticket, Clock, User, Calendar, Filter } from 'lucide-react';
import { useDebounce } from '@/hooks/use-debounce';
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

interface SearchResponse {
  results: SearchResult[];
  totalCount: number;
  hasMore: boolean;
}

type SearchType = 'all' | 'projects' | 'tasks' | 'tickets';

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect?: (result: SearchResult) => void;
}

export function GlobalSearch({ isOpen, onClose, onSelect }: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedType, setSelectedType] = useState<SearchType>('all');
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  
  // Debounce para evitar muitas requisições
  const debouncedQuery = useDebounce(query, 300);

  // Busca com dados reais da API
  const { data: searchResponse, isLoading, error } = useQuery<SearchResponse>({
    queryKey: ['/api/search', debouncedQuery, selectedType],
    queryFn: async () => {
      if (!debouncedQuery.trim() || debouncedQuery.trim().length < 2) {
        return { results: [], totalCount: 0, hasMore: false };
      }
      
      const params = new URLSearchParams({
        q: debouncedQuery.trim(),
        type: selectedType,
        limit: '20',
        offset: '0'
      });
      
      const response = await fetch(`/api/search?${params}`);
      if (!response.ok) {
        throw new Error('Falha na busca');
      }
      
      return response.json();
    },
    enabled: debouncedQuery.trim().length >= 2,
    staleTime: 30 * 1000, // Cache por 30 segundos
    retry: 2
  });
  
  const results = searchResponse?.results || [];

  // Carregar histórico do localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('search-history');
    if (savedHistory) {
      try {
        setSearchHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.warn('Erro ao carregar histórico de busca:', e);
      }
    }
  }, []);
  
  // Salvar busca no histórico
  const saveToHistory = (searchTerm: string) => {
    if (searchTerm.trim().length < 2) return;
    
    const newHistory = [searchTerm, ...searchHistory.filter(h => h !== searchTerm)].slice(0, 10);
    setSearchHistory(newHistory);
    localStorage.setItem('search-history', JSON.stringify(newHistory));
  };
  
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
      setSelectedType('all');
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
    saveToHistory(query);
    onSelect?.(result);
    onClose();
  };
  
  // Destacar termos de busca
  const highlightText = (text: string, searchTerm: string) => {
    if (!searchTerm.trim()) return text;
    
    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 px-1 rounded">
          {part}
        </mark>
      ) : part
    );
  };
  
  // Tipos disponíveis para filtro
  const searchTypes: { value: SearchType; label: string; icon: React.ReactNode }[] = [
    { value: 'all', label: 'Todos', icon: <Search className="w-4 h-4" /> },
    { value: 'projects', label: 'Projetos', icon: <FolderKanban className="w-4 h-4" /> },
    { value: 'tasks', label: 'Tarefas', icon: <CheckSquare className="w-4 h-4" /> },
    { value: 'tickets', label: 'Chamados', icon: <Ticket className="w-4 h-4" /> },
  ];
  
  // Resultados agrupados por tipo
  const groupedResults = useMemo(() => {
    const groups = results.reduce((acc, result) => {
      if (!acc[result.type]) {
        acc[result.type] = [];
      }
      acc[result.type].push(result);
      return acc;
    }, {} as Record<string, SearchResult[]>);
    
    return groups;
  }, [results]);

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
        <div className="p-4 border-b space-y-3">
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
          
          {/* Filtros por tipo */}
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-400" aria-hidden="true" />
            <div className="flex space-x-1">
              {searchTypes.map((type) => (
                <Button
                  key={type.value}
                  variant={selectedType === type.value ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setSelectedType(type.value)}
                  className="h-7 px-2 text-xs"
                >
                  {type.icon}
                  <span className="ml-1">{type.label}</span>
                </Button>
              ))}
            </div>
          </div>
          
          <div id="search-instructions" className="sr-only">
            Use as setas para navegar pelos resultados e Enter para selecionar. Use Ctrl+K para abrir a busca.
          </div>
        </div>

        <CardContent 
          className="p-0 max-h-96 overflow-y-auto" 
          ref={resultsRef}
          role="listbox"
          aria-label="Resultados da busca"
        >
          {query.trim() === '' ? (
            <div className="p-6">
              <div className="text-center text-gray-500 mb-6">
                <Search className="w-12 h-12 mx-auto mb-4 text-gray-300" aria-hidden="true" />
                <p id="search-title">Digite para buscar projetos, tarefas e chamados</p>
                <p className="text-sm mt-2" id="search-description">Use ↑↓ para navegar, Enter para selecionar e Ctrl+K para abrir</p>
              </div>
              
              {/* Histórico de buscas */}
              {searchHistory.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Buscas recentes</h4>
                  <div className="space-y-1">
                    {searchHistory.slice(0, 5).map((historyItem, index) => (
                      <button
                        key={index}
                        onClick={() => setQuery(historyItem)}
                        className="w-full text-left p-2 text-sm text-gray-600 hover:bg-gray-50 rounded flex items-center space-x-2"
                      >
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span>{historyItem}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : error ? (
            <div className="p-8 text-center text-red-500" role="status">
              <X className="w-12 h-12 mx-auto mb-4 text-red-300" aria-hidden="true" />
              <p>Erro na busca</p>
              <p className="text-sm mt-2">Tente novamente em alguns instantes</p>
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
            <div>
              {selectedType === 'all' ? (
                // Resultados agrupados por tipo
                <div>
                  {Object.entries(groupedResults).map(([type, typeResults]) => (
                    <div key={type}>
                      <div className="px-4 py-2 bg-gray-50 border-b">
                        <h3 className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                          {getTypeIcon(type as SearchResult['type'])}
                          <span>
                            {type === 'project' ? 'Projetos' : 
                             type === 'task' ? 'Tarefas' : 'Chamados'} 
                            ({typeResults.length})
                          </span>
                        </h3>
                      </div>
                      {typeResults.map((result, index) => {
                        const globalIndex = results.findIndex(r => r.id === result.id);
                        return (
                          <div
                            key={result.id}
                            id={`search-result-${globalIndex}`}
                            className={cn(
                              'p-4 cursor-pointer transition-colors border-b last:border-b-0',
                              globalIndex === selectedIndex ? 'bg-blue-50' : 'hover:bg-gray-50'
                            )}
                            onClick={() => handleSelect(result)}
                            role="option"
                            aria-selected={globalIndex === selectedIndex}
                            tabIndex={-1}
                          >
                            <div className="flex items-start space-x-3">
                              <div className={cn('p-2 rounded-lg', getTypeColor(result.type))}>
                                {getTypeIcon(result.type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2 mb-1">
                                  <h3 className="font-medium text-gray-900">
                                    {highlightText(result.title, debouncedQuery)}
                                  </h3>
                                </div>
                                
                                {result.description && (
                                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                                    {highlightText(result.description, debouncedQuery)}
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
                        );
                      })}
                    </div>
                  ))}
                </div>
              ) : (
                // Lista simples para filtro específico
                <div>
                  {results.map((result, index) => (
                    <div
                      key={result.id}
                      id={`search-result-${index}`}
                      className={cn(
                        'p-4 cursor-pointer transition-colors border-b last:border-b-0',
                        index === selectedIndex ? 'bg-blue-50' : 'hover:bg-gray-50'
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
                            <h3 className="font-medium text-gray-900">
                              {highlightText(result.title, debouncedQuery)}
                            </h3>
                            <Badge variant="secondary" className="text-xs">
                              {result.type === 'project' ? 'Projeto' : 
                               result.type === 'task' ? 'Tarefa' : 'Chamado'}
                            </Badge>
                          </div>
                          
                          {result.description && (
                            <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                              {highlightText(result.description, debouncedQuery)}
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
              
              {/* Indicador de mais resultados */}
              {searchResponse?.hasMore && (
                <div className="p-4 text-center text-sm text-gray-500 border-t">
                  E mais {searchResponse.totalCount - results.length} resultados...
                </div>
              )}
            </div>
          )}
        </CardContent>
        </Card>
      </FocusTrap>
    </div>
  );
}