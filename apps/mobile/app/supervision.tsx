import { useEffect, useRef, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/store/auth.store";
import { supabase } from "@/lib/supabase";
import { Colors } from "@/constants/colors";

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

  async function send() {
    const text = input.trim();
    if (!text || loading) return;

    const newMessages: Message[] = [...messages, { role: "user", content: text }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

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
    } catch (e: unknown) {
      setMessages(prev => [
        ...prev,
        { role: "assistant", content: `⚠️ ${e instanceof Error ? e.message : "Erro ao conectar com a supervisão."}` },
      ]);
    } finally {
      setLoading(false);
    }
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
          <TouchableOpacity style={s.selector} onPress={() => setShowPicker(!showPicker)}>
            <Ionicons name="person" size={15} color={Colors.gray[400]} />
            <Text style={selected ? s.selectorText : s.selectorPlaceholder} numberOfLines={1}>
              {selected?.name ?? "Selecionar cliente (opcional)"}
            </Text>
            <Ionicons name={showPicker ? "chevron-up" : "chevron-down"} size={15} color={Colors.gray[400]} />
          </TouchableOpacity>
          {showPicker && (
            <View style={s.pickerList}>
              <TouchableOpacity
                style={s.pickerItem}
                onPress={() => { setSelected(null); setShowPicker(false); }}
              >
                <Text style={[s.pickerItemText, { color: Colors.gray[400] }]}>Sem cliente específico</Text>
                {!selected && <Ionicons name="checkmark" size={14} color={Colors.brand[500]} />}
              </TouchableOpacity>
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
          <TouchableOpacity style={s.selector} onPress={() => setShowApproach(!showApproach)}>
            <Ionicons name="school" size={15} color={Colors.gray[400]} />
            <Text style={s.selectorText} numberOfLines={1}>
              {APPROACHES.find(a => a.key === approach)?.label}
            </Text>
            <Ionicons name={showApproach ? "chevron-up" : "chevron-down"} size={15} color={Colors.gray[400]} />
          </TouchableOpacity>
          {showApproach && (
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
                Descreva o caso, dúvida clínica ou situação que quer supervisionar. Você pode selecionar um cliente para contextualizar.
              </Text>
              <View style={s.suggestions}>
                {[
                  "Como abordar resistência à mudança?",
                  "Cliente apresenta dissociação na sessão",
                  "Dificuldade com vínculo terapêutico",
                ].map(s => (
                  <TouchableOpacity key={s} style={s2.suggestionBtn} onPress={() => setInput(s)}>
                    <Text style={s2.suggestionText}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>
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
          <TextInput
            style={s.input}
            value={input}
            onChangeText={setInput}
            placeholder="Descreva o caso ou dúvida clínica..."
            placeholderTextColor={Colors.gray[400]}
            multiline
            maxLength={1000}
            onSubmitEditing={send}
          />
          <TouchableOpacity
            style={[s.sendBtn, (!input.trim() || loading) && s.sendBtnDisabled]}
            onPress={send}
            disabled={!input.trim() || loading}
            activeOpacity={0.8}
          >
            <Ionicons name="send" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
  chat:            { flex: 1 },
  chatContent:     { padding: 16, gap: 12, flexGrow: 1 },
  emptyState:      { flex: 1, alignItems: "center", paddingTop: 32, gap: 12 },
  emptyIcon:       { width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.brand[50], alignItems: "center", justifyContent: "center" },
  emptyTitle:      { fontSize: 18, fontWeight: "700", color: Colors.ink },
  emptyText:       { fontSize: 13, color: Colors.gray[500], textAlign: "center", lineHeight: 20, paddingHorizontal: 16 },
  suggestions:     { gap: 8, width: "100%", marginTop: 8 },
  bubble:          { maxWidth: "85%", borderRadius: 16, padding: 12, flexDirection: "row", gap: 8, alignItems: "flex-start" },
  bubbleUser:      { backgroundColor: Colors.brand[500], alignSelf: "flex-end", borderBottomRightRadius: 4 },
  bubbleAssistant: { backgroundColor: Colors.white, alignSelf: "flex-start", borderBottomLeftRadius: 4, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  assistantIcon:   { width: 20, height: 20, borderRadius: 10, backgroundColor: Colors.brand[50], alignItems: "center", justifyContent: "center", marginTop: 1 },
  bubbleText:      { fontSize: 14, lineHeight: 20, flex: 1 },
  bubbleTextUser:  { color: Colors.white },
  bubbleTextAssistant: { color: Colors.ink },
  inputRow:        { flexDirection: "row", alignItems: "flex-end", gap: 10, padding: 12, backgroundColor: Colors.white, borderTopWidth: 1, borderTopColor: Colors.gray[100] },
  input:           { flex: 1, borderWidth: 1, borderColor: Colors.gray[200], borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 14, color: Colors.ink, backgroundColor: Colors.gray[50], maxHeight: 100 },
  sendBtn:         { width: 42, height: 42, borderRadius: 21, backgroundColor: Colors.brand[500], alignItems: "center", justifyContent: "center" },
  sendBtnDisabled: { opacity: 0.4 },
});

const s2 = StyleSheet.create({
  suggestionBtn:  { backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.gray[200], borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, alignSelf: "flex-start" },
  suggestionText: { fontSize: 12, color: Colors.gray[600] },
});
