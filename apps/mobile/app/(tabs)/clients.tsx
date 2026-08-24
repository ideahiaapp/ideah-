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
  status: string; approach_label: string | null; approaches: string[] | null; main_demand: string | null;
  total_sessions: number; created_at: string; anamnese_id: string | null;
};

function clientApproachLabels(c: Pick<Client, "approach_label" | "approaches">): string[] {
  if (c.approaches?.length) return c.approaches.map(v => ALL_APPROACHES.find(a => a.value === v)?.label ?? v);
  return c.approach_label ? [c.approach_label] : [];
}

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

type Supervision = {
  id: string; title: string; approach: string; updated_at: string; messages_count: number;
};

type TabId = "sem-anamnese" | "ativos" | "aguardando";

type Anamnese = {
  id: string; name: string; email: string; phone: string | null;
  intention: string | null; how_found: string | null; emergency_contact: string | null;
  approach: string | null; created_at: string;
};

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  ACTIVE:   { label: "Ativo",     color: "#16A34A", bg: "#DCFCE7" },
  INACTIVE: { label: "Inativo",   color: "#6B7280", bg: "#F3F4F6" },
  WAITING:  { label: "Aguardando",color: "#D97706", bg: "#FEF3C7" },
};

const MOOD_LABEL = ["", "Muito difícil", "Difícil", "Neutro", "Produtivo", "Excelente"];
const MOOD_COLOR = ["", "#EF4444", "#F97316", "#EAB308", "#3B82F6", "#22C55E"];
const FREQUENCIES = ["Semanal", "Quinzenal", "Mensal", "Sob demanda"];
const DURATIONS   = ["45", "50", "60", "90"];

