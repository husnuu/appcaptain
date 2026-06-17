"use client";

import { use } from "react";
import { Protected, TopBar } from "../../../components/protected";
import { Wizard } from "../../../components/wizard/Wizard";

export default function BoatWizardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return (
    <Protected>
      <div className="min-h-screen bg-slate-50">
        <TopBar />
        <Wizard boatId={id} />
      </div>
    </Protected>
  );
}
