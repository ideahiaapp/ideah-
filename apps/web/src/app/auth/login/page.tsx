"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuthStore } from "@/store/auth.store";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading } = useAuthStore();

  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError]       = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      await login(email, password);
      router.push("/dashboard");
    } catch {
      setError("E-mail ou senha inválidos. Verifique seus dados.");
    }
  }

  return (
    <div className="min-h-screen bg-auth-gradient flex">
      {/* ── Painel esquerdo (decorativo) ── */}
      <aside className="hidden lg:flex flex-col items-center justify-center w-1/2 bg-brand-500 px-16 gap-8">
        <Image
          src="/ideah-logo.png"
          alt="IDEAH"
          width={320}
          height={120}
          className="brightness-0 invert"
          priority
        />
        <p className="text-white/80 text-center text-lg leading-relaxed max-w-sm">
          Supervisão clínica dialógica para terapeutas que buscam profundidade e rigor teórico.
        </p>

        {/* Depoimento */}
        <div className="bg-white/10 border border-white/20 rounded-2xl p-6 max-w-sm">
          <p className="text-white/90 italic text-sm leading-relaxed">
            "O IDEAH mudou a forma como conduzo minha clínica. Ter um supervisor disponível a qualquer hora, ancorado na minha abordagem, é transformador."
          </p>
          <div className="flex items-center gap-3 mt-4">
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm">
              AM
            </div>
            <div>
              <p className="text-white text-sm font-semibold">Ana Martins</p>
              <p className="text-white/60 text-xs">Psicóloga Clínica · São Paulo</p>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Formulário ── */}
      <main className="flex flex-col items-center justify-center w-full lg:w-1/2 px-6 py-12">
        {/* Logo mobile */}
        <div className="lg:hidden mb-10">
          <Image
            src="/ideah-logo.png"
            alt="IDEAH"
            width={200}
            height={75}
            priority
          />
        </div>

        <div className="w-full max-w-md">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-ink">Bem-vindo de volta</h1>
            <p className="text-gray-500 mt-1">Entre na sua conta para continuar</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                E-mail
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="seu@email.com"
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent transition text-sm"
                />
              </div>
            </div>

            {/* Senha */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-gray-700">Senha</label>
                <Link
                  href="/auth/forgot-password"
                  className="text-xs text-brand-500 hover:text-brand-600 font-medium"
                >
                  Esqueci minha senha
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full pl-10 pr-11 py-3 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent transition text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Erro */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">
                {error}
              </div>
            )}

            {/* Botão */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-white font-semibold rounded-xl py-3 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Entrando...
                </span>
              ) : (
                "Entrar"
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-xs text-gray-400 bg-white px-3 mx-auto w-fit">
              Não tem conta?
            </div>
          </div>

          <Link
            href="/auth/register"
            className="block w-full text-center border border-brand-300 text-brand-600 hover:bg-brand-50 font-semibold rounded-xl py-3 transition-colors text-sm"
          >
            Criar conta grátis — 7 dias sem cobrança
          </Link>

          <p className="text-center text-xs text-gray-400 mt-6">
            Em conformidade com o CFP e a LGPD
          </p>
        </div>
      </main>
    </div>
  );
}
