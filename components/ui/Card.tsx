import { ReactNode } from 'react';
import clsx from 'clsx';

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={clsx('glass-card rounded-2xl shadow-glass p-6', className)}>
      {children}
    </div>
  );
}
