/** Aggregated metrics shown on the captain dashboard. */
export interface DashboardStatsDTO {
  totalEarning: { amount: number; currency: string };
  availabilityAwaiting: number;
  availabilityConfirmed: number;
  optioned: number;
  activeBoats: number;
  rating: { average: number | null; count: number };
}

export interface AnnouncementDTO {
  id: string;
  title: string;
  description: string;
}
