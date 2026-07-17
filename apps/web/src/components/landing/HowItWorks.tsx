const FLOW = [
  "Caso Clínico",
  "Supervisão Clínica",
  "Reflexão Dialógica",
  "Evolução Clínica",
  "Aprendizagem",
  "Programa de Formação Clínica Continuada",
  "Certificação",
];

export function HowItWorksSection() {
  return (
    <section id="como-funciona" className="py-24 md:py-32 bg-white">
      <div className="max-w-3xl mx-auto px-6">
        <div className="text-center mb-16">
          <span className="text-brand-500 text-sm font-semibold uppercase tracking-widest">Passo a passo</span>
          <h2 className="font-serif text-3xl md:text-4xl text-ink mt-3">Como funciona</h2>
        </div>

        <div className="flex flex-col items-center">
          {FLOW.map((step, i) => (
            <div key={step} className="flex flex-col items-center w-full">
              <div
                className={
                  i === FLOW.length - 1
                    ? "bg-brand-500 text-white rounded-2xl px-6 py-4 text-center font-semibold text-sm md:text-base max-w-md w-full shadow-sm"
                    : "bg-sand-50 border border-sand-200 rounded-2xl px-6 py-4 text-center font-medium text-ink text-sm md:text-base max-w-md w-full"
                }
              >
                {step}
              </div>
              {i < FLOW.length - 1 && (
                <div className="w-px h-8 bg-brand-200" aria-hidden />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
