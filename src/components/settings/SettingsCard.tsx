'use client';

import { ReactNode } from 'react';

interface SettingsCardProps {
  title: string;
  description: string;
  onEdit?: () => void;
  icon?: ReactNode;
  active?: boolean;
  children: ReactNode;
}

export default function SettingsCard({
  title,
  description,
  onEdit,
  icon,
  active = false,
  children,
}: SettingsCardProps) {
  return (
    <section
      onClick={onEdit}
      role={onEdit ? "button" : undefined}
      tabIndex={onEdit ? 0 : undefined}
      onKeyDown={onEdit ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onEdit();
        }
      } : undefined}
      className={`rounded-xl border bg-white p-6 transition-all duration-200 ${
        onEdit ? 'cursor-pointer' : ''
      } ${
        active
          ? 'border-gray-300 shadow-sm ring-1 ring-gray-200'
          : onEdit ? 'border-gray-200 hover:border-gray-300 hover:shadow-md hover:-translate-y-0.5' : 'border-gray-200'
      }`}
    >
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            {icon ? <span className="text-gray-600">{icon}</span> : null}
            <h3 className="text-base font-semibold text-gray-900">{title}</h3>
          </div>
          <p className="mt-1 text-sm text-gray-500">{description}</p>
        </div>
        {onEdit && (
          <button
            type="button"
            onClick={onEdit}
            className="h-10 shrink-0 rounded-lg border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            Edit
          </button>
        )}
      </div>
      <div className="space-y-2">{children}</div>
    </section>
  );
}
