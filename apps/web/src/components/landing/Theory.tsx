const EXAMPLES = [
  {
    thinker: "Freud",
    prompt: "Pergunte a Freud sobre luto (sem rótulos).",
    icon: "🪞",
  },
  {
    thinker: "Reich",
    prompt: "Convide Reich a observar couraças corporais.",
    icon: "🌀",
  },
  {
    thinker: "Jung",
    prompt: "Peça a Jung um olhar simbólico sobre um sonho.",
    icon: "🌙",
  },
];

export function TheorySection() {
  return (
    <section className="py-24 bg-gradient-to-br from-brand-500 to-brand-700 text-white overflow-hidden relative">
      {/* Blob decorativo */}
      <div
        aria-hidden
        className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full opacity-10"
        style={{ background: "radial-gradient(circle, white 0%, transparent 70%)" }}
      />

      <div className="relative max-w-5xl mx-auto px-6">
        <div className="text-center mb-16">
          <span className="text-white/60 text-sm font-semibold uppercase tracking-widest">Diferencial</span>
          <h2 className="text-3xl md:text-4xl font-bold mt-3 leading-tight">
            Converse com quem te formou
          </h2>
          <p className="text-white/70 mt-4 max-w-2xl mx-auto text-base leading-relaxed">
            Não é a IA "dizendo o que você quer ouvir". É a sua abordagem teórica respondendo em diálogo: perguntas, hipóteses abertas e referências. Quando não há respaldo textual, o Paideia{" "}
            <strong className="text-white">explicita a lacuna e propõe caminhos de estudo.</strong>
          </p>
        </div>

        {/* Chat mockup cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {EXAMPLES.map((ex, i) => (
            <div
              key={i}
              className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-6 hover:bg-white/15 transition-colors"
            >
              <span className="text-3xl block mb-3">{ex.icon}</span>
              <p className="text-white/90 text-sm font-medium leading-relaxed">{ex.prompt}</p>
              <div className="mt-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">
                  {ex.thinker[0]}
                </span>
                <span className="text-white/50 text-xs">{ex.thinker}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Chat demo visual */}
        <div className="max-w-2xl mx-auto bg-white/10 backdrop-blur border border-white/20 rounded-2xl overflow-hidden">
          <div className="bg-white/5 border-b border-white/10 px-5 py-3 flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-red-400" />
            <div className="w-2 h-2 rounded-full bg-yellow-400" />
            <div className="w-2 h-2 rounded-full bg-green-400" />
            <span className="text-white/40 text-xs ml-2">Supervisão · Psicanálise</span>
          </div>
          <div className="p-5 space-y-4">
            {/* Mensagem do terapeuta */}
            <div className="flex justify-end">
              <div className="bg-white/20 rounded-2xl rounded-tr-sm px-4 py-3 max-w-sm">
                <p className="text-white text-sm leading-relaxed">
                  Minha cliente perdeu a mãe há 3 meses e diz que "não chora porque não adianta". Como entender isso?
                </p>
              </div>
            </div>
            {/* Resposta da IA */}
            <div className="flex justify-start">
              <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 max-w-sm shadow-sm">
                <p className="text-gray-700 text-sm leading-relaxed">
                  Em "Luto e Melancolia" (1917), Freud distingue o trabalho de luto — que implica o desinvestimento gradual do objeto — da melancolia. A frase "não adianta" pode indicar uma{" "}
                  <strong>inibição do trabalho de luto</strong> ou uma defesa contra o afeto. Que outros indícios ela traz sobre a relação com a mãe?
                </p>
                <p className="text-brand-500 text-xs mt-2 font-medium">— Base: Freud (1917)</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
