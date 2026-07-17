import { useEffect, useRef, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/store/auth.store";
import { supabase } from "@/lib/supabase";
import { Colors } from "@/constants/colors";
import { VoiceTextInput } from "@/components/VoiceTextInput";

type Client = { id: string; name: string };
type Message = { role: "user" | "assistant"; content: string };

const APPROACHES = [
  { key: "SOMATIC",            label: "Terapia Corporal" },
  { key: "TANTRA",             label: "Sexualidade Humana e Tantra" },
  { key: "PSYCHOANALYSIS",     label: "Psicanálise Freudiana" },
  { key: "JUNGIAN",            label: "Psicologia Junguiana" },
  { key: "COGNITIVE_BEHAVIORAL", label: "TCC" },
  { key: "GESTALT",            label: "Gestalt" },
  { key: "PSYCHODRAMA",        label: "Psicodrama" },
  { key: "SYSTEMIC",           label: "Constelação Familiar" },
];

function formatDuration(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function SupervisionScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const scrollRef = useRef<ScrollView>(null);

  const [clients, setClients]       = useState<Client[]>([]);
  const [selected, setSelected]     = useState<Client | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [approach, setApproach]     = useState(APPROACHES[0].key);
  const [showApproach, setShowApproach] = useState(false);
  const [messages, setMessages]     = useState<Message[]>([]);
  const [input, setInput]           = useState("");
  const [loading, setLoading]       = useState(false);

  // ── Supervisão: iniciar/pausar/retomar/finalizar ──
  const [supervisionId, setSupervisionId]     = useState<string | null>(null);
  const [supervisionActive, setSupervisionActive] = useState(false);
  const [supervisionPaused, setSupervisionPaused] = useState(false);
  const [elapsedSeconds, setElapsedSeconds]   = useState(0);
  const [showStartModal, setShowStartModal]   = useState(false);
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [sessionDate, setSessionDate]         = useState("");
  const [sessionTime, setSessionTime]         = useState("");
  const [impressions, setImpressions]         = useState("");
  const [hypothesis, setHypothesis]           = useState("");
  const [nextSessionPlan, setNextSessionPlan] = useState("");
  const [saving, setSaving]                   = useState(false);

  const canWrite = supervisionActive && !supervisionPaused;

  useEffect(() => {
    if (!user) return;
    supabase
      .from("clients")
      .select("id, name")
      .eq("therapist_id", user.id)
      .eq("status", "ACTIVE")
      .order("name")
      .then(({ data }) => setClients((data ?? []) as Client[]));
  }, [user]);

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages]);

  // Timer — só avança enquanto ativo e não pausado
  useEffect(() => {
    if (!supervisionActive || supervisionPaused) return;
    const interval = setInterval(() => setElapsedSeconds(s => s + 1), 1000);
    return () => clearInterval(interval);
  }, [supervisionActive, supervisionPaused]);

  function openStartModal() {
    if (!selected) return;
    const now = new Date();
    setSessionDate(now.toISOString().split("T")[0]);
    setSessionTime(now.toTimeString().slice(0, 5));
    setImpressions("");
    setShowStartModal(true);
  }

  async function confirmStart() {
    if (!selected || !user) return;
    setShowStartModal(false);

    try {
      const { data: session, error } = await supabase
        .from("supervisions")
        .insert({ therapist_id: user.id, client_id: selected.id, title: `Supervisão de ${selected.name}`, approach })
        .select()
        .single();
      if (error) throw error;
      setSupervisionId(session.id);
    } catch {
      // segue mesmo se não conseguir criar o registro da sessão — o chat ainda funciona
    }

    setSupervisionActive(true);
    setSupervisionPaused(false);
    setElapsedSeconds(0);

    const text = `Sessão em ${sessionDate} às ${sessionTime}. Minhas impressões: ${impressions}`;
    await sendMessageText(text);
  }

  function pauseSupervision() {
    setSupervisionPaused(true);
  }
  function resumeSupervision() {
    setSupervisionPaused(false);
  }

  function openFinishModal() {
    setHypothesis("");
    setNextSessionPlan("");
    setShowFinishModal(true);
  }

  async function confirmFinish() {
    setShowFinishModal(false);
    setSaving(true);
    setSupervisionActive(false);
    setSupervisionPaused(false);

    if (selected && user) {
      const transcript = messages.map(m => `${m.role === "user" ? "Terapeuta" : "IA"}: ${m.content}`).join("\n\n");
      const content = [impressions ? `Impressões iniciais: ${impressions}` : "", transcript].filter(Boolean).join("\n\n");

      try {
        await supabase.from("evolutions").insert({
          therapist_id: user.id,
          client_id: selected.id,
          session_date: sessionDate || new Date().toISOString().split("T")[0],
          session_time: sessionTime || null,
          content: content || "Supervisão realizada.",
          hypothesis: hypothesis.trim() || null,
          next_session_plan: nextSessionPlan.trim() || null,
          mood: null,
          approach,
          duration_seconds: elapsedSeconds,
        });
      } catch {
        // se falhar o registro da evolução, ainda assim encerra a sessão localmente
      }
    }

    setSaving(false);
    setElapsedSeconds(0);
    setSupervisionId(null);
  }

  async function sendMessageText(text: string) {
    if (!text.trim() || loading) return;

    const newMessages: Message[] = [...messages, { role: "user", content: text }];
    setMessages(newMessages);
    setLoading(true);

    if (supervisionId) {
      supabase.from("supervision_messages").insert({ supervision_id: supervisionId, role: "user", content: text }).then(() => {});
    }

    try {
      const res = await fetch(
        `${process.env.EXPO_PUBLIC_WEB_URL}/api/supervision/chat`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: newMessages,
            approach,
            clientName: selected?.name ?? "cliente",
            therapistId: user?.id,
          }),
        }
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erro na supervisão");
      setMessages(prev => [...prev, { role: "assistant", content: json.content }]);
      if (supervisionId) {
        supabase.from("supervision_messages").insert({ supervision_id: supervisionId, role: "assistant", content: json.content }).then(() => {});
      }
    } catch (e: unknown) {
      setMessages(prev => [
        ...prev,
        { role: "assistant", content: `⚠️ ${e instanceof Error ? e.message : "Erro ao conectar com a supervisão."}` },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function send() {
    const text = input.trim();
    if (!text) return;
    setInput("");
    await sendMessageText(text);
  }

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <Ionicons name="arrow-back" size={22} color={Colors.ink} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={s.headerTitle}>Supervisão</Text>
            <Text style={s.headerSub}>Assistente clínico com IA</Text>
          </View>
          <View style={s.badge}>
            <Ionicons name="sparkles" size={14} color={Colors.brand[600]} />
            <Text style={s.badgeText}>IA</Text>
          </View>
        </View>

        {/* Seletor de cliente */}
        <View style={s.pickerWrapper}>
          <TouchableOpacity style={s.selector} onPress={() => setShowPicker(!showPicker)} disabled={supervisionActive}>
            <Ionicons name="person" size={15} color={Colors.gray[400]} />
            <Text style={selected ? s.selectorText : s.selectorPlaceholder} numberOfLines={1}>
              {selected?.name ?? "Selecionar cliente"}
            </Text>
            {!supervisionActive && <Ionicons name={showPicker ? "chevron-up" : "chevron-down"} size={15} color={Colors.gray[400]} />}
          </TouchableOpacity>
          {showPicker && !supervisionActive && (
            <View style={s.pickerList}>
              {clients.map(c => (
                <TouchableOpacity
                  key={c.id}
                  style={[s.pickerItem, selected?.id === c.id && s.pickerItemActive]}
                  onPress={() => { setSelected(c); setShowPicker(false); }}
                >
                  <Text style={[s.pickerItemText, selected?.id === c.id && { color: Colors.brand[600] }]}>
                    {c.name}
                  </Text>
                  {selected?.id === c.id && <Ionicons name="checkmark" size={14} color={Colors.brand[500]} />}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Abordagem */}
        <View style={s.pickerWrapper}>
          <TouchableOpacity style={s.selector} onPress={() => setShowApproach(!showApproach)} disabled={supervisionActive}>
            <Ionicons name="school" size={15} color={Colors.gray[400]} />
            <Text style={s.selectorText} numberOfLines={1}>
              {APPROACHES.find(a => a.key === approach)?.label}
            </Text>
            {!supervisionActive && <Ionicons name={showApproach ? "chevron-up" : "chevron-down"} size={15} color={Colors.gray[400]} />}
          </TouchableOpacity>
          {showApproach && !supervisionActive && (
            <View style={s.pickerList}>
              {APPROACHES.map(a => (
                <TouchableOpacity
                  key={a.key}
                  style={[s.pickerItem, approach === a.key && s.pickerItemActive]}
                  onPress={() => { setApproach(a.key); setShowApproach(false); }}
                >
                  <Text style={[s.pickerItemText, approach === a.key && { color: Colors.brand[600] }]}>
                    {a.label}
                  </Text>
                  {approach === a.key && <Ionicons name="checkmark" size={14} color={Colors.brand[500]} />}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Controle da supervisão */}
        <View style={s.controlBar}>
          {supervisionActive ? (
            <>
              <View style={s.timerBadge}>
                <View style={[s.timerDot, supervisionPaused ? { backgroundColor: Colors.gray[400] } : null]} />
                <Text style={s.timerText}>{formatDuration(elapsedSeconds)}</Text>
              </View>
              {supervisionPaused ? (
                <TouchableOpacity style={s.controlBtnPrimary} onPress={resumeSupervision} activeOpacity={0.8}>
                  <Ionicons name="play" size={15} color="#fff" />
                  <Text style={s.controlBtnPrimaryText}>Retomar</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={s.controlBtnOutline} onPress={pauseSupervision} activeOpacity={0.8}>
                  <Ionicons name="pause" size={15} color={Colors.brand[700]} />
                  <Text style={s.controlBtnOutlineText}>Pausar</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={s.controlBtnFinish} onPress={openFinishModal} activeOpacity={0.8} disabled={saving}>
                {saving ? <ActivityIndicator size="small" color="#fff" /> : <><Ionicons name="stop" size={15} color="#fff" /><Text style={s.controlBtnPrimaryText}>Finalizar</Text></>}
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              style={[s.controlBtnStart, !selected && s.btnDisabled]}
              onPress={openStartModal}
              disabled={!selected}
              activeOpacity={0.8}
            >
              <Ionicons name="play-circle" size={16} color="#fff" />
              <Text style={s.controlBtnPrimaryText}>Iniciar supervisão</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Chat */}
        <ScrollView
          ref={scrollRef}
          style={s.chat}
          contentContainerStyle={s.chatContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {messages.length === 0 && (
            <View style={s.emptyState}>
              <View style={s.emptyIcon}>
                <Ionicons name="chatbubbles" size={36} color={Colors.brand[400]} />
              </View>
              <Text style={s.emptyTitle}>Supervisão clínica</Text>
              <Text style={s.emptyText}>
                {selected
                  ? "Toque em \"Iniciar supervisão\" para começar. Você poderá pausar e retomar quando precisar."
                  : "Selecione um cliente para iniciar a supervisão."}
              </Text>
            </View>
          )}

          {messages.map((m, i) => (
            <View key={i} style={[s.bubble, m.role === "user" ? s.bubbleUser : s.bubbleAssistant]}>
              {m.role === "assistant" && (
                <View style={s.assistantIcon}>
                  <Ionicons name="sparkles" size={12} color={Colors.brand[500]} />
                </View>
              )}
              <Text style={[s.bubbleText, m.role === "user" ? s.bubbleTextUser : s.bubbleTextAssistant]}>
                {m.content}
              </Text>
            </View>
          ))}

          {loading && (
            <View style={[s.bubble, s.bubbleAssistant]}>
              <View style={s.assistantIcon}>
                <Ionicons name="sparkles" size={12} color={Colors.brand[500]} />
              </View>
              <ActivityIndicator size="small" color={Colors.brand[500]} style={{ paddingHorizontal: 8 }} />
            </View>
          )}
        </ScrollView>

        {/* Input */}
        <View style={s.inputRow}>
          <VoiceTextInput
            style={[s.input, !canWrite && s.inputDisabled]}
            value={input}
            onValueChange={setInput}
            placeholder={canWrite ? "Descreva o caso ou dúvida clínica..." : supervisionPaused ? "Supervisão pausada…" : "Inicie a supervisão para escrever…"}
            placeholderTextColor={Colors.gray[400]}
            multiline
            maxLength={1000}
            editable={canWrite}
            onSubmitEditing={send}
          />
          <TouchableOpacity
            style={[s.sendBtn, (!canWrite || !input.trim() || loading) && s.sendBtnDisabled]}
            onPress={send}
            disabled={!canWrite || !input.trim() || loading}
            activeOpacity={0.8}
          >
            <Ionicons name="send" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Modal: iniciar supervisão */}
      <Modal visible={showStartModal} transparent animationType="fade" onRequestClose={() => setShowStartModal(false)}>
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>Vamos evoluir {selected?.name ?? "o cliente"} hoje?</Text>
            <Text style={s.modalSub}>Informe a data, o horário e suas impressões iniciais.</Text>

            <Text style={s.fieldLabel}>Data da sessão</Text>
            <TextInput style={s.fieldInput} value={sessionDate} onChangeText={setSessionDate} placeholder="AAAA-MM-DD" placeholderTextColor={Colors.gray[400]} />

            <Text style={s.fieldLabel}>Horário</Text>
            <TextInput style={s.fieldInput} value={sessionTime} onChangeText={setSessionTime} placeholder="HH:MM" placeholderTextColor={Colors.gray[400]} />

            <Text style={s.fieldLabel}>Impressões iniciais</Text>
            <VoiceTextInput
              style={[s.fieldInput, s.fieldTextarea]}
              value={impressions}
              onValueChange={setImpressions}
              placeholder="O que apareceu na sessão?"
              placeholderTextColor={Colors.gray[400]}
              multiline
            />

            <View style={s.modalActions}>
              <TouchableOpacity style={s.modalCancel} onPress={() => setShowStartModal(false)}>
                <Text style={s.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.modalConfirm} onPress={confirmStart}>
                <Text style={s.modalConfirmText}>Iniciar supervisão</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal: finalizar supervisão */}
      <Modal visible={showFinishModal} transparent animationType="fade" onRequestClose={() => setShowFinishModal(false)}>
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>Finalizar supervisão</Text>
            <Text style={s.modalSub}>Registre a hipótese clínica e o plano para a próxima sessão.</Text>

            <Text style={s.fieldLabel}>Hipótese clínica</Text>
            <VoiceTextInput
              style={[s.fieldInput, s.fieldTextarea]}
              value={hypothesis}
              onValueChange={setHypothesis}
              placeholder="Hipótese levantada nesta sessão"
              placeholderTextColor={Colors.gray[400]}
              multiline
            />

            <Text style={s.fieldLabel}>Plano para próxima sessão</Text>
            <VoiceTextInput
              style={[s.fieldInput, s.fieldTextarea]}
              value={nextSessionPlan}
              onValueChange={setNextSessionPlan}
              placeholder="Próximos focos"
              placeholderTextColor={Colors.gray[400]}
              multiline
            />

            <View style={s.modalActions}>
              <TouchableOpacity style={s.modalCancel} onPress={() => setShowFinishModal(false)}>
                <Text style={s.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.modalConfirm} onPress={confirmFinish}>
                <Text style={s.modalConfirmText}>Salvar e finalizar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:            { flex: 1, backgroundColor: Colors.gray[50] },
  header:          { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.gray[100] },
  backBtn:         { padding: 4 },
  headerTitle:     { fontSize: 16, fontWeight: "700", color: Colors.ink },
  headerSub:       { fontSize: 12, color: Colors.gray[500] },
  badge:           { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: Colors.brand[50], paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText:       { fontSize: 12, fontWeight: "700", color: Colors.brand[600] },
  pickerWrapper:   { backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.gray[100], paddingHorizontal: 16, paddingVertical: 8 },
  selector:        { flexDirection: "row", alignItems: "center", gap: 8 },
  selectorText:    { flex: 1, fontSize: 13, color: Colors.ink, fontWeight: "500" },
  selectorPlaceholder: { flex: 1, fontSize: 13, color: Colors.gray[400] },
  pickerList:      { marginTop: 8, borderWidth: 1, borderColor: Colors.gray[200], borderRadius: 12, overflow: "hidden" },
  pickerItem:      { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 14, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: Colors.gray[100] },
  pickerItemActive: { backgroundColor: Colors.brand[50] },
  pickerItemText:  { fontSize: 13, color: Colors.ink },
  controlBar:      { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.gray[100] },
  timerBadge:      { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#FEF3C7", borderWidth: 1, borderColor: "#FDE68A", paddingHorizontal: 10, paddingVertical: 7, borderRadius: 10 },
  timerDot:        { width: 6, height: 6, borderRadius: 3, backgroundColor: "#D97706" },
  timerText:       { fontSize: 12, fontWeight: "700", color: "#92400E", fontVariant: ["tabular-nums"] },
  controlBtnStart: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: Colors.brand[500], borderRadius: 10, paddingVertical: 10 },
  controlBtnPrimary: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: Colors.brand[500], borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  controlBtnPrimaryText: { color: Colors.white, fontSize: 12, fontWeight: "700" },
  controlBtnOutline: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.brand[200], borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  controlBtnOutlineText: { color: Colors.brand[700], fontSize: 12, fontWeight: "700" },
  controlBtnFinish: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "#D97706", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, marginLeft: "auto" },
  btnDisabled:     { opacity: 0.5 },
  chat:            { flex: 1 },
  chatContent:     { padding: 16, gap: 12, flexGrow: 1 },
  emptyState:      { flex: 1, alignItems: "center", paddingTop: 32, gap: 12 },
  emptyIcon:       { width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.brand[50], alignItems: "center", justifyContent: "center" },
  emptyTitle:      { fontSize: 18, fontWeight: "700", color: Colors.ink },
  emptyText:       { fontSize: 13, color: Colors.gray[500], textAlign: "center", lineHeight: 20, paddingHorizontal: 16 },
  bubble:          { maxWidth: "85%", borderRadius: 16, padding: 12, flexDirection: "row", gap: 8, alignItems: "flex-start" },
  bubbleUser:      { backgroundColor: Colors.brand[500], alignSelf: "flex-end", borderBottomRightRadius: 4 },
  bubbleAssistant: { backgroundColor: Colors.white, alignSelf: "flex-start", borderBottomLeftRadius: 4, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  assistantIcon:   { width: 20, height: 20, borderRadius: 10, backgroundColor: Colors.brand[50], alignItems: "center", justifyContent: "center", marginTop: 1 },
  bubbleText:      { fontSize: 14, lineHeight: 20, flex: 1 },
  bubbleTextUser:  { color: Colors.white },
  bubbleTextAssistant: { color: Colors.ink },
  inputRow:        { flexDirection: "row", alignItems: "flex-end", gap: 10, padding: 12, backgroundColor: Colors.white, borderTopWidth: 1, borderTopColor: Colors.gray[100] },
  input:           { flex: 1, borderWidth: 1, borderColor: Colors.gray[200], borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 14, color: Colors.ink, backgroundColor: Colors.gray[50], maxHeight: 100 },
  inputDisabled:   { backgroundColor: Colors.gray[100], color: Colors.gray[400] },
  sendBtn:         { width: 42, height: 42, borderRadius: 21, backgroundColor: Colors.brand[500], alignItems: "center", justifyContent: "center" },
  sendBtnDisabled: { opacity: 0.4 },
  // Modais
  modalOverlay:    { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", padding: 20 },
  modalCard:       { backgroundColor: Colors.white, borderRadius: 20, padding: 22 },
  modalTitle:      { fontSize: 17, fontWeight: "700", color: Colors.ink, marginBottom: 4 },
  modalSub:        { fontSize: 13, color: Colors.gray[500], marginBottom: 16, lineHeight: 18 },
  fieldLabel:      { fontSize: 12, fontWeight: "600", color: Colors.gray[600], marginBottom: 6, marginTop: 4 },
  fieldInput:      { borderWidth: 1, borderColor: Colors.gray[200], borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13, color: Colors.ink, marginBottom: 4 },
  fieldTextarea:   { minHeight: 70, textAlignVertical: "top" },
  modalActions:    { flexDirection: "row", gap: 10, marginTop: 16 },
  modalCancel:     { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: Colors.gray[200] },
  modalCancelText: { fontSize: 13, fontWeight: "600", color: Colors.gray[600] },
  modalConfirm:    { flex: 1.4, alignItems: "center", justifyContent: "center", paddingVertical: 12, borderRadius: 10, backgroundColor: Colors.brand[500] },
  modalConfirmText: { fontSize: 13, fontWeight: "700", color: Colors.white },
});
