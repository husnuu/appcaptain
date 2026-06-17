"use client";

import { ChevronRight, FileText, ImageIcon, Wrench } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Card,
  EmptyState,
  Skeleton,
  Tabs,
  type ChecklistItem,
  type TabItem,
} from "@getyourboat/ui";
import { AppShell } from "../../../../components/layout/AppShell";
import { FormGrid } from "../../../../components/boats/edit/FormGrid";
import { ListingScorePanel } from "../../../../components/boats/edit/ListingScorePanel";
import { useEditBoat } from "../../../../lib/api/boats";
import {
  EDIT_BOAT_TABS,
  descriptionFields,
  featureFields,
  locationFields,
  type EditBoatFieldDef,
  type EditBoatTabId,
} from "../../../../lib/mock/boat.mock";

const FIELDS_BY_TAB: Partial<Record<EditBoatTabId, EditBoatFieldDef[]>> = {
  features: featureFields,
  location: locationFields,
  description: descriptionFields,
};

function EditBoatContent() {
  const params = useParams<{ id: string }>();
  const boatId = params.id;
  const { data, isLoading, isError } = useEditBoat(boatId);

  const [activeTab, setActiveTab] = useState<EditBoatTabId>("features");
  const [values, setValues] = useState<Record<string, string>>({});

  useEffect(() => {
    if (data) setValues(data.values);
  }, [data]);

  // A tab with required fields is "done" when they're all filled; tabs without
  // a form fall back to the server-provided completion flag (mock).
  const isTabComplete = useMemo(() => {
    return (tab: EditBoatTabId): boolean => {
      const fields = FIELDS_BY_TAB[tab] ?? [];
      const required = fields.filter((f) => f.required);
      if (required.length > 0) {
        return required.every((f) => (values[f.key] ?? "").trim().length > 0);
      }
      return data?.completedTabs.includes(tab) ?? false;
    };
  }, [values, data]);

  const checklist: ChecklistItem[] = EDIT_BOAT_TABS.map((t) => ({
    id: t.id,
    label: t.label,
    done: isTabComplete(t.id),
  }));
  const percent = (checklist.filter((c) => c.done).length / checklist.length) * 100;

  const tabItems: TabItem[] = EDIT_BOAT_TABS.map((t) => ({ id: t.id, label: t.label }));
  const activeTip = EDIT_BOAT_TABS.find((t) => t.id === activeTab)?.tip ?? {
    title: "",
    description: "",
  };

  function onFieldChange(key: string, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  if (isError) {
    return <Alert variant="danger">Tekne bilgileri yüklenemedi. Lütfen tekrar dene.</Alert>;
  }

  return (
    <>
      <nav className="mb-2 flex items-center gap-1 text-body-sm text-gray-500" aria-label="breadcrumb">
        <span>My Boats</span>
        <ChevronRight className="h-4 w-4" aria-hidden />
        <span className="font-medium text-ink">Edit Boat</span>
      </nav>
      <h1 className="mb-6 text-heading text-ink">Edit Boat</h1>

      <div className="mb-6">
        <Tabs items={tabItems} activeId={activeTab} onChange={(id) => setActiveTab(id as EditBoatTabId)} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <Card className="p-4 sm:p-6">
          <h2 className="mb-4 text-subheading text-ink">Boat Details</h2>
          {isLoading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          ) : FIELDS_BY_TAB[activeTab] ? (
            <FormGrid
              fields={FIELDS_BY_TAB[activeTab] as EditBoatFieldDef[]}
              values={values}
              onChange={onFieldChange}
            />
          ) : activeTab === "amenities" ? (
            <EmptyState
              icon={Wrench}
              title="Donanım seçimi"
              description="Bu sekmede teknenin donanımlarını işaretleyebileceksin (yakında)."
            />
          ) : activeTab === "images" ? (
            <EmptyState
              icon={ImageIcon}
              title="Fotoğraf yükleme"
              description="Kapak ve galeri fotoğraflarını buradan yükleyebileceksin (yakında)."
            />
          ) : (
            <EmptyState
              icon={FileText}
              title="Belge yükleme"
              description="Zorunlu belgeleri buradan yükleyip onaya gönderebileceksin (yakında)."
            />
          )}
        </Card>

        <ListingScorePanel
          percent={percent}
          items={checklist}
          activeId={activeTab}
          onSelect={(id) => setActiveTab(id as EditBoatTabId)}
          tip={activeTip}
        />
      </div>
    </>
  );
}

export default function EditBoatPage() {
  return (
    <AppShell active="boats">
      <EditBoatContent />
    </AppShell>
  );
}