function PendingAnamneseCard({ anamnese, onReview, onReject }: {
  anamnese: Anamnese; onReview: () => void; onReject: () => void;
}) {
  const [rejecting, setRejecting] = useState(false);

  async function handleReject() {
    setRejecting(true);
    try { await onReject(); } finally { setRejecting(false); }
  }

  return (
    <View style={s.pendingCard}>
      <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 10 }}>
        <View style={s.pendingAvatar}><Text style={s.pendingAvatarText}>{anamnese.name[0]?.toUpperCase()}</Text></View>
        <View style={{ flex: 1 }}>
          <Text style={s.pendingName} numberOfLines={1}>{anamnese.name}</Text>
          <Text style={s.pendingEmail} numberOfLines={1}>{anamnese.email}</Text>
          {anamnese.phone && <Text style={s.pendingEmail} numberOfLines={1}>{anamnese.phone}</Text>}
        </View>
        <Text style={s.pendingDate}>{new Date(anamnese.created_at).toLocaleDateString("pt-BR")}</Text>
      </View>
      {anamnese.intention && (
        <View style={s.intentionBox}>
          <Text style={s.intentionLabel}>Intenção da sessão</Text>
          <Text style={s.intentionText}>"{anamnese.intention}"</Text>
        </View>
      )}
      <View style={s.pendingActions}>
        <TouchableOpacity style={s.reviewBtn} onPress={onReview} activeOpacity={0.8}>
          <Ionicons name="chevron-forward" size={14} color="#fff" />
          <Text style={s.reviewBtnText}>Visualizar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.rejectBtn} onPress={handleReject} disabled={rejecting} activeOpacity={0.8}>
          {rejecting ? <ActivityIndicator size="small" color="#DC2626" /> : <><Ionicons name="close-circle-outline" size={14} color="#DC2626" /><Text style={s.rejectBtnText}>Recusar</Text></>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

function AnamneseReviewModal({ anamneseId, therapistId, onClose, onAccepted }: {
  anamneseId: string | null; therapistId: string; onClose: () => void; onAccepted: () => void;
}) {
  const [anamnese, setAnamnese] = useState<(Anamnese & { referral?: string | null }) | null>(null);
  const [loading, setLoading]   = useState(true);
  const [approach, setApproach] = useState("");
  const [frequency, setFrequency] = useState("Semanal");
  const [duration, setDuration]   = useState("50");
  const [mainDemand, setMainDemand] = useState("");
  const [notes, setNotes]         = useState("");
  const [saving, setSaving]       = useState(false);
  const [acquiredApproaches, setAcquiredApproaches] = useState<string[]>([]);
  const [loadingApproaches, setLoadingApproaches]   = useState(true);

  useEffect(() => {
    if (!anamneseId) return;
    setLoading(true);
    fetch(`${process.env.EXPO_PUBLIC_WEB_URL}/api/anamnese/${anamneseId}`)
      .then(r => r.json())
      .then(d => {
        if (d.anamnese) {
          setAnamnese(d.anamnese);
          setMainDemand(d.anamnese.intention ?? "");
          setApproach(d.anamnese.approach ?? "");
        }
      })
      .finally(() => setLoading(false));

    fetch(`${process.env.EXPO_PUBLIC_WEB_URL}/api/therapist-approaches?therapistId=${therapistId}`)
      .then(r => r.json())
      .then(d => setAcquiredApproaches(d.approaches ?? []))
      .catch(() => {})
      .finally(() => setLoadingApproaches(false));
  }, [anamneseId, therapistId]);

  const approachOptions = ALL_APPROACHES.filter(a => acquiredApproaches.includes(a.value));
  const selectedApproach = ALL_APPROACHES.find(a => a.value === approach);
  const canSave = !!approach && !!anamnese;

  async function handleAccept() {
    if (!canSave || !anamnese) return;
    setSaving(true);
    try {
      const { error: insErr } = await supabase.from("clients").insert({
        therapist_id:      therapistId,
        name:              anamnese.name,
        email:             anamnese.email || null,
        phone:             anamnese.phone || null,
        approach:          selectedApproach?.value ?? null,
        approach_label:    selectedApproach?.label ?? null,
        status:            "ACTIVE",
        session_frequency: frequency,
        session_duration:  parseInt(duration, 10),
        main_demand:       mainDemand.trim() || anamnese.intention || null,
        notes:             notes.trim() || null,
        emergency_contact: anamnese.emergency_contact || null,
        anamnese_id:       anamnese.id,
        initials:          anamnese.name.trim().split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase() ?? "").join(""),
        color:             "#C2542F",
        total_sessions:    0,
      });
      if (insErr) throw insErr;

      await fetch(`${process.env.EXPO_PUBLIC_WEB_URL}/api/anamnese/${anamnese.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ACCEPTED" }),
      });

      onAccepted();
      onClose();
    } catch (e) {
      Alert.alert("Erro", e instanceof Error ? e.message : "Erro ao ativar cliente.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal visible={!!anamneseId} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={s.safe}>
        <View style={s.modalHeader}>
          <TouchableOpacity onPress={onClose}><Ionicons name="close" size={24} color={Colors.gray[700]} /></TouchableOpacity>
          <Text style={s.modalTitle} numberOfLines={1}>{anamnese?.name ?? "Anamnese"}</Text>
          <View style={{ width: 24 }} />
        </View>
        {loading ? (
          <ActivityIndicator color={Colors.brand[500]} style={{ marginTop: 40 }} />
        ) : !anamnese ? (
          <Text style={[s.emptyText, { marginTop: 40 }]}>Anamnese não encontrada.</Text>
        ) : (
          <ScrollView contentContainerStyle={s.modalScroll} keyboardShouldPersistTaps="handled">
            <View style={s.infoCard}>
              <View style={s.infoRow}><Text style={s.infoLabel}>E-mail</Text><Text style={s.infoValue}>{anamnese.email}</Text></View>
              {anamnese.phone && <View style={s.infoRow}><Text style={s.infoLabel}>Telefone</Text><Text style={s.infoValue}>{anamnese.phone}</Text></View>}
              {anamnese.how_found && <View style={s.infoRow}><Text style={s.infoLabel}>Como chegou</Text><Text style={s.infoValue}>{anamnese.how_found}</Text></View>}
              {anamnese.intention && <View style={s.infoRow}><Text style={s.infoLabel}>Intenção</Text><Text style={s.infoValue}>{anamnese.intention}</Text></View>}
            </View>

            <Text style={s.fieldLabel}>Abordagem terapêutica *</Text>
            {loadingApproaches ? (
              <ActivityIndicator size="small" color={Colors.brand[500]} style={{ marginBottom: 10 }} />
            ) : approachOptions.length === 0 ? (
              <Text style={s.warnText}>Nenhuma base teórica adquirida. Acesse Configurações → Minhas Bases.</Text>
            ) : (
              <PickerField label="Selecionar..." value={approach} onChange={setApproach} options={approachOptions} />
            )}

            <Text style={s.fieldLabel}>Frequência das sessões</Text>
            <PickerField label="Selecionar..." value={frequency} onChange={setFrequency} options={FREQUENCIES.map(f => ({ value: f, label: f }))} />

            <Text style={s.fieldLabel}>Duração (minutos)</Text>
            <PickerField label="Selecionar..." value={duration} onChange={setDuration} options={DURATIONS.map(d => ({ value: d, label: `${d} min` }))} />

            <Text style={s.fieldLabel}>Demanda principal</Text>
            <TextInput value={mainDemand} onChangeText={setMainDemand} multiline numberOfLines={3} style={s.textarea} placeholder="Descreva a demanda..." placeholderTextColor={Colors.gray[400]} />

            <Text style={s.fieldLabel}>Observações</Text>
            <TextInput value={notes} onChangeText={setNotes} multiline numberOfLines={3} style={s.textarea} placeholder="Opcional..." placeholderTextColor={Colors.gray[400]} />

            <TouchableOpacity style={[s.saveBtn, (!canSave || saving) && s.actionBtnDisabled]} onPress={handleAccept} disabled={!canSave || saving} activeOpacity={0.85}>
              {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.saveBtnText}>Aceitar e ativar cliente</Text>}
            </TouchableOpacity>
          </ScrollView>
        )}
      </SafeAreaView>
    </Modal>
  );
}

export default function ClientsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [tab, setTab]           = useState<TabId>("ativos");
  const [clients, setClients]   = useState<Client[]>([]);
  const [search, setSearch]     = useState("");
  const [loading, setLoading]   = useState(true);
  const [selected, setSelected] = useState<Client | null>(null);
  const [evolutions, setEvolutions] = useState<Evolution[]>([]);
  const [evoLoading, setEvoLoading] = useState(false);
  const [supervisions, setSupervisions] = useState<Supervision[]>([]);
  const [supLoading, setSupLoading] = useState(false);
  const [deletingSupId, setDeletingSupId] = useState<string | null>(null);

  const [pending, setPending]         = useState<Anamnese[]>([]);
  const [loadingPending, setLoadingPending] = useState(true);
  const [reviewingId, setReviewingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("clients")
      .select("id, name, email, phone, status, approach_label, approaches, main_demand, total_sessions, created_at, anamnese_id")
      .eq("therapist_id", user.id)
      .order("name");
    setClients((data ?? []) as Client[]);
    setLoading(false);
  }, [user]);

  const loadPending = useCallback(async () => {
    if (!user) return;
    setLoadingPending(true);
    fetch(`${process.env.EXPO_PUBLIC_WEB_URL}/api/anamnese/list?therapistId=${user.id}&status=PENDING`)
      .then(r => r.json())
      .then(d => setPending(d.anamneses ?? []))
      .catch(() => {})
      .finally(() => setLoadingPending(false));
  }, [user]);

  useEffect(() => { load(); loadPending(); }, [load, loadPending]);
  useFocusEffect(useCallback(() => { load(); loadPending(); }, [load, loadPending]));

  const activeClients = clients.filter(c => c.status === "ACTIVE");
  const semAnamnese    = activeClients.filter(c => !c.anamnese_id);
  const comAnamnese    = activeClients.filter(c => !!c.anamnese_id);

  const q = search.toLowerCase();
  const filterClients = (list: Client[]) =>
    list.filter(c => c.name.toLowerCase().includes(q) || (c.email ?? "").toLowerCase().includes(q));

  function handleReject(id: string) {
    return fetch(`${process.env.EXPO_PUBLIC_WEB_URL}/api/anamnese/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "REJECTED" }),
    }).then(() => setPending(prev => prev.filter(a => a.id !== id)));
  }

  async function openClient(c: Client) {
    setSelected(c);
    setEvoLoading(true);
    setSupLoading(true);
    const [evoRes, supRes] = await Promise.all([
      supabase
        .from("evolutions")
        .select("id, session_date, content, mood, session_number")
        .eq("client_id", c.id)
        .order("session_date", { ascending: false })
        .limit(20),
      supabase
        .from("supervisions")
        .select("id, title, approach, updated_at, messages_count")
        .eq("client_id", c.id)
        .order("updated_at", { ascending: false }),
    ]);
    setEvolutions((evoRes.data ?? []) as Evolution[]);
    setSupervisions((supRes.data ?? []) as Supervision[]);
    setEvoLoading(false);
    setSupLoading(false);
  }

  async function deleteSupervision(sv: Supervision) {
    Alert.alert("Excluir reflexão clínica", `Excluir "${sv.title}"? Essa ação não pode ser desfeita.`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Excluir", style: "destructive", onPress: async () => {
          setDeletingSupId(sv.id);
          const { error } = await supabase.from("supervisions").delete().eq("id", sv.id);
          setDeletingSupId(null);
          if (error) { Alert.alert("Erro", error.message); return; }
          setSupervisions(prev => prev.filter(s => s.id !== sv.id));
        },
      },
    ]);
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
          <Text style={s.clientSub} numberOfLines={1}>{clientApproachLabels(item).join(", ") || "Abordagem não definida"}</Text>
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

      {/* Abas */}
      <View style={s.tabRow}>
        {([
          { id: "sem-anamnese" as TabId, label: "Sem anamnese", count: semAnamnese.length },
          { id: "ativos" as TabId,       label: "Ativos",       count: comAnamnese.length },
          { id: "aguardando" as TabId,   label: "Aguardando",   count: pending.length },
        ]).map(t => (
          <TouchableOpacity key={t.id} style={[s.tabBtn, tab === t.id && s.tabBtnActive]} onPress={() => setTab(t.id)}>
            <Text style={[s.tabBtnText, tab === t.id && s.tabBtnTextActive]}>{t.label}</Text>
            {t.count > 0 && (
              <View style={[s.tabBadge, tab === t.id && s.tabBadgeActive]}>
                <Text style={[s.tabBadgeText, tab === t.id && s.tabBadgeTextActive]}>{t.count}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Busca */}
      {tab !== "aguardando" && (
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
      )}

      {(tab === "aguardando" ? loadingPending : loading) ? (
        <ActivityIndicator color={Colors.brand[500]} style={{ marginTop: 40 }} />
      ) : tab === "aguardando" ? (
        <FlatList
          data={pending}
          keyExtractor={a => a.id}
          renderItem={({ item }) => (
            <PendingAnamneseCard anamnese={item} onReview={() => setReviewingId(item.id)} onReject={() => handleReject(item.id)} />
          )}
          contentContainerStyle={s.list}
          ListHeaderComponent={user ? <AnamneseLinkCard therapistId={user.id} clients={clients} /> : null}
          ListEmptyComponent={<Text style={s.emptyText}>Nenhuma anamnese aguardando aprovação.</Text>}
        />
      ) : (
        <FlatList
          data={filterClients(tab === "sem-anamnese" ? semAnamnese : comAnamnese)}
          keyExtractor={c => c.id}
          renderItem={renderClient}
          contentContainerStyle={s.list}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={user ? <AnamneseLinkCard therapistId={user.id} clients={clients} /> : null}
          ListEmptyComponent={
            <Text style={s.emptyText}>
              {tab === "sem-anamnese" ? "Todos os clientes ativos têm anamnese." : "Nenhum cliente encontrado."}
            </Text>
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
                  <Text style={s.infoValue}>{clientApproachLabels(selected).join(", ") || "—"}</Text>
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

              <Text style={s.sectionTitle}>Reflexões Clínicas ({supervisions.length})</Text>

              {supLoading ? (
                <ActivityIndicator color={Colors.brand[500]} style={{ marginBottom: 20 }} />
              ) : supervisions.length === 0 ? (
                <Text style={[s.emptyText, { marginTop: 0, marginBottom: 20 }]}>Nenhuma reflexão clínica sobre este caso ainda.</Text>
              ) : (
                <View style={{ marginBottom: 20, gap: 8 }}>
                  {supervisions.map(sv => (
                    <View key={sv.id} style={s.supCard}>
                      <View style={s.supIcon}><Ionicons name="chatbubbles-outline" size={16} color={Colors.brand[500]} /></View>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text style={s.supTitle} numberOfLines={1}>{sv.title}</Text>
                        <Text style={s.supMeta}>{new Date(sv.updated_at).toLocaleDateString("pt-BR")} · {sv.messages_count} msgs</Text>
                      </View>
                      <TouchableOpacity onPress={() => deleteSupervision(sv)} disabled={deletingSupId === sv.id} style={s.supDeleteBtn} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                        {deletingSupId === sv.id
                          ? <ActivityIndicator size="small" color={Colors.gray[400]} />
                          : <Ionicons name="trash-outline" size={16} color={Colors.gray[400]} />}
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}

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

      {/* Revisão de anamnese pendente */}
      {user && (
        <AnamneseReviewModal
          anamneseId={reviewingId}
          therapistId={user.id}
          onClose={() => setReviewingId(null)}
          onAccepted={() => { load(); loadPending(); }}
        />
      )}
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
  // Abas
  tabRow:      { flexDirection: "row", gap: 6, paddingHorizontal: 20, marginBottom: 12 },
  tabBtn:      { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.gray[200] },
  tabBtnActive: { backgroundColor: Colors.brand[500], borderColor: Colors.brand[500] },
  tabBtnText:  { fontSize: 12, fontWeight: "600", color: Colors.gray[500] },
  tabBtnTextActive: { color: "#fff" },
  tabBadge:    { minWidth: 18, height: 18, borderRadius: 9, backgroundColor: Colors.gray[100], alignItems: "center", justifyContent: "center", paddingHorizontal: 4 },
  tabBadgeActive: { backgroundColor: "rgba(255,255,255,0.25)" },
  tabBadgeText: { fontSize: 10, fontWeight: "700", color: Colors.gray[600] },
  tabBadgeTextActive: { color: "#fff" },
  // Card de anamnese pendente
  pendingCard: { backgroundColor: Colors.white, borderRadius: 16, padding: 14, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  pendingAvatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: "#FEF3C7", alignItems: "center", justifyContent: "center" },
  pendingAvatarText: { fontSize: 15, fontWeight: "700", color: "#B45309" },
  pendingName: { fontSize: 14, fontWeight: "700", color: Colors.ink },
  pendingEmail: { fontSize: 11, color: Colors.gray[500], marginTop: 1 },
  pendingDate: { fontSize: 11, color: Colors.gray[400] },
  intentionBox: { backgroundColor: "#FEF3C7", borderRadius: 10, padding: 10, marginTop: 10 },
  intentionLabel: { fontSize: 10, fontWeight: "700", color: "#B45309", marginBottom: 2 },
  intentionText: { fontSize: 12, color: "#78350F", fontStyle: "italic" },
  pendingActions: { flexDirection: "row", gap: 8, marginTop: 12 },
  reviewBtn:   { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, backgroundColor: Colors.brand[500], borderRadius: 10, paddingVertical: 9 },
  reviewBtnText: { fontSize: 12, fontWeight: "700", color: "#fff" },
  rejectBtn:   { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, backgroundColor: "#FEF2F2", borderWidth: 1, borderColor: "#FECACA", borderRadius: 10, paddingVertical: 9 },
  rejectBtnText: { fontSize: 12, fontWeight: "700", color: "#DC2626" },
  // Modal de revisão
  fieldLabel:  { fontSize: 12, fontWeight: "600", color: Colors.gray[600], marginBottom: 6, marginTop: 4 },
  textarea:    { minHeight: 70, textAlignVertical: "top", marginBottom: 10, borderWidth: 1, borderColor: Colors.gray[200], borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, fontSize: 13, color: Colors.ink, backgroundColor: Colors.white },
  saveBtn:     { marginTop: 16, backgroundColor: Colors.brand[500], borderRadius: 14, paddingVertical: 14, alignItems: "center", justifyContent: "center" },
  saveBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },
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
  supCard:     { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: Colors.white, borderRadius: 14, padding: 12, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  supIcon:     { width: 32, height: 32, borderRadius: 10, backgroundColor: Colors.brand[50], alignItems: "center", justifyContent: "center" },
  supTitle:    { fontSize: 13, fontWeight: "600", color: Colors.ink },
  supMeta:     { fontSize: 11, color: Colors.gray[400], marginTop: 1 },
  supDeleteBtn: { padding: 4 },
});
