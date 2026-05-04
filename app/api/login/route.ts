import { cookies } from "next/headers"
import { SESSION_COOKIE, SESSION_VALUE, VALID_LOGIN, VALID_PASSWORD } from "@/lib/auth"

export async function POST(request: Request) {
  const body = await request.json()
  const { login, senha } = body ?? {}

  if (login !== VALID_LOGIN || senha !== VALID_PASSWORD) {
    return Response.json({ ok: false }, { status: 401 })
  }

  const cookieStore = await cookies()
  cookieStore.set({
    name: SESSION_COOKIE,
    value: SESSION_VALUE,
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  })

  return Response.json({ ok: true })
}
