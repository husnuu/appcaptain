"use client";

import {
  Alert,
  FontAwesomeIcon,
  faCalendarDays,
  faClock,
  faMagnifyingGlass,
  faPenToSquare,
  faPercent,
  faPlus,
  faShip,
  faSpinner,
  faStar,
  faTag,
  faTrash,
  faXmark,
} from "@getyourboat/ui";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  DiscountDayFilter,
  DiscountTarget,
  DiscountType,
  DISCOUNT_DAY_FILTER_LABELS,
  DISCOUNT_TARGET_LABELS,
  formatDiscountValue,
  type DiscountDTO,
} from "@getyourboat/shared";
import { api, ApiError } from "../../lib/api";
import { getAdminToken } from "../../lib/auth";

const TARGET_FILTERS: (DiscountTarget | "ALL")[] = [
  "ALL",
  DiscountTarget.BOAT,
  DiscountTarget.EXPERIENCE,
  DiscountTarget.ALL_BOATS,
  DiscountTarget.ALL_EXPERIENCES,
];

function formatDate(value: string | Date | null): string {
  if (!value) return "";
  const d = typeof value === "string" ? new Date(value) : value;
  return d.toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "numeric" });
}

export default function DiscountsPage() {
  const router = useRouter();
  const [discounts, setDiscounts] = useState<DiscountDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterTarget, setFilterTarget] = useState<DiscountTarget | "ALL">("ALL");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<DiscountDTO | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DiscountDTO | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (!getAdminToken()) {
      router.replace("/login");
      return;
    }
    void load();
  }, [router]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const { discounts } = await api.listDiscounts({ limit: 100 });
      setDiscounts(discounts);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "İndirimler yüklenemedi");
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return discounts.filter((d) => {
      if (filterTarget !== "ALL" && d.target !== filterTarget) return false;
      if (!q) return true;
      return (
        d.name.toLowerCase().includes(q) ||
        (d.description ?? "").toLowerCase().includes(q) ||
        (d.boat?.name ?? "").toLowerCase().includes(q) ||
        (d.experience?.name ?? "").toLowerCase().includes(q)
      );
    });
  }, [discounts, filterTarget, search]);

  const stats = useMemo(() => {
    const active = discounts.filter((d) => d.isActive).length;
    const boat = discounts.filter(
      (d) => d.target === DiscountTarget.BOAT || d.target === DiscountTarget.ALL_BOATS
    ).length;
    const experience = discounts.filter(
      (d) => d.target === DiscountTarget.EXPERIENCE || d.target === DiscountTarget.ALL_EXPERIENCES
    ).length;
    const uses = discounts.reduce((sum, d) => sum + d.usedCount, 0);
    return { active, boat, experience, uses };
  }, [discounts]);

  async function toggle(id: string) {
    setBusyId(id);
    try {
      const { discount } = await api.toggleDiscount(id);
      setDiscounts((list) => list.map((d) => (d.id === id ? discount : d)));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Durum güncellenemedi");
    } finally {
      setBusyId(null);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setBusyId(deleteTarget.id);
    try {
      await api.deleteDiscount(deleteTarget.id);
      setDiscounts((list) => list.filter((d) => d.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "İndirim silinemedi");
    } finally {
      setBusyId(null);
    }
  }

  function openCreate() {
    setEditing(null);
    setShowModal(true);
  }

  function openEdit(discount: DiscountDTO) {
    setEditing(discount);
    setShowModal(true);
  }

  const statCards = [
    { label: "Aktif İndirimler", value: stats.active, icon: faTag, color: "#16a34a", bg: "#f0fdf4" },
    { label: "Tekne İndirimleri", value: stats.boat, icon: faShip, color: "#2563eb", bg: "#eff6ff" },
    { label: "Deneyim İnd.", value: stats.experience, icon: faStar, color: "#9333ea", bg: "#faf5ff" },
    { label: "Toplam Kullanım", value: stats.uses, icon: faPercent, color: "#0097A7", bg: "#E0F7FA" },
  ];

  return (
    <div className="mx-auto max-w-6xl p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">İndirim Yönetimi</h1>
          <p className="mt-1 text-sm text-gray-500">
            Tekne ve deneyimlere tarih/saat bazlı indirim tanımla
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/">
            <button className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:border-gray-300">
              Ana sayfa
            </button>
          </Link>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 rounded-xl bg-[#0097A7] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#00838F]"
          >
            <FontAwesomeIcon icon={faPlus} className="text-[14px]" />
            Yeni İndirim
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        {statCards.map((stat) => (
          <div
            key={stat.label}
            className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-5"
          >
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl"
              style={{ backgroundColor: stat.bg }}
            >
              <FontAwesomeIcon icon={stat.icon} style={{ color: stat.color }} className="text-[18px]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-xs text-gray-500">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {error ? <Alert className="mb-4">{error}</Alert> : null}

      {/* Filters */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="relative max-w-xs flex-1">
          <FontAwesomeIcon
            icon={faMagnifyingGlass}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[14px] text-gray-400"
          />
          <input
            placeholder="İndirim ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-gray-200 py-2.5 pl-9 pr-4 text-sm focus:border-[#0097A7] focus:outline-none"
          />
        </div>
        {TARGET_FILTERS.map((t) => (
          <button
            key={t}
            onClick={() => setFilterTarget(t)}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
              filterTarget === t
                ? "bg-[#0097A7] text-white"
                : "border border-gray-200 bg-white text-gray-600 hover:border-[#0097A7]"
            }`}
          >
            {t === "ALL" ? "Tümü" : DISCOUNT_TARGET_LABELS[t]}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center rounded-2xl border border-gray-100 bg-white py-20 text-gray-400">
          <FontAwesomeIcon icon={faSpinner} spin className="mr-2" /> Yükleniyor…
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState onCreate={openCreate} hasAny={discounts.length > 0} />
      ) : (
        <DiscountTable
          discounts={filtered}
          busyId={busyId}
          onToggle={toggle}
          onEdit={openEdit}
          onDelete={setDeleteTarget}
        />
      )}

      {showModal && (
        <DiscountModal
          editing={editing}
          onClose={() => setShowModal(false)}
          onSaved={async () => {
            setShowModal(false);
            await load();
          }}
        />
      )}

      {deleteTarget && (
        <ConfirmDelete
          discount={deleteTarget}
          busy={busyId === deleteTarget.id}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  );
}

function EmptyState({ onCreate, hasAny }: { onCreate: () => void; hasAny: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white py-20 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#E0F7FA]">
        <FontAwesomeIcon icon={faTag} className="text-2xl text-[#0097A7]" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-gray-900">
        {hasAny ? "Sonuç bulunamadı" : "Henüz indirim yok"}
      </h3>
      <p className="mt-1 max-w-sm text-sm text-gray-500">
        {hasAny
          ? "Filtre veya aramanı değiştirmeyi dene."
          : "Tekne veya deneyimlere özel indirim tanımlayarak başla."}
      </p>
      {!hasAny && (
        <button
          onClick={onCreate}
          className="mt-6 flex items-center gap-2 rounded-xl bg-[#0097A7] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#00838F]"
        >
          <FontAwesomeIcon icon={faPlus} className="text-[14px]" />
          Yeni İndirim
        </button>
      )}
    </div>
  );
}

function DiscountTable({
  discounts,
  busyId,
  onToggle,
  onEdit,
  onDelete,
}: {
  discounts: DiscountDTO[];
  busyId: string | null;
  onToggle: (id: string) => void;
  onEdit: (d: DiscountDTO) => void;
  onDelete: (d: DiscountDTO) => void;
}) {
  const th =
    "text-left text-xs font-semibold uppercase tracking-wider text-gray-500 px-4 py-4";
  return (
    <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-100">
            <th className={`${th} px-6`}>İndirim Adı</th>
            <th className={th}>Hedef</th>
            <th className={th}>Değer</th>
            <th className={th}>Tarih Aralığı</th>
            <th className={th}>Saat</th>
            <th className={th}>Kullanım</th>
            <th className={th}>Durum</th>
            <th className="px-4 py-4" />
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {discounts.map((d) => {
            const isBoat = d.target === DiscountTarget.BOAT || d.target === DiscountTarget.ALL_BOATS;
            return (
              <tr key={d.id} className="transition-colors hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ${
                        isBoat ? "bg-blue-50" : "bg-purple-50"
                      }`}
                    >
                      <FontAwesomeIcon
                        icon={isBoat ? faShip : faStar}
                        className={`text-[14px] ${isBoat ? "text-blue-600" : "text-purple-600"}`}
                      />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{d.name}</p>
                      {d.description && (
                        <p className="max-w-[200px] truncate text-xs text-gray-400">
                          {d.description}
                        </p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <span className="text-xs font-medium text-gray-700">
                    {DISCOUNT_TARGET_LABELS[d.target]}
                  </span>
                  {d.boat && <p className="mt-0.5 text-xs text-[#0097A7]">{d.boat.name}</p>}
                  {d.experience && (
                    <p className="mt-0.5 text-xs text-purple-600">{d.experience.name}</p>
                  )}
                </td>
                <td className="px-4 py-4">
                  <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-3 py-1 text-sm font-bold text-green-700">
                    {formatDiscountValue(d.type, d.value)}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-1.5 text-xs text-gray-600">
                    <FontAwesomeIcon icon={faCalendarDays} className="text-[12px] text-gray-400" />
                    {d.startDate && d.endDate ? (
                      `${formatDate(d.startDate)} – ${formatDate(d.endDate)}`
                    ) : (
                      <span className="text-gray-400">Süresiz</span>
                    )}
                  </div>
                  {d.dayFilter && d.dayFilter !== DiscountDayFilter.ALL && (
                    <span className="mt-0.5 block text-[10px] text-gray-400">
                      {DISCOUNT_DAY_FILTER_LABELS[d.dayFilter]}
                    </span>
                  )}
                </td>
                <td className="px-4 py-4">
                  {d.timeStart && d.timeEnd ? (
                    <div className="flex items-center gap-1.5 text-xs text-gray-600">
                      <FontAwesomeIcon icon={faClock} className="text-[12px] text-gray-400" />
                      {d.timeStart} – {d.timeEnd}
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400">Tüm gün</span>
                  )}
                </td>
                <td className="px-4 py-4">
                  <span className="text-sm font-medium text-gray-700">
                    {d.usedCount}
                    {d.maxUses != null && (
                      <span className="font-normal text-gray-400"> / {d.maxUses}</span>
                    )}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <button
                    onClick={() => onToggle(d.id)}
                    disabled={busyId === d.id}
                    aria-label={d.isActive ? "Pasifleştir" : "Aktifleştir"}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      d.isActive ? "bg-[#0097A7]" : "bg-gray-300"
                    } disabled:opacity-50`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                        d.isActive ? "translate-x-5" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onEdit(d)}
                      className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100"
                      aria-label="Düzenle"
                    >
                      <FontAwesomeIcon icon={faPenToSquare} className="text-[15px]" />
                    </button>
                    <button
                      onClick={() => onDelete(d)}
                      className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
                      aria-label="Sil"
                    >
                      <FontAwesomeIcon icon={faTrash} className="text-[15px]" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function ConfirmDelete({
  discount,
  busy,
  onCancel,
  onConfirm,
}: {
  discount: DiscountDTO;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <h2 className="text-lg font-bold text-gray-900">İndirimi sil</h2>
        <p className="mt-2 text-sm text-gray-500">
          <span className="font-semibold text-gray-700">{discount.name}</span> indirimini kalıcı
          olarak silmek istediğine emin misin? Bu işlem geri alınamaz.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="rounded-xl border-2 border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:border-gray-300"
          >
            İptal
          </button>
          <button
            onClick={onConfirm}
            disabled={busy}
            className="rounded-xl bg-red-500 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-600 disabled:opacity-50"
          >
            {busy ? "Siliniyor…" : "Sil"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------ Create / Edit modal ------------------------------ */

interface FormState {
  name: string;
  description: string;
  type: DiscountType;
  value: string;
  target: DiscountTarget;
  boatId: string;
  experienceId: string;
  startDate: string;
  endDate: string;
  timeStart: string;
  timeEnd: string;
  dayFilter: DiscountDayFilter;
  maxUses: string;
  isActive: boolean;
}

function isoToDateInput(value: string | null): string {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
}

function initialForm(editing: DiscountDTO | null): FormState {
  return {
    name: editing?.name ?? "",
    description: editing?.description ?? "",
    type: editing?.type ?? DiscountType.PERCENTAGE,
    value: editing ? String(editing.value) : "",
    target: editing?.target ?? DiscountTarget.BOAT,
    boatId: editing?.boatId ?? "",
    experienceId: editing?.experienceId ?? "",
    startDate: isoToDateInput(editing?.startDate ?? null),
    endDate: isoToDateInput(editing?.endDate ?? null),
    timeStart: editing?.timeStart ?? "",
    timeEnd: editing?.timeEnd ?? "",
    dayFilter: editing?.dayFilter ?? DiscountDayFilter.ALL,
    maxUses: editing?.maxUses != null ? String(editing.maxUses) : "",
    isActive: editing?.isActive ?? true,
  };
}

const TARGET_OPTIONS: {
  value: DiscountTarget;
  label: string;
  icon: string;
  desc: string;
}[] = [
  { value: DiscountTarget.BOAT, label: "Belirli Tekne", icon: "⛵", desc: "Tek bir teknede geçerli" },
  { value: DiscountTarget.EXPERIENCE, label: "Belirli Deneyim", icon: "⭐", desc: "Tek bir deneyimde geçerli" },
  { value: DiscountTarget.ALL_BOATS, label: "Tüm Tekneler", icon: "🚢", desc: "Her teknede uygulanır" },
  { value: DiscountTarget.ALL_EXPERIENCES, label: "Tüm Deneyimler", icon: "🎯", desc: "Her deneyimde uygulanır" },
];

function DiscountModal({
  editing,
  onClose,
  onSaved,
}: {
  editing: DiscountDTO | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<FormState>(() => initialForm(editing));
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof FormState>(key: K, val: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: val }));

  const inputCls =
    "w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-[#0097A7] focus:outline-none";

  function validate(): string | null {
    if (form.name.trim().length < 2) return "İndirim adı en az 2 karakter olmalı";
    const value = Number(form.value);
    if (!value || value <= 0) return "Geçerli bir indirim değeri gir";
    if (form.type === DiscountType.PERCENTAGE && value > 100)
      return "Yüzde 100'den fazla olamaz";
    if (form.target === DiscountTarget.BOAT && !form.boatId)
      return "Tekne indirimi için tekne seçmelisin";
    if (form.target === DiscountTarget.EXPERIENCE && !form.experienceId)
      return "Deneyim indirimi için deneyim seçmelisin";
    if (form.startDate && form.endDate && form.endDate < form.startDate)
      return "Bitiş tarihi başlangıçtan önce olamaz";
    if (form.timeStart && form.timeEnd && form.timeEnd <= form.timeStart)
      return "Bitiş saati başlangıçtan sonra olmalı";
    return null;
  }

  async function handleSubmit() {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setBusy(true);
    setError(null);
    const payload = {
      name: form.name.trim(),
      type: form.type,
      value: Number(form.value),
      target: form.target,
      dayFilter: form.dayFilter,
      isActive: form.isActive,
      ...(form.description.trim() ? { description: form.description.trim() } : {}),
      ...(form.target === DiscountTarget.BOAT ? { boatId: form.boatId } : {}),
      ...(form.target === DiscountTarget.EXPERIENCE ? { experienceId: form.experienceId } : {}),
      ...(form.startDate
        ? { startDate: new Date(`${form.startDate}T00:00:00.000Z`).toISOString() }
        : {}),
      ...(form.endDate
        ? { endDate: new Date(`${form.endDate}T23:59:59.000Z`).toISOString() }
        : {}),
      ...(form.timeStart ? { timeStart: form.timeStart } : {}),
      ...(form.timeEnd ? { timeEnd: form.timeEnd } : {}),
      ...(form.maxUses ? { maxUses: Number(form.maxUses) } : {}),
    };
    try {
      if (editing) {
        await api.updateDiscount(editing.id, payload);
      } else {
        await api.createDiscount(payload);
      }
      onSaved();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "İndirim kaydedilemedi");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 p-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {editing ? "İndirimi Düzenle" : "Yeni İndirim Tanımla"}
            </h2>
            <p className="mt-0.5 text-sm text-gray-500">
              Tekne veya deneyime özel indirim {editing ? "güncelle" : "ekle"}
            </p>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 hover:bg-gray-100" aria-label="Kapat">
            <FontAwesomeIcon icon={faXmark} className="text-[18px] text-gray-500" />
          </button>
        </div>

        <div className="space-y-6 p-6">
          {error ? <Alert>{error}</Alert> : null}

          {/* Name */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gray-700">
              İndirim Adı <span className="text-red-500">*</span>
            </label>
            <input
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Örn: Yaz Sezonu İndirimi, Sabah Turu"
              className={inputCls}
            />
          </div>

          {/* Description */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gray-700">
              Açıklama <span className="ml-1 text-xs font-normal text-gray-400">(opsiyonel)</span>
            </label>
            <input
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Dahili not"
              className={inputCls}
            />
          </div>

          {/* Target */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">
              İndirim Hedefi <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              {TARGET_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => set("target", opt.value)}
                  className={`flex items-start gap-3 rounded-xl border-2 p-4 text-left transition-all ${
                    form.target === opt.value
                      ? "border-[#0097A7] bg-[#E0F7FA]"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <span className="text-xl">{opt.icon}</span>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{opt.label}</p>
                    <p className="text-xs text-gray-500">{opt.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Boat / Experience selector */}
          {form.target === DiscountTarget.BOAT && (
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                Tekne Seç <span className="text-red-500">*</span>
              </label>
              <OptionSelector
                kind="boat"
                value={form.boatId}
                onChange={(id) => set("boatId", id)}
              />
            </div>
          )}
          {form.target === DiscountTarget.EXPERIENCE && (
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                Deneyim Seç <span className="text-red-500">*</span>
              </label>
              <OptionSelector
                kind="experience"
                value={form.experienceId}
                onChange={(id) => set("experienceId", id)}
              />
            </div>
          )}

          {/* Type + value */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">
              İndirim Türü ve Değeri <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-3">
              <div className="flex rounded-xl bg-gray-100 p-1">
                {[
                  { value: DiscountType.PERCENTAGE, label: "%" },
                  { value: DiscountType.FIXED, label: "₺" },
                ].map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => set("type", t.value)}
                    className={`rounded-lg px-4 py-2 text-sm font-bold transition-colors ${
                      form.type === t.value
                        ? "bg-white text-[#0097A7] shadow"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <div className="relative flex-1">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-500">
                  {form.type === DiscountType.PERCENTAGE ? "%" : "₺"}
                </span>
                <input
                  type="number"
                  min={1}
                  max={form.type === DiscountType.PERCENTAGE ? 100 : undefined}
                  value={form.value}
                  onChange={(e) => set("value", e.target.value)}
                  placeholder={form.type === DiscountType.PERCENTAGE ? "20" : "500"}
                  className={`${inputCls} pl-9`}
                />
              </div>
            </div>
            {form.type === DiscountType.PERCENTAGE && Number(form.value) > 0 && (
              <p className="mt-1.5 text-xs font-medium text-[#0097A7]">
                Fiyat üzerinden %{form.value} indirim uygulanacak
              </p>
            )}
          </div>

          {/* Date range */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">
              Tarih Aralığı
              <span className="ml-2 text-xs font-normal text-gray-400">(boş = süresiz)</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="mb-1 text-xs text-gray-500">Başlangıç</p>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => set("startDate", e.target.value)}
                  className={inputCls}
                />
              </div>
              <div>
                <p className="mb-1 text-xs text-gray-500">Bitiş</p>
                <input
                  type="date"
                  value={form.endDate}
                  min={form.startDate || undefined}
                  onChange={(e) => set("endDate", e.target.value)}
                  className={inputCls}
                />
              </div>
            </div>
          </div>

          {/* Time range */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">
              Saat Aralığı
              <span className="ml-2 text-xs font-normal text-gray-400">(boş = tüm gün)</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="mb-1 text-xs text-gray-500">Başlangıç Saati</p>
                <input
                  type="time"
                  value={form.timeStart}
                  onChange={(e) => set("timeStart", e.target.value)}
                  className={inputCls}
                />
              </div>
              <div>
                <p className="mb-1 text-xs text-gray-500">Bitiş Saati</p>
                <input
                  type="time"
                  value={form.timeEnd}
                  onChange={(e) => set("timeEnd", e.target.value)}
                  className={inputCls}
                />
              </div>
            </div>
            <p className="mt-1.5 text-xs text-gray-400">
              Örn: 09:00–12:00 → Sabah rezervasyonlarına indirim
            </p>
          </div>

          {/* Day filter */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">Gün Filtresi</label>
            <div className="flex gap-3">
              {Object.values(DiscountDayFilter).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => set("dayFilter", d)}
                  className={`rounded-xl border-2 px-4 py-2 text-sm font-medium transition-colors ${
                    form.dayFilter === d
                      ? "border-[#0097A7] bg-[#E0F7FA] text-[#006064]"
                      : "border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  {DISCOUNT_DAY_FILTER_LABELS[d]}
                </button>
              ))}
            </div>
          </div>

          {/* Max uses */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gray-700">
              Maksimum Kullanım
              <span className="ml-2 text-xs font-normal text-gray-400">(boş = sınırsız)</span>
            </label>
            <input
              type="number"
              min={1}
              value={form.maxUses}
              onChange={(e) => set("maxUses", e.target.value)}
              placeholder="Örn: 100"
              className={`${inputCls} w-40`}
            />
          </div>

          {/* Active toggle */}
          <label className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => set("isActive", !form.isActive)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                form.isActive ? "bg-[#0097A7]" : "bg-gray-300"
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                  form.isActive ? "translate-x-5" : "translate-x-0.5"
                }`}
              />
            </button>
            <span className="text-sm font-medium text-gray-700">
              {form.isActive ? "Aktif" : "Pasif"}
            </span>
          </label>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border-2 border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:border-gray-300"
            >
              İptal
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={busy}
              className="rounded-xl bg-[#0097A7] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#00838F] disabled:opacity-50"
            >
              {busy ? "Kaydediliyor…" : editing ? "Değişiklikleri Kaydet" : "İndirimi Oluştur"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function OptionSelector({
  kind,
  value,
  onChange,
}: {
  kind: "boat" | "experience";
  value: string;
  onChange: (id: string) => void;
}) {
  const [options, setOptions] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const fetcher =
      kind === "boat" ? api.listDiscountBoatOptions() : api.listDiscountExperienceOptions();
    fetcher
      .then(({ items }) => {
        if (!cancelled) setOptions(items);
      })
      .catch((err) => {
        if (!cancelled)
          setError(err instanceof ApiError ? err.message : "Liste yüklenemedi");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [kind]);

  if (loading) {
    return <p className="text-sm text-gray-400">Yükleniyor…</p>;
  }
  if (error) {
    return <p className="text-sm text-red-500">{error}</p>;
  }
  if (options.length === 0) {
    return (
      <p className="text-sm text-gray-400">
        {kind === "boat" ? "Kayıtlı tekne bulunamadı." : "Kayıtlı deneyim bulunamadı."}
      </p>
    );
  }

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-[#0097A7] focus:outline-none"
    >
      <option value="">Seç…</option>
      {options.map((o) => (
        <option key={o.id} value={o.id}>
          {o.name}
        </option>
      ))}
    </select>
  );
}
