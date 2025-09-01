import clsx from 'clsx';
import { ReactNode } from 'react';

type BadgeProps = {
  children: ReactNode;
  color?: 'default' | 'green' | 'red' | 'yellow' | 'blue' | 'purple';
  className?: string;
};

export function Badge({ children, color = 'default', className }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-block px-3 py-1 rounded-full text-xs font-semibold',
        {
          'bg-gray-200 text-gray-800': color === 'default',
          'bg-green-100 text-green-700': color === 'green',
          'bg-red-100 text-red-700': color === 'red',
          'bg-yellow-100 text-yellow-800': color === 'yellow',
          'bg-blue-100 text-blue-700': color === 'blue',
          'bg-purple-100 text-purple-700': color === 'purple',
        },
        className
      )}
    >
      {children}
    </span>
  );
}
