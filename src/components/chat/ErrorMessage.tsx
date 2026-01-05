import { AlertCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorMessageProps {
  message: string;
  onDismiss: () => void;
}

export const ErrorMessage = ({ message, onDismiss }: ErrorMessageProps) => {
  return (
    <div className="mx-auto max-w-3xl px-4 animate-fade-in">
      <div className="flex items-center gap-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg px-4 py-3">
        <AlertCircle className="h-5 w-5 flex-shrink-0" />
        <p className="flex-1 text-sm">{message}</p>
        <Button
          variant="ghost"
          size="icon"
          onClick={onDismiss}
          className="h-6 w-6 hover:bg-destructive/20"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
