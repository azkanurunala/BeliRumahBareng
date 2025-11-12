'use client';

import { useState } from 'react';
import { useActionState } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { mockUsers } from '@/lib/mock-data';
import { getMatchmakingAction } from '@/app/actions';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Badge } from './ui/badge';

const currentUser = mockUsers[0];
const otherUsers = mockUsers.slice(1);

type MatchmakingState = {
    data?: {
        matchedUserIds: number[];
        reasoning: string;
    }
    error?: string;
    success: boolean;
}

const initialState: MatchmakingState = {
    success: false
};

export default function Matchmaking() {
  const [isLoading, setIsLoading] = useState(false);
  const [state, formAction] = useActionState(handleMatchmaking, initialState);
  const { toast } = useToast();
  
  async function handleMatchmaking(previousState: MatchmakingState, formData: FormData): Promise<MatchmakingState> {
    setIsLoading(true);
    const input = {
      userProfile: currentUser.profile,
      otherUserProfiles: otherUsers.map(u => u.profile),
    };
    const result = await getMatchmakingAction(input);
    
    if(!result.success){
        toast({
            variant: "destructive",
            title: "Error",
            description: result.error || "Terjadi kesalahan yang tidak diketahui.",
        });
    }

    setIsLoading(false);
    return result;
  }

  const matchedUsers = state.success ? state.data?.matchedUserIds.map(id => otherUsers[id]) : [];

  return (
    <div className="space-y-6 rounded-lg border p-4">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="md:col-span-1">
          <h4 className="font-semibold">Profil Anda</h4>
          <p className="text-sm text-muted-foreground">
            AI akan menemukan rekan berdasarkan preferensi propertiAnda.
          </p>
          <Card className="mt-4">
            <CardHeader className="flex flex-row items-center gap-4">
              <Avatar>
                <AvatarImage src={currentUser.avatarUrl} alt={currentUser.name} data-ai-hint={currentUser.avatarHint} className="object-cover"/>
                <AvatarFallback>{currentUser.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-base">{currentUser.name}</CardTitle>
                <CardDescription>Pengguna Saat Ini</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-1 text-xs">
              <p><strong>Tujuan:</strong> {currentUser.profile.investmentGoals}</p>
              <p><strong>Lokasi:</strong> {currentUser.profile.locationPreference}</p>
              <p><strong>Anggaran:</strong> {currentUser.profile.priceRange}</p>
            </CardContent>
          </Card>
        </div>
        <div className="md:col-span-2">
          <h4 className="font-semibold">Calon Rekan</h4>
          <p className="text-sm text-muted-foreground">
            Daftar pengguna lain di platform yang ingin melakukan co-buy.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
            {otherUsers.map(user => (
              <Link href={`/profile/${user.id}`} key={user.id} className="flex flex-col items-center text-center p-2 rounded-lg transition-colors hover:bg-muted/50">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={user.avatarUrl} alt={user.name} data-ai-hint={user.avatarHint} className="object-cover" />
                  <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <p className="mt-2 text-sm font-medium">{user.name}</p>
                <p className="text-xs text-muted-foreground">{user.profile.locationPreference}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
      <form action={formAction}>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
          Temukan Rekan Terbaik
        </Button>
      </form>

      {state.success && state.data && (
        <div className="mt-6 space-y-4">
            <h3 className="text-lg font-semibold">Hasil Pencarian AI</h3>
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Rekan Paling Cocok untuk Anda</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {matchedUsers && matchedUsers.length > 0 ? matchedUsers.map(user => user && (
                       <Link href={`/profile/${user.id}`} key={user.id} className="flex flex-col items-center text-center p-2 rounded-lg border transition-colors hover:bg-muted/50">
                         <Avatar className="h-16 w-16">
                           <AvatarImage src={user.avatarUrl} alt={user.name} data-ai-hint={user.avatarHint} className="object-cover" />
                           <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                         </Avatar>
                         <p className="mt-2 text-sm font-medium">{user.name}</p>
                         <Badge variant="outline" className="mt-1 text-green-600 border-green-200">Sangat Cocok</Badge>
                       </Link>
                    )) : (
                        <p className="text-muted-foreground col-span-full">Tidak ada rekan yang cocok ditemukan saat ini.</p>
                    )}
                </CardContent>
                <CardFooter className="flex-col items-start gap-2 bg-secondary/30 p-4">
                    <p className="text-sm font-semibold">Alasan dari AI:</p>
                    <p className="text-sm text-muted-foreground italic">"{state.data.reasoning}"</p>
                </CardFooter>
            </Card>
        </div>
      )}
    </div>
  );
}
