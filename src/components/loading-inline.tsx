'use client';

import { CoBuyLogo } from './icons';

interface LoadingInlineProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function LoadingInline({ message = 'Memuat...', size = 'md' }: LoadingInlineProps) {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  const logoSize = sizeClasses[size];
  const textSize = textSizeClasses[size];

  return (
    <div className="flex flex-col items-center justify-center py-8">
      <div className="flex flex-col items-center gap-4">
        {/* Compact Animated Logo */}
        <div className="relative">
          {/* Small ripple effect */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className={`${logoSize} rounded-full bg-primary/20 animate-ping`} />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className={`${size === 'sm' ? 'h-6 w-6' : size === 'md' ? 'h-10 w-10' : 'h-14 w-14'} rounded-full bg-primary/10 animate-ping [animation-delay:0.4s]`} />
          </div>
          
          {/* Glow effect */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className={`${size === 'sm' ? 'h-6 w-6' : size === 'md' ? 'h-10 w-10' : 'h-14 w-14'} rounded-full bg-primary/25 blur-md animate-pulse`} />
          </div>
          
          {/* Logo with rotation and scale animation */}
          <div className="relative">
            <div className="animate-spin-slow">
              <div className="animate-pulse-scale-compact">
                <CoBuyLogo className={`${logoSize} text-primary drop-shadow-md`} />
              </div>
            </div>
          </div>
        </div>

        {/* Loading message */}
        {message && (
          <p className={`${textSize} text-muted-foreground animate-pulse text-center`}>
            {message}
          </p>
        )}

        {/* Compact Loading Dots */}
        <div className="flex gap-1.5 mt-2">
          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" />
        </div>
      </div>
    </div>
  );
}

