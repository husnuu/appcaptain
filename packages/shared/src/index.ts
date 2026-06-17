export * from "./enums";
export * from "./constants";
export * from "./dto/onboarding";
export * from "./dto/dashboard";
export * from "./validation/legacy";
export * from "./validation/onboarding";

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
