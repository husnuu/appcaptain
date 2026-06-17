import { Button, Card, CardContent, CardHeader, CardTitle } from "@getyourboat/ui";

export default function AdminHome() {
  return (
    <main className="mx-auto max-w-5xl p-8">
      <h1 className="text-2xl font-bold text-brand-700">GetYourBoat Admin</h1>
      <p className="mt-1 text-slate-600">Moderation & management console</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Pending boats</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <span className="text-3xl font-semibold">0</span>
            <Button size="sm" variant="outline">
              Review
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Users</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-semibold">0</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Reservations</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-semibold">0</span>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
