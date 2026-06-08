const FEATURES = [
  {
    icon: "📝",
    title: "Evolução viva",
    description: "Hipóteses abertas e próximos focos",
  },
  {
    icon: "📎",
    title: "Anexos",
    description: "Desenhos, imagens e documentos",
  },
  {
    icon: "📊",
    title: "Dashboard",
    description: "Visualize seu progresso",
  },
  {
    icon: "📋",
    title: "Anamnese",
    description: "Envie o link para seu cliente",
  },
  {
    icon: "📱",
    title: "Histórico",
    description: "Acesso completo aos casos",
  },
  {
    icon: "💳",
    title: "Pagamento & Recibo",
    description: "Gestão financeira integrada",
  },
  {
    icon: "📅",
    title: "Agendamento",
    description: "Agenda sem sair do app",
  },
  {
    icon: "🔒",
    title: "LGPD",
    description: "Você controla seus dados",
  },
];

export function FeaturesSection() {
  return (
    <section className="py-24 bg-gray-50">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <span className="text-brand-500 text-sm font-semibold uppercase tracking-widest">Tudo em um lugar</span>
          <h2 className="text-3xl md:text-4xl font-bold text-ink mt-3">
            Do relato ao registro vivo — no mesmo lugar em que você trabalha
          </h2>
          <p className="text-gray-500 mt-4 max-w-2xl mx-auto text-base leading-relaxed">
            Evolua casos com hipóteses abertas e próximos focos; anexe desenhos, consulte os últimos clientes evoluídos e visualize sua dashboard.
            Envie o link de anamnese para seu cliente para cadastro automático.{" "}
            <strong className="text-gray-700">Faça tudo isso sem sair do celular.</strong>
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {FEATURES.map((f, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:border-brand-200 hover:shadow-md transition-all text-center group"
            >
              <span className="text-3xl block mb-3">{f.icon}</span>
              <p className="font-semibold text-ink text-sm">{f.title}</p>
              <p className="text-gray-400 text-xs mt-1 leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
