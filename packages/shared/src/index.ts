export * from "./enums";
export * from "./constants";
export * from "./onboarding";
export * from "./experience";
export * from "./brand-model";
export * from "./discount";
export * from "./booking";
export * from "./units";
export * from "./hull-material";
export * from "./cabin-engine";
export * from "./listing-score";
export * from "./dto/onboarding";
export * from "./dto/cabin";
export * from "./dto/experience";
export * from "./dto/brand-model";
export * from "./dto/discount";
export * from "./dto/booking";
export * from "./dto/dashboard";
export * from "./dto/boat-detail";
export * from "./dto/profile";
export * from "./dto/auth";
export * from "./dto/messaging";
export * from "./dto/validation";
export * from "./validation/error-format";
export * from "./constants/socket-events";
export * from "./validation/legacy";
export * from "./validation/onboarding";
export * from "./validation/profile";
export * from "./validation/auth";
export * from "./validation/messaging";
export * from "./validation/experience";
export * from "./validation/brand-model";
export * from "./validation/discount";
export * from "./validation/booking";

/* Cross-cutting API envelope types. */
export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface AuthTokenPayload {
  sub: string;
  role: import("./enums").UserRole;
  email: string;
}
