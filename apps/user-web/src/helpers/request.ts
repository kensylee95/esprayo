import { TOKEN_NAME } from "@/constants";

export async function saveToken(token: string): Promise<void> {
  if (typeof window === "undefined" || !("cookieStore" in window)) return;

  await cookieStore.set({
    name: TOKEN_NAME,
    value: token,
    path: "/",
    expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
    sameSite: "none",
    secure: true, // Required when sameSite is "none"
  } as CookieInit);
}

export async function getTokenClient(): Promise<string | null> {
  if (typeof window === "undefined") return null;

  if ("cookieStore" in window) {
    const cookie = await cookieStore.get("accessToken");
    return cookie?.value ?? null;
  }
  return null;
}

export async function clearToken(): Promise<void> {
  if (typeof window === "undefined") return;

  if ("cookieStore" in window) {
    await cookieStore.delete({
      name: TOKEN_NAME,
      path: "/",
    });
  }
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
