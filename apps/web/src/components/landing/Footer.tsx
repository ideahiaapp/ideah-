import Image from "next/image";
import Link from "next/link";

export function LandingFooter() {
  return (
    <footer className="bg-ink text-white">
      {/* CTA final */}
      <div className="bg-brand-500 py-20 text-center px-6">
        <h2 className="font-serif text-2xl md:text-3xl mb-6 max-w-xl mx-auto leading-tight">
          A prática clínica não precisa ser um caminho solitário.
        </h2>
        <div className="text-white/90 mb-9 max-w-md mx-auto text-base leading-relaxed space-y-1">
          <p>Transforme cada caso em uma oportunidade de aprendizagem.</p>
          <p>Fortaleça seu raciocínio clínico.</p>
          <p>Desenvolva sua prática continuamente.</p>
          <p>Construa sua Formação Clínica Continuada.</p>
        </div>
        <Link
          href="/auth/register"
          className="inline-block bg-white text-brand-600 hover:bg-brand-50 font-bold px-10 py-4 rounded-xl text-base transition-colors shadow-lg"
        >
          Conhecer o Programa
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
            Formação Clínica Continuada.<br />
            Em conformidade com o CFP e a LGPD.
          </p>
        </div>

        <div>
          <p className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-4">Produto</p>
          <ul className="space-y-3">
            {[["Como funciona", "#como-funciona"], ["Benefícios", "#beneficios"], ["O Programa", "#programa"], ["Ética e CFP", "#etica"], ["Dúvidas", "#faq"]].map(([l, h]) => (
              <li key={l}>
                <a href={h} className="text-white/60 hover:text-white text-sm transition-colors">{l}</a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-4">Conta</p>
          <ul className="space-y-3">
            {[["Entrar", "/auth/login"], ["Criar conta", "/auth/register"], ["Recuperar senha", "/auth/forgot-password"]].map(([l, h]) => (
              <li key={l}>
                <Link href={h} className="text-white/60 hover:text-white text-sm transition-colors">{l}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-4">Legal</p>
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
        <p className="text-white/60 text-xs">
          © {new Date().getFullYear()} Paideia — Formação Clínica Continuada. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
}
