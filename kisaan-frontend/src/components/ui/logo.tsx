import { cn } from '@/lib/utils';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'minimal' | 'text-only';
  className?: string;
}

export function Logo({ size = 'md', variant = 'default', className }: LogoProps) {
  const sizeClasses = {
    sm: {
      icon: 'h-6 w-6',
      container: 'p-1.5',
      text: 'text-lg',
      spacing: 'space-x-2'
    },
    md: {
      icon: 'h-8 w-8',
      container: 'p-2',
      text: 'text-xl',
      spacing: 'space-x-3'
    },
    lg: {
      icon: 'h-10 w-10',
      container: 'p-2.5',
      text: 'text-2xl',
      spacing: 'space-x-4'
    }
  };

  const currentSize = sizeClasses[size];

  if (variant === 'text-only') {
    return (
      <div className={cn('flex items-center', className)}>
        <span className={cn('font-bold text-foreground', currentSize.text)}>
          KisaanCenter
        </span>
      </div>
    );
  }

  if (variant === 'minimal') {
    return (
      <div className={cn('flex items-center', currentSize.spacing, className)}>
        <div className={cn(
          'bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-sm',
          currentSize.container
        )}>
          {/* Modern agricultural symbol */}
          <svg 
            className={cn(currentSize.icon, 'text-white')} 
            fill="currentColor" 
            viewBox="0 0 24 24"
          >
            <path d="M12 2L13.09 8.26L20.75 7.75L13.5 14.5L16 21L12 18L8 21L10.5 14.5L3.25 7.75L10.91 8.26L12 2Z"/>
          </svg>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex items-center', currentSize.spacing, className)}>
      <div className={cn(
        'bg-gradient-to-br from-emerald-500 via-emerald-600 to-green-600 rounded-xl shadow-lg ring-1 ring-emerald-200/20',
        currentSize.container
      )}>
        {/* Enhanced agricultural symbol with grain/wheat inspiration */}
        <svg 
          className={cn(currentSize.icon, 'text-white drop-shadow-sm')} 
          fill="currentColor" 
          viewBox="0 0 24 24"
        >
          <path d="M12 2L13.09 8.26L20.75 7.75L13.5 14.5L16 21L12 18L8 21L10.5 14.5L3.25 7.75L10.91 8.26L12 2Z"/>
          <circle cx="12" cy="12" r="1.5" opacity="0.6"/>
        </svg>
      </div>
      <div className="flex flex-col">
        <span className={cn('font-bold text-foreground leading-tight', currentSize.text)}>
          KisaanCenter
        </span>
        <span className="text-xs text-muted-foreground font-medium -mt-1">
          Agricultural Hub
        </span>
      </div>
    </div>
  );
}