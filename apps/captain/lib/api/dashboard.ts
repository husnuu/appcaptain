import { useQuery } from "@tanstack/react-query";
import type { AnnouncementDTO, DashboardStatsDTO } from "@getyourboat/shared";
import { announcementsMock, dashboardStatsMock } from "../mock/dashboard.mock";

// Data-fetching layer. Replace the queryFn bodies with real API calls
// (e.g. GET /dashboard/stats) without touching the screens.
function delay<T>(value: T, ms = 600): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export function useDashboardStats() {
  return useQuery<DashboardStatsDTO>({
    queryKey: ["dashboard", "stats"],
    queryFn: () => delay(dashboardStatsMock),
  });
}

export function useAnnouncements() {
  return useQuery<AnnouncementDTO[]>({
    queryKey: ["dashboard", "announcements"],
    queryFn: () => delay(announcementsMock, 200),
  });
}
