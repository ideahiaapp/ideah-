const POINTS = [
  {
    title: "Supervisão humana obrigatória",
    description: "O juízo clínico e a responsabilidade técnica são sempre seus.",
  },
  {
    title: "Base teórica curada",
    description: "O conteúdo trabalhado é ancorado na abordagem escolhida, sem diagnósticos ou rótulos.",
  },
  {
    title: "Consentimento e LGPD",
    description: "Você controla o que é registrado e exportado.",
  },
];

export function EthicsSection() {
  return (
    <section id="etica" className="py-16 bg-sand-50 border-y border-sand-100">
      <div className="max-w-4xl mx-auto px-6">
        <div className="grid sm:grid-cols-3 gap-8 mb-8">
          {POINTS.map((p) => (
            <div key={p.title}>
              <h3 className="font-semibold text-ink text-sm mb-1.5">{p.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{p.description}</p>
            </div>
          ))}
        </div>
        <p className="text-center text-xs text-gray-400 leading-relaxed max-w-2xl mx-auto">
          O Paideia é um espaço de supervisão e formação continuada, alinhado às orientações do Conselho Federal de
          Psicologia. Não realiza diagnósticos nem substitui o julgamento profissional.
        </p>
      </div>
    </section>
  );
}
