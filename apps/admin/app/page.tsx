import Link from "next/link";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@getyourboat/ui";

export default function AdminHome() {
  return (
    <main className="mx-auto max-w-5xl p-8">
      <h1 className="text-2xl font-bold text-brand-700">GetYourBoat Admin</h1>
      <p className="mt-1 text-slate-600">Moderation & management console</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Marka / Model</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <span className="text-sm text-slate-600">Katalog ve yeni kayıt ekleme</span>
            <Link href="/brands">
              <Button size="sm" variant="outline">
                Yönet
              </Button>
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Bekleyen talepler</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <span className="text-sm text-slate-600">Kaptan marka/model istekleri</span>
            <Link href="/brand-model-requests">
              <Button size="sm" variant="outline">
                İncele
              </Button>
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>İndirimler</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <span className="text-sm text-slate-600">Tekne / deneyim indirim tanımları</span>
            <Link href="/discounts">
              <Button size="sm" variant="outline">
                Yönet
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <p className="mt-8 text-sm text-slate-500">
        <Link href="/login" className="text-brand-600 hover:underline">
          Admin girişi
        </Link>
      </p>
    </main>
  );
}
