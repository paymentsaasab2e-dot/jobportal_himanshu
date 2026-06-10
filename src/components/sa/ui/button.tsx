'use client';

import * as React from 'react';

type ButtonVariant = 'default' | 'ghost';

export interface SaButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const variantClasses: Record<ButtonVariant, string> = {
  default: 'bg-primary text-primary-foreground hover:opacity-90',
  ghost: 'bg-transparent text-foreground hover:bg-muted',
};

export const SaButton = React.forwardRef<HTMLButtonElement, SaButtonProps>(
  ({ className = '', variant = 'default', type = 'button', ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={type}
        className={`inline-flex items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] disabled:pointer-events-none disabled:opacity-50 ${variantClasses[variant]} ${className}`}
        {...props}
      />
    );
  }
);

SaButton.displayName = 'SaButton';
