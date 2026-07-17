import { MessageSquare, TrendingUp, FileText, GraduationCap } from "lucide-react";

const CARDS = [
  {
    icon: MessageSquare,
    title: "Supervisão Clínica",
    description: "Discuta casos reais dentro da sua abordagem e fortaleça seu raciocínio clínico.",
  },
  {
    icon: TrendingUp,
    title: "Evolução Clínica",
    description: "Organize longitudinalmente a evolução dos casos e acompanhe o percurso terapêutico de cada cliente.",
  },
  {
    icon: FileText,
    title: "Relatórios Inteligentes",
    description: "Produza documentos clínicos consistentes, organizados e fundamentados.",
  },
  {
    icon: GraduationCap,
    title: "Formação Clínica Continuada",
    description: "Cada supervisão amplia seu repertório clínico e fortalece sua prática profissional.",
  },
];

export function FeaturesSection() {
  return (
    <section className="py-24 md:py-32 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="font-serif text-3xl md:text-4xl text-ink leading-tight max-w-2xl mx-auto">
            Transforme cada supervisão em desenvolvimento profissional.
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {CARDS.map((c) => (
            <div
              key={c.title}
              className="bg-white rounded-2xl border border-gray-100 p-7 hover:border-brand-200 hover:shadow-sm transition-all"
            >
              <div className="w-11 h-11 rounded-xl bg-brand-50 flex items-center justify-center mb-5">
                <c.icon className="w-5 h-5 text-brand-500" strokeWidth={1.6} />
              </div>
              <h3 className="font-semibold text-ink text-base mb-2">{c.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{c.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
