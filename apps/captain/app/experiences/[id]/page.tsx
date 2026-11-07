"use client";

import { useParams } from "next/navigation";
import { Protected } from "../../../components/protected";
import { ExperienceWizard } from "../../../components/experiences/ExperienceWizard";

export default function ExperienceEditPage() {
  const params = useParams<{ id: string }>();
  return (
    <Protected>
      {/* Sihirbaz kendi odak düzenini (üst çubuk + alt gezinme) çizer. */}
      <ExperienceWizard experienceId={params.id} />
    </Protected>
  );
}
