import Matchmaking from './matchmaking';
import { Card, CardDescription, CardHeader, CardTitle, CardContent } from './ui/card';

export default function FindPartnersTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Pencarian Rekan</CardTitle>
        <CardDescription>
          Temukan rekan yang cocok untuk memulai grup co-buy Anda berikutnya.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Matchmaking />
      </CardContent>
    </Card>
  );
}
