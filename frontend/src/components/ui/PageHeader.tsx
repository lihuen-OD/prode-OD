import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold text-slate-900 font-display">{title}</h1>
        {subtitle && <p className="text-slate-500 mt-0.5 text-sm">{subtitle}</p>}
      </div>
      {action && <div className="w-full sm:w-auto sm:flex-shrink-0">{action}</div>}
    </div>
  );
}
