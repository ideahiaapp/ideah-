import { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/store/auth.store";
import { supabase } from "@/lib/supabase";
import { Colors } from "@/constants/colors";

type KPI = { label: string; value: string; icon: React.ComponentProps<typeof Ionicons>["name"]; color: string };

export default function HomeScreen() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const [kpis, setKpis]   = useState<KPI[]>([]);
  const [loading, setLoading] = useState(true);
  const [recentClients, setRecentClients] = useState<{ id: string; name: string; status: string }[]>([]);

  const firstName = user?.name?.split(" ")[0] ?? "Terapeuta";

  useEffect(() => {
    if (!user) return;
    async function load() {
      const [{ count: totalClients }, { count: activeSessions }, { count: totalEvolutions }] = await Promise.all([
        supabase.from("clients").select("*", { count: "exact", head: true }).eq("therapist_id", user!.id),
        supabase.from("clients").select("*", { count: "exact", head: true }).eq("therapist_id", user!.id).eq("status", "ACTIVE"),
        supabase.from("evolutions").select("*", { count: "exact", head: true }).eq("therapist_id", user!.id),
      ]);

      setKpis([
        { label: "Pacientes", value: String(totalClients ?? 0), icon: "people", color: Colors.brand[500] },
        { label: "Ativos", value: String(activeSessions ?? 0), icon: "checkmark-circle", color: Colors.green },
        { label: "Evoluções", value: String(totalEvolutions ?? 0), icon: "document-text", color: "#3B82F6" },
      ]);

      const { data } = await supabase
        .from("clients")
        .select("id, name, status")
        .eq("therapist_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(5);
      setRecentClients((data ?? []) as { id: string; name: string; status: string }[]);
      setLoading(false);
    }
    load();
  }, [user]);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Bom dia";
    if (h < 18) return "Boa tarde";
    return "Boa noite";
  };

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={s.greeting}>{greeting()}, {firstName} 👋</Text>
            <Text style={s.headerSub}>Sua clínica em um só lugar</Text>
          </View>
          <TouchableOpacity onPress={() => router.push("/(tabs)/settings")} style={s.avatarBtn}>
            <View style={s.avatar}>
              <Text style={s.avatarText}>{firstName[0]?.toUpperCase()}</Text>
            </View>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator color={Colors.brand[500]} style={{ marginTop: 40 }} />
        ) : (
          <>
            {/* KPIs */}
            <View style={s.kpiRow}>
              {kpis.map(k => (
                <View key={k.label} style={s.kpiCard}>
                  <View style={[s.kpiIcon, { backgroundColor: k.color + "18" }]}>
                    <Ionicons name={k.icon} size={20} color={k.color} />
                  </View>
                  <Text style={s.kpiValue}>{k.value}</Text>
                  <Text style={s.kpiLabel}>{k.label}</Text>
                </View>
              ))}
            </View>

            {/* Acesso rápido */}
            <Text style={s.sectionTitle}>Acesso rápido</Text>
            <View style={s.quickRow}>
              {[
                { label: "Nova Sessão", icon: "add-circle" as const, tab: "/(tabs)/schedule" },
                { label: "Supervisão", icon: "chatbubbles" as const, tab: "/supervision" },
                { label: "Relatório", icon: "bar-chart" as const, tab: "/(tabs)/reports" },
              ].map(item => (
                <TouchableOpacity key={item.label} style={s.quickCard} onPress={() => router.push(item.tab as never)} activeOpacity={0.7}>
                  <Ionicons name={item.icon} size={26} color={Colors.brand[500]} />
                  <Text style={s.quickLabel}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Pacientes recentes */}
            <Text style={s.sectionTitle}>Pacientes recentes</Text>
            <View style={s.card}>
              {recentClients.length === 0 ? (
                <Text style={s.emptyText}>Nenhum paciente cadastrado ainda.</Text>
              ) : (
                recentClients.map((c, i) => (
                  <TouchableOpacity
                    key={c.id}
                    style={[s.clientRow, i < recentClients.length - 1 && s.clientRowBorder]}
                    onPress={() => router.push(`/(tabs)/clients` as never)}
                    activeOpacity={0.7}
                  >
                    <View style={s.clientAvatar}>
                      <Text style={s.clientAvatarText}>{c.name[0]?.toUpperCase()}</Text>
                    </View>
                    <Text style={s.clientName} numberOfLines={1}>{c.name}</Text>
                    <View style={[s.badge, { backgroundColor: c.status === "ACTIVE" ? "#DCFCE7" : Colors.gray[100] }]}>
                      <Text style={[s.badgeText, { color: c.status === "ACTIVE" ? "#16A34A" : Colors.gray[500] }]}>
                        {c.status === "ACTIVE" ? "Ativo" : "Inativo"}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: Colors.gray[50] },
  scroll:        { padding: 20, paddingBottom: 40 },
  header:        { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
  greeting:      { fontSize: 22, fontWeight: "700", color: Colors.ink },
  headerSub:     { fontSize: 13, color: Colors.gray[500], marginTop: 2 },
  avatarBtn:     {},
  avatar:        { width: 42, height: 42, borderRadius: 21, backgroundColor: Colors.brand[100], alignItems: "center", justifyContent: "center" },
  avatarText:    { fontSize: 18, fontWeight: "700", color: Colors.brand[600] },
  kpiRow:        { flexDirection: "row", gap: 12, marginBottom: 24 },
  kpiCard:       { flex: 1, backgroundColor: Colors.white, borderRadius: 16, padding: 14, alignItems: "center", shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  kpiIcon:       { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  kpiValue:      { fontSize: 22, fontWeight: "700", color: Colors.ink },
  kpiLabel:      { fontSize: 11, color: Colors.gray[500], marginTop: 2 },
  sectionTitle:  { fontSize: 15, fontWeight: "700", color: Colors.ink, marginBottom: 12 },
  quickRow:      { flexDirection: "row", gap: 12, marginBottom: 24 },
  quickCard:     { flex: 1, backgroundColor: Colors.white, borderRadius: 16, padding: 16, alignItems: "center", gap: 8, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  quickLabel:    { fontSize: 11, fontWeight: "600", color: Colors.gray[700], textAlign: "center" },
  card:          { backgroundColor: Colors.white, borderRadius: 16, overflow: "hidden", shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, elevation: 2, marginBottom: 16 },
  clientRow:     { flexDirection: "row", alignItems: "center", padding: 14, gap: 12 },
  clientRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.gray[100] },
  clientAvatar:  { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.brand[100], alignItems: "center", justifyContent: "center" },
  clientAvatarText: { fontSize: 15, fontWeight: "700", color: Colors.brand[600] },
  clientName:    { flex: 1, fontSize: 14, fontWeight: "500", color: Colors.ink },
  badge:         { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  badgeText:     { fontSize: 11, fontWeight: "600" },
  emptyText:     { textAlign: "center", color: Colors.gray[400], padding: 20, fontSize: 14 },
});
