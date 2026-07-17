const PARAGRAPHS = [
  "Todo profissional chega ao momento em que precisa tomar decisões diante de pessoas reais.",
  "No início da carreira surgem inseguranças.",
  "Com o tempo surgem casos cada vez mais complexos.",
  "A prática clínica nunca deixa de ensinar.",
  "Continuar aprendendo faz parte da responsabilidade de quem cuida de pessoas.",
];

export function WhatIsSection() {
  return (
    <section className="py-24 md:py-32 bg-sand-50">
      <div className="max-w-2xl mx-auto px-6 text-center">
        <h2 className="font-serif text-3xl md:text-4xl text-ink leading-tight mb-10">
          A formação termina. A prática começa.
        </h2>

        <div className="space-y-3 text-base md:text-lg text-gray-600 leading-relaxed mb-8">
          {PARAGRAPHS.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </div>

        <p className="text-base md:text-lg text-ink font-medium leading-relaxed">
          O Paideia nasceu para transformar a prática clínica em um processo permanente de desenvolvimento
          profissional.
        </p>
      </div>
    </section>
  );
}
