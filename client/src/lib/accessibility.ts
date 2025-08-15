import { useEffect, useRef } from 'react';

// Hook para gerenciar foco em elementos
export function useFocusManagement() {
  const focusRef = useRef<HTMLElement>(null);

  const focusElement = () => {
    if (focusRef.current) {
      focusRef.current.focus();
    }
  };

  const trapFocus = (event: KeyboardEvent) => {
    if (event.key !== 'Tab') return;

    const focusableElements = focusRef.current?.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    if (!focusableElements || focusableElements.length === 0) return;

    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    if (event.shiftKey) {
      if (document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      }
    } else {
      if (document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }
  };

  return { focusRef, focusElement, trapFocus };
}

// Hook para navegação por teclado
export function useKeyboardNavigation({
  onEnter,
  onEscape,
  onArrowUp,
  onArrowDown,
  onArrowLeft,
  onArrowRight,
}: {
  onEnter?: () => void;
  onEscape?: () => void;
  onArrowUp?: () => void;
  onArrowDown?: () => void;
  onArrowLeft?: () => void;
  onArrowRight?: () => void;
}) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'Enter':
          onEnter?.();
          break;
        case 'Escape':
          onEscape?.();
          break;
        case 'ArrowUp':
          event.preventDefault();
          onArrowUp?.();
          break;
        case 'ArrowDown':
          event.preventDefault();
          onArrowDown?.();
          break;
        case 'ArrowLeft':
          onArrowLeft?.();
          break;
        case 'ArrowRight':
          onArrowRight?.();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onEnter, onEscape, onArrowUp, onArrowDown, onArrowLeft, onArrowRight]);
}

// Função para anunciar mudanças para screen readers
export function announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite') {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.setAttribute('class', 'sr-only');
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  
  // Remove o elemento após um tempo para não poluir o DOM
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

// Função para gerar IDs únicos para ARIA
export function generateAriaId(prefix: string = 'aria'): string {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
}

// Hook para gerenciar descrições ARIA
export function useAriaDescribedBy(description: string) {
  const descriptionId = useRef(generateAriaId('description'));
  
  useEffect(() => {
    const descElement = document.createElement('div');
    descElement.id = descriptionId.current;
    descElement.className = 'sr-only';
    descElement.textContent = description;
    document.body.appendChild(descElement);
    
    return () => {
      const element = document.getElementById(descriptionId.current);
      if (element) {
        document.body.removeChild(element);
      }
    };
  }, [description]);
  
  return descriptionId.current;
}

// Função para verificar se um elemento está visível
export function isElementVisible(element: HTMLElement): boolean {
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

// Hook para skip links
export function useSkipLink() {
  const skipToContent = () => {
    const mainContent = document.querySelector('main, [role="main"], #main-content');
    if (mainContent instanceof HTMLElement) {
      mainContent.focus();
      mainContent.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return { skipToContent };
}

// Constantes para ARIA labels comuns
export const ARIA_LABELS = {
  close: 'Fechar',
  menu: 'Menu',
  search: 'Buscar',
  notifications: 'Notificações',
  profile: 'Perfil do usuário',
  settings: 'Configurações',
  loading: 'Carregando...',
  error: 'Erro',
  success: 'Sucesso',
  warning: 'Aviso',
  info: 'Informação',
  edit: 'Editar',
  delete: 'Excluir',
  save: 'Salvar',
  cancel: 'Cancelar',
  previous: 'Anterior',
  next: 'Próximo',
  first: 'Primeiro',
  last: 'Último',
  sortAscending: 'Ordenar crescente',
  sortDescending: 'Ordenar decrescente',
  filter: 'Filtrar',
  expand: 'Expandir',
  collapse: 'Recolher',
  select: 'Selecionar',
  deselect: 'Desmarcar',
  required: 'Campo obrigatório',
  optional: 'Campo opcional',
  invalid: 'Valor inválido',
  valid: 'Valor válido'
} as const;