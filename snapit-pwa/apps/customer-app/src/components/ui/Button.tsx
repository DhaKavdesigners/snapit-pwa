import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-full font-medium transition-transform active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-2',
          {
            'bg-brand text-white': variant === 'primary',
            'bg-surface text-text-primary': variant === 'secondary',
            'border border-text-secondary text-text-primary': variant === 'outline',
            'bg-transparent text-text-primary hover:bg-surface': variant === 'ghost',
            'h-8 px-3 text-sm': size === 'sm',
            'h-11 px-4 text-base min-h-[44px]': size === 'md', // 44px min tap target
            'h-14 px-6 text-lg min-h-[44px]': size === 'lg',
          },
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';
