"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuthStore } from "@/store/auth.store";
import { Eye, EyeOff, Lock, Mail, User, CheckCircle2 } from "lucide-react";

const BENEFITS = [
  "7 dias grátis com acesso completo",
  "Supervisão clínica baseada na sua abordagem",
  "Registro de evolução clínica integrado",
  "Sem cartão de crédito para começar",
];

export default function RegisterPage() {
  const router = useRouter();
  const { register: signUp, isLoading } = useAuthStore();

  const [name, setName]         = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm]   = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError]       = useState("");

  const passwordStrength = (() => {
    if (password.length === 0) return 0;
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
  })();

  const strengthLabel = ["", "Fraca", "Razoável", "Boa", "Forte"][passwordStrength];
  const strengthColor = ["", "bg-red-400", "bg-yellow-400", "bg-blue-400", "bg-green-400"][passwordStrength];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("As senhas não coincidem.");
      return;
    }
    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    try {
      await signUp(name, email, password);
      router.push("/dashboard");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(msg ?? "Erro ao criar conta. Tente novamente.");
    }
  }

  return (
    <div className="min-h-screen bg-auth-gradient flex">
      {/* ── Painel esquerdo ── */}
      <aside className="hidden lg:flex flex-col items-center justify-center w-1/2 bg-brand-500 px-16 gap-10">
        <Image
          src="/ideah-logo.png"
          alt="IDEAH"
          width={300}
          height={112}
          className="brightness-0 invert"
          priority
        />

        <div className="space-y-4 w-full max-w-sm">
          {BENEFITS.map((b) => (
            <div key={b} className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-white/80 flex-shrink-0" />
              <span className="text-white/90 text-sm">{b}</span>
            </div>
          ))}
        </div>

        <div className="bg-white/10 border border-white/20 rounded-2xl p-6 w-full max-w-sm text-center">
          <p className="text-3xl font-bold text-white">R$ 49,90</p>
          <p className="text-white/70 text-sm mt-1">por mês após o período gratuito</p>
          <p className="text-white/50 text-xs mt-3">
            Plano anual disponível por R$ 39,92/mês (20% off)
          </p>
        </div>
      </aside>

      {/* ── Formulário ── */}
      <main className="flex flex-col items-center justify-center w-full lg:w-1/2 px-6 py-12 overflow-y-auto">
        {/* Logo mobile */}
        <div className="lg:hidden mb-8">
          <Image src="/ideah-logo.png" alt="IDEAH" width={180} height={68} priority />
        </div>

        <div className="w-full max-w-md">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-ink">Crie sua conta</h1>
            <p className="text-gray-500 mt-1">Comece seus 7 dias gratuitos agora</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nome */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Nome completo</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Seu nome"
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent transition text-sm"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">E-mail</label>
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
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Mínimo 6 caracteres"
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
              {/* Barra de força da senha */}
              {password.length > 0 && (
                <div className="mt-2">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-colors ${
                          i <= passwordStrength ? strengthColor : "bg-gray-200"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Força: {strengthLabel}</p>
                </div>
              )}
            </div>

            {/* Confirmar senha */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirmar senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={showPass ? "text" : "password"}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  placeholder="Repita a senha"
                  className={`w-full pl-10 pr-4 py-3 border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent transition text-sm ${
                    confirm && confirm !== password
                      ? "border-red-300"
                      : "border-gray-200"
                  }`}
                />
                {confirm && confirm === password && (
                  <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
                )}
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
              className="w-full bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-white font-semibold rounded-xl py-3 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm mt-2"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Criando conta...
                </span>
              ) : (
                "Criar conta grátis"
              )}
            </button>

            <p className="text-xs text-gray-400 text-center">
              Ao criar sua conta, você concorda com os{" "}
              <Link href="/termos" className="text-brand-500 hover:underline">Termos de Uso</Link>
              {" "}e a{" "}
              <Link href="/privacidade" className="text-brand-500 hover:underline">Política de Privacidade</Link>.
            </p>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-xs text-gray-400 bg-white/0 px-3 mx-auto w-fit">
              Já tem conta?
            </div>
          </div>

          <Link
            href="/auth/login"
            className="block w-full text-center border border-brand-300 text-brand-600 hover:bg-brand-50 font-semibold rounded-xl py-3 transition-colors text-sm"
          >
            Fazer login
          </Link>

          <p className="text-center text-xs text-gray-400 mt-6">
            Em conformidade com o CFP e a LGPD
          </p>
        </div>
      </main>
    </div>
  );
}
