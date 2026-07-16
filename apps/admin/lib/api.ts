import {
  BoatBrandCategory,
  BOAT_BRAND_CATEGORY_LABELS,
  type BoatBrandDTO,
  type BoatModelDTO,
  type BrandModelRequestDTO,
  type CreateBrandModelRequestInput,
  type CreateDiscountInput,
  type DiscountDTO,
  type DiscountListQuery,
  type DiscountListResponse,
  type UpdateDiscountInput,
} from "@getyourboat/shared";
const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const V1 = `${BASE}/api/v1`;

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(
  path: string,
  options: { method?: string; body?: unknown } = {}
): Promise<T> {
  const { method = "GET", body } = options;
  const headers: Record<string, string> = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";

  const res = await fetch(`${V1}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
    credentials: "include", // sends httpOnly cookie automatically on every request
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    throw new ApiError(res.status, (data && data.message) || `Request failed (${res.status})`);
  }
  return data as T;
}

export const api = {
  login: (email: string, password: string) =>
    request<{
      token: string;
      admin: { id: string; email: string; fullName: string; role: string };
    }>("/admin/auth/login", { method: "POST", body: { email, password } }),

  logout: () =>
    request<{ ok: boolean }>("/admin/auth/logout", { method: "POST" }).catch(() => {}),

  me: () =>
    request<{ admin: { id: string; email: string; fullName: string; role: string; isActive: boolean } }>(
      "/admin/auth/me"
    ),

  // --- Boats ---
  listBoats: (
    query: {
      status?: string;
      search?: string;
      boatTypeKey?: string;
      location?: string;
      priceMin?: number;
      priceMax?: number;
      dateFrom?: string;
      dateTo?: string;
      page?: number;
      limit?: number;
    } = {}
  ) => {
    const params = new URLSearchParams();
    if (query.status) params.set("status", query.status);
    if (query.search) params.set("search", query.search);
    if (query.boatTypeKey) params.set("boatTypeKey", query.boatTypeKey);
    if (query.location) params.set("location", query.location);
    if (query.priceMin !== undefined) params.set("priceMin", String(query.priceMin));
    if (query.priceMax !== undefined) params.set("priceMax", String(query.priceMax));
    if (query.dateFrom) params.set("dateFrom", query.dateFrom);
    if (query.dateTo) params.set("dateTo", query.dateTo);
    if (query.page) params.set("page", String(query.page));
    if (query.limit) params.set("limit", String(query.limit));
    const qs = params.toString();
    return request<{
      items: {
        id: string;
        title: string | null;
        status: string;
        approvalType: string;
        boatTypeKey: string | null;
        submittedAt: string | null;
        createdAt: string;
        updatedAt: string;
        owner: { id: string; email: string | null; fullName: string | null };
        featureValues: { featureKey: string; value: string | null }[];
      }[];
      total: number;
      page: number;
      limit: number;
    }>(`/admin/boats${qs ? `?${qs}` : ""}`);
  },
  getBoatTypes: () =>
    request<{ types: { key: string; label: string }[] }>("/admin/boats/types"),
  getBoatCities: () =>
    request<{ cities: string[] }>("/admin/boats/cities"),
  getBoat: (id: string) =>
    request<{
      boat: {
        id: string;
        title: string | null;
        description: string | null;
        rulesText: string | null;
        checkInNotes: string | null;
        checkOutNotes: string | null;
        status: string;
        boatTypeKey: string | null;
        rejectionReason: string | null;
        createdAt: string;
        updatedAt: string;
        submittedAt: string | null;
        reviewedAt: string | null;
        owner: { id: string; email: string | null; fullName: string | null; phone: string | null };
        photos: { id: string; publicUrl: string | null; storagePath: string; isCover: boolean; sortOrder: number; altText: string | null }[];
        documents: { id: string; documentTypeKey: string; status: string; publicUrl: string | null }[];
        listingModels: { listingModelKey: string }[];
        pricing: { listingModelKey: string; price: number; currency: string }[];
        featureValues: { featureKey: string; value: string | null }[];
        stats: { reservationCount: number; totalRevenue: number; reviewCount: number; averageRating: number | null };
        checklist: { key: string; label: string; pass: boolean; warn: boolean }[];
      };
    }>(`/admin/boats/${id}`),
  updateBoat: (id: string, body: { title?: string; description?: string; boatTypeKey?: string; rulesText?: string; checkInNotes?: string; checkOutNotes?: string }) =>
    request<{ boat: { id: string } }>(`/admin/boats/${id}`, { method: "PATCH", body }),
  updateBoatStatus: (id: string, body: { status: string; rejectionReason?: string }) =>
    request<{ boat: { id: string; status: string; rejectionReason: string | null }; emailSent: boolean }>(
      `/admin/boats/${id}/status`,
      { method: "PATCH", body }
    ),
  updateBoatPricing: (id: string, listingModelKey: string, body: { price: number; currency: string }) =>
    request<{ ok: boolean }>(`/admin/boats/${id}/pricing/${listingModelKey}`, { method: "PATCH", body }),
  deleteBoatPhoto: (boatId: string, photoId: string) =>
    request<{ deleted: string }>(`/admin/boats/${boatId}/photos/${photoId}`, { method: "DELETE" }),
  reorderBoatPhotos: (boatId: string, photos: { id: string; sortOrder: number }[]) =>
    request<{ ok: boolean }>(`/admin/boats/${boatId}/photos/reorder`, { method: "PATCH", body: { photos } }),
  setBoatPhotoCover: (boatId: string, photoId: string) =>
    request<{ ok: boolean }>(`/admin/boats/${boatId}/photos/${photoId}/cover`, { method: "PATCH", body: {} }),
  bulkBoatStatus: (body: { ids: string[]; status: string; rejectionReason?: string }) =>
    request<{ updated: number }>("/admin/boats/bulk-status", { method: "POST", body }),
  bulkDeleteBoats: (ids: string[]) =>
    request<{ deleted: number }>("/admin/boats/bulk", { method: "DELETE", body: { ids } }),

  // --- Owner (Profile) Users ---
  listUsers: (query: { search?: string; status?: string; page?: number; limit?: number } = {}) => {
    const params = new URLSearchParams();
    if (query.search) params.set("search", query.search);
    if (query.status) params.set("status", query.status);
    if (query.page) params.set("page", String(query.page));
    if (query.limit) params.set("limit", String(query.limit));
    const qs = params.toString();
    return request<{
      items: {
        id: string;
        email: string | null;
        fullName: string | null;
        phone: string | null;
        companyName: string | null;
        address: string | null;
        role: string;
        badge: string | null;
        isVerified: boolean;
        createdAt: string;
        _count: { boats: number };
      }[];
      total: number;
      page: number;
      limit: number;
    }>(`/admin/users${qs ? `?${qs}` : ""}`);
  },
  getOwner: (id: string) =>
    request<{
      profile: {
        id: string;
        email: string | null;
        fullName: string | null;
        phone: string | null;
        companyName: string | null;
        address: string | null;
        role: string;
        badge: string | null;
        isVerified: boolean;
        createdAt: string;
        updatedAt: string;
        boats: {
          id: string;
          title: string | null;
          status: string;
          boatTypeKey: string | null;
          createdAt: string;
          bookingCount: number;
          reviewCount: number;
          avgRating: number | null;
        }[];
        stats: {
          boatCount: number;
          totalRevenue: number;
          totalCommission: number;
          totalNetAmount: number;
          bookingCount: number;
          avgRating: number | null;
        };
        recentPayments: {
          id: string;
          boatName: string;
          amount: number;
          commission: number;
          netAmount: number;
          currency: string;
          status: string;
          createdAt: string;
        }[];
      };
    }>(`/admin/users/${id}`),
  suspendUser: (id: string, suspend: boolean) =>
    request<{ profile: { id: string; email: string | null; isVerified: boolean } }>(
      `/admin/users/${id}/suspend`,
      { method: "PATCH", body: { suspend } }
    ),
  setOwnerBadge: (id: string, badge: string | null) =>
    request<{ profile: { id: string; email: string | null; badge: string | null } }>(
      `/admin/users/${id}/badge`,
      { method: "PATCH", body: { badge } }
    ),
  warnOwner: (id: string, message: string) =>
    request<{ emailSent: boolean }>(`/admin/users/${id}/warn`, { method: "POST", body: { message } }),

  // --- Guest Users ---
  listGuests: (query: { search?: string; status?: string; dateFrom?: string; dateTo?: string; country?: string; page?: number; limit?: number } = {}) => {
    const params = new URLSearchParams();
    if (query.search) params.set("search", query.search);
    if (query.status) params.set("status", query.status);
    if (query.dateFrom) params.set("dateFrom", query.dateFrom);
    if (query.dateTo) params.set("dateTo", query.dateTo);
    if (query.country) params.set("country", query.country);
    if (query.page) params.set("page", String(query.page));
    if (query.limit) params.set("limit", String(query.limit));
    const qs = params.toString();
    return request<{
      items: {
        id: string;
        email: string;
        name: string;
        phone: string | null;
        country: string | null;
        role: string;
        isSuspended: boolean;
        bannedAt: string | null;
        createdAt: string;
        _count: { reservations: number; reviews: number };
      }[];
      total: number;
      page: number;
      limit: number;
    }>(`/admin/users/guests${qs ? `?${qs}` : ""}`);
  },
  getGuest: (id: string) =>
    request<{
      user: {
        id: string;
        email: string;
        name: string;
        phone: string | null;
        country: string | null;
        role: string;
        isSuspended: boolean;
        bannedAt: string | null;
        createdAt: string;
        reservations: {
          id: string;
          startDate: string;
          endDate: string;
          guests: number;
          totalPrice: string | null;
          status: string;
          createdAt: string;
          boat: { id: string; title: string | null };
        }[];
        reviews: {
          id: string;
          rating: number;
          comment: string | null;
          createdAt: string;
          boat: { id: string; title: string | null };
        }[];
        stats: { reservationCount: number; reviewCount: number; totalSpending: number };
      };
    }>(`/admin/users/guests/${id}`),
  suspendGuest: (id: string, body: { suspend: boolean; permanent?: boolean }) =>
    request<{ user: { id: string; email: string; isSuspended: boolean; bannedAt: string | null } }>(
      `/admin/users/guests/${id}/suspend`,
      { method: "PATCH", body }
    ),
  resetGuestPassword: (id: string) =>
    request<{ emailSent: boolean }>(`/admin/users/guests/${id}/reset-password`, { method: "POST", body: {} }),

  listBrands: (category?: BoatBrandCategory) => {
    const qs = category ? `?category=${encodeURIComponent(category)}` : "";
    return request<{ items: BoatBrandDTO[] }>(`/admin/boat-brands${qs}`);
  },
  createBrand: (body: { name: string; category: BoatBrandCategory; logoUrl?: string | null }) =>
    request<BoatBrandDTO>("/admin/boat-brands", { method: "POST", body }),
  listModels: (brandId: string) =>
    request<{ items: BoatModelDTO[] }>(`/admin/boat-brands/${brandId}/models`),
  createModel: (body: { brandId: string; name: string; notes?: string | null }) =>
    request<BoatModelDTO>("/admin/boat-models", { method: "POST", body }),

  listRequests: (status = "PENDING") =>
    request<{ items: BrandModelRequestDTO[] }>(
      `/admin/brand-model-requests?status=${encodeURIComponent(status)}`
    ),
  approveRequest: (id: string, category?: BoatBrandCategory) =>
    request<BrandModelRequestDTO>(`/admin/brand-model-requests/${id}/approve`, {
      method: "POST",
      body: category ? { category } : {},
    }),
  rejectRequest: (id: string) =>
    request<BrandModelRequestDTO>(`/admin/brand-model-requests/${id}/reject`, {
      method: "POST",
      body: {},
    }),

  // --- Dashboard ---
  getDashboard: () =>
    request<{
      stats: {
        totalProfiles: number;
        totalOwners: number;
        totalCaptains: number;
        activeListings: number;
        pendingListings: number;
        suspendedListings: number;
        totalBookings: number;
        pendingBookings: number;
        approvedBookings: number;
        cancelledBookings: number;
        completedBookings: number;
        todayBookings: number;
        totalRevenue: number;
        platformCommission: number;
        cancellationRate: number;
        commissionRate: number;
        pendingVerifications: number;
      };
      recentActivity: { id: string; action: string; targetType: string | null; targetId: string | null; createdAt: string; admin: { fullName: string; email: string } }[];
      weeklyTrend: { date: string; count: number; revenue: number; commission: number }[];
    }>("/admin/dashboard"),

  // --- Reservations ---
  listReservations: (query: { status?: string; search?: string; page?: number; limit?: number } = {}) => {
    const params = new URLSearchParams();
    if (query.status) params.set("status", query.status);
    if (query.search) params.set("search", query.search);
    if (query.page) params.set("page", String(query.page));
    if (query.limit) params.set("limit", String(query.limit));
    const qs = params.toString();
    return request<{
      items: {
        id: string;
        guestName: string | null;
        guestEmail: string | null;
        guestPhone: string | null;
        guestCount: number | null;
        rentalType: string;
        startDate: string;
        endDate: string | null;
        totalPrice: number | null;
        currency: string | null;
        status: string;
        rejectionNote: string | null;
        createdAt: string;
        boat: { id: string; title: string | null; owner: { id: string; fullName: string | null; email: string | null } };
      }[];
      total: number;
      page: number;
      limit: number;
    }>(`/admin/reservations${qs ? `?${qs}` : ""}`);
  },
  cancelReservation: (id: string, note?: string) =>
    request<{ booking: { id: string; status: string } }>(
      `/admin/reservations/${id}/cancel`,
      { method: "PATCH", body: { note } }
    ),

  // --- Finance ---
  listPayments: (query: { status?: string; page?: number; limit?: number } = {}) => {
    const params = new URLSearchParams();
    if (query.status) params.set("status", query.status);
    if (query.page) params.set("page", String(query.page));
    if (query.limit) params.set("limit", String(query.limit));
    const qs = params.toString();
    return request<{
      items: {
        id: string;
        guestName: string | null;
        totalPrice: number | null;
        currency: string | null;
        status: string;
        commissionRate: number;
        commission: number | null;
        createdAt: string;
        boat: { id: string; title: string | null; owner: { id: string; fullName: string | null } };
      }[];
      total: number;
      page: number;
      limit: number;
      summary: { totalRevenue: number; totalCommission: number; globalCommissionRate: number };
    }>(`/admin/finance/payments${qs ? `?${qs}` : ""}`);
  },
  getCommissionRates: () =>
    request<{
      globalRate: number;
      overrides: { ownerId: string; rate: number; owner: { id: string; fullName: string | null; email: string | null } | undefined }[];
    }>("/admin/finance/commission-rates"),
  setOwnerCommission: (ownerId: string, rate: number) =>
    request<{ ownerId: string; rate: number }>(`/admin/users/${ownerId}/commission`, {
      method: "PATCH",
      body: { rate },
    }),

  // --- Settings ---
  getSettings: () =>
    request<{ settings: { key: string; value: string; updatedAt: string }[] }>("/admin/settings"),
  updateSetting: (key: string, value: string) =>
    request<{ setting: { key: string; value: string } }>(`/admin/settings/${key}`, {
      method: "PUT",
      body: { value },
    }),
  bulkUpdateSettings: (settings: Record<string, string>) =>
    request<{ updated: number }>("/admin/settings", { method: "PATCH", body: { settings } }),

  // --- Reviews ---
  listReviews: (query: { search?: string; page?: number; limit?: number } = {}) => {
    const params = new URLSearchParams();
    if (query.search) params.set("search", query.search);
    if (query.page) params.set("page", String(query.page));
    if (query.limit) params.set("limit", String(query.limit));
    const qs = params.toString();
    return request<{
      items: {
        id: string;
        rating: number;
        comment: string | null;
        createdAt: string;
        customer: { id: string; name: string; email: string };
        boat: { id: string; title: string | null };
      }[];
      total: number;
      page: number;
      limit: number;
    }>(`/admin/reviews${qs ? `?${qs}` : ""}`);
  },
  deleteReview: (id: string) =>
    request<{ deleted: boolean }>(`/admin/reviews/${id}`, { method: "DELETE" }),

  // --- Notifications ---
  sendBroadcast: (body: { subject: string; message: string; targetRole?: "ALL" | "OWNER" | "RENTER" }) =>
    request<{ sent: boolean; recipientCount: number; subject: string }>("/admin/notifications/broadcast", {
      method: "POST",
      body,
    }),
  listBroadcasts: (query: { page?: number; limit?: number } = {}) => {
    const params = new URLSearchParams();
    if (query.page) params.set("page", String(query.page));
    if (query.limit) params.set("limit", String(query.limit));
    const qs = params.toString();
    return request<{
      items: { id: string; action: string; metadata: Record<string, unknown> | null; createdAt: string; admin: { fullName: string; email: string } }[];
      total: number;
      page: number;
      limit: number;
    }>(`/admin/notifications/broadcasts${qs ? `?${qs}` : ""}`);
  },

  // --- Audit Log ---
  listAuditLog: (query: { action?: string; adminId?: string; page?: number; limit?: number } = {}) => {
    const params = new URLSearchParams();
    if (query.action) params.set("action", query.action);
    if (query.adminId) params.set("adminId", query.adminId);
    if (query.page) params.set("page", String(query.page));
    if (query.limit) params.set("limit", String(query.limit));
    const qs = params.toString();
    return request<{
      items: { id: string; action: string; targetType: string | null; targetId: string | null; metadata: Record<string, unknown> | null; ip: string | null; createdAt: string; admin: { id: string; fullName: string; email: string; role: string } }[];
      total: number;
      page: number;
      limit: number;
    }>(`/admin/audit-log${qs ? `?${qs}` : ""}`);
  },

  // --- Discounts ---
  listDiscounts: (query: DiscountListQuery = {}) => {
    const params = new URLSearchParams();
    if (query.target) params.set("target", query.target);
    if (query.isActive !== undefined) params.set("isActive", String(query.isActive));
    if (query.page) params.set("page", String(query.page));
    if (query.limit) params.set("limit", String(query.limit));
    const qs = params.toString();
    return request<DiscountListResponse>(`/admin/discounts${qs ? `?${qs}` : ""}`);
  },
  createDiscount: (body: CreateDiscountInput) =>
    request<{ discount: DiscountDTO }>("/admin/discounts", { method: "POST", body }),
  updateDiscount: (id: string, body: UpdateDiscountInput) =>
    request<{ discount: DiscountDTO }>(`/admin/discounts/${id}`, { method: "PATCH", body }),
  toggleDiscount: (id: string) =>
    request<{ discount: DiscountDTO }>(`/admin/discounts/${id}/toggle`, { method: "PATCH" }),
  deleteDiscount: (id: string) =>
    request<{ success: boolean }>(`/admin/discounts/${id}`, { method: "DELETE" }),
  listDiscountBoatOptions: (search?: string) => {
    const qs = search ? `?search=${encodeURIComponent(search)}` : "";
    return request<{ items: { id: string; name: string }[] }>(
      `/admin/discounts/boat-options${qs}`
    );
  },
  listDiscountExperienceOptions: (search?: string) => {
    const qs = search ? `?search=${encodeURIComponent(search)}` : "";
    return request<{ items: { id: string; name: string }[] }>(
      `/admin/discounts/experience-options${qs}`
    );
  },
};

export { BoatBrandCategory, BOAT_BRAND_CATEGORY_LABELS };
export type { BoatBrandDTO, BoatModelDTO, BrandModelRequestDTO, CreateBrandModelRequestInput };
