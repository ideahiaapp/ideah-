"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, CheckCircle2, AlertTriangle, ArrowLeft } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [checkingSession, setCheckingSession] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const [password, setPassword]     = useState("");
  const [confirm, setConfirm]       = useState("");
  const [showPass, setShowPass]     = useState(false);
  const [saving, setSaving]         = useState(false);
  const [saved, setSaved]           = useState(false);
  const [error, setError]           = useState("");

  // O link do e-mail de recuperação abre esta página com o token de sessão de
  // recuperação na própria URL — o cliente Supabase já detecta e autentica
  // automaticamente (detectSessionInUrl), só precisamos confirmar que funcionou.
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setHasSession(!!data.session);
      setCheckingSession(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setHasSession(!!session);
    });
    return () => subscription.unsubscribe();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password !== confirm) { setError("As senhas não coincidem."); return; }
    if (password.length < 6)  { setError("A senha deve ter pelo menos 6 caracteres."); return; }
    setSaving(true);
    try {
      const { error: updateErr } = await supabase.auth.updateUser({ password });
      if (updateErr) throw updateErr;
      setSaved(true);
      setTimeout(() => router.replace("/dashboard/home"), 1500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao redefinir senha.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-auth-gradient flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-10">
          <Image src="/paideia-wordmark-light.svg" alt="Paideia" width={180} height={72} priority />
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          {checkingSession ? (
            <p className="text-sm text-gray-500 text-center py-4">Verificando link...</p>
          ) : !hasSession ? (
            <div className="text-center py-4 space-y-4">
              <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto" />
              <div>
                <h1 className="text-lg font-bold text-ink">Link inválido ou expirado</h1>
                <p className="text-gray-500 text-sm mt-1">Solicite um novo link de recuperação de senha.</p>
              </div>
              <Link href="/auth/forgot-password" className="inline-block bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-xl py-2.5 px-6 text-sm transition-colors">
                Solicitar novo link
              </Link>
            </div>
          ) : saved ? (
            <div className="text-center py-4 space-y-3">
              <CheckCircle2 className="w-14 h-14 text-brand-500 mx-auto" />
              <h1 className="text-lg font-bold text-ink">Senha redefinida!</h1>
              <p className="text-gray-500 text-sm">Redirecionando para o painel...</p>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h1 className="text-xl font-bold text-ink">Defina sua nova senha</h1>
                <p className="text-gray-500 text-sm mt-1">Escolha uma senha com pelo menos 6 caracteres.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Nova senha</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type={showPass ? "text" : "password"}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      placeholder="Mínimo 6 caracteres"
                      className="w-full pl-10 pr-11 py-3 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand-400 text-sm"
                    />
                    <button type="button" onClick={() => setShowPass(!showPass)} aria-label={showPass ? "Ocultar senha" : "Mostrar senha"} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirmar nova senha</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type={showPass ? "text" : "password"}
                      value={confirm}
                      onChange={e => setConfirm(e.target.value)}
                      required
                      placeholder="Repita a senha"
                      className={`w-full pl-10 pr-4 py-3 border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand-400 text-sm ${confirm && confirm !== password ? "border-red-300" : "border-gray-200"}`}
                    />
                  </div>
                </div>

                {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">{error}</div>}

                <button type="submit" disabled={saving}
                  className="w-full bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-xl py-3 transition-colors disabled:opacity-50 text-sm">
                  {saving ? "Salvando..." : "Redefinir senha"}
                </button>
              </form>
            </>
          )}

          <div className="mt-6 pt-6 border-t border-gray-100">
            <Link href="/auth/login" className="flex items-center justify-center gap-2 text-sm text-brand-600 hover:text-brand-700 font-medium">
              <ArrowLeft className="w-4 h-4" />
              Voltar para o login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
