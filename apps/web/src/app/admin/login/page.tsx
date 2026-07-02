"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Eye, EyeOff, Loader2, ShieldCheck, AlertCircle } from "lucide-react";
import { useAdminStore } from "@/store/admin.store";
import { useAuthStore } from "@/store/auth.store";
import { cn } from "@/lib/utils";

export default function AdminLoginPage() {
  const router   = useRouter();
  const { login, isLoading, error, isAdmin } = useAdminStore();
  const { user } = useAuthStore();

  /* Auto-redirect se já autenticado como admin */
  useEffect(() => {
    if (isAdmin || user?.role === "admin") router.replace("/admin");
  }, [isAdmin, user, router]);

  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPwd,  setShowPwd]  = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await login(email, password);
    // Se autenticou, redireciona
    const state = useAdminStore.getState();
    if (state.isAdmin) router.push("/admin");
  }

  const canSubmit = email.trim() && password.trim() && !isLoading;

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-8">

        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
            <Image src="/paideia-wordmark-white.svg" alt="Paideia" width={150} height={60} />
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-900 border border-gray-800 rounded-full px-3 py-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-brand-400" />
            Acesso restrito — Administradores
          </div>
        </div>

        {/* Card de login */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 space-y-5">
          <div>
            <h1 className="text-xl font-bold text-white">Painel Admin</h1>
            <p className="text-gray-500 text-sm mt-1">Vendas, receita e acessos dos usuários</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* E-mail */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5">
                E-mail de administrador
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="seu@email.com"
                autoComplete="email"
                className="w-full px-4 py-2.5 text-sm bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              />
            </div>

            {/* Senha */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5">Senha</label>
              <div className="relative">
                <input
                  type={showPwd ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••••"
                  autoComplete="current-password"
                  className="w-full px-4 py-2.5 pr-10 text-sm bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Erro */}
            {error && (
              <div className="flex items-center gap-2 bg-red-950 border border-red-800 rounded-xl px-4 py-3 text-xs text-red-400">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={!canSubmit}
              className={cn(
                "w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all",
                canSubmit
                  ? "bg-brand-500 hover:bg-brand-600 text-white shadow-lg shadow-brand-900/40"
                  : "bg-gray-800 text-gray-600 cursor-not-allowed"
              )}
            >
              {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Entrando...</> : "Entrar no painel"}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-700">
          Acesso permitido apenas para sócios cadastrados.
        </p>
      </div>
    </div>
  );
}
