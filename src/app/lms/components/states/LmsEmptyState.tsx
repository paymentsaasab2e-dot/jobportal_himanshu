import type { ReactNode } from 'react';
import { LMS_CARD_CLASS } from '../../constants';

type LmsEmptyStateProps = {
  title: string;
  body?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
};

export function LmsEmptyState({ title, body, icon, action, className = '' }: LmsEmptyStateProps) {
  return (
    <div className={`${LMS_CARD_CLASS} text-center py-12 px-6 border-dashed border-2 border-gray-200 ${className}`}>
      {icon ? <div className="mx-auto mb-4 w-fit text-gray-300">{icon}</div> : null}
      <h3 className="text-lg font-bold text-gray-900">{title}</h3>
      {body ? <p className="mt-2 text-sm font-normal text-gray-500 max-w-md mx-auto">{body}</p> : null}
      {action ? <div className="mt-6 flex justify-center">{action}</div> : null}
    </div>
  );
}

