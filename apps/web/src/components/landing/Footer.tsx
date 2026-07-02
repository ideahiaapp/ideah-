import Image from "next/image";
import Link from "next/link";

export function LandingFooter() {
  return (
    <footer className="bg-ink text-white">
      {/* CTA final */}
      <div className="bg-brand-500 py-16 text-center px-6">
        <h2 className="text-2xl md:text-3xl font-bold mb-3">
          Pronto para conversar com a teoria?
        </h2>
        <p className="text-white/70 mb-8 max-w-md mx-auto text-base">
          7 dias grátis com acesso completo. Sem cartão de crédito.
        </p>
        <Link
          href="/auth/register"
          className="inline-block bg-white text-brand-600 hover:bg-brand-50 font-bold px-10 py-4 rounded-xl text-base transition-colors shadow-lg"
        >
          Começar grátis agora
        </Link>
      </div>

      {/* Footer links */}
      <div className="max-w-6xl mx-auto px-6 py-12 grid md:grid-cols-4 gap-8">
        <div>
          <Image
            src="/paideia-wordmark-white.svg"
            alt="Paideia"
            width={120}
            height={48}
            className="mb-4"
          />
          <p className="text-white/50 text-xs leading-relaxed">
            Supervisão Clínica Dialógica.<br />
            Em conformidade com o CFP e a LGPD.
          </p>
        </div>

        <div>
          <p className="text-white/40 text-xs font-semibold uppercase tracking-widest mb-4">Produto</p>
          <ul className="space-y-3">
            {[["Como funciona", "#como-funciona"], ["Para quem", "#para-quem"], ["Ética e CFP", "#etica"], ["Preços", "#precos"]].map(([l, h]) => (
              <li key={l}>
                <a href={h} className="text-white/60 hover:text-white text-sm transition-colors">{l}</a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-white/40 text-xs font-semibold uppercase tracking-widest mb-4">Conta</p>
          <ul className="space-y-3">
            {[["Entrar", "/auth/login"], ["Criar conta", "/auth/register"], ["Recuperar senha", "/auth/forgot-password"]].map(([l, h]) => (
              <li key={l}>
                <Link href={h} className="text-white/60 hover:text-white text-sm transition-colors">{l}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-white/40 text-xs font-semibold uppercase tracking-widest mb-4">Legal</p>
          <ul className="space-y-3">
            {[["Termos de Uso", "/termos"], ["Política de Privacidade", "/privacidade"]].map(([l, h]) => (
              <li key={l}>
                <Link href={h} className="text-white/60 hover:text-white text-sm transition-colors">{l}</Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10 py-6 text-center">
        <p className="text-white/30 text-xs">
          © {new Date().getFullYear()} Paideia — Inteligência Dialógica. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
}
