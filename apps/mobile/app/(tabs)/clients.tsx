import { useEffect, useState, useCallback } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, ActivityIndicator, Modal, ScrollView, Alert, Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import * as Clipboard from "expo-clipboard";
import { useAuthStore } from "@/store/auth.store";
import { supabase } from "@/lib/supabase";
import { Colors } from "@/constants/colors";
import { HamburgerMenu } from "@/components/HamburgerMenu";

type Client = {
  id: string; name: string; email: string | null; phone: string | null;
  status: string; approach_label: string | null; main_demand: string | null;
  total_sessions: number; created_at: string;
};

const ALL_APPROACHES = [
  { value: "PSYCHOANALYSIS",       label: "Psicanálise Freudiana" },
  { value: "COGNITIVE_BEHAVIORAL", label: "TCC" },
  { value: "JUNGIAN",              label: "Junguiana" },
  { value: "SOMATIC",              label: "Somática / Corporal" },
  { value: "TANTRA",               label: "Sexualidade Humana e Tantra" },
  { value: "GESTALT",              label: "Gestalt-terapia" },
  { value: "PSYCHODRAMA",          label: "Psicodrama" },
  { value: "SYSTEMIC",             label: "Constelação Familiar" },
];

function PickerField({ label, value, options, onChange }: {
  label: string; value: string; options: { value: string; label: string }[]; onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selectedLabel = options.find(o => o.value === value)?.label;
  return (
    <View style={{ marginBottom: 10 }}>
      <TouchableOpacity style={s.selector} onPress={() => setOpen(!open)}>
        <Text style={selectedLabel ? s.selectorText : s.selectorPlaceholder} numberOfLines={1}>
          {selectedLabel ?? label}
        </Text>
        <Ionicons name={open ? "chevron-up" : "chevron-down"} size={16} color={Colors.gray[400]} />
      </TouchableOpacity>
      {open && (
        <View style={s.pickerList}>
          {options.map(o => (
            <TouchableOpacity
              key={o.value}
              style={[s.pickerItem, value === o.value && s.pickerItemActive]}
              onPress={() => { onChange(o.value); setOpen(false); }}
            >
              <Text style={[s.pickerItemText, value === o.value && { color: Colors.brand[600] }]} numberOfLines={1}>{o.label}</Text>
              {value === o.value && <Ionicons name="checkmark" size={16} color={Colors.brand[500]} />}
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

function AnamneseLinkCard({ therapistId, clients }: { therapistId: string; clients: Client[] }) {
  const [mode, setMode]           = useState<"new" | "existing">("new");
  const [selectedId, setSelectedId] = useState("");
  const [approach, setApproach]   = useState("");
  const [newEmail, setNewEmail]   = useState("");
  const [emailOpen, setEmailOpen] = useState(false);
  const [sending, setSending]     = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [copied, setCopied]       = useState(false);
  const [acquiredApproaches, setAcquiredApproaches] = useState<string[]>([]);
  const [loadingApproaches, setLoadingApproaches]   = useState(true);

  useEffect(() => {
    fetch(`${process.env.EXPO_PUBLIC_WEB_URL}/api/therapist-approaches?therapistId=${therapistId}`)
      .then(r => r.json())
      .then(d => setAcquiredApproaches(d.approaches ?? []))
      .catch(() => {})
      .finally(() => setLoadingApproaches(false));
  }, [therapistId]);

  const approachOptions = ALL_APPROACHES.filter(a => acquiredApproaches.includes(a.value));
  const selectedClient = clients.find(c => c.id === selectedId) ?? null;
  const baseUrl = process.env.EXPO_PUBLIC_WEB_URL ?? "";

  const ready = !!approach && (mode === "new" ? true : !!selectedClient);
  const approachParam = approach ? `?approach=${approach}` : "";
  const link = mode === "new"
    ? `${baseUrl}/anamnese/${therapistId}${approachParam}`
    : (selectedClient ? `${baseUrl}/anamnese/preencher/${selectedClient.id}${approachParam}` : "");

  const waText = encodeURIComponent(
    mode === "new"
      ? `Olá! Para agendarmos sua sessão, peço que preencha a anamnese inicial pelo link abaixo:\n${link}`
      : `Olá ${selectedClient?.name ?? ""}! Para seguirmos com seu atendimento, peço que confirme/preencha sua anamnese pelo link abaixo:\n${link}`
  );

  function switchMode(m: "new" | "existing") {
    setMode(m); setEmailOpen(false); setEmailSent(false); setSelectedId(""); setCopied(false);
  }

  async function copyLink() {
    if (!link) return;
    await Clipboard.setStringAsync(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function openWhatsApp() {
    if (!ready) return;
    Linking.openURL(`https://wa.me/?text=${waText}`);
  }

  async function sendEmail() {
    if (mode === "existing" && !selectedClient) return;
    if (mode === "new" && !newEmail.trim()) return;
    setSending(true);
    try {
      const res = await fetch(`${process.env.EXPO_PUBLIC_WEB_URL}/api/anamnese/invite`, {
        method: "POST",
        // "Origin" precisa ser setado manualmente aqui: sem ele a API monta um link
        // relativo (sem domínio) no e-mail enviado — no navegador esse cabeçalho é
        // preenchido automaticamente, mas o fetch do React Native não faz isso sozinho.
        headers: { "Content-Type": "application/json", Origin: process.env.EXPO_PUBLIC_WEB_URL ?? "" },
        body: JSON.stringify(
          mode === "existing"
            ? { therapistId, clientId: selectedClient!.id }
            : { therapistId, patientEmail: newEmail.trim() }
        ),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao enviar.");
      setEmailSent(true);
      setTimeout(() => { setEmailSent(false); setEmailOpen(false); }, 3000);
    } catch (e) {
      Alert.alert("Erro", e instanceof Error ? e.message : "Erro ao enviar e-mail.");
    } finally {
      setSending(false);
    }
  }

  return (
    <View style={s.anamneseCard}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <View style={s.anamneseIcon}><Ionicons name="link" size={18} color={Colors.brand[600]} /></View>
        <View style={{ flex: 1 }}>
          <Text style={s.anamneseTitle}>Enviar anamnese</Text>
          <Text style={s.anamneseSubtitle}>
            {mode === "new"
              ? "Novo cliente — o preenchimento é o pré-cadastro."
              : "Cliente já cadastrado — dados já vêm preenchidos no link."}
          </Text>
        </View>
      </View>

      <View style={s.modeToggle}>
        <TouchableOpacity style={[s.modeBtn, mode === "new" && s.modeBtnActive]} onPress={() => switchMode("new")}>
          <Text style={[s.modeBtnText, mode === "new" && s.modeBtnTextActive]}>Novo cliente</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.modeBtn, mode === "existing" && s.modeBtnActive]} onPress={() => switchMode("existing")}>
          <Text style={[s.modeBtnText, mode === "existing" && s.modeBtnTextActive]}>Já cadastrado</Text>
        </TouchableOpacity>
      </View>

      {loadingApproaches ? (
        <ActivityIndicator size="small" color={Colors.brand[500]} style={{ marginVertical: 8 }} />
      ) : approachOptions.length === 0 ? (
        <Text style={s.warnText}>Nenhuma base teórica adquirida. Acesse Configurações → Minhas Bases.</Text>
      ) : (
        <PickerField label="Selecionar abordagem terapêutica *" value={approach} onChange={v => { setApproach(v); setCopied(false); setEmailOpen(false); }} options={approachOptions} />
      )}

      {mode === "existing" && (
        <PickerField label="Selecionar cliente..." value={selectedId} onChange={v => { setSelectedId(v); setEmailOpen(false); setEmailSent(false); }} options={clients.map(c => ({ value: c.id, label: c.name }))} />
      )}

      <View style={s.actionsRow}>
        <TouchableOpacity style={[s.actionBtn, !ready && s.actionBtnDisabled]} onPress={copyLink} disabled={!ready}>
          <Ionicons name={copied ? "checkmark" : "copy-outline"} size={14} color={copied ? "#16A34A" : Colors.brand[700]} />
          <Text style={[s.actionBtnText, copied && { color: "#16A34A" }]}>{copied ? "Copiado!" : "Copiar link"}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.actionBtnGreen, !ready && s.actionBtnDisabled]} onPress={openWhatsApp} disabled={!ready}>
          <Ionicons name="logo-whatsapp" size={14} color="#fff" />
          <Text style={s.actionBtnGreenText}>WhatsApp</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.actionBtn, !ready && s.actionBtnDisabled]} onPress={() => setEmailOpen(v => !v)} disabled={!ready}>
          <Ionicons name="mail-outline" size={14} color={Colors.brand[700]} />
          <Text style={s.actionBtnText}>E-mail</Text>
        </TouchableOpacity>
      </View>

      {emailOpen && (
        <View style={s.emailRow}>
          {mode === "new" ? (
            <TextInput
              style={s.emailInput}
              value={newEmail}
              onChangeText={setNewEmail}
              placeholder="email@docliente.com"
              placeholderTextColor={Colors.gray[400]}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          ) : (
            <Text style={s.emailInput} numberOfLines={1}>
              {selectedClient?.email ?? "Cliente sem e-mail cadastrado"}
            </Text>
          )}
          {emailSent ? (
            <Text style={s.emailSentText}>Enviado!</Text>
          ) : (
            <TouchableOpacity
              style={[s.emailSendBtn, (sending || (mode === "new" ? !newEmail.trim() : !selectedClient?.email)) && s.actionBtnDisabled]}
              onPress={sendEmail}
              disabled={sending || (mode === "new" ? !newEmail.trim() : !selectedClient?.email)}
            >
              {sending ? <ActivityIndicator size="small" color="#fff" /> : <Text style={s.emailSendBtnText}>Enviar</Text>}
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

type Evolution = {
  id: string; session_date: string; content: string;
  mood: number | null; session_number: number | null;
};

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  ACTIVE:   { label: "Ativo",     color: "#16A34A", bg: "#DCFCE7" },
  INACTIVE: { label: "Inativo",   color: "#6B7280", bg: "#F3F4F6" },
  WAITING:  { label: "Aguardando",color: "#D97706", bg: "#FEF3C7" },
};

const MOOD_LABEL = ["", "Muito difícil", "Difícil", "Neutro", "Produtivo", "Excelente"];
const MOOD_COLOR = ["", "#EF4444", "#F97316", "#EAB308", "#3B82F6", "#22C55E"];

export default function ClientsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [clients, setClients]   = useState<Client[]>([]);
  const [filtered, setFiltered] = useState<Client[]>([]);
  const [search, setSearch]     = useState("");
  const [loading, setLoading]   = useState(true);
  const [selected, setSelected] = useState<Client | null>(null);
  const [evolutions, setEvolutions] = useState<Evolution[]>([]);
  const [evoLoading, setEvoLoading] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("clients")
      .select("id, name, email, phone, status, approach_label, main_demand, total_sessions, created_at")
      .eq("therapist_id", user.id)
      .order("name");
    setClients((data ?? []) as Client[]);
    setFiltered((data ?? []) as Client[]);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(clients.filter(c => c.name.toLowerCase().includes(q) || (c.email ?? "").toLowerCase().includes(q)));
  }, [search, clients]);

  async function openClient(c: Client) {
    setSelected(c);
    setEvoLoading(true);
    const { data } = await supabase
      .from("evolutions")
      .select("id, session_date, content, mood, session_number")
      .eq("client_id", c.id)
      .order("session_date", { ascending: false })
      .limit(20);
    setEvolutions((data ?? []) as Evolution[]);
    setEvoLoading(false);
  }

  async function toggleStatus(c: Client) {
    const next = c.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    await supabase.from("clients").update({ status: next }).eq("id", c.id);
    await load();
    if (selected?.id === c.id) setSelected({ ...c, status: next });
  }

  const renderClient = ({ item }: { item: Client }) => {
    const st = STATUS_MAP[item.status] ?? STATUS_MAP.INACTIVE;
    return (
      <TouchableOpacity style={s.clientCard} onPress={() => openClient(item)} activeOpacity={0.7}>
        <View style={s.clientAvatar}>
          <Text style={s.clientAvatarText}>{item.name[0]?.toUpperCase()}</Text>
        </View>
        <View style={s.clientInfo}>
          <Text style={s.clientName} numberOfLines={1}>{item.name}</Text>
          <Text style={s.clientSub} numberOfLines={1}>{item.approach_label ?? "Abordagem não definida"}</Text>
        </View>
        <View style={[s.badge, { backgroundColor: st.bg }]}>
          <Text style={[s.badgeText, { color: st.color }]}>{st.label}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={s.safe}>
      {/* Header */}
      <View style={s.header}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <HamburgerMenu />
          <Text style={s.title}>Clientes</Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <Text style={s.count}>{clients.length} total</Text>
          <TouchableOpacity onPress={() => router.push("/new-client" as never)} style={s.addBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="add" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Busca */}
      <View style={s.searchRow}>
        <Ionicons name="search" size={16} color={Colors.gray[400]} style={s.searchIcon} />
        <TextInput
          style={s.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar cliente..."
          placeholderTextColor={Colors.gray[400]}
        />
      </View>

      {loading ? (
        <ActivityIndicator color={Colors.brand[500]} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={c => c.id}
          renderItem={renderClient}
          contentContainerStyle={s.list}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={user ? <AnamneseLinkCard therapistId={user.id} clients={clients} /> : null}
          ListEmptyComponent={
            <Text style={s.emptyText}>Nenhum cliente encontrado.</Text>
          }
        />
      )}

      {/* Modal de detalhe */}
      <Modal visible={!!selected} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setSelected(null)}>
        {selected && (
          <SafeAreaView style={s.safe}>
            <View style={s.modalHeader}>
              <TouchableOpacity onPress={() => setSelected(null)}>
                <Ionicons name="close" size={24} color={Colors.gray[700]} />
              </TouchableOpacity>
              <Text style={s.modalTitle} numberOfLines={1}>{selected.name}</Text>
              <TouchableOpacity onPress={() => Alert.alert("Status", "Alterar status?", [
                { text: "Cancelar", style: "cancel" },
                { text: selected.status === "ACTIVE" ? "Inativar" : "Ativar", onPress: () => toggleStatus(selected) },
              ])}>
                <Ionicons name="ellipsis-horizontal" size={22} color={Colors.gray[500]} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={s.modalScroll} showsVerticalScrollIndicator={false}>
              {/* Info card */}
              <View style={s.infoCard}>
                <View style={s.infoRow}>
                  <Text style={s.infoLabel}>Abordagem</Text>
                  <Text style={s.infoValue}>{selected.approach_label ?? "—"}</Text>
                </View>
                <View style={s.infoRow}>
                  <Text style={s.infoLabel}>Demanda principal</Text>
                  <Text style={s.infoValue}>{selected.main_demand ?? "—"}</Text>
                </View>
                <View style={s.infoRow}>
                  <Text style={s.infoLabel}>Total de sessões</Text>
                  <Text style={s.infoValue}>{selected.total_sessions}</Text>
                </View>
                {selected.email && (
                  <View style={s.infoRow}>
                    <Text style={s.infoLabel}>E-mail</Text>
                    <Text style={s.infoValue}>{selected.email}</Text>
                  </View>
                )}
              </View>

              <Text style={s.sectionTitle}>Evoluções recentes</Text>

              {evoLoading ? (
                <ActivityIndicator color={Colors.brand[500]} />
              ) : evolutions.length === 0 ? (
                <Text style={s.emptyText}>Nenhuma evolução registrada.</Text>
              ) : (
                evolutions.map(e => (
                  <View key={e.id} style={s.evoCard}>
                    <View style={s.evoHeader}>
                      <Text style={s.evoDate}>{new Date(e.session_date).toLocaleDateString("pt-BR")}</Text>
                      {e.mood && (
                        <View style={[s.moodBadge, { backgroundColor: MOOD_COLOR[e.mood] + "22" }]}>
                          <Text style={[s.moodText, { color: MOOD_COLOR[e.mood] }]}>{MOOD_LABEL[e.mood]}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={s.evoContent} numberOfLines={4}>{e.content}</Text>
                  </View>
                ))
              )}
            </ScrollView>
          </SafeAreaView>
        )}
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: Colors.gray[50] },
  header:      { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 },
  title:       { fontSize: 24, fontWeight: "700", color: Colors.ink },
  count:       { fontSize: 13, color: Colors.gray[500] },
  addBtn:      { width: 30, height: 30, borderRadius: 15, backgroundColor: Colors.brand[500], alignItems: "center", justifyContent: "center" },
  searchRow:   { flexDirection: "row", alignItems: "center", backgroundColor: Colors.white, marginHorizontal: 20, marginBottom: 12, borderRadius: 12, borderWidth: 1, borderColor: Colors.gray[200], paddingHorizontal: 12 },
  searchIcon:  { marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 11, fontSize: 14, color: Colors.ink },
  list:        { paddingHorizontal: 20, paddingBottom: 40, gap: 10 },
  // Card "Enviar anamnese"
  anamneseCard: { backgroundColor: Colors.brand[50], borderWidth: 1, borderColor: Colors.brand[100], borderRadius: 16, padding: 16, marginBottom: 6 },
  anamneseIcon: { width: 34, height: 34, borderRadius: 10, backgroundColor: Colors.brand[100], alignItems: "center", justifyContent: "center" },
  anamneseTitle: { fontSize: 14, fontWeight: "700", color: Colors.brand[900] },
  anamneseSubtitle: { fontSize: 11, color: Colors.brand[600], marginTop: 2, lineHeight: 15 },
  modeToggle: { flexDirection: "row", gap: 4, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.brand[200], borderRadius: 12, padding: 4, alignSelf: "flex-start", marginBottom: 10 },
  modeBtn:    { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 9 },
  modeBtnActive: { backgroundColor: Colors.brand[500] },
  modeBtnText: { fontSize: 11, fontWeight: "700", color: Colors.brand[600] },
  modeBtnTextActive: { color: "#fff" },
  warnText:   { fontSize: 11, color: "#B45309", backgroundColor: "#FEF3C7", borderWidth: 1, borderColor: "#FDE68A", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 8 },
  actionsRow: { flexDirection: "row", gap: 8, marginTop: 4 },
  actionBtn:  { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.brand[200], borderRadius: 10, paddingVertical: 9 },
  actionBtnDisabled: { opacity: 0.4 },
  actionBtnText: { fontSize: 11, fontWeight: "700", color: Colors.brand[700] },
  actionBtnGreen: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, backgroundColor: "#22C55E", borderRadius: 10, paddingVertical: 9 },
  actionBtnGreenText: { fontSize: 11, fontWeight: "700", color: "#fff" },
  emailRow:   { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.brand[200], borderRadius: 10, paddingHorizontal: 10, marginTop: 8 },
  emailInput: { flex: 1, fontSize: 13, color: Colors.ink, paddingVertical: 9 },
  emailSentText: { fontSize: 11, fontWeight: "700", color: "#16A34A", paddingVertical: 9 },
  emailSendBtn: { backgroundColor: Colors.brand[500], borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7 },
  emailSendBtnText: { fontSize: 11, fontWeight: "700", color: "#fff" },
  // Picker (reaproveitado do padrão certificate/new-client)
  selector:   { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderWidth: 1, borderColor: Colors.brand[200], backgroundColor: Colors.white, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, marginBottom: 10 },
  selectorText: { fontSize: 13, color: Colors.ink, flex: 1 },
  selectorPlaceholder: { fontSize: 13, color: Colors.gray[400], flex: 1 },
  pickerList: { borderWidth: 1, borderColor: Colors.gray[200], borderRadius: 12, overflow: "hidden", marginTop: -4, marginBottom: 10, backgroundColor: Colors.white },
  pickerItem: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 14, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: Colors.gray[100] },
  pickerItemActive: { backgroundColor: Colors.brand[50] },
  pickerItemText: { fontSize: 13, color: Colors.ink, flex: 1 },
  clientCard:  { flexDirection: "row", alignItems: "center", backgroundColor: Colors.white, borderRadius: 14, padding: 14, gap: 12, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  clientAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.brand[100], alignItems: "center", justifyContent: "center" },
  clientAvatarText: { fontSize: 18, fontWeight: "700", color: Colors.brand[600] },
  clientInfo:  { flex: 1 },
  clientName:  { fontSize: 15, fontWeight: "600", color: Colors.ink },
  clientSub:   { fontSize: 12, color: Colors.gray[500], marginTop: 2 },
  badge:       { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText:   { fontSize: 11, fontWeight: "600" },
  emptyText:   { textAlign: "center", color: Colors.gray[400], marginTop: 40, fontSize: 14 },
  // Modal
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, borderBottomWidth: 1, borderBottomColor: Colors.gray[100] },
  modalTitle:  { flex: 1, fontSize: 17, fontWeight: "700", color: Colors.ink, textAlign: "center", marginHorizontal: 8 },
  modalScroll: { padding: 20, paddingBottom: 40 },
  infoCard:    { backgroundColor: Colors.white, borderRadius: 14, padding: 16, marginBottom: 20, gap: 12, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  infoRow:     { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  infoLabel:   { fontSize: 13, color: Colors.gray[500], flex: 1 },
  infoValue:   { fontSize: 13, fontWeight: "600", color: Colors.ink, flex: 1, textAlign: "right" },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: Colors.ink, marginBottom: 12 },
  evoCard:     { backgroundColor: Colors.white, borderRadius: 14, padding: 14, marginBottom: 10, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  evoHeader:   { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  evoDate:     { fontSize: 12, fontWeight: "600", color: Colors.gray[500] },
  moodBadge:   { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  moodText:    { fontSize: 11, fontWeight: "600" },
  evoContent:  { fontSize: 13, color: Colors.gray[700], lineHeight: 20 },
});
