const TESTIMONIALS = [
  {
    quote:
      "No começo da minha prática eu estudava muito, mas ainda tinha dificuldade para organizar meu raciocínio clínico. Com o Paideia, cada supervisão passou a se transformar em aprendizado para os próximos casos.",
    role: "Psicóloga em início de carreira",
  },
  {
    quote:
      "Percebi que não precisava decorar respostas. O que eu precisava era aprender a pensar clinicamente com mais consistência.",
    role: "Psicoterapeuta",
  },
  {
    quote:
      "Depois de alguns meses utilizando o programa, minha documentação clínica ficou muito mais organizada e minhas devolutivas ganharam mais clareza.",
    role: "Profissional da clínica",
  },
];

export function TestimonialsSection() {
  return (
    <section className="py-24 md:py-32 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-4">
          <h2 className="font-serif text-3xl md:text-4xl text-ink leading-tight">
            O que profissionais diriam sobre o Paideia
          </h2>
        </div>
        <p className="text-center text-xs text-gray-400 max-w-lg mx-auto mb-16 leading-relaxed">
          A plataforma está em fase inicial. Os depoimentos abaixo são exemplos ilustrativos de experiências
          comuns, não relatos de usuários reais.
        </p>

        <div className="grid md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t) => (
            <div key={t.role} className="bg-sand-50 border border-sand-100 rounded-2xl p-7">
              <p className="text-gray-700 text-sm leading-relaxed mb-6">"{t.quote}"</p>
              <p className="text-xs text-gray-500">
                {t.role} <span className="text-gray-400">(exemplo ilustrativo)</span>
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
