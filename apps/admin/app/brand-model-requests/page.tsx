"use client";

import {
  Alert,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Select,
} from "@getyourboat/ui";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  api,
  ApiError,
  BoatBrandCategory,
  BOAT_BRAND_CATEGORY_LABELS,
  type BrandModelRequestDTO,
} from "../../lib/api";
export default function BrandModelRequestsPage() {
  const router = useRouter();
  const [items, setItems] = useState<BrandModelRequestDTO[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [categories, setCategories] = useState<Record<string, BoatBrandCategory>>({});

  useEffect(() => {
    load();
  }, [router]);

  async function load() {
    try {
      const { items: pending } = await api.listRequests("PENDING");
      setItems(pending);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Talepler yüklenemedi");
    }
  }

  async function approve(id: string) {
    setBusyId(id);
    setError(null);
    try {
      await api.approveRequest(id, categories[id]);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Onay başarısız");
    } finally {
      setBusyId(null);
    }
  }

  async function reject(id: string) {
    setBusyId(id);
    setError(null);
    try {
      await api.rejectRequest(id);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Reddetme başarısız");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <main className="mx-auto max-w-4xl p-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-700">Bekleyen Marka/Model Talepleri</h1>
          <p className="text-slate-600">Kaptanların &quot;listede yok&quot; talepleri.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/">
            <Button variant="outline" size="sm">
              Ana sayfa
            </Button>
          </Link>
          <Link href="/brands">
            <Button variant="outline" size="sm">
              Marka yönetimi
            </Button>
          </Link>
        </div>
      </div>

      {error ? <Alert className="mb-4">{error}</Alert> : null}

      {items.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-slate-500">
            Bekleyen talep yok.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <Card key={item.id}>
              <CardHeader>
                <CardTitle className="text-base">
                  {item.requestedBrand}
                  {item.requestedModel ? ` — ${item.requestedModel}` : ""}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-slate-600">
                  {item.captainName ?? "Kaptan"} ({item.captainEmail ?? item.captainId})
                </p>
                <p className="text-xs text-slate-400">
                  {new Date(item.createdAt).toLocaleString("tr-TR")}
                </p>
                <Select
                  value={categories[item.id] ?? BoatBrandCategory.MOTORYACHT}
                  onChange={(e) =>
                    setCategories((c) => ({
                      ...c,
                      [item.id]: e.target.value as BoatBrandCategory,
                    }))
                  }
                >
                  {Object.values(BoatBrandCategory).map((cat) => (
                    <option key={cat} value={cat}>
                      {BOAT_BRAND_CATEGORY_LABELS[cat]}
                    </option>
                  ))}
                </Select>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    disabled={busyId === item.id}
                    onClick={() => approve(item.id)}
                  >
                    Onayla
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busyId === item.id}
                    onClick={() => reject(item.id)}
                  >
                    Reddet
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
