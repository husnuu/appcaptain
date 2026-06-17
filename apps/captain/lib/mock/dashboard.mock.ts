import type { AnnouncementDTO, DashboardStatsDTO } from "@getyourboat/shared";

// Placeholder data — in production these come from the API (controller →
// service → repository). Swap the queryFn in lib/api/dashboard.ts for a fetch.
export const dashboardStatsMock: DashboardStatsDTO = {
  totalEarning: { amount: 12450, currency: "EUR" },
  availabilityAwaiting: 3,
  availabilityConfirmed: 8,
  optioned: 2,
  activeBoats: 4,
  rating: { average: 4.8, count: 36 },
};

/** Empty-state variant (used to preview the zero/“-” presentation). */
export const dashboardStatsEmptyMock: DashboardStatsDTO = {
  totalEarning: { amount: 0, currency: "EUR" },
  availabilityAwaiting: 0,
  availabilityConfirmed: 0,
  optioned: 0,
  activeBoats: 0,
  rating: { average: null, count: 0 },
};

export const announcementsMock: AnnouncementDTO[] = [
  {
    id: "a1",
    title: "Sezona hazırlan",
    description: "Takvimini güncelle ve fiyatlarını gözden geçir; yaz rezervasyonları başladı.",
  },
  {
    id: "a2",
    title: "Listing skorunu yükselt",
    description: "Eksik sekmeleri tamamlayan tekneler aramada daha üst sırada çıkıyor.",
  },
  {
    id: "a3",
    title: "Hızlı yanıt = daha çok rezervasyon",
    description: "Mesajlara 1 saat içinde yanıt veren kaptanlar %30 daha fazla onay alıyor.",
  },
];
