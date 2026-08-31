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
    <div className="min-h-screen flex items-center justify-center bg-[color:var(--surface-page)] px-6">
      <Card className="w-full max-w-sm border border-[color:var(--border-subtle)] bg-[color:var(--surface-card)]">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="h-6 w-1 bg-[color:var(--action-primary)]" aria-hidden />
            <span className="text-sm font-bold text-[color:var(--text-primary)] tracking-[0.08em] uppercase">
              Panobianco
            </span>
          </div>
          <CardTitle className="text-xl font-medium tracking-tight text-[color:var(--text-primary)]">
            Entrar no dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="login" className="text-xs font-semibold uppercase tracking-[0.06em] text-[color:var(--text-secondary)]">Login</Label>
              <Input
                id="login"
                name="login"
                type="text"
                autoComplete="username"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="senha" className="text-xs font-semibold uppercase tracking-[0.06em] text-[color:var(--text-secondary)]">Senha</Label>
              <Input
                id="senha"
                name="senha"
                type="password"
                autoComplete="current-password"
                required
              />
            </div>
            {error && (
              <p className="text-sm font-medium text-[color:var(--feedback-negative)]">{error}</p>
            )}
            <Button
              type="submit"
              disabled={loading}
              className="mt-2 h-10 bg-[color:var(--pb-black)] text-[color:var(--pb-white)] font-semibold uppercase tracking-[0.06em] hover:bg-[color:var(--pb-graphite)] transition-colors"
            >
              {loading ? "Entrando…" : "Entrar"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
