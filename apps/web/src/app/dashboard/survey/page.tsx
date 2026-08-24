"use client";

import { useState } from "react";
import { ClipboardList, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { adminHeaders } from "@/lib/supabase";
import { cn } from "@/lib/utils";

/* ── Tipos de campo ──────────────────────────────────────
   - Opções terminadas em ":" são "abertas" (ex.: "Outro:") — ao selecionar,
     revela um campo de texto livre cujo conteúdo é anexado à resposta salva.
*/

function isOpenOption(opt: string) {
  return opt.trim().endsWith(":");
}

function RadioGroup({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) {
  const openOpt = options.find(isOpenOption);
  const openSelected = !!openOpt && value.startsWith(openOpt);
  const openText = openSelected ? value.slice(openOpt!.length).trim() : "";

  return (
    <div className="space-y-2">
      {options.map(opt => {
        const open = isOpenOption(opt);
        const selected = open ? openSelected : value === opt;
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(open ? `${opt} ` : opt)}
            className={cn(
              "w-full flex items-center gap-3 text-left px-4 py-2.5 rounded-xl border text-sm transition-colors",
              selected ? "border-brand-400 bg-brand-50 text-brand-800" : "border-gray-200 text-gray-700 hover:border-gray-300"
            )}
          >
            <span className={cn("w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center", selected ? "border-brand-500" : "border-gray-300")}>
              {selected && <span className="w-2 h-2 rounded-full bg-brand-500" />}
            </span>
            {opt}
          </button>
        );
      })}
      {openSelected && (
        <input
          value={openText}
          onChange={e => onChange(`${openOpt} ${e.target.value}`)}
          placeholder="Especifique..."
          className="w-full px-4 py-2 text-sm bg-white border border-brand-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-300"
        />
      )}
    </div>
  );
}

function CheckboxGroup({ value, onChange, options }: { value: string[]; onChange: (v: string[]) => void; options: string[] }) {
  const openOpt = options.find(isOpenOption);
  const openEntry = openOpt ? value.find(v => v.startsWith(openOpt)) : undefined;
  const openText = openEntry ? openEntry.slice(openOpt!.length).trim() : "";

  function toggle(opt: string) {
    const open = isOpenOption(opt);
    if (open) {
      onChange(openEntry ? value.filter(v => v !== openEntry) : [...value, `${opt} `]);
    } else {
      onChange(value.includes(opt) ? value.filter(v => v !== opt) : [...value, opt]);
    }
  }

  function setOpenText(text: string) {
    const others = value.filter(v => !openOpt || !v.startsWith(openOpt));
    onChange([...others, `${openOpt} ${text}`]);
  }

  return (
    <div className="space-y-2">
      {options.map(opt => {
        const open = isOpenOption(opt);
        const selected = open ? !!openEntry : value.includes(opt);
        return (
          <button
            key={opt}
            type="button"
            onClick={() => toggle(opt)}
            className={cn(
              "w-full flex items-center gap-3 text-left px-4 py-2.5 rounded-xl border text-sm transition-colors",
              selected ? "border-brand-400 bg-brand-50 text-brand-800" : "border-gray-200 text-gray-700 hover:border-gray-300"
            )}
          >
            <span className={cn("w-4 h-4 rounded-md border-2 flex-shrink-0 flex items-center justify-center", selected ? "border-brand-500 bg-brand-500" : "border-gray-300")}>
              {selected && <svg width="9" height="9" viewBox="0 0 10 10" fill="none"><polyline points="1.5 5 4 7.5 8.5 2.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
            </span>
            {opt}
          </button>
        );
      })}
      {openEntry && (
        <input
          value={openText}
          onChange={e => setOpenText(e.target.value)}
          placeholder="Especifique..."
          className="w-full px-4 py-2 text-sm bg-white border border-brand-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-300"
        />
      )}
    </div>
  );
}

function ScaleField({ value, onChange, minLabel, maxLabel }: { value: string; onChange: (v: string) => void; minLabel: string; maxLabel: string }) {
  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {Array.from({ length: 11 }, (_, i) => String(i)).map(n => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={cn(
              "w-9 h-9 rounded-lg border text-sm font-semibold transition-colors",
              value === n ? "bg-brand-500 border-brand-500 text-white" : "border-gray-200 text-gray-600 hover:border-brand-300"
            )}
          >
            {n}
          </button>
        ))}
      </div>
      <div className="flex justify-between text-xs text-gray-500 mt-1.5">
        <span>{minLabel}</span>
        <span>{maxLabel}</span>
      </div>
    </div>
  );
}

