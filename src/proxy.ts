import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { TOKEN_NAME } from "./constants";

export async function proxy(request: NextRequest) {
  const token = request.cookies.get(TOKEN_NAME)?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/find`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    return NextResponse.next();
  } catch (error) {
    console.error("Middleware auth error:", error);

    return NextResponse.redirect(new URL("/login", request.url));
  }
}

export const config = {
  matcher: [
    "/event/:path*",
    "/gift-room/:path*",
    "/home/:path*",
    "/join/:path*",
    "/wallet/:path*",
  ],
};
