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
        <CardTitle>AI-Powered Matchmaking</CardTitle>
        <CardDescription>
          Find the perfect property and partners for your next investment using our intelligent tools.
        </CardDescription>
      </CardHeader>
      <div className="p-6 pt-0">
        <Accordion type="single" collapsible defaultValue="item-1" className="w-full">
          <AccordionItem value="item-1">
            <AccordionTrigger className="text-lg font-semibold">
              Get Personalized Property Recommendations
            </AccordionTrigger>
            <AccordionContent>
              <Recommendations />
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger className="text-lg font-semibold">
              Find Co-Buy Partners
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
