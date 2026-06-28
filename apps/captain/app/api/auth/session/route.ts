import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const REFRESH_COOKIE = "gyb_refresh";
const MAX_AGE = 30 * 24 * 60 * 60;

/** Returns the current session when a refresh cookie exists; otherwise authenticated: false. */
export async function GET() {
  const jar = await cookies();
  const refreshToken = jar.get(REFRESH_COOKIE)?.value;
  if (!refreshToken) {
    return NextResponse.json({ authenticated: false });
  }

  const res = await fetch(`${API}/api/v1/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });
  const data = await res.json().catch(() => ({ message: "Sunucu hatası" }));
  if (!res.ok) {
    const response = NextResponse.json({ authenticated: false, message: data.message }, { status: 200 });
    response.cookies.delete(REFRESH_COOKIE);
    return response;
  }

  const response = NextResponse.json({
    authenticated: true,
    accessToken: data.accessToken,
    user: data.user,
  });

  if (data.refreshToken) {
    response.cookies.set(REFRESH_COOKIE, data.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: MAX_AGE,
    });
  }

  return response;
}
