import { useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { authHeaders } from "@/lib/ai-headers";
import { Colors } from "@/constants/colors";

function isOpenOption(opt: string) {
  return opt.trim().endsWith(":");
}

function RadioGroup({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) {
  const openOpt = options.find(isOpenOption);
  const openSelected = !!openOpt && value.startsWith(openOpt);
  const openText = openSelected ? value.slice(openOpt!.length).trim() : "";

  return (
    <View style={{ gap: 8 }}>
      {options.map(opt => {
        const open = isOpenOption(opt);
        const selected = open ? openSelected : value === opt;
        return (
          <TouchableOpacity
            key={opt}
            onPress={() => onChange(open ? `${opt} ` : opt)}
            style={[s.option, selected && s.optionSelected]}
            activeOpacity={0.7}
          >
            <View style={[s.radioDot, selected && s.radioDotSelected]}>
              {selected && <View style={s.radioDotInner} />}
            </View>
            <Text style={[s.optionText, selected && s.optionTextSelected]}>{opt}</Text>
          </TouchableOpacity>
        );
      })}
      {openSelected && (
        <TextInput
          value={openText}
          onChangeText={t => onChange(`${openOpt} ${t}`)}
          placeholder="Especifique..."
          placeholderTextColor={Colors.gray[400]}
          style={s.openInput}
        />
      )}
    </View>
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
    <View style={{ gap: 8 }}>
      {options.map(opt => {
        const open = isOpenOption(opt);
        const selected = open ? !!openEntry : value.includes(opt);
        return (
          <TouchableOpacity
            key={opt}
            onPress={() => toggle(opt)}
            style={[s.option, selected && s.optionSelected]}
            activeOpacity={0.7}
          >
            <View style={[s.checkBox, selected && s.checkBoxSelected]}>
              {selected && <Ionicons name="checkmark" size={11} color="#fff" />}
            </View>
            <Text style={[s.optionText, selected && s.optionTextSelected]}>{opt}</Text>
          </TouchableOpacity>
        );
      })}
      {openEntry && (
        <TextInput
          value={openText}
          onChangeText={setOpenText}
          placeholder="Especifique..."
          placeholderTextColor={Colors.gray[400]}
          style={s.openInput}
        />
      )}
    </View>
  );
}

function ScaleField({ value, onChange, minLabel, maxLabel }: { value: string; onChange: (v: string) => void; minLabel: string; maxLabel: string }) {
  return (
    <View>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
        {Array.from({ length: 11 }, (_, i) => String(i)).map(n => (
          <TouchableOpacity
            key={n}
            onPress={() => onChange(n)}
            style={[s.scaleBtn, value === n && s.scaleBtnSelected]}
            activeOpacity={0.75}
          >
            <Text style={[s.scaleBtnText, value === n && s.scaleBtnTextSelected]}>{n}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 6 }}>
        <Text style={s.scaleLabel}>{minLabel}</Text>
        <Text style={s.scaleLabel}>{maxLabel}</Text>
      </View>
    </View>
  );
}

function OpenText({ value, onChange, numberOfLines = 3 }: { value: string; onChange: (v: string) => void; numberOfLines?: number }) {
  return (
    <TextInput
      value={value}
      onChangeText={onChange}
      placeholder="Sua resposta..."
      placeholderTextColor={Colors.gray[400]}
      multiline
      numberOfLines={numberOfLines}
      style={[s.openInput, { minHeight: numberOfLines * 20, textAlignVertical: "top" }]}
    />
  );
}

function ShortText({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <TextInput
      value={value}
      onChangeText={onChange}
      placeholder="Sua resposta..."
      placeholderTextColor={Colors.gray[400]}
      style={s.openInput}
    />
  );
}

function Question({ n, title, hint, required = true, children }: { n: string; title: string; hint?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <View style={s.question}>
      <Text style={s.questionTitle}>
        {n}. {title} {required && <Text style={{ color: "#EF4444" }}>*</Text>}
      </Text>
      {hint && <Text style={s.questionHint}>{hint}</Text>}
      <View style={{ marginTop: 10 }}>{children}</View>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={s.section}>
      <Text style={s.sectionTitle}>{title}</Text>
      {children}
    </View>
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
  "Horas acumuladas de supervisão",
  "Casos acompanhados",
  "Principais conteúdos estudados",
  "Temas clínicos mais recorrentes",
  "Abordagens utilizadas",
  "Evolução do meu percurso de aprendizagem",
  "Histórico das supervisões",
  "Nenhuma dessas informações seria relevante para mim",
];

export default function SurveyScreen() {
  const router = useRouter();
  const [a, setA] = useState<Record<string, string>>({});
  const [multi, setMulti] = useState<{ q5: string[]; q8: string[]; q18: string[] }>({ q5: [], q8: [], q18: [] });
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
      const res = await fetch(`${process.env.EXPO_PUBLIC_WEB_URL}/api/satisfaction-survey`, {
        method: "POST",
        headers: await authHeaders(),
        body: JSON.stringify({ answers, platform: "mobile" }),
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
      <SafeAreaView style={s.safe}>
        <View style={s.doneWrap}>
          <View style={s.doneIcon}><Ionicons name="checkmark-circle" size={36} color="#16A34A" /></View>
          <Text style={s.doneTitle}>Obrigado pela sua contribuição!</Text>
          <Text style={s.doneText}>Suas respostas foram registradas e serão analisadas de forma agregada para orientar a evolução do Paideia.</Text>
          <TouchableOpacity style={s.doneBtn} onPress={() => (router.canGoBack() ? router.back() : router.replace("/(tabs)"))}>
            <Text style={s.doneBtnText}>Voltar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => (router.canGoBack() ? router.back() : router.replace("/(tabs)"))} style={s.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.ink} />
        </TouchableOpacity>
        <View>
          <Text style={s.headerTitle}>Pesquisa de Satisfação</Text>
          <Text style={s.headerSub}>Formulário de Validação do MVP</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        <View style={s.introBox}>
          <Text style={s.introTitle}>Validação da Experiência Paideia</Text>
          <Text style={s.introText}>
            Este formulário tem como objetivo compreender sua experiência durante os testes do Paideia.
            Queremos identificar o que funciona, o que não funciona, quais problemas a ferramenta efetivamente
            ajuda a resolver e o que precisa ser melhorado.
          </Text>
          <Text style={s.introText}>
            Não existem respostas certas ou erradas. Críticas, dificuldades e sugestões são especialmente
            importantes nesta fase de desenvolvimento.
          </Text>
          <Text style={s.introBold}>
            Importante: não inclua nomes, informações identificáveis ou dados de clientes/pacientes neste formulário.
          </Text>
        </View>

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
          <Question n="20" title="Ter as horas de supervisão e os conteúdos trabalhados registrados e organizados aumentaria o valor do Paideia para você?">
            <RadioGroup value={a.q20 ?? ""} onChange={v => set("q20", v)}
              options={["Aumentaria muito", "Aumentaria um pouco", "Não faria diferença", "Diminuiria o interesse", "Não sei"]} />
          </Question>
          <Question n="21" title="A possibilidade de obter um registro/certificação do percurso de formação e das horas de supervisão seria relevante para você?">
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
            <OpenText value={a.q32 ?? ""} onChange={v => set("q32", v)} numberOfLines={2} />
          </Question>
          <Question n="33" title="Você autoriza que esse depoimento seja utilizado na comunicação e apresentação do Paideia?" hint="Esta autorização é independente do consentimento para participar da pesquisa — o depoimento é sempre opcional.">
            <RadioGroup value={a.q33 ?? ""} onChange={v => set("q33", v)}
              options={["Sim, de forma anônima", "Sim, com meu primeiro nome e profissão", "Não autorizo utilização pública"]} />
          </Question>
        </Section>

        {error && (
          <View style={s.errorBox}>
            <Ionicons name="alert-circle" size={16} color="#DC2626" />
            <Text style={s.errorText}>{error}</Text>
          </View>
        )}

        <TouchableOpacity
          style={[s.submitBtn, (!canSave || saving) && s.submitBtnDisabled]}
          onPress={handleSave}
          disabled={!canSave || saving}
          activeOpacity={0.85}
        >
          {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.submitBtnText}>Enviar respostas</Text>}
        </TouchableOpacity>
        {!canSave && !saving && (
          <Text style={s.helperText}>Preencha todas as perguntas obrigatórias (*) para enviar.</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:       { flex: 1, backgroundColor: Colors.gray[50] },
  header:     { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.gray[100] },
  backBtn:    { padding: 4 },
  headerTitle: { fontSize: 16, fontWeight: "700", color: Colors.ink },
  headerSub:  { fontSize: 12, color: Colors.gray[500] },
  scroll:     { padding: 16, paddingBottom: 50, gap: 14 },
  introBox:   { backgroundColor: Colors.brand[50], borderWidth: 1, borderColor: Colors.brand[100], borderRadius: 16, padding: 16, gap: 6 },
  introTitle: { fontSize: 14, fontWeight: "700", color: Colors.brand[800] },
  introText:  { fontSize: 12, color: Colors.brand[700], lineHeight: 18 },
  introBold:  { fontSize: 12, fontWeight: "700", color: Colors.brand[800], lineHeight: 18 },
  section:    { backgroundColor: Colors.white, borderRadius: 16, paddingHorizontal: 16, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  sectionTitle: { fontSize: 12, fontWeight: "700", color: Colors.brand[600], textTransform: "uppercase", letterSpacing: 0.4, paddingTop: 14, paddingBottom: 4 },
  question:   { paddingVertical: 14, borderTopWidth: 1, borderTopColor: Colors.gray[50] },
  questionTitle: { fontSize: 13, fontWeight: "600", color: Colors.ink, lineHeight: 19 },
  questionHint: { fontSize: 11, color: Colors.gray[500], marginTop: 3 },
  option:     { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: Colors.gray[200] },
  optionSelected: { borderColor: Colors.brand[300], backgroundColor: Colors.brand[50] },
  optionText: { flex: 1, fontSize: 13, color: Colors.gray[700] },
  optionTextSelected: { color: Colors.brand[800], fontWeight: "600" },
  radioDot:   { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: Colors.gray[300], alignItems: "center", justifyContent: "center" },
  radioDotSelected: { borderColor: Colors.brand[500] },
  radioDotInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.brand[500] },
  checkBox:   { width: 18, height: 18, borderRadius: 5, borderWidth: 2, borderColor: Colors.gray[300], alignItems: "center", justifyContent: "center" },
  checkBoxSelected: { borderColor: Colors.brand[500], backgroundColor: Colors.brand[500] },
  openInput:  { borderWidth: 1, borderColor: Colors.gray[200], borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 13, color: Colors.ink, backgroundColor: Colors.white },
  scaleBtn:   { width: 32, height: 32, borderRadius: 8, borderWidth: 1, borderColor: Colors.gray[200], alignItems: "center", justifyContent: "center" },
  scaleBtnSelected: { backgroundColor: Colors.brand[500], borderColor: Colors.brand[500] },
  scaleBtnText: { fontSize: 13, fontWeight: "700", color: Colors.gray[600] },
  scaleBtnTextSelected: { color: "#fff" },
  scaleLabel: { fontSize: 10, color: Colors.gray[500], flexShrink: 1 },
  errorBox:   { flexDirection: "row", alignItems: "flex-start", gap: 8, backgroundColor: "#FEF2F2", borderWidth: 1, borderColor: "#FECACA", borderRadius: 12, padding: 12 },
  errorText:  { fontSize: 13, color: "#DC2626", flex: 1 },
  submitBtn:  { backgroundColor: Colors.brand[500], borderRadius: 14, paddingVertical: 14, alignItems: "center", justifyContent: "center" },
  submitBtnDisabled: { backgroundColor: Colors.gray[300] },
  submitBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  helperText: { fontSize: 11, color: Colors.gray[400], textAlign: "center" },
  // Tela de conclusão
  doneWrap:   { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  doneIcon:   { width: 64, height: 64, borderRadius: 20, backgroundColor: "#DCFCE7", alignItems: "center", justifyContent: "center", marginBottom: 18 },
  doneTitle:  { fontSize: 17, fontWeight: "700", color: Colors.ink, marginBottom: 8, textAlign: "center" },
  doneText:   { fontSize: 13, color: Colors.gray[500], textAlign: "center", lineHeight: 19, marginBottom: 24 },
  doneBtn:    { backgroundColor: Colors.brand[500], borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 },
  doneBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },
});
