"use client";

import {
  Alert,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Field,
  Input,
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
  type BoatBrandDTO,
  type BoatModelDTO,
} from "../../lib/api";
export default function BrandsPage() {
  const router = useRouter();
  const [brands, setBrands] = useState<BoatBrandDTO[]>([]);
  const [models, setModels] = useState<BoatModelDTO[]>([]);
  const [selectedBrandId, setSelectedBrandId] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("");
  const [search, setSearch] = useState("");
  const [newBrandName, setNewBrandName] = useState("");
  const [newBrandCategory, setNewBrandCategory] = useState<BoatBrandCategory>(
    BoatBrandCategory.MOTORYACHT
  );
  const [newModelName, setNewModelName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    loadBrands();
  }, [router, filterCategory]);

  useEffect(() => {
    if (!selectedBrandId) {
      setModels([]);
      return;
    }
    api
      .listModels(selectedBrandId)
      .then(({ items }) => setModels(items))
      .catch((err) => setError(err instanceof ApiError ? err.message : "Modeller yüklenemedi"));
  }, [selectedBrandId]);

  async function loadBrands() {
    try {
      const category = filterCategory
        ? (filterCategory as BoatBrandCategory)
        : undefined;
      const { items } = await api.listBrands(category);
      setBrands(items);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Markalar yüklenemedi");
    }
  }

  const filtered = brands.filter((b) =>
    b.name.toLowerCase().includes(search.trim().toLowerCase())
  );

  async function addBrand() {
    if (!newBrandName.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await api.createBrand({ name: newBrandName.trim(), category: newBrandCategory });
      setNewBrandName("");
      await loadBrands();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Marka eklenemedi");
    } finally {
      setBusy(false);
    }
  }

  async function addModel() {
    if (!selectedBrandId || !newModelName.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await api.createModel({ brandId: selectedBrandId, name: newModelName.trim() });
      setNewModelName("");
      const { items } = await api.listModels(selectedBrandId);
      setModels(items);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Model eklenemedi");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-6xl p-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-700">Marka / Model Yönetimi</h1>
          <p className="text-slate-600">Katalog markaları ve modelleri yönetin.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/">
            <Button variant="outline" size="sm">
              Ana sayfa
            </Button>
          </Link>
          <Link href="/brand-model-requests">
            <Button variant="outline" size="sm">
              Bekleyen talepler
            </Button>
          </Link>
        </div>
      </div>

      {error ? <Alert className="mb-4">{error}</Alert> : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Markalar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Ara…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <Select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                <option value="">Tüm kategoriler</option>
                {Object.values(BoatBrandCategory).map((cat) => (
                  <option key={cat} value={cat}>
                    {BOAT_BRAND_CATEGORY_LABELS[cat]}
                  </option>
                ))}
              </Select>
            </div>
            <ul className="max-h-80 space-y-1 overflow-y-auto text-sm">
              {filtered.map((b) => (
                <li key={b.id}>
                  <button
                    type="button"
                    className={`w-full rounded px-2 py-1.5 text-left hover:bg-slate-50 ${
                      selectedBrandId === b.id ? "bg-brand-50 font-medium" : ""
                    }`}
                    onClick={() => setSelectedBrandId(b.id)}
                  >
                    {b.name}
                    <span className="ml-2 text-xs text-slate-500">
                      {BOAT_BRAND_CATEGORY_LABELS[b.category]}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            <div className="space-y-2 border-t pt-4">
              <Field label="Yeni marka">
                <Input
                  value={newBrandName}
                  onChange={(e) => setNewBrandName(e.target.value)}
                  placeholder="Marka adı"
                />
              </Field>
              <Select
                value={newBrandCategory}
                onChange={(e) => setNewBrandCategory(e.target.value as BoatBrandCategory)}
              >
                {Object.values(BoatBrandCategory).map((cat) => (
                  <option key={cat} value={cat}>
                    {BOAT_BRAND_CATEGORY_LABELS[cat]}
                  </option>
                ))}
              </Select>
              <Button size="sm" disabled={busy} onClick={addBrand}>
                Marka ekle
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Modeller</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!selectedBrandId ? (
              <p className="text-sm text-slate-500">Soldan bir marka seçin.</p>
            ) : (
              <>
                <ul className="max-h-80 space-y-1 overflow-y-auto text-sm">
                  {models.map((m) => (
                    <li key={m.id} className="rounded px-2 py-1.5 hover:bg-slate-50">
                      {m.name}
                    </li>
                  ))}
                </ul>
                <div className="space-y-2 border-t pt-4">
                  <Field label="Yeni model">
                    <Input
                      value={newModelName}
                      onChange={(e) => setNewModelName(e.target.value)}
                      placeholder="Model adı"
                    />
                  </Field>
                  <Button size="sm" disabled={busy} onClick={addModel}>
                    Model ekle
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
