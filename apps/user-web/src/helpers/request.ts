import { TOKEN_NAME } from "../constants";

export async function saveToken(token: string): Promise<void> {
  if (typeof window === "undefined") return;

  await cookieStore.set({
    name: TOKEN_NAME,
    value: token,
    path: "/",
    expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
    sameSite: "none",
    secure: true, // Required when sameSite is "none"
  } as CookieInit);
}

export async function deleteToken(): Promise<void> {
  if (typeof window === "undefined") return;

  await cookieStore.delete(TOKEN_NAME);
}

export async function getTokenClient(): Promise<string | null> {
  if (typeof window === "undefined") return null;

  const cookie = await cookieStore.get(TOKEN_NAME);
  return cookie?.value ?? null;
}

export async function clearToken(): Promise<void> {
  if (typeof window === "undefined") return;

  await cookieStore.delete({
    name: TOKEN_NAME,
    path: "/",
  });
}
export async function request<T>(
  endpoint: string,
  options?: RequestInit & { token?: string },
): Promise<T> {
  const BASE_URL = process.env.NEXT_PUBLIC_API_URL;
  const { token, ...fetchOptions } = options || {};

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...fetchOptions,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(fetchOptions.headers || {}),
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const error = await res.json().catch(() => null);
    throw new Error(error?.message || "Something went wrong");
  }

  return res.json();
}
