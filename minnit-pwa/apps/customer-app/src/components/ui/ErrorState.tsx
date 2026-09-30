import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from './Button';

interface ErrorStateProps {
  message?: string;
  onRetry: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ message = 'Something went wrong.', onRetry }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
      <p className="text-text-primary font-medium mb-2">{message}</p>
      <Button variant="outline" onClick={onRetry} aria-label="Retry loading data">
        Retry
      </Button>
    </div>
  );
};
