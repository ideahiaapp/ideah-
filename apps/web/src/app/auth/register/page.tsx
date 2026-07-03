"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuthStore } from "@/store/auth.store";
import { Eye, EyeOff, Lock, Mail, User, CheckCircle2, ArrowLeft, Loader2, BookOpen, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

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

const BASES = [
  { key: "PSYCHOANALYSIS",       label: "Psicanálise Freudiana",   price: 49.90 },
  { key: "COGNITIVE_BEHAVIORAL", label: "TCC",                     price: 49.90 },
  { key: "JUNGIAN",              label: "Junguiana",               price: 49.90 },
  { key: "SOMATIC",              label: "Somática / Corporal",     price: 49.90 },
  { key: "GESTALT",              label: "Gestalt-terapia",         price: 49.90 },
  { key: "PSYCHODRAMA",          label: "Psicodrama",              price: 49.90 },
  { key: "SYSTEMIC",             label: "Constelação Familiar",    price: 49.90 },
];

async function saveApproaches(userId: string, approaches: string[]) {
  if (approaches.length === 0) return;
  await fetch("/api/therapist-approaches-self", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, approaches }),
  });
}

export default function RegisterPage() {
  const router = useRouter();
  const { register: signUp, loginWithGoogle, isLoading } = useAuthStore();

  const [step, setStep]           = useState<1 | 2>(1);
  const [name, setName]           = useState("");
  const [email, setEmail]         = useState("");
  const [password, setPassword]   = useState("");
  const [confirm, setConfirm]     = useState("");
  const [showPass, setShowPass]   = useState(false);
  const [selectedBases, setSelectedBases] = useState<string[]>([]);
  const [ethicsAccepted, setEthicsAccepted] = useState(false);
  const [error, setError]         = useState("");
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

  const total = selectedBases.length * 49.90;

  function toggleBase(key: string) {
    setSelectedBases(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  }

  function goToStep2(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password !== confirm) { setError("As senhas não coincidem."); return; }
    if (password.length < 6)  { setError("A senha deve ter pelo menos 6 caracteres."); return; }
    setStep(2);
  }

  async function handleSubmit() {
    if (selectedBases.length === 0) { setError("Selecione ao menos uma base de conhecimento."); return; }
    if (!ethicsAccepted) { setError("Confirme que está ciente do uso ético da ferramenta para continuar."); return; }
    setError("");
    try {
      const user = await signUp(name, email, password);
      if (user?.id) await saveApproaches(user.id, selectedBases);
      router.push("/dashboard/supervision");
    } catch (err: unknown) {
      const raw = err instanceof Error ? err.message : String(err);
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
      setStep(2);
    }
  }

  async function handleGoogle() {
    if (selectedBases.length === 0) { setError("Selecione ao menos uma base antes de continuar."); return; }
    if (!ethicsAccepted) { setError("Confirme que está ciente do uso ético da ferramenta para continuar."); return; }
    setError("");
    // Salva bases em localStorage para usar após o callback OAuth
    localStorage.setItem("ideah_pending_bases", JSON.stringify(selectedBases));
    await loginWithGoogle();
    router.push("/dashboard/supervision");
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
            Clique no link para ativar sua conta e acessar o Paideia.
          </p>
          <Link href="/auth/login" className="block w-full text-center bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-xl py-3 transition-colors text-sm mt-2">
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
        <Image src="/paideia-wordmark-white.svg" alt="Paideia" width={300} height={120} priority />
        <div className="bg-white/10 border border-white/20 rounded-2xl p-6 w-full max-w-sm space-y-4">
          <p className="text-white font-bold text-sm uppercase tracking-widest">Bases disponíveis</p>
          {BASES.map(b => (
            <div key={b.key} className="flex items-center justify-between">
              <span className="text-white/80 text-sm">{b.label}</span>
              <span className="text-white font-semibold text-sm">R$ {b.price.toFixed(2).replace(".", ",")}/mês</span>
            </div>
          ))}
          <div className="border-t border-white/20 pt-3 flex items-center justify-between">
            <span className="text-white/60 text-xs">Selecione as que desejar</span>
            <span className="text-white text-xs font-medium">7 dias grátis</span>
          </div>
        </div>
      </aside>

      {/* ── Formulário ── */}
      <main className="flex flex-col items-center justify-center w-full lg:w-1/2 px-6 py-12 overflow-y-auto">
        <div className="lg:hidden mb-8">
          <Image src="/paideia-wordmark-light.svg" alt="Paideia" width={180} height={72} priority />
        </div>

        <div className="w-full max-w-md">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-brand-500 transition-colors mb-8">
            <ArrowLeft className="w-4 h-4" /> Voltar ao início
          </Link>

          {/* Indicador de passos */}
          <div className="flex items-center gap-2 mb-8">
            <div className={cn("flex items-center gap-2 text-sm font-semibold", step >= 1 ? "text-brand-600" : "text-gray-400")}>
              <span className={cn("w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold", step >= 1 ? "bg-brand-500 text-white" : "bg-gray-200 text-gray-500")}>1</span>
              Sua conta
            </div>
            <div className="flex-1 h-px bg-gray-200" />
            <div className={cn("flex items-center gap-2 text-sm font-semibold", step >= 2 ? "text-brand-600" : "text-gray-400")}>
              <span className={cn("w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold", step >= 2 ? "bg-brand-500 text-white" : "bg-gray-200 text-gray-500")}>2</span>
              Suas bases
            </div>
          </div>

          {/* ── PASSO 1: Dados da conta ── */}
          {step === 1 && (
            <>
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-ink">Crie sua conta</h1>
                <p className="text-gray-500 mt-1">Comece seus 7 dias gratuitos agora</p>
              </div>

              <button
                type="button"
                onClick={() => { setStep(2); }}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all text-sm font-semibold text-gray-700 shadow-sm disabled:opacity-50 mb-5"
              >
                <GoogleIcon /> Cadastrar com Google
              </button>

              <div className="relative mb-5">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
                <div className="relative flex justify-center"><span className="bg-white px-3 text-xs text-gray-400">ou preencha o formulário</span></div>
              </div>

              <form onSubmit={goToStep2} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Nome completo</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="Seu nome"
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand-400 text-sm" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">E-mail</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="seu@email.com"
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand-400 text-sm" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Senha</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type={showPass ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} required placeholder="Mínimo 6 caracteres"
                      className="w-full pl-10 pr-11 py-3 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand-400 text-sm" />
                    <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {password.length > 0 && (
                    <div className="mt-2">
                      <div className="flex gap-1">{[1,2,3,4].map(i => <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= passwordStrength ? strengthColor : "bg-gray-200"}`} />)}</div>
                      <p className="text-xs text-gray-400 mt-1">Força: {strengthLabel}</p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirmar senha</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type={showPass ? "text" : "password"} value={confirm} onChange={e => setConfirm(e.target.value)} required placeholder="Repita a senha"
                      className={`w-full pl-10 pr-4 py-3 border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand-400 text-sm ${confirm && confirm !== password ? "border-red-300" : "border-gray-200"}`} />
                    {confirm && confirm === password && <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />}
                  </div>
                </div>

                {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">{error}</div>}

                <button type="submit" disabled={isLoading}
                  className="w-full bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-xl py-3 transition-colors disabled:opacity-50 text-sm flex items-center justify-center gap-2">
                  Próximo — Escolher bases <ArrowRight className="w-4 h-4" />
                </button>

                <p className="text-xs text-gray-400 text-center">
                  Ao criar sua conta, você concorda com os <Link href="/termos" className="text-brand-500 hover:underline">Termos de Uso</Link> e a <Link href="/privacidade" className="text-brand-500 hover:underline">Política de Privacidade</Link>.
                </p>
              </form>

              <div className="relative my-6"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div><div className="relative flex justify-center text-xs text-gray-400 bg-white/0 px-3 mx-auto w-fit">Já tem conta?</div></div>
              <Link href="/auth/login" className="block w-full text-center border border-brand-300 text-brand-600 hover:bg-brand-50 font-semibold rounded-xl py-3 transition-colors text-sm">Fazer login</Link>
            </>
          )}

          {/* ── PASSO 2: Seleção de bases ── */}
          {step === 2 && (
            <>
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-ink">Escolha suas bases</h1>
                <p className="text-gray-500 mt-1">Selecione as abordagens que deseja acessar. Você poderá alterar depois.</p>
              </div>

              <div className="space-y-2 mb-6">
                {BASES.map(b => {
                  const on = selectedBases.includes(b.key);
                  return (
                    <button key={b.key} type="button" onClick={() => toggleBase(b.key)}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 text-left transition-all",
                        on ? "border-brand-500 bg-brand-50" : "border-gray-200 bg-white hover:border-gray-300"
                      )}>
                      <div className={cn("w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors",
                        on ? "border-brand-500 bg-brand-500" : "border-gray-300")}>
                        {on && <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><polyline points="1.5 5 4 7.5 8.5 2.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                      </div>
                      <div className="flex-1">
                        <p className={cn("text-sm font-semibold", on ? "text-brand-700" : "text-gray-800")}>{b.label}</p>
                      </div>
                      <span className={cn("text-sm font-bold flex-shrink-0", on ? "text-brand-600" : "text-gray-400")}>
                        R$ {b.price.toFixed(2).replace(".", ",")}
                        <span className="text-xs font-normal">/mês</span>
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Resumo */}
              <div className={cn("rounded-xl p-4 mb-5 border", selectedBases.length > 0 ? "bg-brand-50 border-brand-200" : "bg-gray-50 border-gray-200")}>
                <div className="flex items-center gap-2">
                  <BookOpen className={cn("w-4 h-4", selectedBases.length > 0 ? "text-brand-500" : "text-gray-400")} />
                  <span className="text-sm font-semibold text-gray-700">
                    {selectedBases.length === 0
                      ? "Nenhuma base selecionada"
                      : `${selectedBases.length} base${selectedBases.length > 1 ? "s" : ""} selecionada${selectedBases.length > 1 ? "s" : ""}`}
                  </span>
                  {selectedBases.length > 0 && (
                    <span className="ml-auto text-brand-700 font-bold text-sm">
                      R$ {total.toFixed(2).replace(".", ",")}/mês
                    </span>
                  )}
                </div>
                {selectedBases.length > 0 && (
                  <p className="text-xs text-brand-600 mt-1">7 dias grátis · sem cobrança imediata</p>
                )}
              </div>

              {/* Aceite ético */}
              <button
                type="button"
                onClick={() => setEthicsAccepted(v => !v)}
                className={cn(
                  "w-full flex items-start gap-3 px-4 py-3.5 rounded-xl border-2 text-left transition-all mb-4",
                  ethicsAccepted ? "border-amber-400 bg-amber-50" : "border-gray-200 bg-white hover:border-amber-200"
                )}
              >
                <span className={cn(
                  "w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center mt-0.5 transition-colors",
                  ethicsAccepted ? "border-amber-500 bg-amber-500" : "border-gray-300"
                )}>
                  {ethicsAccepted && <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><polyline points="1.5 5 4 7.5 8.5 2.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                </span>
                <span className="text-xs text-gray-700 leading-relaxed">
                  <strong className="text-amber-800">Recurso de apoio clínico — Res. CFP nº 21/2025</strong><br />
                  Estou ciente de que as respostas geradas pela IA são suporte ao raciocínio clínico e <strong>não substituem o juízo profissional do(a) psicólogo(a)</strong>. A decisão clínica é sempre minha.
                </span>
              </button>

              {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 mb-4">{error}</div>}

              <div className="space-y-3">
                {/* Se veio pelo Google (sem nome/email preenchidos) */}
                {!name && (
                  <button type="button" onClick={handleGoogle} disabled={isLoading || selectedBases.length === 0 || !ethicsAccepted}
                    className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all text-sm font-semibold text-gray-700 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed">
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin text-gray-400" /> : <GoogleIcon />}
                    Cadastrar com Google
                  </button>
                )}

                {/* Se veio pelo formulário */}
                {name && (
                  <button type="button" onClick={handleSubmit} disabled={isLoading || selectedBases.length === 0 || !ethicsAccepted}
                    className={cn(
                      "w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-colors",
                      selectedBases.length > 0 && ethicsAccepted && !isLoading
                        ? "bg-brand-500 hover:bg-brand-600 text-white"
                        : "bg-gray-100 text-gray-400 cursor-not-allowed"
                    )}>
                    {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Criando conta...</> : "Criar conta grátis"}
                  </button>
                )}

                <button type="button" onClick={() => { setStep(1); setError(""); }}
                  className="w-full flex items-center justify-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors py-2">
                  <ArrowLeft className="w-4 h-4" /> Voltar
                </button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
