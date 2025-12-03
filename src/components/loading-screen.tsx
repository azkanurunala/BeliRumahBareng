'use client';

import { CoBuyLogo } from './icons';
import { Loader2 } from 'lucide-react';

interface LoadingScreenProps {
  message?: string;
  fullScreen?: boolean;
}

export function LoadingScreen({ message = 'Memuat...', fullScreen = false }: LoadingScreenProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center ${
        fullScreen ? 'min-h-screen' : 'min-h-[400px]'
      } bg-muted/20`}
    >
      <div className="flex flex-col items-center gap-6">
        {/* Animated Logo with Ripple Effect */}
        <div className="relative">
          {/* Ripple circles */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 rounded-full bg-primary/20 animate-ping" />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 animate-ping [animation-delay:0.5s]" />
          </div>
          {/* Logo */}
          <div className="relative">
            <CoBuyLogo className="h-16 w-16 text-primary animate-pulse" />
          </div>
        </div>

        {/* Brand Name with Fade Animation */}
        <div className="flex flex-col items-center gap-2">
          <h2 className="text-2xl font-bold text-primary animate-pulse">
            BeliRumahBareng
          </h2>
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">{message}</p>
          </div>
        </div>

        {/* Loading Dots Animation */}
        <div className="flex gap-2 mt-4">
          <div className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
          <div className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
          <div className="w-2 h-2 rounded-full bg-primary animate-bounce" />
        </div>
      </div>
    </div>
  );
}

