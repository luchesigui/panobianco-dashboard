"use client"

import { useState, FormEvent } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")
    setLoading(true)

    const form = new FormData(e.currentTarget)
    const login = form.get("login") as string
    const senha = form.get("senha") as string

    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ login, senha }),
    })

    setLoading(false)

    if (res.ok) {
      router.push("/kpis")
    } else {
      setError("Login ou senha incorretos.")
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f7f6f3] bg-[radial-gradient(90%_55%_at_50%_0%,rgba(255,97,0,0.10),transparent_62%),radial-gradient(120%_60%_at_50%_115%,rgba(73,41,26,0.12),transparent_68%)] px-6">
      <Card className="w-full max-w-sm border-black/10 bg-white/90 shadow-md">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-8 h-8 bg-[#ff6100] flex items-center justify-center text-white text-sm font-black [clip-path:polygon(28%_0,100%_0,100%_100%,0_100%,0_22%)]">
              P
            </div>
            <span className="text-sm font-extrabold text-slate-950 tracking-[0.08em] uppercase">
              Panobianco
            </span>
          </div>
          <CardTitle className="text-lg font-black uppercase tracking-tight text-slate-900">
            Entrar no dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="login">Login</Label>
              <Input
                id="login"
                name="login"
                type="text"
                autoComplete="username"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="senha">Senha</Label>
              <Input
                id="senha"
                name="senha"
                type="password"
                autoComplete="current-password"
                required
              />
            </div>
            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}
            <Button type="submit" disabled={loading} className="mt-1 rounded-full bg-[#ff6100] font-extrabold uppercase tracking-[0.06em] text-white hover:bg-[#ff4b00]">
              {loading ? "Entrando…" : "Entrar"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
