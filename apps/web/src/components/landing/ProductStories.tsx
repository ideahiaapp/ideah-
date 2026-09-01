import { ProductMockup } from "./ProductMockup";

const STORIES = [
  {
    number: "01",
    title: "Supervisão Clínica",
    description:
      "Traga situações reais da sua prática e desenvolva seu raciocínio dentro da abordagem clínica escolhida.",
    hint: "Supervisão orientada pela abordagem clínica escolhida.",
    mockup: {
      sectionLabel: "Supervisão clínica",
      sectionTitle: "Questões da sessão",
      badge: "Psicanálise Freudiana",
      message: "Vamos examinar o que essa situação mobiliza na condução do caso.",
    },
  },
  {
    number: "02",
    title: "Continuidade dos casos",
    description:
      "As supervisões permanecem vinculadas ao percurso de cada cliente, permitindo acompanhar longitudinalmente as questões trabalhadas.",
    hint: null,
    mockup: {
      sectionLabel: "Percurso do caso",
      sectionTitle: "Continuidade clínica",
      badge: "Evolução",
      message: "Questões trabalhadas permanecem organizadas ao longo das supervisões.",
    },
  },
  {
    number: "03",
    title: "Seu percurso de aprendizagem",
    description:
      "O conhecimento desenvolvido durante as supervisões deixa de desaparecer depois da conversa e passa a compor seu percurso de Formação Clínica Continuada.",
    hint: null,
    mockup: {
      sectionLabel: "Seu percurso",
      sectionTitle: "Formação continuada",
      badge: "18h acumuladas",
      message: "Aprendizagens construídas a partir da prática e reunidas em um só lugar.",
    },
  },
];

export function ProductStoriesSection() {
  return (
    <section className="py-24 md:py-32 bg-white" id="produto">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-20">
          <span className="text-brand-600 text-xs font-semibold uppercase tracking-widest">Dentro do Paideia</span>
          <h2 className="font-serif text-3xl md:text-4xl text-ink leading-tight mt-3 mb-4">
            Veja como a prática se transforma em aprendizagem.
          </h2>
          <p className="text-gray-500 text-base leading-relaxed">
            Um ambiente criado para acompanhar o profissional entre aquilo que estudou e aquilo que os casos reais
            passam a exigir.
          </p>
        </div>

        <div className="space-y-20 md:space-y-28">
          {STORIES.map((story, i) => (
            <div
              key={story.number}
              className={`grid lg:grid-cols-2 gap-12 items-center ${i % 2 === 1 ? "lg:[&>*:first-child]:order-2" : ""}`}
            >
              <div>
                <span className="font-serif text-4xl text-brand-200">{story.number}</span>
                <h3 className="font-serif text-2xl md:text-3xl text-ink leading-tight mt-2 mb-4">{story.title}</h3>
                <p className="text-gray-600 text-base leading-relaxed">{story.description}</p>
                {story.hint && <p className="text-gray-400 text-sm mt-3">{story.hint}</p>}
              </div>
              <ProductMockup {...story.mockup} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
