import type { AuthError, AuthResponse } from "./Auth.dto";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export async function googleSignIn(token: string): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE_URL}/auth/google`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw {
      message: data.message || "Authentication failed",
      statusCode: res.status,
    } as AuthError;
  }

  return data as AuthResponse;
}

export function saveToken(token: string): void {
  localStorage.setItem("accessToken", token);
}

export function getToken(): string | null {
  return localStorage.getItem("accessToken");
}

export function clearToken(): void {
  localStorage.removeItem("accessToken");
}
