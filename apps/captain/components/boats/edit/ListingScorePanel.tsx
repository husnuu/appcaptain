"use client";

import { Info } from "lucide-react";
import {
  Banner,
  Card,
  Checklist,
  ProgressBar,
  type ChecklistItem,
} from "@getyourboat/ui";

interface ListingScorePanelProps {
  percent: number;
  items: ChecklistItem[];
  activeId: string;
  onSelect: (id: string) => void;
  tip: { title: string; description: string };
}

export function ListingScorePanel({
  percent,
  items,
  activeId,
  onSelect,
  tip,
}: ListingScorePanelProps) {
  return (
    <div className="space-y-4 lg:sticky lg:top-20">
      <Card className="p-4 sm:p-6">
        <h3 className="text-subheading text-ink">Listing Score</h3>
        <p className="mt-1 text-body-sm text-gray-500">
          İlanını tamamladıkça skorun yükselir ve arama sonuçlarında öne çıkarsın.
        </p>
        <div className="mt-4">
          <ProgressBar percent={percent} label="Tamamlanma" />
        </div>
        <div className="mt-4 border-t border-gray-200 pt-3">
          <Checklist items={items} activeId={activeId} onSelect={onSelect} />
        </div>
      </Card>

      <Banner icon={Info} title={tip.title} description={tip.description} />
    </div>
  );
}
