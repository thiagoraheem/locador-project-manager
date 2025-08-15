import { useSkipLink, ARIA_LABELS } from '@/lib/accessibility';
import { Button } from '@/components/ui/button';

interface SkipLinkProps {
  targetId?: string;
  className?: string;
}

export function SkipLink({ targetId = 'main-content', className }: SkipLinkProps) {
  const { skipToContent } = useSkipLink();

  const handleSkip = () => {
    if (targetId) {
      const target = document.getElementById(targetId);
      if (target) {
        target.focus();
        target.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }
    skipToContent();
  };

  return (
    <Button
      onClick={handleSkip}
      className={`
        absolute -top-40 left-6 z-50 
        focus:top-6 
        bg-primary text-primary-foreground 
        px-4 py-2 rounded-md 
        transition-all duration-200
        ${className}
      `}
      onFocus={(e) => {
        e.currentTarget.style.top = '1.5rem';
      }}
      onBlur={(e) => {
        e.currentTarget.style.top = '-10rem';
      }}
      aria-label="Pular para o conteúdo principal"
    >
      Pular para o conteúdo
    </Button>
  );
}