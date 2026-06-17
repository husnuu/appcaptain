import { Button } from "@getyourboat/ui";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-gradient-to-b from-brand-50 to-white p-8 text-center">
      <h1 className="text-4xl font-bold text-brand-700 sm:text-6xl">
        Find your boat.
      </h1>
      <p className="max-w-xl text-lg text-slate-600">
        Browse hundreds of yachts and boats, book online, and set sail with a
        trusted captain.
      </p>
      <Button size="lg">Start searching</Button>
      <p className="text-sm text-slate-400">Customer frontend — Phase 2</p>
    </main>
  );
}
