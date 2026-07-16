"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { api, ApiError } from "../../../lib/api";

type Boat = Awaited<ReturnType<typeof api.getBoat>>["boat"];
type Photo = Boat["photos"][number];

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Taslak",
  PENDING_REVIEW: "İncelemede",
  ACTIVE: "Aktif",
  REJECTED: "Reddedildi",
  SUSPENDED: "Askıya Alındı",
};

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-600",
  PENDING_REVIEW: "bg-yellow-100 text-yellow-700",
  ACTIVE: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
  SUSPENDED: "bg-orange-100 text-orange-700",
};

export default function BoatDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [boat, setBoat] = useState<Boat | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit mode
  const [editMode, setEditMode] = useState(false);
  const [editFields, setEditFields] = useState({ title: "", description: "", boatTypeKey: "", rulesText: "", checkInNotes: "", checkOutNotes: "" });
  const [editBusy, setEditBusy] = useState(false);

  // Pricing edit
  const [pricingEdit, setPricingEdit] = useState<Record<string, { price: string; currency: string }>>({});
  const [pricingBusy, setPricingBusy] = useState<string | null>(null);

  // Status
  const [actionBusy, setActionBusy] = useState(false);
  const [emailSentNote, setEmailSentNote] = useState<string | null>(null);

  // Photo management
  const [photoBusy, setPhotoBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await api.getBoat(id);
      setBoat(res.boat);
      setEditFields({
        title: res.boat.title ?? "",
        description: res.boat.description ?? "",
        boatTypeKey: res.boat.boatTypeKey ?? "",
        rulesText: res.boat.rulesText ?? "",
        checkInNotes: res.boat.checkInNotes ?? "",
        checkOutNotes: res.boat.checkOutNotes ?? "",
      });
      setPricingEdit(
        Object.fromEntries(
          res.boat.pricing.map((p) => [p.listingModelKey, { price: String(p.price), currency: p.currency }])
        )
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Yüklenemedi");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function changeStatus(newStatus: string, rejectionReason?: string) {
    if (!boat) return;
    setActionBusy(true);
    setEmailSentNote(null);
    try {
      const res = await api.updateBoatStatus(boat.id, { status: newStatus, rejectionReason });
      if (newStatus === "REJECTED") {
        setEmailSentNote(res.emailSent ? "E-posta kaptana gönderildi." : "E-posta gönderilemedi (SMTP yapılandırılmamış).");
      }
      await load();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "İşlem başarısız");
    } finally {
      setActionBusy(false);
    }
  }

  async function saveFields() {
    if (!boat) return;
    setEditBusy(true);
    try {
      await api.updateBoat(boat.id, editFields);
      await load();
      setEditMode(false);
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Kayıt başarısız");
    } finally {
      setEditBusy(false);
    }
  }

  async function savePricing(modelKey: string) {
    if (!boat) return;
    const entry = pricingEdit[modelKey];
    if (!entry) return;
    setPricingBusy(modelKey);
    try {
      await api.updateBoatPricing(boat.id, modelKey, { price: Number(entry.price), currency: entry.currency });
      await load();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Fiyat güncellenemedi");
    } finally {
      setPricingBusy(null);
    }
  }

  async function deletePhoto(photoId: string) {
    if (!boat) return;
    if (!window.confirm("Bu fotoğrafı silmek istediğinizden emin misiniz?")) return;
    setPhotoBusy(photoId);
    try {
      await api.deleteBoatPhoto(boat.id, photoId);
      await load();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Fotoğraf silinemedi");
    } finally {
      setPhotoBusy(null);
    }
  }

  async function setCover(photoId: string) {
    if (!boat) return;
    setPhotoBusy(photoId);
    try {
      await api.setBoatPhotoCover(boat.id, photoId);
      await load();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Kapak fotoğrafı ayarlanamadı");
    } finally {
      setPhotoBusy(null);
    }
  }

  async function movePhoto(photos: Photo[], idx: number, dir: -1 | 1) {
    if (!boat) return;
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= photos.length) return;
    const reordered = [...photos];
    const tmp = reordered[idx]!;
    reordered[idx] = reordered[swapIdx]!;
    reordered[swapIdx] = tmp;
    const payload = reordered.map((p, i) => ({ id: p.id, sortOrder: i }));
    setPhotoBusy("reorder");
    try {
      await api.reorderBoatPhotos(boat.id, payload);
      await load();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Sıralama güncellenemedi");
    } finally {
      setPhotoBusy(null);
    }
  }

  if (loading) return <div className="py-16 text-center text-gray-400">Yükleniyor…</div>;
  if (error) return <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">{error}</div>;
  if (!boat) return null;

  const locationCity = boat.featureValues.find((f) => f.featureKey === "city")?.value;
  const locationCountry = boat.featureValues.find((f) => f.featureKey === "country")?.value;
  const locationText = [locationCity, locationCountry].filter(Boolean).join(", ") || null;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <button type="button" onClick={() => router.back()} className="mb-2 text-sm text-gray-400 hover:text-gray-600">
            ← Geri
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{boat.title ?? "(isimsiz)"}</h1>
          {locationText && <p className="text-sm text-gray-500 mt-0.5">📍 {locationText}</p>}
          <p className="text-xs font-mono text-gray-300 mt-0.5">{boat.id}</p>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${STATUS_COLORS[boat.status] ?? "bg-gray-100 text-gray-600"}`}>
            {STATUS_LABELS[boat.status] ?? boat.status}
          </span>
          <button
            type="button"
            onClick={() => { setEditMode((e) => !e); setEmailSentNote(null); }}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium border ${editMode ? "bg-gray-100 border-gray-300 text-gray-700" : "bg-white border-blue-300 text-blue-600 hover:bg-blue-50"}`}
          >
            {editMode ? "İptal" : "Düzenle"}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Rezervasyon", value: boat.stats.reservationCount },
          { label: "Toplam Gelir", value: `€${boat.stats.totalRevenue.toLocaleString("tr-TR")}` },
          { label: "Değerlendirme", value: boat.stats.reviewCount },
          { label: "Ortalama Puan", value: boat.stats.averageRating != null ? `⭐ ${boat.stats.averageRating}` : "—" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-gray-200 bg-white p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">{s.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Status actions */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="mb-3 text-sm font-semibold text-gray-500 uppercase tracking-wide">Durum Yönetimi</h2>
        {boat.status === "REJECTED" && boat.rejectionReason && (
          <div className="mb-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <span className="font-medium">Red sebebi:</span> {boat.rejectionReason}
          </div>
        )}
        {emailSentNote && (
          <div className="mb-3 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700">
            {emailSentNote}
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          {boat.status === "PENDING_REVIEW" && (
            <>
              <button type="button" disabled={actionBusy} onClick={() => changeStatus("ACTIVE")}
                className="rounded-md bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50">
                Onayla
              </button>
              <button type="button" disabled={actionBusy}
                onClick={() => { const r = window.prompt("Reddetme sebebi:"); if (r !== null) changeStatus("REJECTED", r); }}
                className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50">
                Reddet
              </button>
            </>
          )}
          {boat.status === "ACTIVE" && (
            <button type="button" disabled={actionBusy} onClick={() => changeStatus("SUSPENDED")}
              className="rounded-md bg-orange-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-orange-700 disabled:opacity-50">
              Askıya Al
            </button>
          )}
          {boat.status === "SUSPENDED" && (
            <button type="button" disabled={actionBusy} onClick={() => changeStatus("ACTIVE")}
              className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
              Aktifleştir
            </button>
          )}
          {(boat.status === "ACTIVE" || boat.status === "SUSPENDED" || boat.status === "DRAFT") && (
            <button type="button" disabled={actionBusy}
              onClick={() => { const r = window.prompt("Reddetme sebebi:"); if (r !== null) changeStatus("REJECTED", r); }}
              className="rounded-md border border-red-300 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50">
              Reddet
            </button>
          )}
        </div>
      </div>

      {/* Basic info — view or edit */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">İlan Bilgileri</h2>
          {editMode && (
            <button type="button" disabled={editBusy} onClick={saveFields}
              className="rounded-md bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50">
              {editBusy ? "Kaydediliyor…" : "Kaydet"}
            </button>
          )}
        </div>
        {editMode ? (
          <div className="space-y-4">
            <Field label="Başlık">
              <input type="text" value={editFields.title} onChange={(e) => setEditFields((f) => ({ ...f, title: e.target.value }))}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </Field>
            <Field label="Açıklama">
              <textarea rows={5} value={editFields.description} onChange={(e) => setEditFields((f) => ({ ...f, description: e.target.value }))}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y" />
            </Field>
            <Field label="Tekne Tipi (key)">
              <input type="text" value={editFields.boatTypeKey} onChange={(e) => setEditFields((f) => ({ ...f, boatTypeKey: e.target.value }))}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </Field>
            <Field label="Kurallar">
              <textarea rows={3} value={editFields.rulesText} onChange={(e) => setEditFields((f) => ({ ...f, rulesText: e.target.value }))}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y" />
            </Field>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Check-in Notları">
                <textarea rows={3} value={editFields.checkInNotes} onChange={(e) => setEditFields((f) => ({ ...f, checkInNotes: e.target.value }))}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y" />
              </Field>
              <Field label="Check-out Notları">
                <textarea rows={3} value={editFields.checkOutNotes} onChange={(e) => setEditFields((f) => ({ ...f, checkOutNotes: e.target.value }))}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y" />
              </Field>
            </div>
          </div>
        ) : (
          <dl className="space-y-3 text-sm">
            <Row label="Tekne Tipi" value={boat.boatTypeKey ?? "—"} />
            <Row label="Oluşturulma" value={new Date(boat.createdAt).toLocaleDateString("tr-TR")} />
            {boat.submittedAt && <Row label="Gönderilme" value={new Date(boat.submittedAt).toLocaleDateString("tr-TR")} />}
            {boat.reviewedAt && <Row label="İnceleme" value={new Date(boat.reviewedAt).toLocaleDateString("tr-TR")} />}
            <Row label="Listeleme Modelleri" value={boat.listingModels.map((m) => m.listingModelKey).join(", ") || "—"} />
            {boat.description && (
              <div>
                <dt className="text-xs font-medium text-gray-500 mb-1">Açıklama</dt>
                <dd className="text-gray-700 whitespace-pre-wrap">{boat.description}</dd>
              </div>
            )}
            {boat.rulesText && (
              <div>
                <dt className="text-xs font-medium text-gray-500 mb-1">Kurallar</dt>
                <dd className="text-gray-700 whitespace-pre-wrap">{boat.rulesText}</dd>
              </div>
            )}
            {boat.checkInNotes && (
              <div>
                <dt className="text-xs font-medium text-gray-500 mb-1">Check-in Notları</dt>
                <dd className="text-gray-700 whitespace-pre-wrap">{boat.checkInNotes}</dd>
              </div>
            )}
            {boat.checkOutNotes && (
              <div>
                <dt className="text-xs font-medium text-gray-500 mb-1">Check-out Notları</dt>
                <dd className="text-gray-700 whitespace-pre-wrap">{boat.checkOutNotes}</dd>
              </div>
            )}
          </dl>
        )}
      </div>

      {/* Owner info */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="mb-3 text-sm font-semibold text-gray-500 uppercase tracking-wide">Kaptan Bilgileri</h2>
        <dl className="space-y-1.5 text-sm">
          <Row label="Ad Soyad" value={boat.owner.fullName ?? "—"} />
          <Row label="E-posta" value={boat.owner.email ?? "—"} />
          <Row label="Telefon" value={boat.owner.phone ?? "—"} />
          <Row label="ID" value={<span className="font-mono text-xs text-gray-400">{boat.owner.id.slice(0, 16)}…</span>} />
        </dl>
      </div>

      {/* Pricing */}
      {boat.pricing.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="mb-3 text-sm font-semibold text-gray-500 uppercase tracking-wide">Fiyatlandırma</h2>
          <div className="space-y-2">
            {boat.pricing.map((p) => {
              const entry = pricingEdit[p.listingModelKey] ?? { price: String(p.price), currency: p.currency };
              return (
                <div key={p.listingModelKey} className="flex items-center gap-3">
                  <span className="w-40 text-sm text-gray-600 shrink-0">{p.listingModelKey}</span>
                  {editMode ? (
                    <>
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        value={entry.price}
                        onChange={(e) => setPricingEdit((prev) => ({ ...prev, [p.listingModelKey]: { ...entry, price: e.target.value } }))}
                        className="w-28 rounded-lg border border-gray-200 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="text"
                        maxLength={3}
                        value={entry.currency}
                        onChange={(e) => setPricingEdit((prev) => ({ ...prev, [p.listingModelKey]: { ...entry, currency: e.target.value.toUpperCase() } }))}
                        className="w-16 rounded-lg border border-gray-200 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        type="button"
                        disabled={pricingBusy === p.listingModelKey}
                        onClick={() => savePricing(p.listingModelKey)}
                        className="rounded-md bg-blue-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                      >
                        {pricingBusy === p.listingModelKey ? "…" : "Kaydet"}
                      </button>
                    </>
                  ) : (
                    <span className="font-semibold text-gray-900">{p.price} {p.currency}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Photos */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="mb-3 text-sm font-semibold text-gray-500 uppercase tracking-wide">
          Fotoğraflar ({boat.photos.length})
        </h2>
        {boat.photos.length === 0 ? (
          <p className="text-sm text-gray-400">Fotoğraf yüklenmemiş.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {boat.photos.map((photo, idx) => (
              <div key={photo.id} className="relative group rounded-lg overflow-hidden border border-gray-200">
                {photo.publicUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={photo.publicUrl} alt={photo.altText ?? ""} className="h-36 w-full object-cover" />
                ) : (
                  <div className="h-36 bg-gray-100 flex items-center justify-center text-gray-400 text-xs">Görsel yok</div>
                )}
                {photo.isCover && (
                  <span className="absolute top-1 left-1 rounded bg-blue-600 px-1.5 py-0.5 text-xs text-white font-medium">Kapak</span>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5">
                  {!photo.isCover && (
                    <button
                      type="button"
                      disabled={photoBusy === photo.id}
                      onClick={() => setCover(photo.id)}
                      className="rounded-md bg-blue-600 px-2 py-1 text-xs text-white font-medium hover:bg-blue-700 disabled:opacity-50"
                    >
                      Kapak Yap
                    </button>
                  )}
                  <div className="flex gap-1">
                    <button
                      type="button"
                      disabled={photoBusy === "reorder" || idx === 0}
                      onClick={() => movePhoto(boat.photos, idx, -1)}
                      className="rounded-md bg-white/90 px-2 py-1 text-xs text-gray-800 font-medium hover:bg-white disabled:opacity-40"
                    >
                      ←
                    </button>
                    <button
                      type="button"
                      disabled={photoBusy === "reorder" || idx === boat.photos.length - 1}
                      onClick={() => movePhoto(boat.photos, idx, 1)}
                      className="rounded-md bg-white/90 px-2 py-1 text-xs text-gray-800 font-medium hover:bg-white disabled:opacity-40"
                    >
                      →
                    </button>
                  </div>
                  <button
                    type="button"
                    disabled={photoBusy === photo.id}
                    onClick={() => deletePhoto(photo.id)}
                    className="rounded-md bg-red-600 px-2 py-1 text-xs text-white font-medium hover:bg-red-700 disabled:opacity-50"
                  >
                    Sil
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Documents */}
      {boat.documents.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="mb-3 text-sm font-semibold text-gray-500 uppercase tracking-wide">
            Belgeler ({boat.documents.length})
          </h2>
          <div className="space-y-2">
            {boat.documents.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between text-sm">
                <span className="text-gray-700">{doc.documentTypeKey}</span>
                <div className="flex items-center gap-2">
                  {doc.publicUrl && (
                    <a href={doc.publicUrl} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline">
                      Görüntüle
                    </a>
                  )}
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    doc.status === "APPROVED" ? "bg-green-100 text-green-700"
                      : doc.status === "REJECTED" ? "bg-red-100 text-red-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}>
                    {doc.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-gray-500 shrink-0">{label}</dt>
      <dd className="text-gray-900 text-right">{value}</dd>
    </div>
  );
}
