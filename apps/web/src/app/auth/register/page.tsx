"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuthStore } from "@/store/auth.store";
import { Eye, EyeOff, Lock, Mail, User, CheckCircle2, ArrowLeft, Loader2 } from "lucide-react";

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

const BENEFITS = [
  "7 dias grátis com acesso completo",
  "Supervisão clínica baseada na sua abordagem",
  "Registro de evolução clínica integrado",
  "Sem cartão de crédito para começar",
];

export default function RegisterPage() {
  const router = useRouter();
  const { register: signUp, loginWithGoogle, isLoading } = useAuthStore();

  const [name, setName]         = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm]   = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError]       = useState("");
  const [emailSent, setEmailSent] = useState(false);

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
      // Se chegou aqui sem erro, pode ter confirmação pendente ou login direto
      setEmailSent(true);
    } catch (err: unknown) {
      const raw = err instanceof Error ? err.message : String(err);
      // Traduz mensagens comuns do Supabase
      if (raw.includes("User already registered"))
        setError("Este e-mail já está cadastrado. Tente fazer login.");
      else if (raw.includes("Password should be"))
        setError("A senha não atende aos requisitos mínimos de segurança.");
      else if (raw.includes("Unable to validate email address"))
        setError("E-mail inválido. Verifique o endereço digitado.");
      else if (raw.includes("Email rate limit exceeded") || raw.includes("rate limit"))
        setError("Muitas tentativas. Aguarde alguns minutos e tente novamente.");
      else
        setError(raw || "Erro ao criar conta. Tente novamente.");
    }
  }

  if (emailSent) {
    return (
      <div className="min-h-screen bg-auth-gradient flex items-center justify-center px-6">
        <div className="bg-white rounded-2xl shadow-lg p-10 max-w-md w-full text-center space-y-4">
          <div className="w-14 h-14 bg-brand-50 rounded-full flex items-center justify-center mx-auto">
            <Mail className="w-7 h-7 text-brand-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Verifique seu e-mail</h2>
          <p className="text-gray-500 text-sm leading-relaxed">
            Enviamos um link de confirmação para <strong>{email}</strong>.<br />
            Clique no link para ativar sua conta e acessar o IDEAh.
          </p>
          <p className="text-xs text-gray-400">
            Não recebeu? Verifique a caixa de spam ou{" "}
            <button
              onClick={() => setEmailSent(false)}
              className="text-brand-500 hover:underline"
            >
              tente novamente
            </button>.
          </p>
          <Link
            href="/auth/login"
            className="block w-full text-center bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-xl py-3 transition-colors text-sm mt-2"
          >
            Ir para o login
          </Link>
        </div>
      </div>
    );
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
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-brand-500 transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar ao início
          </Link>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-ink">Crie sua conta</h1>
            <p className="text-gray-500 mt-1">Comece seus 7 dias gratuitos agora</p>
          </div>

          {/* ── Botão Google ── */}
          <button
            type="button"
            onClick={async () => { await loginWithGoogle(); router.push("/dashboard"); }}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 active:bg-gray-100 transition-all text-sm font-semibold text-gray-700 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed mb-5"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin text-gray-400" /> : <GoogleIcon />}
            Cadastrar com Google
          </button>

          {/* Divisor */}
          <div className="relative mb-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-3 text-xs text-gray-400">ou preencha o formulário</span>
            </div>
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
