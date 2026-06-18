"use client";

import { useState, useEffect, useRef } from "react";
import { getApiKey, saveApiKey, removeApiKey, aiHeaders, maskApiKey } from "@/lib/api-key";
import { getClinicSettings, saveClinicSettings } from "@/lib/clinic-settings";
import {
  User, Lock, CreditCard, Key, Save, Loader2, CheckCircle2,
  Eye, EyeOff, Camera, ExternalLink, AlertTriangle, Sparkles,
  ChevronDown, ShieldCheck, Zap, Crown, Check, Copy, DollarSign,
  Scale, ShieldAlert, FileText, Info, BookOpen, Upload, Trash2,
  Users, ShieldOff,
} from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { cn } from "@/lib/utils";
import { VoiceInput, VoiceTextarea } from "@/components/ui/VoiceField";

type Tab = "perfil" | "seguranca" | "plano" | "api" | "base" | "etica" | "terapeutas";

/* ─── Helpers ─────────────────────────────────────── */
const inputCls = "w-full px-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-transparent text-gray-800 placeholder-gray-400";

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1.5">{label}</label>
      {children}
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}

function SaveButton({ saving, saved, disabled, onClick, label = "Salvar alterações" }: {
  saving: boolean; saved: boolean; disabled: boolean; onClick: () => void; label?: string;
}) {
  return (
    <button onClick={onClick} disabled={disabled || saving || saved}
      className={cn(
        "flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all",
        saved ? "bg-green-500 text-white"
          : !disabled && !saving ? "bg-brand-500 hover:bg-brand-600 text-white shadow-sm"
          : "bg-gray-100 text-gray-400 cursor-not-allowed"
      )}>
      {saved   ? <><CheckCircle2 className="w-4 h-4" /> Salvo!</>
       : saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</>
       :           <><Save className="w-4 h-4" /> {label}</>}
    </button>
  );
}

