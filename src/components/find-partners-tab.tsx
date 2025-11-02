import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import Recommendations from './recommendations';
import Matchmaking from './matchmaking';
import { Card, CardDescription, CardHeader, CardTitle } from './ui/card';

export default function FindPartnersTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Pencarian Rekan Berbasis AI</CardTitle>
        <CardDescription>
          Temukan properti dan rekan yang sempurna untuk investasi Anda berikutnya menggunakan alat cerdas kami.
        </CardDescription>
      </CardHeader>
      <div className="p-6 pt-0">
        <Accordion type="single" collapsible defaultValue="item-1" className="w-full">
          <AccordionItem value="item-1">
            <AccordionTrigger className="text-lg font-semibold">
              Dapatkan Rekomendasi Properti Personal
            </AccordionTrigger>
            <AccordionContent>
              <Recommendations />
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger className="text-lg font-semibold">
              Temukan Rekan Co-Buy
            </AccordionTrigger>
            <AccordionContent>
              <Matchmaking />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </Card>
  );
}
