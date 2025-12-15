'use client';

import { Button } from '@/components/ui/button';
import { Loader2, Save, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FloatingSaveButtonProps {
  onSave: () => void;
  onCancel: () => void;
  isLoading?: boolean;
  saveLabel?: string;
  cancelLabel?: string;
  showCancelButton?: boolean;
  className?: string;
}

export function FloatingSaveButton({
  onSave,
  onCancel,
  isLoading = false,
  saveLabel = 'Salvar',
  cancelLabel = 'Cancelar',
  showCancelButton = true,
  className,
}: FloatingSaveButtonProps) {
  return (
    <div
      className={cn(
        'fixed right-6 top-1/2 -translate-y-1/2 z-50',
        'flex flex-col gap-2',
        'animate-in slide-in-from-right duration-300',
        className
      )}
    >
      {showCancelButton && (
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={onCancel}
          disabled={isLoading}
          className="h-12 w-12 rounded-full shadow-lg hover:shadow-xl transition-all bg-background border-2"
          title={cancelLabel}
        >
          <X className="h-5 w-5" />
        </Button>
      )}
      
      <Button
        type="button"
        onClick={onSave}
        disabled={isLoading}
        className="h-12 px-6 rounded-full shadow-lg hover:shadow-xl transition-all gap-2"
        title={saveLabel}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Salvando...</span>
          </>
        ) : (
          <>
            <Save className="h-5 w-5" />
            <span>{saveLabel}</span>
          </>
        )}
      </Button>
    </div>
  );
}
