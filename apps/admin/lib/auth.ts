// Token is managed server-side via httpOnly cookie set by POST /admin/auth/login.
// The frontend never reads or writes the token directly.
// Call api.logout() to revoke the session server-side and clear the cookie.
export function clearAdminToken(): void {
  // No-op — kept for any legacy imports during migration
}
