"use client";

import {
  CABIN_TYPE_LABELS,
  CabinType,
  WC_TYPE_LABELS,
  WcType,
  type CabinConfigurationDTO,
  type CabinConfigurationInput,
} from "@getyourboat/shared";
import { Button, Modal, cn } from "@getyourboat/ui";
import { useState } from "react";
import { Field, Select } from "../ui";
import { SectionTitle, TileCheck, tileClass } from "./focus";

const CABIN_TYPES = Object.values(CabinType);

export function CabinConfigurationSection({
  configurations,
  onChange,
}: {
  configurations: CabinConfigurationInput[];
  onChange: (next: CabinConfigurationInput[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [draftType, setDraftType] = useState<CabinType | "">("");
  const [draftWc, setDraftWc] = useState<WcType | "">("");
  const [draftQty, setDraftQty] = useState(1);
  const hasCabins = configurations.length > 0;

  function resetDraft() {
    setDraftType("");
    setDraftWc("");
    setDraftQty(1);
  }

  function saveDraft() {
    if (!draftType) return;
    onChange([
      ...configurations,
      {
        cabinType: draftType,
        wcType: draftWc || null,
        quantity: draftQty,
      },
    ]);
    resetDraft();
    setOpen(false);
  }

  function removeAt(index: number) {
    onChange(configurations.filter((_, i) => i !== index));
  }

  return (
    <section className="space-y-4 border-t border-gray-200 pt-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <SectionTitle hint="Kabin tipi, WC detayı ve adet ekleyin.">Kabin bilgisi</SectionTitle>
        <Button type="button" size="sm" variant="outline" onClick={() => setOpen(true)}>
          Kabin & WC ekle
        </Button>
      </div>

      {configurations.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-gray-300 px-4 py-5 text-center text-[14px] text-gray-500">
          Henüz kabin konfigürasyonu eklenmedi.
        </p>
      ) : (
        <ul className="space-y-2">
          {configurations.map((c, index) => (
            <li
              key={`${c.cabinType}-${index}`}
              className="flex items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3.5"
            >
              <div>
                <p className="text-[15px] font-semibold text-ink">
                  {CABIN_TYPE_LABELS[c.cabinType]} × {c.quantity}
                </p>
                {c.wcType ? (
                  <p className="text-caption text-gray-500">{WC_TYPE_LABELS[c.wcType]}</p>
                ) : null}
              </div>
              <button
                type="button"
                className="text-[13px] font-semibold text-danger-600 hover:underline"
                onClick={() => removeAt(index)}
              >
                Kaldır
              </button>
            </li>
          ))}
        </ul>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Kabin & WC ekle">
        <div className="space-y-5">
          <div>
            <p className="mb-3 text-body-sm font-medium text-ink">Kabin tipi</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {CABIN_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setDraftType(type)}
                  role="radio"
                  aria-checked={draftType === type}
                  className={cn(tileClass(draftType === type), "py-3 pl-3.5 pr-8 text-[13.5px] font-semibold")}
                >
                  {CABIN_TYPE_LABELS[type]}
                  <TileCheck on={draftType === type} />
                </button>
              ))}
            </div>
          </div>

          <Field label="WC & Shower">
            <Select
              value={draftWc}
              onChange={(e) => setDraftWc(e.target.value as WcType | "")}
            >
              <option value="">Seçiniz…</option>
              <option value={WcType.EXTERNAL}>{WC_TYPE_LABELS[WcType.EXTERNAL]}</option>
              <option
                value={WcType.EN_SUITE}
                disabled={!hasCabins && !draftType}
              >
                {WC_TYPE_LABELS[WcType.EN_SUITE]}
                {!hasCabins && !draftType ? " (önce kabin seçin)" : ""}
              </option>
            </Select>
          </Field>

          <Field label="Bu konfigürasyondan kaç adet?">
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Azalt"
                disabled={draftQty <= 1}
                onClick={() => setDraftQty((q) => Math.max(1, q - 1))}
                className="grid h-10 w-10 place-items-center rounded-full border border-gray-300 text-[18px] text-ink transition hover:border-ink disabled:cursor-not-allowed disabled:border-gray-200 disabled:text-gray-300"
              >
                −
              </button>
              <span className="min-w-[2.5rem] text-center text-[17px] font-semibold tabular-nums">
                {draftQty}
              </span>
              <button
                type="button"
                aria-label="Arttır"
                onClick={() => setDraftQty((q) => q + 1)}
                className="grid h-10 w-10 place-items-center rounded-full border border-gray-300 text-[18px] text-ink transition hover:border-ink"
              >
                +
              </button>
            </div>
          </Field>

          <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              İptal
            </Button>
            <Button type="button" disabled={!draftType} onClick={saveDraft}>
              Kaydet
            </Button>
          </div>
        </div>
      </Modal>
    </section>
  );
}

export function toCabinInputs(
  rows: CabinConfigurationDTO[] | undefined
): CabinConfigurationInput[] {
  return (rows ?? []).map((c) => ({
    cabinType: c.cabinType,
    wcType: c.wcType,
    quantity: c.quantity,
  }));
}
