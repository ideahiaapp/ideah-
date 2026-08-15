import { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/store/auth.store";
import { Colors } from "@/constants/colors";
import { HamburgerMenu } from "@/components/HamburgerMenu";

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

function dateLine(): string {
  const raw = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

type HowItWorksContent = {
  title: string;
  subtitle: string;
  steps: { title: string; desc: string }[];
  ctaLabel: string;
  ctaHref: string;
};

const HOW_IT_WORKS: Record<"supervision" | "client", HowItWorksContent> = {
  supervision: {
    title: "Supervisão clínica",
    subtitle: "Um espaço de reflexão dialógica para investigar seus casos a partir da abordagem teórica escolhida.",
    steps: [
      { title: "Escolha o cliente", desc: "Selecione o caso que deseja supervisionar." },
      { title: "Escolha a abordagem", desc: "Defina a base teórica que orientará a supervisão." },
      { title: "Inicie a reflexão", desc: "Traga suas impressões, dúvidas ou situações da sessão. O Paideia dialogará com você por meio de perguntas e reflexões para apoiar a construção do seu raciocínio clínico." },
    ],
    ctaLabel: "Iniciar supervisão",
    ctaHref: "/supervision",
  },
  client: {
    title: "Acompanhamento do cliente",
    subtitle: "Organize em um único espaço o cadastro, a anamnese, o prontuário e o histórico do acompanhamento.",
    steps: [
      { title: "Cadastre o cliente", desc: "Informe os dados iniciais e a abordagem terapêutica." },
      { title: "Realize a anamnese", desc: "Preencha a anamnese ou envie um link para que o próprio cliente responda." },
      { title: "Acompanhe o percurso", desc: "Supervisões, evoluções e registros ficam vinculados ao cliente ao longo do acompanhamento." },
    ],
    ctaLabel: "Cadastrar cliente",
    ctaHref: "/new-client",
  },
};

function HowItWorksModal({ content, onClose, onCta }: { content: HowItWorksContent; onClose: () => void; onCta: () => void }) {
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={s.modalOverlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
        <View style={s.modalCard}>
          <TouchableOpacity onPress={onClose} style={s.modalClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close" size={20} color={Colors.gray[400]} />
          </TouchableOpacity>
          <Text style={s.modalTitle}>{content.title}</Text>
          <Text style={s.modalSubtitle}>{content.subtitle}</Text>
          <View style={{ gap: 14, marginTop: 16 }}>
            {content.steps.map((step, i) => (
              <View key={step.title} style={{ flexDirection: "row", gap: 10 }}>
                <View style={s.stepNumber}><Text style={s.stepNumberText}>{i + 1}</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={s.stepTitle}>{step.title}</Text>
                  <Text style={s.stepDesc}>{step.desc}</Text>
                </View>
              </View>
            ))}
          </View>
          <TouchableOpacity style={s.modalCta} onPress={onCta} activeOpacity={0.85}>
            <Text style={s.modalCtaText}>{content.ctaLabel}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

export default function HomeScreen() {
  const { user } = useAuthStore();
  const router = useRouter();
  const firstName = user?.name?.split(" ")[0] ?? "Terapeuta";
  const [howItWorks, setHowItWorks] = useState<"supervision" | "client" | null>(null);

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Topo */}
        <View style={s.topRow}>
          <HamburgerMenu />
        </View>

        {/* Saudação */}
        <View style={s.greetingRow}>
          <Text style={s.greeting}>{greeting()}, {firstName}</Text>
          <Text style={s.date}>{dateLine()}</Text>
        </View>
        <Text style={s.question}>Qual caso você quer acompanhar agora?</Text>

        {/* Cards */}
        <View style={s.cards}>
          <View style={s.card}>
            <View style={[s.cardIcon, { backgroundColor: Colors.brand[500] }]}>
              <Ionicons name="chatbubbles" size={22} color="#fff" />
            </View>
            <Text style={s.cardTitle}>Iniciar supervisão</Text>
            <Text style={s.cardDesc}>Investigue um caso em acompanhamento e aprofunde seu raciocínio clínico.</Text>
            <View style={s.cardActions}>
              <TouchableOpacity style={s.cardCta} onPress={() => router.push("/supervision")} activeOpacity={0.85}>
                <Text style={s.cardCtaText}>Iniciar supervisão</Text>
                <Ionicons name="arrow-forward" size={14} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setHowItWorks("supervision")} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={s.howItWorksLink}>Como funciona?</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={s.card}>
            <View style={[s.cardIcon, { backgroundColor: Colors.brand[100] }]}>
              <Ionicons name="people" size={22} color={Colors.brand[600]} />
            </View>
            <Text style={s.cardTitle}>Cadastrar cliente</Text>
            <Text style={s.cardDesc}>Cadastre um novo cliente para iniciar e organizar seu acompanhamento clínico.</Text>
            <View style={s.cardActions}>
              <TouchableOpacity style={s.cardCtaOutline} onPress={() => router.push("/new-client" as never)} activeOpacity={0.85}>
                <Text style={s.cardCtaOutlineText}>Cadastrar cliente</Text>
                <Ionicons name="arrow-forward" size={14} color={Colors.brand[600]} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setHowItWorks("client")} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={s.howItWorksLink}>Como funciona?</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      {howItWorks && (
        <HowItWorksModal
          content={HOW_IT_WORKS[howItWorks]}
          onClose={() => setHowItWorks(null)}
          onCta={() => { const href = HOW_IT_WORKS[howItWorks].ctaHref; setHowItWorks(null); router.push(href as never); }}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: Colors.brand[50] },
  scroll:      { padding: 20, paddingBottom: 40 },
  topRow:      { flexDirection: "row", justifyContent: "flex-start", marginBottom: 8 },
  greetingRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginTop: 8 },
  greeting:    { fontSize: 24, fontWeight: "700", color: Colors.ink, flexShrink: 1 },
  date:        { fontSize: 12, color: Colors.gray[500], textAlign: "right", marginLeft: 8 },
  question:    { fontSize: 14, color: Colors.gray[600], marginTop: 6, marginBottom: 28 },
  cards:       { gap: 16 },
  card:        { backgroundColor: Colors.white, borderRadius: 20, padding: 20, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 10, elevation: 2 },
  cardIcon:    { width: 46, height: 46, borderRadius: 14, alignItems: "center", justifyContent: "center", marginBottom: 14 },
  cardTitle:   { fontSize: 17, fontWeight: "700", color: Colors.ink, marginBottom: 6 },
  cardDesc:    { fontSize: 13, color: Colors.gray[500], lineHeight: 19, marginBottom: 18 },
  cardActions: { flexDirection: "row", alignItems: "center", gap: 16, flexWrap: "wrap" },
  cardCta:     { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: Colors.brand[500], alignSelf: "flex-start", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  cardCtaText: { fontSize: 13, fontWeight: "700", color: "#fff" },
  cardCtaOutline: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.gray[200], alignSelf: "flex-start", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  cardCtaOutlineText: { fontSize: 13, fontWeight: "700", color: Colors.gray[700] },
  howItWorksLink: { fontSize: 13, fontWeight: "700", color: Colors.brand[600] },
  // Modal "Como funciona?"
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", alignItems: "center", justifyContent: "center", padding: 24 },
  modalCard:   { backgroundColor: Colors.white, borderRadius: 20, padding: 24, width: "100%", maxWidth: 400 },
  modalClose:  { position: "absolute", top: 16, right: 16, zIndex: 1 },
  modalTitle:  { fontSize: 19, fontWeight: "700", color: Colors.ink, paddingRight: 24 },
  modalSubtitle: { fontSize: 13, color: Colors.gray[500], marginTop: 8, lineHeight: 19 },
  stepNumber:  { width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.brand[50], alignItems: "center", justifyContent: "center" },
  stepNumberText: { fontSize: 11, fontWeight: "700", color: Colors.brand[600] },
  stepTitle:   { fontSize: 13, fontWeight: "700", color: Colors.ink },
  stepDesc:    { fontSize: 13, color: Colors.gray[500], marginTop: 2, lineHeight: 18 },
  modalCta:    { marginTop: 22, backgroundColor: Colors.brand[500], borderRadius: 12, paddingVertical: 13, alignItems: "center" },
  modalCtaText: { fontSize: 14, fontWeight: "700", color: "#fff" },
});
