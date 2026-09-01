export function TrainingProgressSection() {
  return (
    <section className="py-24 md:py-32 bg-white overflow-hidden">
      <div className="max-w-5xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
        {/* Texto */}
        <div>
          <span className="text-brand-600 text-xs font-semibold uppercase tracking-widest">
            Formação por abordagem
          </span>
          <h2 className="font-serif text-3xl md:text-4xl text-ink leading-tight mt-3 mb-6">
            Sua prática também constrói sua formação.
          </h2>
          <p className="text-gray-600 text-base md:text-lg leading-relaxed">
            Ao longo das supervisões, o Paideia registra seu percurso de aprendizagem e acompanha as horas
            desenvolvidas dentro da abordagem clínica escolhida. A Formação Clínica Continuada reconhece esse
            percurso construído a partir da própria prática profissional.
          </p>
        </div>

        {/* Mockup de progresso */}
        <div className="bg-white border border-sand-200 rounded-3xl shadow-xl p-8">
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-1.5">
            Formação Clínica Continuada
          </p>
          <h3 className="font-serif text-xl text-ink mb-6">Psicanálise Freudiana</h3>

          <div className="flex items-baseline justify-between mb-2">
            <strong className="text-ink text-sm font-semibold">18 de 40 horas</strong>
            <span className="text-gray-400 text-xs">18h acumuladas</span>
          </div>
          <div className="h-2.5 rounded-full bg-sand-100 overflow-hidden mb-6">
            <div className="h-full rounded-full bg-brand-500" style={{ width: "45%" }} />
          </div>

          <p className="text-gray-500 text-sm leading-relaxed">
            As horas de supervisão são registradas na abordagem escolhida. Ao completar a carga horária prevista
            para aquele percurso, o profissional poderá obter a certificação correspondente.
          </p>
        </div>
      </div>
    </section>
  );
}
