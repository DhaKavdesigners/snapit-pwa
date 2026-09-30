import React from 'react';
import { cn } from './Button'; // reuse cn utility

export const Skeleton = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div
      className={cn('animate-pulse rounded-2xl bg-gray-200', className)}
      {...props}
    />
  );
};
