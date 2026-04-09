'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Circle, Clock, Image as ImageIcon } from 'lucide-react';
import type { PurchaseTransaction, ConstructionCheckpoint } from '@/lib/types';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type ConstructionCheckpointCardProps = {
  transaction: PurchaseTransaction;
  onUpdate?: () => void;
  isAdmin?: boolean;
};

const MILESTONE_LABELS: Record<string, string> = {
  foundation: 'Pondasi',
  structure: 'Struktur',
  roofing: 'Atap',
  finishing: 'Finishing',
};

const CHECKPOINT_PROGRESS = [25, 50, 75, 100] as const;

export default function ConstructionCheckpointCard({
  transaction,
  onUpdate,
  isAdmin = false,
}: ConstructionCheckpointCardProps) {
  const [selectedCheckpoint, setSelectedCheckpoint] = useState<ConstructionCheckpoint | null>(null);
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const checkpoints = transaction.constructionCheckpoints || [];
  const completedCheckpoints = checkpoints.filter((cp) => cp.status === 'completed');
  const overallProgress = checkpoints.length > 0
    ? (completedCheckpoints.length / CHECKPOINT_PROGRESS.length) * 100
    : 0;

  const getCheckpointStatus = (progress: number) => {
    const checkpoint = checkpoints.find((cp) => cp.progress === progress);
    return checkpoint?.status || 'pending';
  };

  const handleImageClick = (checkpoint: ConstructionCheckpoint, imageIndex: number) => {
    setSelectedCheckpoint(checkpoint);
    setSelectedImageIndex(imageIndex);
    setImageViewerOpen(true);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Progress Pembangunan</CardTitle>
              <CardDescription>
                Tracking progress pembangunan per checkpoint (bukan payment trigger)
              </CardDescription>
            </div>
            {isAdmin && (
              <Button variant="outline" size="sm" onClick={onUpdate}>
                Update Progress
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Overall Progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Progress Keseluruhan</span>
                <span className="font-bold text-primary">{Math.round(overallProgress)}%</span>
              </div>
              <Progress value={overallProgress} className="h-3" />
              <p className="text-xs text-muted-foreground">
                {completedCheckpoints.length} dari {CHECKPOINT_PROGRESS.length} checkpoint selesai
              </p>
            </div>

            {/* Checkpoints */}
            <div className="space-y-4">
              {CHECKPOINT_PROGRESS.map((progress) => {
                const checkpoint = checkpoints.find((cp) => cp.progress === progress);
                const status = checkpoint?.status || 'pending';
                const isCompleted = status === 'completed';
                const isInProgress = status === 'in_progress';

                return (
                  <div
                    key={progress}
                    className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    {/* Status Icon */}
                    <div className="flex-shrink-0">
                      {isCompleted ? (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500 text-white">
                          <CheckCircle2 className="h-5 w-5" />
                        </div>
                      ) : isInProgress ? (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white">
                          <Clock className="h-5 w-5 animate-pulse" />
                        </div>
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
                          <Circle className="h-5 w-5" />
                        </div>
                      )}
                    </div>

                    {/* Checkpoint Details */}
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold">{progress}% - {checkpoint ? MILESTONE_LABELS[checkpoint.milestone] || checkpoint.milestone : 'Checkpoint'}</h4>
                          <Badge
                            variant={
                              isCompleted
                                ? 'default'
                                : isInProgress
                                ? 'secondary'
                                : 'outline'
                            }
                            className="mt-1"
                          >
                            {isCompleted
                              ? 'Selesai'
                              : isInProgress
                              ? 'Sedang Dikerjakan'
                              : 'Belum Dimulai'}
                          </Badge>
                        </div>
                      </div>

                      {checkpoint && (
                        <>
                          {checkpoint.startDate && (
                            <p className="text-xs text-muted-foreground">
                              Mulai: {new Date(checkpoint.startDate).toLocaleDateString('id-ID')}
                            </p>
                          )}
                          {checkpoint.completedDate && (
                            <p className="text-xs text-muted-foreground">
                              Selesai: {new Date(checkpoint.completedDate).toLocaleDateString('id-ID')}
                            </p>
                          )}

                          {checkpoint.notes && (
                            <p className="text-sm text-muted-foreground">{checkpoint.notes}</p>
                          )}

                          {/* Photos */}
                          {checkpoint.photos && checkpoint.photos.length > 0 && (
                            <div className="flex gap-2 mt-2">
                              {checkpoint.photos.slice(0, 3).map((photo, index) => (
                                <button
                                  key={index}
                                  type="button"
                                  onClick={() => handleImageClick(checkpoint, index)}
                                  className="relative w-16 h-16 rounded-lg overflow-hidden border hover:opacity-80 transition-opacity"
                                >
                                  <Image
                                    src={photo}
                                    alt={`Checkpoint ${progress}% - Photo ${index + 1}`}
                                    fill
                                    className="object-cover"
                                  />
                                </button>
                              ))}
                              {checkpoint.photos.length > 3 && (
                                <button
                                  type="button"
                                  onClick={() => handleImageClick(checkpoint, 0)}
                                  className="w-16 h-16 rounded-lg border flex items-center justify-center bg-muted hover:bg-muted/80 transition-colors"
                                >
                                  <span className="text-xs font-medium">
                                    +{checkpoint.photos.length - 3}
                                  </span>
                                </button>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Image Viewer Dialog */}
      {selectedCheckpoint && selectedCheckpoint.photos && (
        <Dialog open={imageViewerOpen} onOpenChange={setImageViewerOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Foto Progress {selectedCheckpoint.progress}% - {MILESTONE_LABELS[selectedCheckpoint.milestone] || selectedCheckpoint.milestone}
              </DialogTitle>
              <DialogDescription>
                Galeri foto checkpoint pembangunan
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
              {selectedCheckpoint.photos.map((photo, index) => (
                <div
                  key={index}
                  className="relative aspect-square rounded-lg overflow-hidden border cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => setSelectedImageIndex(index)}
                >
                  <Image
                    src={photo}
                    alt={`Photo ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

