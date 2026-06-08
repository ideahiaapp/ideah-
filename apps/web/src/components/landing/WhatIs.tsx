const IS_LIST = [
  "Um Supervisor Clínico Dialógico: um espaço para pensar com a teoria que você escolheu.",
  "Um ambiente de estudo aplicado: cada resposta é ancorada em base teórica curada.",
  "Um registro vivo da evolução (hipóteses abertas e próximos passos).",
];

const IS_NOT_LIST = [
  "Ferramenta de diagnóstico ou rotulação.",
  "Substituto da tua escuta clínica e do teu juízo profissional.",
  "Chatbot para pacientes.",
];

export function WhatIsSection() {
  return (
    <section className="py-24 bg-gray-50">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-16">
          <span className="text-brand-500 text-sm font-semibold uppercase tracking-widest">Transparência</span>
          <h2 className="text-3xl md:text-4xl font-bold text-ink mt-3">O que é · O que não é</h2>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* É */}
          <div className="bg-white rounded-2xl p-8 border border-green-100 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <span className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold text-sm">✓</span>
              <h3 className="text-lg font-bold text-ink">É</h3>
            </div>
            <ul className="space-y-4">
              {IS_LIST.map((item, i) => (
                <li key={i} className="flex gap-3 text-sm text-gray-600 leading-relaxed">
                  <span className="text-green-500 mt-0.5 flex-shrink-0">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Não é */}
          <div className="bg-white rounded-2xl p-8 border border-red-100 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <span className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-500 font-bold text-sm">✗</span>
              <h3 className="text-lg font-bold text-ink">Não é</h3>
            </div>
            <ul className="space-y-4">
              {IS_NOT_LIST.map((item, i) => (
                <li key={i} className="flex gap-3 text-sm text-gray-600 leading-relaxed">
                  <span className="text-red-400 mt-0.5 flex-shrink-0">✗</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Nota de rodapé */}
        <p className="text-center text-sm text-gray-400 mt-8 max-w-2xl mx-auto leading-relaxed">
          O ideah não confirma vontades; ele ancora na teoria e pode contrapor pedidos que contrariem a abordagem,{" "}
          <strong className="text-gray-500">convidando à reflexão ética.</strong>
        </p>
      </div>
    </section>
  );
}
