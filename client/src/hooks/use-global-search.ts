import { useState, useCallback, useEffect } from 'react';
import { useLocation } from 'wouter';

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

export function useGlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [, setLocation] = useLocation();

  // Abrir busca com Ctrl+K ou Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const openSearch = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeSearch = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleSelect = useCallback((result: SearchResult) => {
    // Navegar para o item selecionado
    switch (result.type) {
      case 'project':
        setLocation(`/projects/${result.id}`);
        break;
      case 'task':
        // Se a tarefa tem um projeto associado, navegar para o projeto
        if (result.projectName) {
          setLocation(`/projects?task=${result.id}`);
        } else {
          setLocation(`/tasks/${result.id}`);
        }
        break;
      case 'ticket':
        setLocation(`/tickets/${result.id}`);
        break;
    }
    
    setIsOpen(false);
  }, [setLocation]);

  return {
    isOpen,
    openSearch,
    closeSearch,
    handleSelect
  };
}