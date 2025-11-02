import Recommendations from "@/components/recommendations";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function RecommendationsPage() {
    return (
        <div className="container mx-auto py-6 sm:py-10">
            <Card>
                <CardHeader>
                    <CardTitle>Rekomendasi Properti</CardTitle>
                    <CardDescription>
                        Masukkan preferensi Anda dan biarkan AI kami menemukan properti yang paling cocok untuk Anda.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Recommendations />
                </CardContent>
            </Card>
        </div>
    )
}