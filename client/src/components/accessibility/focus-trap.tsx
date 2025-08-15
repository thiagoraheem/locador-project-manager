import { useEffect, useRef, ReactNode } from 'react';
import { useFocusManagement } from '@/lib/accessibility';

interface FocusTrapProps {
  children: ReactNode;
  isActive: boolean;
  restoreFocus?: boolean;
  className?: string;
}

export function FocusTrap({ 
  children, 
  isActive, 
  restoreFocus = true, 
  className 
}: FocusTrapProps) {
  const { focusRef, focusElement, trapFocus } = useFocusManagement();
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isActive) {
      // Salvar o elemento ativo atual
      previousActiveElement.current = document.activeElement as HTMLElement;
      
      // Focar no primeiro elemento focável dentro do trap
      setTimeout(() => {
        const focusableElements = focusRef.current?.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        if (focusableElements && focusableElements.length > 0) {
          (focusableElements[0] as HTMLElement).focus();
        }
      }, 100);
      
      // Adicionar listener para trap de foco
      document.addEventListener('keydown', trapFocus);
    } else {
      // Restaurar foco quando o trap for desativado
      if (restoreFocus && previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
      
      // Remover listener
      document.removeEventListener('keydown', trapFocus);
    }

    return () => {
      document.removeEventListener('keydown', trapFocus);
    };
  }, [isActive, trapFocus, restoreFocus]);

  if (!isActive) {
    return <>{children}</>;
  }

  return (
    <div 
      ref={focusRef}
      className={className}
      role="dialog"
      aria-modal="true"
    >
      {children}
    </div>
  );
}