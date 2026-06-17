"use client";

import { useAuth } from "../components/auth-provider";
import { AppShell } from "../components/layout/AppShell";
import { AnnouncementCarousel } from "../components/dashboard/AnnouncementCarousel";
import { StatGrid } from "../components/dashboard/StatGrid";
import { WelcomeHeader } from "../components/dashboard/WelcomeHeader";
import { useDashboardStats } from "../lib/api/dashboard";

function DashboardContent() {
  const { user } = useAuth();
  const { data, isLoading, isError } = useDashboardStats();
  const name = user?.email?.split("@")[0] ?? "Captain";

  return (
    <>
      <AnnouncementCarousel />
      <WelcomeHeader name={name} />
      <StatGrid stats={data} loading={isLoading} error={isError} />
    </>
  );
}

export default function DashboardPage() {
  return (
    <AppShell active="dashboard">
      <DashboardContent />
    </AppShell>
  );
}
