"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, Mail, User, CheckCircle2, ArrowLeft, Loader2, BookOpen, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth.store";

const BASES = [
  { key: "PSYCHOANALYSIS",       label: "Psicanálise Freudiana" },
  { key: "COGNITIVE_BEHAVIORAL", label: "TCC" },
  { key: "JUNGIAN",              label: "Junguiana" },
  { key: "SOMATIC",              label: "Somática / Corporal" },
  { key: "TANTRA",               label: "Sexualidade Humana e Tantra" },
  { key: "GESTALT",              label: "Gestalt-terapia" },
  { key: "PSYCHODRAMA",          label: "Psicodrama" },
  { key: "SYSTEMIC",             label: "Constelação Familiar" },
];

type Category = "individual";
type Billing  = "monthly" | "annual";

// Plano Clínica ainda não disponível — só Individual por enquanto.
const CATEGORIES: { key: Category; label: string; description: string; feature: string }[] = [
  { key: "individual", label: "Individual", description: "Para terapeutas autônomos", feature: "1 terapeuta" },
];

const MONTHLY_PRICE_PER_BASE = 147.00;
const ANNUAL_DISCOUNT = 0.2; // 20% off no plano anual
const ANNUAL_PRICE_PER_BASE = MONTHLY_PRICE_PER_BASE * (1 - ANNUAL_DISCOUNT);

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [step, setStep]           = useState<1 | 2 | 3 | 4>(1);
  const [name, setName]           = useState("");
  const [email, setEmail]         = useState("");
  const [password, setPassword]   = useState("");
  const [confirm, setConfirm]     = useState("");
  const [showPass, setShowPass]   = useState(false);
  const [billing, setBilling]     = useState<Billing>("monthly");
  const [selectedBases, setSelectedBases] = useState<string[]>([]);
  const [ethicsAccepted, setEthicsAccepted] = useState(false);
  const [error, setError]         = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [payLoading, setPayLoading] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const pricePerBase = billing === "annual" ? ANNUAL_PRICE_PER_BASE : MONTHLY_PRICE_PER_BASE;

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

  const total = selectedBases.length * pricePerBase;

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
    setPayLoading(true);
    try {
      // A conta só é criada de verdade quando o pagamento é confirmado (ver
      // /api/webhooks/greenn). Por enquanto guardamos um cadastro pendente.
      const res = await fetch("/api/auth/pending-registration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name, email, password,
          approaches: selectedBases,
          category: "individual",
          billing,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao registrar cadastro.");
      setPendingId(data.id);
      setStep(4);
    } catch (err: unknown) {
      const raw = err instanceof Error ? err.message : String(err);
      setError(raw || "Erro ao criar conta. Tente novamente.");
      setStep(3);
    } finally {
      setPayLoading(false);
    }
  }

  async function handlePayment() {
    setError("");
    setPayLoading(true);
    try {
      // TODO: integração real com a Greenn (app.greenn.club). O checkout precisa de
      // um valor dinâmico (total calculado acima), o que ainda depende de descobrir,
      // dentro do painel autenticado da Greenn, como ela aceita valor customizado
      // por link/API. O `pendingId` abaixo é a referência que o webhook usa para
      // encontrar o cadastro pendente e criar a conta após o pagamento confirmado.
      const checkoutBaseUrl = process.env.NEXT_PUBLIC_GREENN_CHECKOUT_URL;
      if (!checkoutBaseUrl) {
        setError("O checkout de pagamento ainda está sendo configurado. Assim que estiver disponível, você poderá concluir o pagamento e sua conta será criada automaticamente.");
        return;
      }
      const url = new URL(checkoutBaseUrl);
      url.searchParams.set("ref", pendingId ?? "");
      url.searchParams.set("amount", total.toFixed(2));
      window.location.href = url.toString();
    } finally {
      setPayLoading(false);
    }
  }

  /**
   * ⚠️ TEMPORÁRIO — cria a conta direto, sem pagamento, enquanto o checkout não
   * está configurado. Chama /api/auth/dev-complete-registration (ver comentário
   * lá). Remover este botão junto com a rota quando o pagamento estiver pronto.
   */
  async function handleTestBypass() {
    if (!pendingId) return;
    setError("");
    setPayLoading(true);
    try {
      const res = await fetch("/api/auth/dev-complete-registration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pendingId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao criar conta de teste.");
      await login(email, password);
      router.replace("/dashboard/home");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao criar conta de teste.");
    } finally {
      setPayLoading(false);
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
              <span className="text-white font-semibold text-sm">R$ {pricePerBase.toFixed(2).replace(".", ",")}/mês</span>
            </div>
          ))}
          <div className="border-t border-white/20 pt-3 flex items-center justify-between">
            <span className="text-white/60 text-xs">Selecione as que desejar</span>
            {billing === "annual" && <span className="text-white text-xs font-medium">20% off no anual</span>}
          </div>
        </div>
      </aside>

      {/* ── Formulário ── */}
      <main className="flex flex-col items-center justify-center w-full lg:w-1/2 px-6 py-12 overflow-y-auto">
        <div className="lg:hidden mb-8">
          <Image src="/paideia-wordmark-light.svg" alt="Paideia" width={180} height={72} priority />
        </div>

        <div className="w-full max-w-md">
          <Link href="/auth/login" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-brand-500 transition-colors mb-8">
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
              Seu plano
            </div>
            <div className="flex-1 h-px bg-gray-200" />
            <div className={cn("flex items-center gap-2 text-sm font-semibold", step >= 3 ? "text-brand-600" : "text-gray-400")}>
              <span className={cn("w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold", step >= 3 ? "bg-brand-500 text-white" : "bg-gray-200 text-gray-500")}>3</span>
              Suas bases
            </div>
            <div className="flex-1 h-px bg-gray-200" />
            <div className={cn("flex items-center gap-2 text-sm font-semibold", step >= 4 ? "text-brand-600" : "text-gray-400")}>
              <span className={cn("w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold", step >= 4 ? "bg-brand-500 text-white" : "bg-gray-200 text-gray-500")}>4</span>
              Pagamento
            </div>
          </div>

          {/* ── PASSO 1: Dados da conta ── */}
          {step === 1 && (
            <>
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-ink">Crie sua conta</h1>
                <p className="text-gray-500 mt-1">Preencha seus dados para continuar</p>
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
                    <button type="button" onClick={() => setShowPass(!showPass)} aria-label={showPass ? "Ocultar senha" : "Mostrar senha"} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
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

                <button type="submit"
                  className="w-full bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-xl py-3 transition-colors disabled:opacity-50 text-sm flex items-center justify-center gap-2">
                  Próximo — Escolher plano <ArrowRight className="w-4 h-4" />
                </button>

                <p className="text-xs text-gray-500 text-center">
                  Ao criar sua conta, você concorda com os <Link href="/termos" className="text-brand-500 hover:underline">Termos de Uso</Link> e a <Link href="/privacidade" className="text-brand-500 hover:underline">Política de Privacidade</Link>.
                </p>
              </form>

              <div className="relative my-6"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div><div className="relative flex justify-center text-xs text-gray-500 bg-white px-3 mx-auto w-fit">Já tem conta?</div></div>
              <Link href="/auth/login" className="block w-full text-center border border-brand-300 text-brand-600 hover:bg-brand-50 font-semibold rounded-xl py-3 transition-colors text-sm">Fazer login</Link>
            </>
          )}

          {/* ── PASSO 2: Escolha do plano ── */}
          {step === 2 && (
            <>
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-ink">Escolha seu plano</h1>
                <p className="text-gray-500 mt-1">Selecione o ciclo de cobrança. O preço final depende de quantas bases teóricas você escolher no próximo passo.</p>
              </div>

              {/* Categoria (só Individual por enquanto) */}
              <div className="flex items-center justify-between px-4 py-3.5 rounded-xl border-2 border-brand-500 bg-brand-50 mb-5">
                <div>
                  <p className="text-sm font-bold text-brand-700">{CATEGORIES[0].label}</p>
                  <p className="text-xs text-gray-500">{CATEGORIES[0].description}</p>
                </div>
                <span className="text-xs font-semibold text-brand-600">{CATEGORIES[0].feature}</span>
              </div>

              {/* Ciclo de cobrança */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <button type="button" onClick={() => setBilling("monthly")}
                  className={cn(
                    "text-left px-4 py-4 rounded-xl border-2 transition-all",
                    billing === "monthly" ? "border-brand-500 bg-brand-50" : "border-gray-200 bg-white hover:border-gray-300"
                  )}>
                  <p className={cn("text-sm font-bold", billing === "monthly" ? "text-brand-700" : "text-gray-800")}>Mensal</p>
                  <p className="text-xs text-gray-500 mt-1">R$ {MONTHLY_PRICE_PER_BASE.toFixed(2).replace(".", ",")}/base/mês</p>
                </button>
                <button type="button" onClick={() => setBilling("annual")}
                  className={cn(
                    "text-left px-4 py-4 rounded-xl border-2 transition-all relative",
                    billing === "annual" ? "border-brand-500 bg-brand-50" : "border-gray-200 bg-white hover:border-gray-300"
                  )}>
                  <span className="absolute top-3 right-3 bg-brand-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">20% OFF</span>
                  <p className={cn("text-sm font-bold", billing === "annual" ? "text-brand-700" : "text-gray-800")}>Anual</p>
                  <p className="text-xs text-gray-500 mt-1">R$ {ANNUAL_PRICE_PER_BASE.toFixed(2).replace(".", ",")}/base/mês</p>
                </button>
              </div>

              <button type="button" onClick={() => setStep(3)}
                className="w-full bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-xl py-3 transition-colors text-sm flex items-center justify-center gap-2 mb-3">
                Próximo — Escolher bases <ArrowRight className="w-4 h-4" />
              </button>

              <button type="button" onClick={() => setStep(1)}
                className="w-full flex items-center justify-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors py-2">
                <ArrowLeft className="w-4 h-4" /> Voltar
              </button>
            </>
          )}

          {/* ── PASSO 3: Seleção de bases ── */}
          {step === 3 && (
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
                        R$ {pricePerBase.toFixed(2).replace(".", ",")}
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
                <button type="button" onClick={handleSubmit} disabled={payLoading || selectedBases.length === 0 || !ethicsAccepted}
                  className={cn(
                    "w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-colors",
                    selectedBases.length > 0 && ethicsAccepted && !payLoading
                      ? "bg-brand-500 hover:bg-brand-600 text-white"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed"
                  )}>
                  {payLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Processando...</> : "Continuar para pagamento"}
                </button>

                <button type="button" onClick={() => { setStep(2); setError(""); }}
                  className="w-full flex items-center justify-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors py-2">
                  <ArrowLeft className="w-4 h-4" /> Voltar
                </button>
              </div>
            </>
          )}

          {/* ── PASSO 4: Pagamento (Greenn) ── */}
          {step === 4 && (
            <>
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-ink">Confirme e pague para ativar sua conta</h1>
                <p className="text-gray-500 mt-1">Sua conta é criada automaticamente assim que o pagamento for confirmado.</p>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-5 mb-6">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Resumo do pedido</p>
                <div className="space-y-2 mb-4">
                  {selectedBases.map(key => (
                    <div key={key} className="flex items-center justify-between text-sm">
                      <span className="text-gray-700">{BASES.find(b => b.key === key)?.label}</span>
                      <span className="text-gray-500">R$ {pricePerBase.toFixed(2).replace(".", ",")}/mês</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-gray-100 pt-3 flex items-center justify-between text-sm text-gray-500 mb-1">
                  <span>Plano {CATEGORIES[0].label} · {billing === "annual" ? "Anual" : "Mensal"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-700">Total</span>
                  <span className="text-lg font-bold text-brand-700">R$ {total.toFixed(2).replace(".", ",")}/mês</span>
                </div>
              </div>

              {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 mb-4">{error}</div>}

              <button type="button" onClick={handlePayment} disabled={payLoading}
                className="w-full bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-xl py-3 transition-colors disabled:opacity-50 text-sm flex items-center justify-center gap-2">
                {payLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Redirecionando...</> : "Ir para pagamento"}
              </button>

              <p className="text-xs text-gray-400 text-center mt-4">
                Você será redirecionado para o checkout seguro da Greenn.
              </p>

              {/* ⚠️ TEMPORÁRIO — remover quando o checkout de pagamento estiver configurado. */}
              <button type="button" onClick={handleTestBypass} disabled={payLoading}
                className="w-full mt-3 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 font-semibold rounded-xl py-2.5 transition-colors disabled:opacity-50 text-xs flex items-center justify-center gap-2">
                {payLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "⚠ Criar conta sem pagar (modo de teste)"}
              </button>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
