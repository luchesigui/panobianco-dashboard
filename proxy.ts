import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { SESSION_COOKIE, SESSION_VALUE } from "@/lib/auth"

export function proxy(request: NextRequest) {
  const session = request.cookies.get(SESSION_COOKIE)
  const authenticated = session?.value === SESSION_VALUE
  const { pathname } = request.nextUrl

  if (pathname.startsWith("/login")) {
    if (authenticated) {
      return NextResponse.redirect(new URL("/kpis", request.url))
    }
    return NextResponse.next()
  }

  if (!authenticated) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/kpis/:path*", "/login"],
}
