"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Protected, TopBar } from "../../../components/protected";
import { Wizard } from "../../../components/wizard/Wizard";
import { Spinner } from "../../../components/ui";
import { useProfile } from "../../../lib/hooks";

export default function BoatWizardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { data: profile, loading } = useProfile();

  useEffect(() => {
    if (!loading && profile && !profile.isComplete) {
      router.replace("/profile/setup");
    }
  }, [loading, profile, router]);

  if (loading || (profile && !profile.isComplete)) {
    return (
      <Protected>
        <div className="flex min-h-screen items-center justify-center">
          <Spinner className="h-6 w-6" />
        </div>
      </Protected>
    );
  }

  return (
    <Protected>
      <div className="min-h-screen bg-white">
        <TopBar />
        <Wizard key={id} boatId={id} />
      </div>
    </Protected>
  );
}
