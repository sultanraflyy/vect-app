'use client';

import { ReactNode } from 'react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  accent?: 'blue' | 'green' | 'amber' | 'red' | 'slate';
  children?: ReactNode;
  delay?: number;
}

const accentStyles: Record<string, string> = {
  blue: 'bg-blue-50 text-blue-600',
  green: 'bg-green-50 text-green-600',
  amber: 'bg-amber-50 text-amber-600',
  red: 'bg-red-50 text-red-600',
  slate: 'bg-slate-100 text-slate-600',
};

export default function MetricCard({
  title,
  value,
  subtitle,
  icon,
  accent = 'blue',
  children,
  delay = 0,
}: MetricCardProps) {
  return (
    <div
      className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow"
      style={{
        animation: `fadeUp 0.4s ease-out ${delay}ms forwards`,
        opacity: 0,
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <p className="text-sm font-medium text-slate-500">{title}</p>
        {icon && (
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${accentStyles[accent]}`}>
            {icon}
          </div>
        )}
      </div>
      {children ? (
        <div className="flex items-center gap-4">
          {children}
          <div>
            <p className="text-2xl font-bold text-slate-900">{value}</p>
            {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
        </div>
      ) : (
        <>
          <p className="text-2xl font-bold text-slate-900">{value}</p>
          {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
        </>
      )}
    </div>
  );
}
