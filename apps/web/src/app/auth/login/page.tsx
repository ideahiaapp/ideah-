"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuthStore } from "@/store/auth.store";
import { Eye, EyeOff, Lock, Mail, ArrowLeft, Loader2 } from "lucide-react";

/* SVG oficial do Google (4 cores) */
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.2045c0-.6381-.0573-1.2518-.1636-1.8409H9v3.4814h4.8436c-.2086 1.125-.8427 2.0782-1.7959 2.7164v2.2581h2.9087c1.7018-1.5668 2.6836-3.874 2.6836-6.615Z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.4673-.8059 5.9564-2.1805l-2.9087-2.2581c-.8059.54-1.8368.859-3.0477.859-2.3441 0-4.3282-1.5832-5.036-3.7105H.9574v2.3318C2.4382 15.9832 5.4818 18 9 18Z" fill="#34A853"/>
      <path d="M3.964 10.71c-.18-.54-.2822-1.1168-.2822-1.71s.1023-1.17.2823-1.71V4.9582H.9573A8.9965 8.9965 0 0 0 0 9c0 1.4523.3477 2.8259.9573 4.0418L3.964 10.71Z" fill="#FBBC05"/>
      <path d="M9 3.5795c1.3214 0 2.5077.4541 3.4405 1.346l2.5813-2.5814C13.4632.8918 11.4259 0 9 0 5.4818 0 2.4382 2.0168.9573 4.9582L3.964 7.29C4.6718 5.1627 6.6559 3.5795 9 3.5795Z" fill="#EA4335"/>
    </svg>
  );
}

function ErrorFromParams({ onError }: { onError: (msg: string) => void }) {
  const searchParams = useSearchParams();
  useEffect(() => {
    if (searchParams.get("error") === "not_registered") {
      onError("Acesso não autorizado. Seu e-mail não está cadastrado no IDEAh. Entre em contato com a equipe.");
    }
  }, [searchParams, onError]);
  return null;
}

export default function LoginPage() {
  const router = useRouter();
  const { login, loginWithGoogle, isLoading } = useAuthStore();

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
      <Suspense fallback={null}>
        <ErrorFromParams onError={setError} />
      </Suspense>
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
          {/* Voltar para a landing */}
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-brand-500 transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar ao início
          </Link>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-ink">Bem-vindo de volta</h1>
            <p className="text-gray-500 mt-1">Entre na sua conta para continuar</p>
          </div>

          {/* ── Botão Google ── */}
          <button
            type="button"
            onClick={async () => { await loginWithGoogle(); router.push("/dashboard"); }}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 active:bg-gray-100 transition-all text-sm font-semibold text-gray-700 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed mb-5"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin text-gray-400" /> : <GoogleIcon />}
            Continuar com Google
          </button>

          {/* Divisor */}
          <div className="relative mb-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-3 text-xs text-gray-400">ou continue com e-mail</span>
            </div>
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
