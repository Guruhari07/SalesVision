import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({
  className = '',
  label,
  error,
  type = 'text',
  id,
  ...props
}, ref) => {
  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-sm font-semibold tracking-wide text-slate-300">
          {label}
        </label>
      )}
      <input
        type={type}
        id={id}
        ref={ref}
        className={`w-full px-3.5 py-2 text-sm bg-card border border-border/80 rounded-lg text-foreground placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/80 transition-all duration-150 ${error ? 'border-destructive/80 focus:ring-destructive/30' : ''} ${className}`}
        {...props}
      />
      {error && (
        <span className="text-xs text-destructive font-medium mt-0.5">
          {error}
        </span>
      )}
    </div>
  );
});

Input.displayName = 'Input';
