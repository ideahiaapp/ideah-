import { BookOpen, Download } from "lucide-react";

const SECTIONS = [
  "1. Introdução ao Paideia",
  "2. Primeiros Passos (Cadastro e Login)",
  "3. Navegação Geral da Versão Web",
  "4. Home",
  "5. Supervisão com Inteligência Artificial",
  "6. Clientes",
  "7. Agenda",
  "8. Meu Escritório (Relatórios e Documentos)",
  "9. Certificado de Supervisão",
  "10. Pesquisa de Satisfação",
  "11. Configurações",
  "12. Aplicativo Mobile",
  "13. Entrada por Voz (Ditado)",
  "14. Perguntas Frequentes e Solução de Problemas",
  "15. Ética, Privacidade e Segurança (CFP e LGPD)",
];

export default function ManualPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center">
          <BookOpen className="w-5 h-5 text-brand-500" strokeWidth={1.8} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-ink">Manual do Usuário</h1>
          <p className="text-gray-500 text-sm">Documentação completa do Paideia — web e mobile</p>
        </div>
      </div>

      <div className="bg-brand-50 border border-brand-100 rounded-2xl p-6 space-y-4">
        <p className="text-sm text-brand-800 leading-relaxed">
          O manual traz o passo a passo detalhado de cada funcionalidade do Paideia, tanto na versão web quanto no
          aplicativo mobile, além de uma seção de perguntas frequentes e das diretrizes éticas (CFP e LGPD) que
          orientam o uso da plataforma.
        </p>
        <a
          href="/manual/Paideia_Manual_do_Usuario.docx"
          download
          className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
        >
          <Download className="w-4 h-4" />
          Baixar manual completo (.docx)
        </a>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <p className="text-sm font-bold text-gray-800 mb-3">Sumário</p>
        <ul className="space-y-2">
          {SECTIONS.map(s => (
            <li key={s} className="text-sm text-gray-600">{s}</li>
          ))}
        </ul>
      </div>

      <p className="text-xs text-gray-400 text-center">
        Cada tela do painel também tem um link &quot;Como funciona?&quot; com uma explicação rápida — o manual completo
        é para quando você quiser todos os detalhes.
      </p>
    </div>
  );
}
