import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
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

export default function HomeScreen() {
  const { user } = useAuthStore();
  const router = useRouter();
  const firstName = user?.name?.split(" ")[0] ?? "Terapeuta";

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
          <TouchableOpacity style={s.card} onPress={() => router.push("/supervision")} activeOpacity={0.85}>
            <View style={[s.cardIcon, { backgroundColor: Colors.brand[500] }]}>
              <Ionicons name="chatbubbles" size={22} color="#fff" />
            </View>
            <Text style={s.cardTitle}>Supervisionar cliente</Text>
            <Text style={s.cardDesc}>Inicie uma supervisão dialógica com apoio da IA para um caso em acompanhamento.</Text>
            <View style={s.cardCta}>
              <Text style={s.cardCtaText}>Supervisionar</Text>
              <Ionicons name="arrow-forward" size={14} color="#fff" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={s.card} onPress={() => router.push("/(tabs)/clients")} activeOpacity={0.85}>
            <View style={[s.cardIcon, { backgroundColor: Colors.brand[100] }]}>
              <Ionicons name="people" size={22} color={Colors.brand[600]} />
            </View>
            <Text style={s.cardTitle}>Novo Cliente</Text>
            <Text style={s.cardDesc}>Cadastre um novo cliente para começar o acompanhamento.</Text>
            <View style={s.cardCtaOutline}>
              <Text style={s.cardCtaOutlineText}>Novo cliente</Text>
              <Ionicons name="arrow-forward" size={14} color={Colors.brand[600]} />
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  cardCta:     { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: Colors.brand[500], alignSelf: "flex-start", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  cardCtaText: { fontSize: 13, fontWeight: "700", color: "#fff" },
  cardCtaOutline: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.gray[200], alignSelf: "flex-start", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  cardCtaOutlineText: { fontSize: 13, fontWeight: "700", color: Colors.gray[700] },
});
