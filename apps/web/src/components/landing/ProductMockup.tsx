import { MessageSquare, Sparkles, ArrowRight } from "lucide-react";

interface ProductMockupProps {
  sectionLabel: string;
  sectionTitle: string;
  badge: string;
  message: string;
}

/** Ilustração decorativa reutilizada em várias seções da landing, simulando
    uma tela do produto (não é dado real). */
export function ProductMockup({ sectionLabel, sectionTitle, badge, message }: ProductMockupProps) {
  return (
    <div className="bg-white border border-sand-200 rounded-3xl shadow-xl overflow-hidden" aria-hidden>
      <div className="flex items-center gap-2 px-5 py-3 border-b border-sand-100 bg-sand-50">
        <span className="w-2.5 h-2.5 rounded-full bg-sand-300" />
        <span className="w-2.5 h-2.5 rounded-full bg-sand-300" />
        <span className="w-2.5 h-2.5 rounded-full bg-sand-300" />
        <span className="ml-auto text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Paideia</span>
      </div>
      <div className="flex">
        <div className="hidden sm:flex flex-col items-center gap-3 w-14 py-6 border-r border-sand-100 bg-sand-50/60">
          <div className="w-8 h-8 rounded-lg bg-brand-500 text-white flex items-center justify-center font-serif text-sm">
            P
          </div>
          <div className="w-6 h-1 rounded-full bg-brand-300" />
          <div className="w-6 h-1 rounded-full bg-sand-200" />
          <div className="w-4 h-1 rounded-full bg-sand-200" />
        </div>
        <div className="flex-1 p-6 min-w-0">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <p className="text-[11px] text-gray-400 uppercase tracking-widest">{sectionLabel}</p>
              <h3 className="font-serif text-lg text-ink">{sectionTitle}</h3>
            </div>
            <span className="text-[11px] font-semibold text-brand-600 bg-brand-50 px-2.5 py-1 rounded-full whitespace-nowrap">
              {badge}
            </span>
          </div>

          <div className="bg-sand-50 border border-sand-100 rounded-xl p-4 flex gap-3 mb-4">
            <MessageSquare className="w-4 h-4 text-brand-500 flex-shrink-0 mt-0.5" strokeWidth={1.8} />
            <p className="text-sm text-gray-600 leading-relaxed">{message}</p>
          </div>

          <div className="space-y-2 mb-4">
            <div className="h-1.5 rounded-full bg-sand-100 w-full" />
            <div className="h-1.5 rounded-full bg-sand-100 w-4/5" />
            <div className="h-1.5 rounded-full bg-sand-100 w-1/2" />
          </div>

          <div className="flex items-center justify-between bg-brand-50 rounded-xl px-4 py-3">
            <span className="flex items-center gap-2 text-xs font-semibold text-brand-700">
              <Sparkles className="w-3.5 h-3.5" strokeWidth={2} />
              Reflexão desenvolvida
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-brand-600" strokeWidth={2} />
          </div>
        </div>
      </div>
    </div>
  );
}
