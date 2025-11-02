import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Mail, Phone, MapPin } from 'lucide-react';

export default function ContactPage() {
  return (
    <div className="container mx-auto max-w-4xl py-6 sm:py-10">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-3xl">Hubungi Kami</CardTitle>
          <CardDescription>
            Punya pertanyaan atau masukan? Kami siap membantu Anda.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <h3 className="text-xl font-semibold">Informasi Kontak</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Mail className="h-5 w-5 text-primary" />
                  <div>
                    <h4 className="font-medium">Email</h4>
                    <a href="mailto:support@belirumahbareng.com" className="text-muted-foreground hover:text-primary">
                      support@belirumahbareng.com
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Phone className="h-5 w-5 text-primary" />
                  <div>
                    <h4 className="font-medium">Telepon</h4>
                    <p className="text-muted-foreground">+62 21 1234 5678</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <MapPin className="h-5 w-5 text-primary mt-1" />
                  <div>
                    <h4 className="font-medium">Alamat</h4>
                    <p className="text-muted-foreground">
                      Jl. Jenderal Sudirman Kav. 52-53, <br/>
                      Jakarta Selatan, DKI Jakarta, 12190
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-6">
                <h3 className="text-xl font-semibold">Kirim Pesan</h3>
                 {/* This would be a client component with useForm in a real app */}
                 <form className="space-y-4">
                    <div className="space-y-2">
                        <label htmlFor="name" className="text-sm font-medium">Nama</label>
                        <Input id="name" placeholder="Nama Lengkap Anda" />
                    </div>
                     <div className="space-y-2">
                        <label htmlFor="email" className="text-sm font-medium">Email</label>
                        <Input id="email" type="email" placeholder="email@anda.com" />
                    </div>
                     <div className="space-y-2">
                        <label htmlFor="message" className="text-sm font-medium">Pesan</label>
                        <Textarea id="message" placeholder="Tulis pesan Anda di sini..." rows={5} />
                    </div>
                    <Button type="submit" className="w-full">Kirim Pesan</Button>
                 </form>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