function OpenText({ value, onChange, rows = 3 }: { value: string; onChange: (v: string) => void; rows?: number }) {
  return (
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      rows={rows}
      placeholder="Sua resposta..."
      className="w-full px-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-300 resize-y"
    />
  );
}

function ShortText({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <input
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder="Sua resposta..."
      className="w-full px-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-300"
    />
  );
}

function Question({ n, title, hint, required = true, children }: { n: string; title: string; hint?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="py-5 border-b border-gray-100 last:border-0">
      <p className="text-sm font-semibold text-gray-800 mb-1">
        {n}. {title} {required && <span className="text-red-400">*</span>}
      </p>
      {hint && <p className="text-xs text-gray-500 mb-3">{hint}</p>}
      <div className={hint ? "" : "mt-3"}>{children}</div>
    </div>
  );
}

function Section({ title, intro, children }: { title: string; intro?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6">
      <div className="pt-6 pb-1">
        <h2 className="text-sm font-bold text-brand-600 uppercase tracking-wide">{title}</h2>
        {intro && <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">{intro}</p>}
      </div>
      {children}
    </div>
  );
}

const Q5_OPTIONS = [
  "Dificuldade de transformar teoria em prática",
  "Insegurança diante de determinados casos",
  "Dificuldade para construir hipóteses clínicas",
  "Necessidade de supervisão com maior frequência",
  "Dificuldade de acessar supervisão quando preciso",
  "Dificuldade para aprofundar teoricamente questões surgidas nos atendimentos",
  "Dificuldade para acompanhar minha própria evolução profissional",
  "Sensação de estudar muito, mas ter dificuldade de integrar o conhecimento à prática",
  "Necessidade de atualização/formação continuada",
  "Nenhuma dessas situações",
  "Outra:",
];

const Q8_OPTIONS = [
  "Supervisão de casos",
  "Estudo de conceitos teóricos",
  "Construção/reflexão sobre hipóteses clínicas",
  "Acompanhamento da evolução de um caso",
  "Preparação/reflexão antes ou depois de atendimentos",
  "Documentos/ferramentas profissionais",
  "Formação/estudo pessoal",
  "Outra:",
];

const Q18_OPTIONS = [
  "Horas acumuladas de reflexão clínica",
  "Casos acompanhados",
  "Principais conteúdos estudados",
  "Temas clínicos mais recorrentes",
  "Abordagens utilizadas",
  "Evolução do meu percurso de aprendizagem",
  "Histórico das reflexões clínicas",
  "Nenhuma dessas informações seria relevante para mim",
];

export default function SatisfactionSurveyPage() {
  const [a, setA] = useState<Record<string, string>>({});
  const [multi, setMulti] = useState<Record<string, string[]>>({ q5: [], q8: [], q18: [] });
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);
  const [error,  setError]  = useState<string | null>(null);

  function set(key: string, value: string) {
    setA(p => ({ ...p, [key]: value }));
  }

  const showQ14_1 = a.q14 === "Sim";
  const showQ16_17 = !!a.q15 && a.q15 !== "Nunca";

  const REQUIRED = [
    "q1", "q2", "q3", "q4", "q6", "q7", "q9", "q10", "q11", "q12", "q13", "q14",
    "q15", "q19", "q20", "q21", "q22", "q23", "q24", "q25", "q26", "q27", "q28", "q29", "q30", "q31", "q33",
  ];
  const canSave = REQUIRED.every(k => !!a[k]) && multi.q5.length > 0 && multi.q8.length > 0
    && (!showQ14_1 || !!a.q14_1) && (!showQ16_17 || (!!a.q16 && !!a.q17));

  async function handleSave() {
    if (!canSave) return;
    setSaving(true); setError(null);
    try {
      const answers = { ...a, q5: multi.q5, q8: multi.q8, q18: multi.q18 };
      const res = await fetch("/api/satisfaction-survey", {
        method: "POST",
        headers: await adminHeaders(),
        body: JSON.stringify({ answers, platform: "web" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao enviar respostas.");
    } finally {
      setSaving(false);
    }
  }

  if (saved) {
    return (
      <div className="max-w-2xl mx-auto text-center py-24">
        <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <CheckCircle2 className="w-8 h-8 text-green-500" />
        </div>
        <h1 className="text-xl font-bold text-ink mb-2">Obrigado pela sua contribuição!</h1>
        <p className="text-gray-500 text-sm">Suas respostas foram registradas e serão analisadas de forma agregada para orientar a evolução do Paideia.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-16">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center">
          <ClipboardList className="w-5 h-5 text-brand-500" strokeWidth={1.8} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-ink">Pesquisa de Satisfação</h1>
          <p className="text-gray-500 text-sm">Formulário de Validação do MVP — Paideia</p>
        </div>
      </div>

      <div className="bg-brand-50 border border-brand-100 rounded-2xl p-5 space-y-2">
        <h2 className="text-sm font-bold text-brand-800">Validação da Experiência Paideia</h2>
        <p className="text-xs text-brand-700 leading-relaxed">
          Este formulário tem como objetivo compreender sua experiência durante os testes do Paideia.
          Queremos identificar o que funciona, o que não funciona, quais problemas a ferramenta efetivamente
          ajuda a resolver e o que precisa ser melhorado.
        </p>
        <p className="text-xs text-brand-700 leading-relaxed">
          Não existem respostas certas ou erradas. Críticas, dificuldades e sugestões são especialmente
          importantes nesta fase de desenvolvimento. As respostas serão analisadas de forma agregada para
          orientar a evolução do produto.
        </p>
        <p className="text-xs font-semibold text-brand-800 leading-relaxed">
          Importante: não inclua nomes, informações identificáveis ou dados de clientes/pacientes neste formulário.
        </p>
      </div>

      <Section title="Seção 1 — Perfil profissional">
        <Question n="1" title="Qual é sua formação/situação profissional?">
          <RadioGroup value={a.q1 ?? ""} onChange={v => set("q1", v)}
            options={["Psicólogo(a)", "Estudante de Psicologia", "Terapeuta com outra formação", "Outro:"]} />
        </Question>
        <Question n="2" title="Em que momento da sua trajetória profissional você está?">
          <RadioGroup value={a.q2 ?? ""} onChange={v => set("q2", v)}
            options={["Estudante em fase final de formação", "Até 1 ano de atuação", "De 1 a 3 anos", "De 3 a 5 anos", "De 5 a 10 anos", "Mais de 10 anos", "Ainda não iniciei atendimentos"]} />
        </Question>
        <Question n="3" title="Você realiza atendimentos atualmente?">
          <RadioGroup value={a.q3 ?? ""} onChange={v => set("q3", v)}
            options={["Sim, regularmente", "Sim, ocasionalmente", "Estou começando agora", "Ainda não"]} />
        </Question>
        <Question n="4" title="Qual abordagem/referencial teórico você utiliza principalmente?">
          <ShortText value={a.q4 ?? ""} onChange={v => set("q4", v)} />
        </Question>
      </Section>

      <Section title="Seção 2 — O problema antes do Paideia">
        <Question n="5" title="Antes de utilizar o Paideia, quais dessas situações você já vivenciava na prática?" hint="Permite múltiplas respostas">
          <CheckboxGroup value={multi.q5} onChange={v => setMulti(p => ({ ...p, q5: v }))} options={Q5_OPTIONS} />
        </Question>
        <Question n="6" title="Qual é hoje sua maior dificuldade quando surge um caso ou situação clínica que você não sabe como compreender ou conduzir?">
          <OpenText value={a.q6 ?? ""} onChange={v => set("q6", v)} />
        </Question>
      </Section>

      <Section title="Seção 3 — Experiência com o Paideia">
        <Question n="7" title="Quantas vezes aproximadamente você utilizou o Paideia durante o período de teste?">
          <RadioGroup value={a.q7 ?? ""} onChange={v => set("q7", v)}
            options={["1 vez", "2 a 3 vezes", "4 a 5 vezes", "6 a 10 vezes", "Mais de 10 vezes"]} />
        </Question>
        <Question n="8" title="Para quais atividades você utilizou o Paideia?" hint="Múltipla escolha">
          <CheckboxGroup value={multi.q8} onChange={v => setMulti(p => ({ ...p, q8: v }))} options={Q8_OPTIONS} />
        </Question>
        <Question n="9" title="Em uma escala de 0 a 10, quanto o Paideia ajudou você a refletir sobre seus casos ou sua prática profissional?">
          <ScaleField value={a.q9 ?? ""} onChange={v => set("q9", v)} minLabel="0 = não ajudou" maxLabel="10 = ajudou muito" />
        </Question>
        <Question n="10" title="Em uma escala de 0 a 10, quanto o Paideia ajudou você a relacionar teoria e prática?">
          <ScaleField value={a.q10 ?? ""} onChange={v => set("q10", v)} minLabel="0 = não ajudou" maxLabel="10 = ajudou muito" />
        </Question>
      </Section>

      <Section title="Seção 4 — Diferencial da experiência">
        <Question n="11" title="Durante as interações, você sentiu que o Paideia principalmente:">
          <RadioGroup value={a.q11 ?? ""} onChange={v => set("q11", v)}
            options={["Entregava respostas prontas", "Ajudava mais a organizar informações", "Fazia com que eu refletisse sobre o caso", "Ajudava a construir meu próprio raciocínio", "Variava bastante conforme a interação", "Não consigo avaliar"]} />
        </Question>
        <Question n="12" title="O Paideia fez perguntas que levaram você a perceber aspectos do caso ou da sua própria interpretação que não havia considerado anteriormente?">
          <RadioGroup value={a.q12 ?? ""} onChange={v => set("q12", v)}
            options={["Muitas vezes", "Algumas vezes", "Poucas vezes", "Nunca", "Não consigo avaliar"]} />
        </Question>
        <Question n="13" title="Depois das interações, você percebeu que compreendia melhor por que estava construindo determinada hipótese ou possibilidade clínica?">
          <RadioGroup value={a.q13 ?? ""} onChange={v => set("q13", v)}
            options={["Muito mais", "Um pouco mais", "Não houve diferença", "Fiquei mais confuso(a)", "Não consigo avaliar"]} />
        </Question>
        <Question n="14" title="Em algum momento você modificou uma compreensão anterior sobre um caso depois do processo de reflexão realizado no Paideia?">
          <RadioGroup value={a.q14 ?? ""} onChange={v => set("q14", v)}
            options={["Sim", "Não", "Não tenho certeza"]} />
        </Question>
        {showQ14_1 && (
          <Question n="14.1" title="Sem mencionar qualquer informação identificável do cliente, o que mudou na sua compreensão?">
            <OpenText value={a.q14_1 ?? ""} onChange={v => set("q14_1", v)} />
          </Question>
        )}
      </Section>

      <Section title="Seção 5 — Paideia versus IA generalista">
        <Question n="15" title="Você já utilizou ferramentas generalistas de Inteligência Artificial para estudar ou refletir sobre questões profissionais?">
          <RadioGroup value={a.q15 ?? ""} onChange={v => set("q15", v)}
            options={["Sim, frequentemente", "Sim, algumas vezes", "Experimentei poucas vezes", "Nunca"]} />
        </Question>
        {showQ16_17 && (
          <>
            <Question n="16" title="Comparando sua experiência, o Paideia pareceu diferente de conversar diretamente com uma IA generalista?">
              <RadioGroup value={a.q16 ?? ""} onChange={v => set("q16", v)}
                options={["Muito diferente", "Um pouco diferente", "Praticamente igual", "Não percebi diferença", "Não consigo avaliar"]} />
            </Question>
            <Question n="17" title="Qual foi a principal diferença percebida?">
              <OpenText value={a.q17 ?? ""} onChange={v => set("q17", v)} />
            </Question>
          </>
        )}
      </Section>

      <Section title="Seção 6 — Aprendizagem e percurso formativo">
        <Question n="18" title="Para você, seria útil visualizar ao longo do tempo:" hint="Marque todas que considerar relevantes." required={false}>
          <CheckboxGroup value={multi.q18} onChange={v => setMulti(p => ({ ...p, q18: v }))} options={Q18_OPTIONS} />
        </Question>
        <Question n="19" title="Qual seria o valor de visualizar o que você vem aprendendo ao longo dos seus próprios casos?">
          <RadioGroup value={a.q19 ?? ""} onChange={v => set("q19", v)}
            options={["Muito alto", "Alto", "Moderado", "Baixo", "Nenhum"]} />
        </Question>
        <Question n="20" title="Ter as horas de reflexão clínica e os conteúdos trabalhados registrados e organizados aumentaria o valor do Paideia para você?">
          <RadioGroup value={a.q20 ?? ""} onChange={v => set("q20", v)}
            options={["Aumentaria muito", "Aumentaria um pouco", "Não faria diferença", "Diminuiria o interesse", "Não sei"]} />
        </Question>
        <Question n="21" title="A possibilidade de obter um registro/certificação do percurso de formação e das horas de reflexão clínica seria relevante para você?">
          <RadioGroup value={a.q21 ?? ""} onChange={v => set("q21", v)}
            options={["Muito relevante", "Relevante", "Pouco relevante", "Irrelevante", "Não sei"]} />
        </Question>
      </Section>

      <Section title="Seção 7 — Valor comercial">
        <Question n="22" title="Se o período gratuito de teste terminasse hoje, o que você provavelmente faria?">
          <RadioGroup value={a.q22 ?? ""} onChange={v => set("q22", v)}
            options={["Assinaria o Paideia", "Provavelmente assinaria, mas gostaria de usar mais antes", "Dependeria do preço", "Continuaria apenas se houvesse uma versão gratuita", "Provavelmente não continuaria", "Não continuaria"]} />
        </Question>
        <Question n="23" title="Considerando a experiência que você teve até agora, como você avaliaria uma assinatura de R$147 por mês por abordagem?">
          <RadioGroup value={a.q23 ?? ""} onChange={v => set("q23", v)}
            options={["Muito barata para o valor entregue", "Um preço adequado", "Um pouco cara, mas eu consideraria assinar", "Cara demais para mim", "Ainda não percebi valor suficiente para pagar esse preço"]} />
        </Question>
        <Question n="24" title="O que precisaria existir ou melhorar para que você considerasse R$147/mês um investimento que vale a pena?">
          <OpenText value={a.q24 ?? ""} onChange={v => set("q24", v)} />
        </Question>
      </Section>

      <Section title="Seção 8 — Retenção e recomendação">
        <Question n="25" title="Em uma escala de 0 a 10, qual a probabilidade de você continuar utilizando o Paideia na sua prática profissional?">
          <ScaleField value={a.q25 ?? ""} onChange={v => set("q25", v)} minLabel="0 = nenhuma probabilidade" maxLabel="10 = probabilidade muito alta" />
        </Question>
        <Question n="26" title="Em uma escala de 0 a 10, qual a probabilidade de você recomendar o Paideia para outro psicólogo ou terapeuta?">
          <ScaleField value={a.q26 ?? ""} onChange={v => set("q26", v)} minLabel="0 = não recomendaria" maxLabel="10 = certamente recomendaria" />
        </Question>
      </Section>

      <Section title="Seção 9 — O que precisamos melhorar">
        <Question n="27" title="Qual foi a parte MAIS valiosa da sua experiência com o Paideia?">
          <OpenText value={a.q27 ?? ""} onChange={v => set("q27", v)} />
        </Question>
        <Question n="28" title="Qual foi a parte MENOS útil ou mais frustrante?">
          <OpenText value={a.q28 ?? ""} onChange={v => set("q28", v)} />
        </Question>
        <Question n="29" title="Houve algum momento em que você não confiou, não compreendeu ou discordou do que o Paideia apresentou?" hint="Conte-nos o que aconteceu, sem incluir informações identificáveis de clientes.">
          <OpenText value={a.q29 ?? ""} onChange={v => set("q29", v)} />
        </Question>
        <Question n="30" title="Se você pudesse mudar apenas UMA coisa no Paideia hoje, o que mudaria?">
          <OpenText value={a.q30 ?? ""} onChange={v => set("q30", v)} />
        </Question>
        <Question n="31" title="Existe alguma funcionalidade que você considera indispensável e que ainda não encontrou no Paideia?">
          <OpenText value={a.q31 ?? ""} onChange={v => set("q31", v)} />
        </Question>
      </Section>

      <Section title="Seção 10 — Depoimento opcional">
        <Question n="32" title="Em uma ou duas frases, como você explicaria sua experiência com o Paideia para outro profissional?" required={false}>
          <OpenText value={a.q32 ?? ""} onChange={v => set("q32", v)} rows={2} />
        </Question>
        <Question n="33" title="Você autoriza que esse depoimento seja utilizado na comunicação e apresentação do Paideia?" hint="Esta autorização é independente do consentimento para participar da pesquisa — o depoimento é sempre opcional.">
          <RadioGroup value={a.q33 ?? ""} onChange={v => set("q33", v)}
            options={["Sim, de forma anônima", "Sim, com meu primeiro nome e profissão", "Não autorizo utilização pública"]} />
        </Question>
      </Section>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}

      <button
        onClick={handleSave}
        disabled={!canSave || saving}
        className={cn(
          "w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold transition-colors",
          canSave && !saving ? "bg-brand-500 hover:bg-brand-600 text-white shadow-sm" : "bg-gray-100 text-gray-400 cursor-not-allowed"
        )}
      >
        {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Enviando...</> : "Enviar respostas"}
      </button>
      {!canSave && !saving && (
        <p className="text-xs text-gray-400 text-center -mt-3">Preencha todas as perguntas obrigatórias (*) para enviar.</p>
      )}
    </div>
  );
}