/* ─── Aba Perfil ─────────────────────────────────── */
function TabPerfil() {
  const { user } = useAuthStore();
  const [form, setForm] = useState({
    name:         user?.name ?? "",
    email:        user?.email ?? "",
    phone:        "",
    crp:          "",
    bio:          "",
    approach:     "Psicanálise",
    city:         "",
    instagram:    "",
  });
  const [saving,       setSaving]       = useState(false);
  const [saved,        setSaved]        = useState(false);
  const [avatarUrl,    setAvatarUrl]    = useState(user?.avatarUrl ?? "");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarError,  setAvatarError]  = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 2 * 1024 * 1024) { setAvatarError("Arquivo muito grande. Máx. 2MB."); return; }
    setAvatarError(null);
    setUploadingAvatar(true);
    try {
      const { supabase } = await import("@/lib/supabase");
      const ext  = file.name.split(".").pop();
      const path = `${user.id}/avatar.${ext}`;
      const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      const publicUrl = `${data.publicUrl}?t=${Date.now()}`;
      await supabase.auth.updateUser({ data: { avatar_url: publicUrl } });
      useAuthStore.setState(s => s.user ? { user: { ...s.user, avatarUrl: publicUrl } } : {});
      setAvatarUrl(publicUrl);
    } catch (err: unknown) {
      setAvatarError(err instanceof Error ? err.message : "Erro ao enviar foto.");
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function save() {
    setSaving(true);
    await new Promise(r => setTimeout(r, 900));
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  const initials = user?.name
    ? user.name.trim().split(/\s+/).slice(0, 2).map(w => w[0].toUpperCase()).join("")
    : "?";

  return (
    <div className="space-y-6">
      {/* Avatar */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <p className="text-sm font-semibold text-gray-700 mb-4">Foto de perfil</p>
        <div className="flex items-center gap-5">
          <div className="relative">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="w-20 h-20 rounded-2xl object-cover shadow-sm" />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-brand-500 flex items-center justify-center text-white text-2xl font-bold shadow-sm">
                {initials}
              </div>
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="absolute -bottom-1.5 -right-1.5 w-7 h-7 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm hover:bg-gray-50 transition-colors">
              {uploadingAvatar
                ? <Loader2 className="w-3.5 h-3.5 text-brand-500 animate-spin" />
                : <Camera className="w-3.5 h-3.5 text-gray-600" />}
            </button>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700">Carregar nova foto</p>
            <p className="text-xs text-gray-400 mt-0.5">PNG, JPG ou WEBP · Máx. 2MB</p>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="mt-2 text-xs text-brand-500 hover:text-brand-700 font-medium disabled:opacity-50">
              {uploadingAvatar ? "Enviando..." : "Selecionar arquivo"}
            </button>
            {avatarError && <p className="text-xs text-red-500 mt-1">{avatarError}</p>}
          </div>
          <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp"
            className="hidden" onChange={handleAvatarChange} />
        </div>
      </div>

      {/* Dados pessoais */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <p className="text-sm font-semibold text-gray-700">Dados pessoais</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <VoiceInput label="Nome completo"
            value={form.name} onChange={v => setForm(p => ({...p, name: v}))} />
          <Field label="E-mail" hint="Usado para login e notificações">
            <input type="email" value={form.email} onChange={e => setForm(p => ({...p, email: e.target.value}))} className={inputCls} />
          </Field>
          <VoiceInput label="Telefone / WhatsApp"
            value={form.phone} onChange={v => setForm(p => ({...p, phone: v}))}
            placeholder="(11) 99999-9999" />
          <VoiceInput label="CRP" hint="Número do seu registro profissional"
            value={form.crp} onChange={v => setForm(p => ({...p, crp: v}))}
            placeholder="00/000000" />
          <VoiceInput label="Cidade"
            value={form.city} onChange={v => setForm(p => ({...p, city: v}))}
            placeholder="Cidade — UF" />
          <VoiceInput label="Instagram profissional"
            value={form.instagram} onChange={v => setForm(p => ({...p, instagram: v}))}
            placeholder="@seu.perfil" />
        </div>
        <Field label="Abordagem principal">
          <div className="relative">
            <select value={form.approach} onChange={e => setForm(p => ({...p, approach: e.target.value}))}
              className={inputCls + " appearance-none pr-9"}>
              {["Psicanálise","TCC","Junguiana","Humanista","Sistêmica","Somática","Gestalt","ACT"].map(a => (
                <option key={a}>{a}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </Field>
        <VoiceTextarea label="Bio profissional" hint="Visível no seu perfil público (opcional)"
          rows={3} value={form.bio} onChange={v => setForm(p => ({...p, bio: v}))} />
      </div>

      {/* Configurações clínicas */}
      <ClinicSettingsBlock />

      <div className="flex justify-end">
        <SaveButton saving={saving} saved={saved} disabled={false} onClick={save} />
      </div>
    </div>
  );
}

/* ─── Bloco de configurações clínicas ─────────────────── */
function ClinicSettingsBlock() {
  const [cfg, setCfg]     = useState(() => getClinicSettings());
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);

  const DAYS = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];

  function toggleDay(d: string) {
    setCfg(p => ({
      ...p,
      workDays: p.workDays.includes(d) ? p.workDays.filter(x => x !== d) : [...p.workDays, d],
    }));
  }

  async function save() {
    setSaving(true);
    saveClinicSettings(cfg);
    await new Promise(r => setTimeout(r, 600));
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 bg-green-50 rounded-lg flex items-center justify-center">
          <DollarSign className="w-4 h-4 text-green-600" strokeWidth={1.8} />
        </div>
        <p className="text-sm font-semibold text-gray-700">Configurações clínicas</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Field label="Valor por sessão (R$)" hint="Usado nos relatórios de produção">
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-400">R$</span>
            <input
              type="number" min={0} step={10}
              value={cfg.sessionPrice}
              onChange={e => setCfg(p => ({ ...p, sessionPrice: Number(e.target.value) }))}
              className={inputCls + " pl-10"}
              placeholder="180"
            />
          </div>
        </Field>
        <Field label="Duração padrão (min)">
          <div className="relative">
            <select value={cfg.sessionDuration}
              onChange={e => setCfg(p => ({ ...p, sessionDuration: Number(e.target.value) }))}
              className={inputCls + " appearance-none pr-9"}>
              {[45, 50, 60, 90].map(d => <option key={d} value={d}>{d} min</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Início do expediente">
            <input type="time" value={cfg.workStart}
              onChange={e => setCfg(p => ({ ...p, workStart: e.target.value }))}
              className={inputCls} />
          </Field>
          <Field label="Fim do expediente">
            <input type="time" value={cfg.workEnd}
              onChange={e => setCfg(p => ({ ...p, workEnd: e.target.value }))}
              className={inputCls} />
          </Field>
        </div>
      </div>

      <Field label="Dias de atendimento">
        <div className="flex flex-wrap gap-2 mt-1">
          {DAYS.map(d => (
            <button key={d} type="button" onClick={() => toggleDay(d)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold border-2 transition-all",
                cfg.workDays.includes(d)
                  ? "bg-brand-500 border-brand-500 text-white"
                  : "bg-white border-gray-200 text-gray-500 hover:border-brand-300"
              )}>
              {d.slice(0, 3)}
            </button>
          ))}
        </div>
      </Field>

      <div className="flex items-center justify-between pt-1">
        <p className="text-xs text-gray-400">
          Receita mensal estimada: <strong className="text-gray-700">
            R$ {(cfg.sessionPrice * 16).toLocaleString("pt-BR")}
          </strong>
          <span className="text-gray-300 ml-1">(16 sessões/mês)</span>
        </p>
        <SaveButton saving={saving} saved={saved} disabled={false} onClick={save} label="Salvar configurações" />
      </div>
    </div>
  );
}

/* ─── Aba Segurança ──────────────────────────────── */
function TabSeguranca() {
  const [form, setForm]         = useState({ current: "", newPwd: "", confirm: "" });
  const [show, setShow]         = useState({ current: false, newPwd: false, confirm: false });
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);
  const [error, setError]       = useState<string | null>(null);

  function strength(pwd: string) {
    let score = 0;
    if (pwd.length >= 8)             score++;
    if (/[A-Z]/.test(pwd))           score++;
    if (/[0-9]/.test(pwd))           score++;
    if (/[^A-Za-z0-9]/.test(pwd))   score++;
    return score;
  }

  const sc = strength(form.newPwd);
  const strengthLabel = ["", "Fraca", "Razoável", "Boa", "Forte"][sc];
  const strengthColor = ["", "bg-red-400", "bg-yellow-400", "bg-blue-400", "bg-green-500"][sc];

  async function save() {
    setError(null);
    if (form.newPwd !== form.confirm) { setError("As senhas não coincidem."); return; }
    if (sc < 2) { setError("Escolha uma senha mais forte."); return; }
    setSaving(true);
    await new Promise(r => setTimeout(r, 900));
    setSaving(false); setSaved(true);
    setForm({ current: "", newPwd: "", confirm: "" });
    setTimeout(() => setSaved(false), 3000);
  }

  const canSave = form.current && form.newPwd && form.confirm;

  function ToggleEye({ field }: { field: keyof typeof show }) {
    return (
      <button type="button" onClick={() => setShow(p => ({...p, [field]: !p[field]}))}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
        {show[field] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <p className="text-sm font-semibold text-gray-700">Alterar senha</p>

        <Field label="Senha atual">
          <div className="relative">
            <input type={show.current ? "text" : "password"} value={form.current}
              onChange={e => setForm(p => ({...p, current: e.target.value}))}
              className={inputCls + " pr-10"} placeholder="••••••••" />
            <ToggleEye field="current" />
          </div>
        </Field>

        <Field label="Nova senha">
          <div className="relative">
            <input type={show.newPwd ? "text" : "password"} value={form.newPwd}
              onChange={e => setForm(p => ({...p, newPwd: e.target.value}))}
              className={inputCls + " pr-10"} placeholder="••••••••" />
            <ToggleEye field="newPwd" />
          </div>
          {form.newPwd && (
            <div className="mt-2 space-y-1">
              <div className="flex gap-1">
                {[1,2,3,4].map(i => (
                  <div key={i} className={cn("h-1 flex-1 rounded-full transition-colors", i <= sc ? strengthColor : "bg-gray-100")} />
                ))}
              </div>
              <p className={cn("text-xs font-medium", sc >= 3 ? "text-green-600" : sc === 2 ? "text-yellow-600" : "text-red-500")}>
                Força: {strengthLabel}
              </p>
            </div>
          )}
        </Field>

        <Field label="Confirmar nova senha">
          <div className="relative">
            <input type={show.confirm ? "text" : "password"} value={form.confirm}
              onChange={e => setForm(p => ({...p, confirm: e.target.value}))}
              className={inputCls + " pr-10"} placeholder="••••••••" />
            <ToggleEye field="confirm" />
          </div>
          {form.confirm && form.newPwd !== form.confirm && (
            <p className="text-xs text-red-500 mt-1">As senhas não coincidem.</p>
          )}
        </Field>

        {error && (
          <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <div className="flex justify-end">
          <SaveButton saving={saving} saved={saved} disabled={!canSave} onClick={save} label="Alterar senha" />
        </div>
      </div>

      {/* Sessões */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <p className="text-sm font-semibold text-gray-700 mb-4">Segurança da conta</p>
        <div className="space-y-3">
          {[
            { icon: ShieldCheck, label: "Autenticação em dois fatores", sub: "Adicione uma camada extra de segurança", badge: "Em breve", color: "text-gray-400" },
            { icon: Lock,        label: "Encerrar todas as sessões",    sub: "Desconectar de todos os dispositivos",  badge: "Encerrar", color: "text-red-500 hover:text-red-700 cursor-pointer" },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
              <div className="flex items-center gap-3">
                <item.icon className="w-4 h-4 text-gray-400" strokeWidth={1.8} />
                <div>
                  <p className="text-sm font-medium text-gray-700">{item.label}</p>
                  <p className="text-xs text-gray-400">{item.sub}</p>
                </div>
              </div>
              <span className={cn("text-xs font-semibold", item.color)}>{item.badge}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Aba Plano ──────────────────────────────────── */
function TabPlano() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");

  const plans = [
    {
      id: "trial",
      name: "Trial",
      price: { monthly: "Grátis", annual: "Grátis" },
      description: "14 dias para explorar a plataforma",
      features: ["Até 3 clientes", "10 supervisões IA", "Evoluções ilimitadas", "Acesso web"],
      current: true,
      cta: "Plano atual",
      highlight: false,
    },
    {
      id: "pro",
      name: "Pro",
      price: { monthly: "R$ 49,90", annual: "R$ 39,90" },
      priceSub: { monthly: "/mês", annual: "/mês (cobrado anualmente)" },
      description: "Para terapeutas em plena atividade",
      features: ["Clientes ilimitados", "Supervisões IA ilimitadas", "8 abordagens teóricas", "Evoluções e prontuários", "Acesso web + mobile", "Exportar prontuários (PDF)"],
      current: false,
      cta: "Assinar Pro",
      highlight: true,
    },
    {
      id: "clinic",
      name: "Clínica",
      price: { monthly: "R$ 129,90", annual: "R$ 99,90" },
      priceSub: { monthly: "/mês", annual: "/mês (cobrado anualmente)" },
      description: "Para clínicas e grupos de terapeutas",
      features: ["Tudo do Pro", "Até 5 terapeutas", "Painel administrativo", "Relatórios consolidados", "Suporte prioritário", "Treinamento da equipe"],
      current: false,
      cta: "Falar com vendas",
      highlight: false,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Status atual */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
            <Crown className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-amber-800">Você está no Trial</p>
            <p className="text-xs text-amber-600 mt-0.5">
              {"Trial ativo"}
            </p>
          </div>
        </div>
        <a href="#pro" className="bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors">
          Ver planos
        </a>
      </div>

      {/* Toggle cobrança */}
      <div className="flex items-center justify-center gap-3">
        <span className={cn("text-sm font-medium", billingCycle === "monthly" ? "text-gray-900" : "text-gray-400")}>Mensal</span>
        <button onClick={() => setBillingCycle(b => b === "monthly" ? "annual" : "monthly")}
          className={cn("relative w-12 h-6 rounded-full transition-colors", billingCycle === "annual" ? "bg-brand-500" : "bg-gray-200")}>
          <div className={cn("absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all", billingCycle === "annual" ? "left-7" : "left-1")} />
        </button>
        <span className={cn("text-sm font-medium", billingCycle === "annual" ? "text-gray-900" : "text-gray-400")}>
          Anual
          <span className="ml-1.5 text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-semibold">−20%</span>
        </span>
      </div>

      {/* Cards de plano */}
      <div className="grid md:grid-cols-3 gap-4" id="pro">
        {plans.map((plan) => (
          <div key={plan.id}
            className={cn(
              "rounded-2xl border-2 p-5 flex flex-col transition-all",
              plan.highlight ? "border-brand-400 shadow-lg shadow-brand-100 bg-white" : "border-gray-100 bg-white",
              plan.current && "opacity-80"
            )}>
            {plan.highlight && (
              <div className="flex justify-center mb-3">
                <span className="bg-brand-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Mais popular
                </span>
              </div>
            )}
            <p className="text-base font-bold text-gray-900">{plan.name}</p>
            <p className="text-xs text-gray-500 mt-0.5 mb-3">{plan.description}</p>
            <div className="mb-4">
              <span className="text-3xl font-black text-gray-900">{plan.price[billingCycle]}</span>
              {plan.priceSub && <span className="text-xs text-gray-400 ml-1">{plan.priceSub[billingCycle]}</span>}
            </div>
            <ul className="space-y-2 flex-1 mb-5">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-xs text-gray-600">
                  <Check className="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" strokeWidth={2.5} />
                  {f}
                </li>
              ))}
            </ul>
            <button disabled={plan.current}
              className={cn(
                "w-full py-2.5 rounded-xl text-sm font-semibold transition-colors",
                plan.current ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : plan.highlight ? "bg-brand-500 hover:bg-brand-600 text-white"
                  : "border border-gray-200 text-gray-700 hover:bg-gray-50"
              )}>
              {plan.cta}
            </button>
          </div>
        ))}
      </div>

      {/* Histórico */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <p className="text-sm font-semibold text-gray-700 mb-4">Histórico de cobrança</p>
        <div className="text-center py-6">
          <CreditCard className="w-8 h-8 text-gray-200 mx-auto mb-2" />
          <p className="text-sm text-gray-400">Nenhuma cobrança ainda</p>
          <p className="text-xs text-gray-300 mt-0.5">Seu histórico aparecerá aqui após a assinatura</p>
        </div>
      </div>
    </div>
  );
}

/* ─── Aba API Key ─────────────────────────────────── */
function TabAPI() {
  const [inputKey, setInputKey]     = useState("");
  // storedKey: valor decifrado em memória apenas, nunca persistido em claro
  const [storedKey, setStoredKey]   = useState("");
  const [loading, setLoading]       = useState(true);
  const [showKey, setShowKey]       = useState(false);
  const [saving, setSaving]         = useState(false);
  const [saved, setSaved]           = useState(false);
  const [testing, setTesting]       = useState(false);
  const [testResult, setTestResult] = useState<"ok" | "error" | null>(null);
  const [copied, setCopied]         = useState(false);
  const [removing, setRemoving]     = useState(false);

  // Decifra e carrega a chave ao montar
  useEffect(() => {
    getApiKey().then((k) => { setStoredKey(k); setLoading(false); });
  }, []);

  const hasKey = storedKey.length > 0;

  async function handleSave() {
    if (!inputKey.startsWith("sk-ant-")) return;
    setSaving(true);
    await saveApiKey(inputKey);   // cifra e persiste
    setStoredKey(inputKey);       // mantém decifrado só em memória
    setInputKey("");
    setSaving(false);
    setSaved(true);
    setTestResult(null);
    setTimeout(() => setSaved(false), 3000);
  }

  async function handleRemove() {
    setRemoving(true);
    removeApiKey();
    setStoredKey("");
    setTestResult(null);
    setRemoving(false);
  }

  async function handleTest() {
    setTesting(true); setTestResult(null);
    try {
      const res = await fetch("/api/supervision/chat", {
        method: "POST",
        headers: await aiHeaders(),
        body: JSON.stringify({
          messages: [{ role: "user", content: "Teste de conexão. Responda apenas com a palavra: OK" }],
          approach: "PSYCHOANALYSIS",
          clientName: "teste",
        }),
      });
      setTestResult(res.ok ? "ok" : "error");
    } catch {
      setTestResult("error");
    } finally {
      setTesting(false);
    }
  }

  async function copyKey() {
    await navigator.clipboard.writeText(storedKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const isValidFormat = inputKey.startsWith("sk-ant-");

  return (
    <div className="space-y-6">
      {/* Explicação */}
      <div className="bg-gradient-to-br from-purple-50 to-brand-50 border border-purple-100 rounded-2xl p-5 flex items-start gap-4">
        <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-5 h-5 text-purple-600" />
        </div>
        <div>
          <p className="text-sm font-bold text-purple-800">API Key da Anthropic (Claude)</p>
          <p className="text-xs text-purple-600 mt-1 leading-relaxed">
            A Supervisão com IA e as sugestões de hipóteses em Evoluções funcionam com o modelo Claude da Anthropic.
            Informe sua chave aqui — ela será usada automaticamente em todas as funcionalidades de IA.
          </p>
          <a href="https://console.anthropic.com/" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1 mt-2 text-xs font-semibold text-purple-700 hover:text-purple-900">
            Obter chave no console da Anthropic <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Status da chave atual */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-semibold text-gray-700">Status da integração</p>
          {hasKey ? (
            <span className="flex items-center gap-1.5 text-xs text-green-600 bg-green-50 border border-green-100 px-2.5 py-1 rounded-full font-medium">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
              Chave configurada
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 border border-amber-100 px-2.5 py-1 rounded-full font-medium">
              <span className="w-1.5 h-1.5 bg-amber-400 rounded-full" />
              Não configurada
            </span>
          )}
        </div>

        {loading ? (
          <div className="flex items-center gap-2 py-4 text-xs text-gray-400">
            <Loader2 className="w-4 h-4 animate-spin" /> Carregando...
          </div>
        ) : hasKey ? (
          <>
            <div className="flex items-center gap-3">
              <div className="flex-1 flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 min-w-0">
                <Key className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="text-sm font-mono text-gray-600 truncate">
                  {showKey ? storedKey : maskApiKey(storedKey)}
                </span>
              </div>
              <button onClick={() => setShowKey(s => !s)}
                className="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-gray-400 flex-shrink-0">
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
              <button onClick={copyKey}
                className="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-gray-400 flex-shrink-0">
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            {/* Testar + remover */}
            <div className="mt-4 flex items-center gap-3 flex-wrap">
              <button onClick={handleTest} disabled={testing}
                className="flex items-center gap-1.5 px-4 py-2 bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 text-xs font-semibold rounded-xl transition-colors">
                {testing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                Testar conexão
              </button>
              {testResult === "ok" && (
                <span className="flex items-center gap-1.5 text-xs text-green-600 font-medium">
                  <CheckCircle2 className="w-4 h-4" /> Conexão OK — Claude respondendo!
                </span>
              )}
              {testResult === "error" && (
                <span className="flex items-center gap-1.5 text-xs text-red-500 font-medium">
                  <AlertTriangle className="w-4 h-4" /> Falhou — verifique a chave
                </span>
              )}
              <button onClick={handleRemove} disabled={removing}
                className="ml-auto text-xs text-red-400 hover:text-red-600 font-medium transition-colors">
                {removing ? "Removendo..." : "Remover chave"}
              </button>
            </div>
          </>
        ) : (
          <div className="text-center py-4">
            <Key className="w-8 h-8 text-gray-200 mx-auto mb-2" />
            <p className="text-sm text-gray-400">Nenhuma chave configurada</p>
            <p className="text-xs text-gray-300 mt-0.5">As funcionalidades de IA ficarão indisponíveis</p>
          </div>
        )}
      </div>

      {/* Campo para inserir/atualizar */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <p className="text-sm font-semibold text-gray-700">
          {hasKey ? "Substituir chave" : "Inserir API Key"}
        </p>

        <Field
          label="API Key da Anthropic"
          hint="Começa com sk-ant-... · Armazenada localmente no seu navegador."
        >
          <div className="relative">
            <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type={showKey ? "text" : "password"}
              value={inputKey}
              onChange={e => setInputKey(e.target.value)}
              placeholder="sk-ant-api03-..."
              className={inputCls + " pl-9 pr-10 font-mono"}
            />
            <button type="button" onClick={() => setShowKey(s => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {inputKey && !isValidFormat && (
            <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              Formato inválido. A chave deve começar com <code className="bg-red-50 px-1 rounded">sk-ant-</code>
            </p>
          )}
          {inputKey && isValidFormat && (
            <p className="text-xs text-green-600 mt-1.5 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Formato válido ✓
            </p>
          )}
        </Field>

        <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-xs text-amber-700">
          <p className="font-semibold mb-0.5">⚠️ Sobre custos de uso</p>
          Cada conversa de supervisão consome tokens da API Anthropic. O modelo usado é o <strong>claude-opus-4-5</strong>.
          Acompanhe seu uso em <a href="https://console.anthropic.com/usage" target="_blank" className="underline">console.anthropic.com/usage</a>.
        </div>

        <div className="flex justify-end">
          <SaveButton saving={saving} saved={saved} disabled={!isValidFormat} onClick={handleSave} label="Salvar e ativar chave" />
        </div>
      </div>

      {/* Fallback .env.local */}
      <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5">
        <p className="text-xs font-semibold text-gray-600 mb-2">💡 Alternativa para produção: variável de ambiente</p>
        <p className="text-xs text-gray-500 mb-3">
          Se você hospeda o app no servidor, defina a chave como variável de ambiente — ela será usada como fallback caso nenhuma chave esteja salva pelo usuário:
        </p>
        <div className="bg-gray-900 rounded-xl px-4 py-3 font-mono text-xs text-green-400">
          <span className="text-gray-500"># apps/web/.env.local</span><br />
          ANTHROPIC_API_KEY=sk-ant-api03-sua-chave-aqui
        </div>
      </div>
    </div>
  );
}

/* ─── Aba Ética CFP ──────────────────────────────── */
function TabEtica() {
  const [confirmed, setConfirmed] = useState({
    nodiag: false,
    juizo: false,
    sigilo: false,
    lgpd: false,
  });

  const allConfirmed = Object.values(confirmed).every(Boolean);

  return (
    <div className="space-y-6">
      {/* Banner de referência */}
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-4">
        <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
          <Scale className="w-5 h-5 text-amber-700" strokeWidth={1.8} />
        </div>
        <div>
          <p className="text-sm font-bold text-amber-900">Resolução CFP nº 21/2025</p>
          <p className="text-xs text-amber-700 mt-1 leading-relaxed">
            Esta plataforma foi projetada em conformidade com as orientações do Conselho Federal de Psicologia
            para o uso de Inteligência Artificial na prática profissional. O profissional é o único responsável
            pelo juízo clínico e pelas decisões tomadas a partir do conteúdo gerado pela IA.
          </p>
          <a
            href="https://site.cfp.org.br/resolucoes/resolucao-cfp-no-21-2025/"
            target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1 mt-2 text-xs font-semibold text-amber-700 hover:text-amber-900"
          >
            Ler a resolução completa <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Compromissos do profissional */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-brand-50 rounded-lg flex items-center justify-center">
            <ShieldCheck className="w-4 h-4 text-brand-500" strokeWidth={1.8} />
          </div>
          <p className="text-sm font-semibold text-gray-700">Compromissos éticos do profissional</p>
        </div>
        <p className="text-xs text-gray-500">
          Confirme que está ciente das suas responsabilidades no uso desta ferramenta, conforme a Res. CFP nº 21/2025:
        </p>
        <div className="space-y-3">
          {[
            {
              id: "nodiag" as const,
              title: "Sem diagnóstico automático",
              desc: "Compreendo que a IA não realiza diagnósticos. Toda hipótese diagnóstica é de minha exclusiva responsabilidade profissional.",
            },
            {
              id: "juizo" as const,
              title: "Juízo clínico humano",
              desc: "Reconheço que as sugestões da IA são apenas suporte ao meu raciocínio. O juízo clínico final é sempre meu.",
            },
            {
              id: "sigilo" as const,
              title: "Sigilo e proteção de dados",
              desc: "Comprometo-me a não inserir dados que identifiquem diretamente o(a) paciente nas interações com a IA. Usarei pseudonimização sempre que possível.",
            },
            {
              id: "lgpd" as const,
              title: "Consentimento e LGPD",
              desc: "Obtive o TCLE (Termo de Consentimento Livre e Esclarecido) de cada pessoa atendida antes de cadastrá-la nesta plataforma.",
            },
          ].map(item => (
            <label key={item.id} className="flex items-start gap-3 cursor-pointer group">
              <div
                className={cn(
                  "w-5 h-5 rounded-md border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-colors",
                  confirmed[item.id] ? "border-brand-500 bg-brand-500" : "border-gray-300 group-hover:border-brand-300"
                )}
                onClick={() => setConfirmed(p => ({ ...p, [item.id]: !p[item.id] }))}
              >
                {confirmed[item.id] && (
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <polyline points="1.5 5 4 7.5 8.5 2.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-700">{item.title}</p>
                <p className="text-xs text-gray-500 leading-relaxed mt-0.5">{item.desc}</p>
              </div>
            </label>
          ))}
        </div>
        {allConfirmed && (
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-xs text-green-800">
            <ShieldCheck className="w-4 h-4 text-green-600 flex-shrink-0" strokeWidth={1.8} />
            <span>Todos os compromissos confirmados. Obrigado por usar o ideah com responsabilidade ética.</span>
          </div>
        )}
      </div>

      {/* Como o ideah protege os dados */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center">
            <ShieldAlert className="w-4 h-4 text-blue-500" strokeWidth={1.8} />
          </div>
          <p className="text-sm font-semibold text-gray-700">Como o ideah protege os dados clínicos</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { icon: FileText, title: "Pseudonimização opcional", desc: "Você pode ativar a pseudonimização por cliente, impedindo que o nome real apareça nas interações com a IA." },
            { icon: Info,     title: "Base fechada de conhecimento", desc: "A IA responde apenas com base em referências teóricas curadas. Não acessa dados de outros usuários." },
            { icon: Lock,     title: "API Key local", desc: "Sua chave da Anthropic é armazenada localmente no navegador, criptografada. O servidor não a vê." },
            { icon: ShieldCheck, title: "Sem retenção para treino", desc: "Os dados clínicos não são usados para treinar modelos. Consulte a política de privacidade da Anthropic." },
          ].map(item => (
            <div key={item.title} className="flex items-start gap-3 bg-gray-50 rounded-xl p-3">
              <item.icon className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" strokeWidth={1.8} />
              <div>
                <p className="text-xs font-semibold text-gray-700">{item.title}</p>
                <p className="text-xs text-gray-500 leading-relaxed mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Aba Base de Conhecimento (admin only) ────────── */
const APPROACH_LIST = [
  { key: "PSYCHOANALYSIS",       label: "Psicanálise Freudiana" },
  { key: "COGNITIVE_BEHAVIORAL", label: "TCC" },
  { key: "JUNGIAN",              label: "Junguiana" },
  { key: "SOMATIC",              label: "Somática / Corporal" },
  { key: "GESTALT",              label: "Gestalt-terapia" },
  { key: "PSYCHODRAMA",          label: "Psicodrama" },
  { key: "SYSTEMIC",             label: "Constelação Familiar" },
];

function TabBase() {
  const { user } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  type RagDoc = { id: string; name: string; size_bytes: number; chunk_count: number; approach: string; created_at: string };
  const [docs,        setDocs]        = useState<RagDoc[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [uploading,   setUploading]   = useState(false);
  const [uploadMsg,   setUploadMsg]   = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [deleting,    setDeleting]    = useState<string | null>(null);
  const [approach,    setApproach]    = useState("PSYCHOANALYSIS");

  function loadDocs() {
    if (!user) return;
    fetch(`/api/rag/documents?therapistId=${user.id}`)
      .then(r => r.json())
      .then(d => setDocs(d.documents ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(loadDocs, [user]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length || !user) return;
    e.target.value = "";
    setUploading(true);
    setUploadMsg(null);

    const label = APPROACH_LIST.find(a => a.key === approach)?.label ?? approach;
    const results = { ok: 0, fail: 0, errors: [] as string[] };

    for (const file of files) {
      try {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("therapistId", user.id);
        fd.append("approach", approach);
        const res = await fetch("/api/rag/upload", { method: "POST", body: fd });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        results.ok++;
      } catch (err) {
        results.fail++;
        results.errors.push(`${file.name}: ${err instanceof Error ? err.message : "erro"}`);
      }
    }

    if (results.fail === 0) {
      setUploadMsg({ type: "ok", text: `${results.ok} arquivo(s) indexado(s) em ${label}.` });
    } else if (results.ok === 0) {
      setUploadMsg({ type: "err", text: results.errors[0] });
    } else {
      setUploadMsg({ type: "ok", text: `${results.ok} indexado(s), ${results.fail} com erro. ${results.errors[0]}` });
    }

    loadDocs();
    setUploading(false);
  }

  async function handleDelete(docId: string) {
    if (!user) return;
    setDeleting(docId);
    try {
      await fetch("/api/rag/documents", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId: docId, therapistId: user.id }),
      });
      setDocs(prev => prev.filter(d => d.id !== docId));
    } finally {
      setDeleting(null);
    }
  }

  function fmtSize(bytes: number) {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }

  // Agrupa por abordagem
  const grouped = APPROACH_LIST.map(ap => ({
    ...ap,
    docs: docs.filter(d => d.approach === ap.key),
  })).filter(g => g.docs.length > 0);

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl p-5 flex items-start gap-4">
        <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
          <BookOpen className="w-5 h-5 text-indigo-600" strokeWidth={1.8} />
        </div>
        <div>
          <p className="text-sm font-bold text-indigo-800">Base de Conhecimento — RAG</p>
          <p className="text-xs text-indigo-600 mt-1 leading-relaxed">
            Envie livros e artigos por abordagem teórica. O supervisor IA consultará automaticamente os materiais da abordagem selecionada em cada supervisão.
          </p>
        </div>
      </div>

      {/* Upload */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <p className="text-sm font-semibold text-gray-700">Enviar documento</p>

        {/* Seletor de abordagem */}
        <Field label="Abordagem teórica">
          <div className="relative">
            <select value={approach} onChange={e => setApproach(e.target.value)}
              className={inputCls + " appearance-none pr-9"}>
              {APPROACH_LIST.map(a => (
                <option key={a.key} value={a.key}>{a.label}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </Field>

        <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
          className={cn(
            "w-full flex flex-col items-center gap-3 py-8 rounded-xl border-2 border-dashed transition-colors",
            uploading ? "border-gray-200 bg-gray-50 cursor-not-allowed"
                      : "border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50 cursor-pointer"
          )}>
          {uploading
            ? <Loader2 className="w-7 h-7 text-indigo-400 animate-spin" />
            : <Upload className="w-7 h-7 text-indigo-300" strokeWidth={1.5} />}
          <div className="text-center">
            <p className="text-sm font-semibold text-gray-600">{uploading ? "Indexando…" : "Clique para selecionar"}</p>
            <p className="text-xs text-gray-400 mt-0.5">PDF ou TXT · Múltiplos arquivos · Máx. 200MB cada</p>
          </div>
        </button>

        <input ref={fileInputRef} type="file" accept=".pdf,.txt,application/pdf,text/plain"
          multiple className="hidden" onChange={handleUpload} />

        {uploadMsg && (
          <div className={cn(
            "flex items-center gap-2 rounded-xl px-4 py-3 text-xs font-medium",
            uploadMsg.type === "ok" ? "bg-green-50 border border-green-100 text-green-700"
                                   : "bg-red-50 border border-red-100 text-red-600"
          )}>
            {uploadMsg.type === "ok"
              ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              : <AlertTriangle className="w-4 h-4 flex-shrink-0" />}
            {uploadMsg.text}
          </div>
        )}
      </div>

      {/* Documentos agrupados por abordagem */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <p className="text-sm font-semibold text-gray-700 mb-4">
          Documentos indexados
          {docs.length > 0 && <span className="ml-2 text-xs font-normal text-gray-400">({docs.length} no total)</span>}
        </p>

        {loading ? (
          <div className="flex items-center gap-2 py-6 text-xs text-gray-400 justify-center">
            <Loader2 className="w-4 h-4 animate-spin" /> Carregando…
          </div>
        ) : grouped.length === 0 ? (
          <div className="text-center py-8">
            <BookOpen className="w-8 h-8 text-gray-200 mx-auto mb-2" strokeWidth={1.5} />
            <p className="text-sm text-gray-400">Nenhum documento ainda</p>
            <p className="text-xs text-gray-300 mt-0.5">Selecione uma abordagem e envie um PDF ou TXT</p>
          </div>
        ) : (
          <div className="space-y-5">
            {grouped.map(group => (
              <div key={group.key}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold text-indigo-600 uppercase tracking-wide">{group.label}</span>
                  <span className="text-xs text-gray-400">({group.docs.length})</span>
                </div>
                <div className="space-y-1.5">
                  {group.docs.map(doc => (
                    <div key={doc.id} className="flex items-center gap-3 py-2.5 px-4 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
                      <FileText className="w-4 h-4 text-indigo-300 flex-shrink-0" strokeWidth={1.8} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{doc.name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {fmtSize(doc.size_bytes)} · {doc.chunk_count} trechos · {new Date(doc.created_at).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                      <button onClick={() => handleDelete(doc.id)} disabled={deleting === doc.id}
                        className="p-1.5 text-gray-300 hover:text-red-400 transition-colors rounded-lg hover:bg-red-50 flex-shrink-0">
                        {deleting === doc.id
                          ? <Loader2 className="w-4 h-4 animate-spin" />
                          : <Trash2 className="w-4 h-4" strokeWidth={1.8} />}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Aba Terapeutas (admin) ─────────────────────── */
type TherapistRow = {
  userId: string; email: string; name: string; blocked: boolean; createdAt: string;
};

function TabTerapeutas() {
  const { user } = useAuthStore();
  const [list, setList]       = useState<TherapistRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);
  const [error, setError]     = useState("");

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/therapists", {
      headers: { "x-admin-email": user?.email ?? "" },
    });
    if (res.ok) setList(await res.json());
    else setError("Erro ao carregar terapeutas.");
    setLoading(false);
  }

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function toggle(userId: string, blocked: boolean) {
    setToggling(userId);
    const res = await fetch("/api/admin/therapists", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-admin-email": user?.email ?? "" },
      body: JSON.stringify({ userId, blocked }),
    });
    if (res.ok) setList(prev => prev.map(t => t.userId === userId ? { ...t, blocked } : t));
    else setError("Erro ao atualizar acesso.");
    setToggling(null);
  }

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-brand-400" /></div>;

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
      <div>
        <h2 className="font-semibold text-gray-900">Terapeutas com acesso</h2>
        <p className="text-sm text-gray-500 mt-0.5">Gerencie quem pode acessar a plataforma IDEAh.</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">{error}</div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-xs text-gray-400 font-semibold uppercase tracking-wide">
              <th className="pb-2 pr-4">Nome</th>
              <th className="pb-2 pr-4">E-mail</th>
              <th className="pb-2 pr-4">Cadastro</th>
              <th className="pb-2 pr-4">Status</th>
              <th className="pb-2">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {list.map(t => (
              <tr key={t.userId} className="hover:bg-gray-50/50">
                <td className="py-3 pr-4 font-medium text-gray-800">{t.name}</td>
                <td className="py-3 pr-4 text-gray-500">{t.email}</td>
                <td className="py-3 pr-4 text-gray-400">
                  {new Date(t.createdAt).toLocaleDateString("pt-BR")}
                </td>
                <td className="py-3 pr-4">
                  <span className={cn(
                    "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold",
                    t.blocked
                      ? "bg-red-50 text-red-600 border border-red-200"
                      : "bg-green-50 text-green-600 border border-green-200"
                  )}>
                    {t.blocked ? <ShieldOff className="w-3 h-3" /> : <ShieldCheck className="w-3 h-3" />}
                    {t.blocked ? "Bloqueado" : "Ativo"}
                  </span>
                </td>
                <td className="py-3">
                  <button
                    onClick={() => toggle(t.userId, !t.blocked)}
                    disabled={toggling === t.userId || t.email === user?.email}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed",
                      t.blocked
                        ? "bg-green-50 text-green-700 hover:bg-green-100 border border-green-200"
                        : "bg-red-50 text-red-700 hover:bg-red-100 border border-red-200"
                    )}
                  >
                    {toggling === t.userId
                      ? <Loader2 className="w-3 h-3 animate-spin" />
                      : t.blocked ? "Liberar acesso" : "Bloquear"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {list.length === 0 && (
          <p className="text-center text-gray-400 text-sm py-8">Nenhum terapeuta cadastrado ainda.</p>
        )}
      </div>
    </div>
  );
}

/* ─── Página principal ───────────────────────────── */
export default function SettingsPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === "admin";
  const [tab, setTab] = useState<Tab>("perfil");
  const [apiKeyConfigured, setApiKeyConfigured] = useState(false);

  useEffect(() => {
    setApiKeyConfigured(hasApiKey());
    // Re-verifica sempre que a aba muda (usuário pode ter salvo)
  }, [tab]);

  function hasApiKey() {
    if (typeof window === "undefined") return false;
    return (localStorage.getItem("ideah_anthropic_api_key") || "").length > 0;
  }

  const tabs = [
    { id: "perfil"      as Tab, label: "Perfil",       icon: User,       adminOnly: false },
    { id: "seguranca"   as Tab, label: "Segurança",    icon: Lock,       adminOnly: false },
    { id: "plano"       as Tab, label: "Plano",        icon: CreditCard, adminOnly: false },
    { id: "api"         as Tab, label: "API Key",      icon: Key,        adminOnly: false },
    { id: "base"        as Tab, label: "Base RAG",     icon: BookOpen,   adminOnly: true  },
    { id: "etica"       as Tab, label: "Ética CFP",    icon: Scale,      adminOnly: false },
    { id: "terapeutas"  as Tab, label: "Terapeutas",   icon: Users,      adminOnly: true  },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-ink">Configurações</h1>
        <p className="text-gray-500 text-sm mt-1">Gerencie sua conta, segurança e integrações</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit overflow-x-auto">
        {tabs.filter(t => !t.adminOnly || isAdmin).map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap",
              tab === t.id ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"
            )}>
            <t.icon className="w-3.5 h-3.5" strokeWidth={1.8} />
            {t.label}
            {t.id === "api" && (
              <span
                className={cn("w-1.5 h-1.5 rounded-full ml-0.5", apiKeyConfigured ? "bg-green-400" : "bg-amber-400")}
                title={apiKeyConfigured ? "API Key configurada" : "API Key não configurada"}
              />
            )}
          </button>
        ))}
      </div>

      {/* Conteúdo */}
      {tab === "perfil"     && <TabPerfil />}
      {tab === "seguranca"  && <TabSeguranca />}
      {tab === "plano"      && <TabPlano />}
      {tab === "api"        && <TabAPI />}
      {tab === "base"       && <TabBase />}
      {tab === "etica"      && <TabEtica />}
      {tab === "terapeutas" && <TabTerapeutas />}
    </div>
  );
}
