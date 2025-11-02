import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const faqs = [
  {
    question: 'Apa itu BeliRumahBareng dan bagaimana cara kerjanya?',
    answer: 'BeliRumahBareng adalah platform kepemilikan properti kolektif. Kami memungkinkan sekelompok orang untuk patungan membeli properti bersama. Prosesnya sederhana: temukan properti, gabung dengan grup pembelian, dan selesaikan proses legal untuk memiliki bagian Anda. Kami memfasilitasi seluruh prosesnya agar aman dan transparan.',
  },
  {
    question: 'Apakah proses ini aman dan legal?',
    answer: 'Tentu saja. Keamanan dan legalitas adalah prioritas utama kami. Semua transaksi finansial dilakukan melalui rekening bersama (escrow) yang diawasi oleh notaris. Kepemilikan bersama diikat oleh Perjanjian Kepemilikan Bersama (Co-Ownership Agreement) yang sah secara hukum dan didaftarkan secara resmi.',
  },
  {
    question: 'Apa keuntungan utama membeli properti melalui BeliRumahBareng?',
    answer: 'Keuntungan utamanya adalah keterjangkauan. Dengan membeli lahan dalam skala besar atau membangun properti tanpa pengembang, biaya per individu menjadi jauh lebih murah. Selain itu, Anda menjadi bagian dari komunitas dan memiliki kontrol lebih besar atas properti Anda.',
  },
  {
    question: 'Apa yang terjadi jika saya ingin menjual bagian kepemilikan saya?',
    answer: 'Perjanjian Kepemilikan Bersama akan mengatur mekanisme penjualan. Umumnya, Anda harus terlebih dahulu menawarkan bagian Anda kepada anggota grup lain. Jika tidak ada yang berminat, Anda bisa menjualnya ke pasar terbuka. Platform kami juga dapat membantu memfasilitasi penjualan kembali bagian Anda.',
  },
  {
    question: 'Bagaimana jika ada anggota grup yang gagal bayar?',
    answer: 'Risiko ini dimitigasi sejak awal melalui proses verifikasi finansial (KYC). Namun, jika terjadi gagal bayar, Perjanjian Kepemilikan Bersama akan memiliki klausul yang mengatur solusinya, seperti pengambilalihan bagian oleh anggota lain atau penjualan bagian tersebut.',
  },
  {
    question: 'Berapa biaya yang dikenakan oleh BeliRumahBareng?',
    answer: 'Kami mengenakan biaya platform yang transparan untuk setiap proyek yang berhasil didanai. Biaya ini digunakan untuk menutupi biaya operasional, kurasi properti, fasilitasi legal, dan pengembangan platform. Detail biaya akan selalu dijabarkan di awal setiap proyek.',
  },
];

export default function FAQPage() {
  return (
    <div className="container mx-auto max-w-4xl py-6 sm:py-10 px-4">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-3xl">Frequently Asked Questions (FAQ)</CardTitle>
          <CardDescription>
            Temukan jawaban untuk pertanyaan yang paling sering diajukan.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem value={`item-${index + 1}`} key={index}>
                <AccordionTrigger className="text-left font-semibold">{faq.question}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}
