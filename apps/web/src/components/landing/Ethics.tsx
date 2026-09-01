import { UserCheck, Scale, Lock, ShieldCheck } from "lucide-react";

const POINTS = [
  {
    icon: UserCheck,
    title: "Você decide",
    description: "O julgamento, as decisões e a responsabilidade pela condução clínica permanecem com o profissional.",
  },
  {
    icon: Scale,
    title: "A teoria importa",
    description: "O processo de supervisão é organizado considerando a abordagem clínica escolhida pelo profissional.",
  },
  {
    icon: Lock,
    title: "Os dados importam",
    description: "O tratamento das informações segue as regras de consentimento, privacidade e proteção de dados adotadas pela plataforma.",
  },
];

export function EthicsSection() {
  return (
    <section id="etica" className="py-24 md:py-32 bg-sand-50">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-14">
          <h2 className="font-serif text-3xl md:text-4xl text-ink leading-tight max-w-2xl mx-auto">
            Tecnologia para apoiar o raciocínio, não para substituir o profissional.
          </h2>
        </div>

        <div className="grid sm:grid-cols-3 gap-6 mb-10">
          {POINTS.map((p) => (
            <div key={p.title} className="bg-white rounded-2xl border border-sand-100 p-7">
              <div className="w-11 h-11 rounded-xl bg-brand-50 flex items-center justify-center mb-5">
                <p.icon className="w-5 h-5 text-brand-500" strokeWidth={1.6} />
              </div>
              <h3 className="font-semibold text-ink text-xs uppercase tracking-widest mb-2">{p.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{p.description}</p>
            </div>
          ))}
        </div>

        <div className="flex items-start gap-3 max-w-2xl mx-auto text-center justify-center">
          <ShieldCheck className="w-4 h-4 text-brand-500 flex-shrink-0 mt-0.5" strokeWidth={1.8} />
          <p className="text-gray-500 text-sm leading-relaxed">
            O Paideia é um ambiente de supervisão e Formação Clínica Continuada. Não realiza diagnósticos e não
            substitui o julgamento profissional.
          </p>
        </div>
      </div>
    </section>
  );
}
