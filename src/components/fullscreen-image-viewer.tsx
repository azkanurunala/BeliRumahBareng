'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type ImageData = {
  url: string;
  alt: string;
  hint?: string;
};

type FullscreenImageViewerProps = {
  images: ImageData[];
  initialIndex: number;
  isOpen: boolean;
  onClose: () => void;
};

export default function FullscreenImageViewer({
  images,
  initialIndex,
  isOpen,
  onClose,
}: FullscreenImageViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageLoading, setImageLoading] = useState(true);
  const imageRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Reset zoom and pan when image changes
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      setZoom(1);
      setPan({ x: 0, y: 0 });
      setImageLoading(true);
    }
  }, [isOpen, initialIndex]);

  // Update current index when initialIndex changes
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      setZoom(1);
      setPan({ x: 0, y: 0 });
      setImageLoading(true);
    }
  }, [initialIndex, isOpen]);

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => {
      const newIndex = prev > 0 ? prev - 1 : images.length - 1;
      setZoom(1);
      setPan({ x: 0, y: 0 });
      setImageLoading(true);
      return newIndex;
    });
  }, [images.length]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => {
      const newIndex = prev < images.length - 1 ? prev + 1 : 0;
      setZoom(1);
      setPan({ x: 0, y: 0 });
      setImageLoading(true);
      return newIndex;
    });
  }, [images.length]);

  const handleZoomIn = useCallback(() => {
    setZoom((prev) => Math.min(prev + 0.25, 5));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((prev) => {
      const newZoom = Math.max(prev - 0.25, 1);
      if (newZoom === 1) {
        setPan({ x: 0, y: 0 });
      }
      return newZoom;
    });
  }, []);

  const resetZoom = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  // Prevent body scroll when fullscreen is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isOpen]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          goToPrevious();
          break;
        case 'ArrowRight':
          e.preventDefault();
          goToNext();
          break;
        case '+':
        case '=':
          e.preventDefault();
          handleZoomIn();
          break;
        case '-':
          e.preventDefault();
          handleZoomOut();
          break;
        case '0':
          e.preventDefault();
          resetZoom();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, goToPrevious, goToNext, handleZoomIn, handleZoomOut, resetZoom]);

  // Mouse wheel zoom
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        if (e.deltaY < 0) {
          handleZoomIn();
        } else {
          handleZoomOut();
        }
      }
    },
    [handleZoomIn, handleZoomOut]
  );

  // Mouse drag for panning
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  }, [zoom, pan]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isDragging && zoom > 1) {
        setPan({
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y,
        });
      }
    },
    [isDragging, dragStart, zoom]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Touch gestures
  const touchStartRef = useRef<{ x: number; y: number; distance: number } | null>(null);

  const getTouchDistance = (touches: TouchList) => {
    if (touches.length < 2) return 0;
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1 && zoom > 1) {
      touchStartRef.current = {
        x: e.touches[0].clientX - pan.x,
        y: e.touches[0].clientY - pan.y,
        distance: 0,
      };
    } else if (e.touches.length === 2) {
      touchStartRef.current = {
        x: 0,
        y: 0,
        distance: getTouchDistance(e.touches),
      };
    }
  }, [zoom, pan]);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 1 && touchStartRef.current && zoom > 1) {
        setPan({
          x: e.touches[0].clientX - touchStartRef.current.x,
          y: e.touches[0].clientY - touchStartRef.current.y,
        });
      } else if (e.touches.length === 2 && touchStartRef.current?.distance) {
        const newDistance = getTouchDistance(e.touches);
        const scale = newDistance / touchStartRef.current.distance;
        setZoom((prev) => Math.min(Math.max(prev * scale, 1), 5));
      }
    },
    [zoom]
  );

  const handleTouchEnd = useCallback(() => {
    touchStartRef.current = null;
  }, []);

  if (!isOpen) return null;

  const currentImage = images[currentIndex];

  return (
    <div
      ref={containerRef}
      className={cn(
        'fixed inset-0 z-[9999] bg-black/95 backdrop-blur-sm',
        'flex items-center justify-center',
        'transition-opacity duration-300',
        isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
      )}
      onClick={(e) => {
        if (e.target === containerRef.current) {
          onClose();
        }
      }}
      onWheel={handleWheel}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Close Button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 right-4 z-50 h-12 w-12 rounded-full bg-black/50 hover:bg-black/70 text-white backdrop-blur-sm transition-all duration-200 hover:scale-110"
        onClick={onClose}
        aria-label="Close fullscreen"
      >
        <X className="h-6 w-6" />
      </Button>

      {/* Previous Button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute left-4 top-1/2 -translate-y-1/2 z-50 h-14 w-14 rounded-full bg-black/50 hover:bg-black/70 text-white backdrop-blur-sm transition-all duration-200 hover:scale-110"
        onClick={goToPrevious}
        aria-label="Previous image"
      >
        <ChevronLeft className="h-8 w-8" />
      </Button>

      {/* Next Button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-4 top-1/2 -translate-y-1/2 z-50 h-14 w-14 rounded-full bg-black/50 hover:bg-black/70 text-white backdrop-blur-sm transition-all duration-200 hover:scale-110"
        onClick={goToNext}
        aria-label="Next image"
      >
        <ChevronRight className="h-8 w-8" />
      </Button>

      {/* Zoom Controls */}
      <div className="absolute top-4 left-4 z-50 flex gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-full bg-black/50 hover:bg-black/70 text-white backdrop-blur-sm transition-all duration-200 hover:scale-110"
          onClick={handleZoomIn}
          disabled={zoom >= 5}
          aria-label="Zoom in"
        >
          <ZoomIn className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-full bg-black/50 hover:bg-black/70 text-white backdrop-blur-sm transition-all duration-200 hover:scale-110"
          onClick={handleZoomOut}
          disabled={zoom <= 1}
          aria-label="Zoom out"
        >
          <ZoomOut className="h-5 w-5" />
        </Button>
        {zoom > 1 && (
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-full bg-black/50 hover:bg-black/70 text-white backdrop-blur-sm transition-all duration-200 hover:scale-110"
            onClick={resetZoom}
            aria-label="Reset zoom"
          >
            <RotateCcw className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* Image Container */}
      <div
        ref={imageRef}
        className="relative w-full h-full flex items-center justify-center p-4"
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
      >
        <div
          className="relative transition-all duration-300 ease-out"
          style={{
            transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
            maxWidth: '90vw',
            maxHeight: '90vh',
          }}
        >
          {imageLoading && (
            <div className="absolute inset-0 bg-gray-900/50 animate-pulse rounded-lg" />
          )}
          <Image
            src={currentImage.url}
            alt={currentImage.alt}
            width={1920}
            height={1080}
            className={cn(
              'max-w-full max-h-[90vh] object-contain transition-opacity duration-300',
              imageLoading ? 'opacity-0' : 'opacity-100'
            )}
            data-ai-hint={currentImage.hint}
            onLoad={() => setImageLoading(false)}
            onError={() => setImageLoading(false)}
            priority
            unoptimized
          />
        </div>
      </div>

      {/* Image Counter */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-black/50 backdrop-blur-sm text-white text-sm font-medium">
        {currentIndex + 1} / {images.length}
      </div>

      {/* Keyboard Shortcuts Hint */}
      <div className="absolute bottom-4 right-4 z-50 px-3 py-2 rounded-lg bg-black/50 backdrop-blur-sm text-white text-xs opacity-70">
        <div className="space-y-1">
          <div>← → Navigate</div>
          <div>ESC Close</div>
          <div>Ctrl + Scroll Zoom</div>
        </div>
      </div>
    </div>
  );
}

