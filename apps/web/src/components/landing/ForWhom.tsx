import Link from "next/link";

const PERSONAS = [
  {
    emoji: "🌱",
    tag: "Iniciante (recém-formado)",
    tagColor: "bg-green-100 text-green-700",
    need: "Conduzir evolução clínica dentro da abordagem escolhida.",
    description:
      "Apoio teórico para as primeiras sessões, sem diagnósticos antecipados — só perguntas, hipóteses e a teoria como parceira.",
  },
  {
    emoji: "🔬",
    tag: "Clínico em prática",
    tagColor: "bg-blue-100 text-blue-700",
    need: "Ampliar estudos de caso e orientar outros com base teórica.",
    description:
      "Aprofunde casos complexos, dialogue com autores que você já conhece e registre evoluções vivas com rigor conceitual.",
  },
  {
    emoji: "💭",
    tag: "Cuidado do cuidador",
    tagColor: "bg-purple-100 text-purple-700",
    need: "Espaço de escuta de si.",
    description:
      "Um lugar para processar o que a clínica te move — com a proteção de uma base teórica e sem a pressão de dar respostas imediatas.",
  },
];

export function ForWhomSection() {
  return (
    <section id="para-quem" className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <span className="text-brand-500 text-sm font-semibold uppercase tracking-widest">Público</span>
          <h2 className="text-3xl md:text-4xl font-bold text-ink mt-3">Para quem é</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {PERSONAS.map((p, i) => (
            <div
              key={i}
              className="relative bg-white rounded-2xl border border-gray-100 p-8 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all"
            >
              <div className="text-4xl mb-4">{p.emoji}</div>
              <span className={`text-xs font-semibold px-3 py-1 rounded-full ${p.tagColor}`}>
                {p.tag}
              </span>
              <p className="text-xs text-gray-400 font-medium mt-4 mb-2 uppercase tracking-wide">Precisa:</p>
              <p className="text-brand-600 font-semibold text-sm mb-3">{p.need}</p>
              <p className="text-gray-500 text-sm leading-relaxed">{p.description}</p>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link
            href="/auth/register"
            className="inline-block bg-brand-500 hover:bg-brand-600 text-white font-semibold px-8 py-4 rounded-xl transition-colors"
          >
            Começar grátis agora
          </Link>
        </div>
      </div>
    </section>
  );
}
