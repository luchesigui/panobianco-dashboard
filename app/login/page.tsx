"use client"

import { useState, FormEvent } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import Logo from "@/components/Logo"

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
    <div className="min-h-screen flex items-center justify-center bg-[#161515] px-6 relative overflow-hidden">
      {/* Background ambient glow */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          background: "radial-gradient(circle at 50% 40%, rgba(255, 97, 0, 0.25) 0%, transparent 60%)"
        }}
      />

      <div className="w-full max-w-md bg-[#1f1f1f] border border-white/10 p-8 sm:p-10 shadow-2xl relative z-10 rounded-none">
        <div className="flex flex-col items-center text-center mb-8">
          <Logo width={180} height={34} variant="light-on-dark" showLink={false} />
          <p className="text-xs font-semibold text-[#ff6100] mt-4">
            Feitos de força e vontade
          </p>
          <h1 className="text-xl font-bold tracking-tight text-white mt-1">
            Dashboard Estratégico
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label 
              htmlFor="login" 
              className="text-xs font-semibold text-white/80"
            >
              Usuário
            </label>
            <input
              id="login"
              name="login"
              type="text"
              autoComplete="username"
              required
              className="h-11 w-full rounded-none border border-white/15 bg-white/5 px-4 text-sm text-white placeholder-white/30 transition-colors focus:border-[#ff6100] focus:outline-none focus:ring-2 focus:ring-[#ff6100]/50"
              placeholder="Digite seu usuário"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label 
              htmlFor="senha" 
              className="text-xs font-semibold text-white/80"
            >
              Senha
            </label>
            <input
              id="senha"
              name="senha"
              type="password"
              autoComplete="current-password"
              required
              className="h-11 w-full rounded-none border border-white/15 bg-white/5 px-4 text-sm text-white placeholder-white/30 transition-colors focus:border-[#ff6100] focus:outline-none focus:ring-2 focus:ring-[#ff6100]/50"
              placeholder="Digite sua senha"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-none text-xs text-red-400 font-medium">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary mt-3 h-12 w-full text-xs font-bold text-white shadow-lg cursor-pointer"
          >
            {loading ? "Autenticando…" : "Acessar Dashboard"}
          </button>
        </form>
      </div>
    </div>
  )
}
