import { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/store/auth.store";
import { Colors } from "@/constants/colors";
import { HamburgerMenu } from "@/components/HamburgerMenu";
import { secureStorage } from "@/lib/secure-storage";
import { confirmAsync } from "@/lib/confirm";
import { authHeaders } from "@/lib/ai-headers";
import { VoiceTextInput } from "@/components/VoiceTextInput";

const API_KEY_STORE = "ideah_anthropic_api_key";

const ALL_APPROACHES_SETTINGS = [
  { value: "PSYCHOANALYSIS",       label: "Psicanálise Freudiana" },
  { value: "COGNITIVE_BEHAVIORAL", label: "TCC" },
  { value: "JUNGIAN",              label: "Junguiana" },
  { value: "SOMATIC",              label: "Somática / Corporal" },
  { value: "TANTRA",               label: "Sexualidade Humana e Tantra" },
  { value: "GESTALT",              label: "Gestalt-terapia" },
  { value: "PSYCHODRAMA",          label: "Psicodrama" },
  { value: "SYSTEMIC",             label: "Constelação Familiar" },
];

function AnamneseApproachRow({ approach, label, hasTemplate, onSaved }: {
  approach: string; label: string; hasTemplate: boolean; onSaved: (approach: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [content,  setContent]  = useState("");
  const [loaded,   setLoaded]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [saving,   setSaving]   = useState(false);

  function toggle() {
    const next = !expanded;
    setExpanded(next);
    if (next && !loaded) {
      setLoading(true);
      fetch(`${process.env.EXPO_PUBLIC_WEB_URL}/api/anamnese-templates/${approach}`, { cache: "no-store" })
        .then(r => r.json())
        .then(d => setContent(d.content ?? ""))
        .catch(() => {})
        .finally(() => { setLoading(false); setLoaded(true); });
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`${process.env.EXPO_PUBLIC_WEB_URL}/api/anamnese-templates/${approach}`, {
        method: "PUT",
        headers: await authHeaders(),
        body: JSON.stringify({ content }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onSaved(approach);
      Alert.alert("Sucesso", "Formulário salvo com sucesso.");
    } catch (err) {
      Alert.alert("Erro", err instanceof Error ? err.message : "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={s.anamneseRow}>
      <TouchableOpacity style={s.anamneseHeader} onPress={toggle} activeOpacity={0.7}>
        <Ionicons name={expanded ? "chevron-down" : "chevron-forward"} size={16} color={Colors.gray[400]} />
        <Text style={s.anamneseLabel}>{label}</Text>
        <View style={[s.anamneseBadge, hasTemplate ? s.anamneseBadgeOk : s.anamneseBadgeMissing]}>
          <Text style={[s.anamneseBadgeText, { color: hasTemplate ? "#16A34A" : Colors.gray[500] }]}>
            {hasTemplate ? "Cadastrado" : "Não cadastrado"}
          </Text>
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={s.anamneseBody}>
          {loading ? (
            <ActivityIndicator color={Colors.brand[500]} style={{ marginVertical: 12 }} />
          ) : (
            <>
              <Text style={s.cardDesc}>
                Conteúdo HTML do formulário apresentado ao cliente ao preencher a anamnese desta abordagem.
              </Text>
              <VoiceTextInput
                value={content}
                onValueChange={setContent}
                placeholder="Cole ou escreva aqui o HTML do formulário de anamnese..."
                multiline
                numberOfLines={10}
                style={s.anamneseTextarea}
              />
              <TouchableOpacity style={[s.btn, !content.trim() && s.btnDisabled]} onPress={handleSave} disabled={saving || !content.trim()} activeOpacity={0.8}>
                {saving ? <ActivityIndicator color="#fff" size="small" /> : <><Ionicons name="save" size={16} color="#fff" /><Text style={s.btnText}>Salvar formulário</Text></>}
              </TouchableOpacity>
            </>
          )}
        </View>
      )}
    </View>
  );
}

export default function SettingsScreen() {
  const { user, logout } = useAuthStore();
  const isAdmin = user?.role === "admin";
  const [apiKey, setApiKey]     = useState("");
  const [showKey, setShowKey]   = useState(false);
  const [keySaved, setKeySaved] = useState(false);
  const [anamneseTemplates, setAnamneseTemplates] = useState<string[]>([]);

  useEffect(() => {
    secureStorage.getItem(API_KEY_STORE).then(v => { if (v) setApiKey(v); });
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    fetch(`${process.env.EXPO_PUBLIC_WEB_URL}/api/anamnese-templates`, { cache: "no-store" })
      .then(r => r.json())
      .then(d => setAnamneseTemplates((d.templates ?? []).map((t: { approach: string }) => t.approach)))
      .catch(() => {});
  }, [isAdmin]);

  async function saveApiKey() {
    if (!apiKey.trim()) { Alert.alert("Atenção", "Digite uma API Key válida."); return; }
    await secureStorage.setItem(API_KEY_STORE, apiKey.trim());
    setKeySaved(true);
    setTimeout(() => setKeySaved(false), 2000);
  }

  async function removeApiKey() {
    const ok = await confirmAsync("Remover API Key", "Tem certeza?", "Remover");
    if (!ok) return;
    await secureStorage.removeItem(API_KEY_STORE);
    setApiKey("");
  }

  async function confirmLogout() {
    const ok = await confirmAsync("Sair", "Deseja sair da sua conta?", "Sair");
    if (ok) logout();
  }

  const firstName = user?.name?.split(" ")[0] ?? "Terapeuta";

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 20 }}>
          <HamburgerMenu />
          <Text style={[s.title, { marginBottom: 0 }]}>Configurações</Text>
        </View>

        {/* Perfil */}
        <View style={s.card}>
          <View style={s.profileRow}>
            <View style={s.avatar}>
              <Text style={s.avatarText}>{firstName[0]?.toUpperCase()}</Text>
            </View>
            <View style={s.profileInfo}>
              <Text style={s.profileName}>{user?.name}</Text>
              <Text style={s.profileEmail}>{user?.email}</Text>
              <View style={[s.roleBadge, user?.role === "admin" && s.adminBadge]}>
                <Text style={[s.roleText, user?.role === "admin" && s.adminText]}>
                  {user?.role === "admin" ? "Administrador" : "Terapeuta"}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* API Key */}
        <View style={s.card}>
          <View style={s.cardHeader}>
            <Ionicons name="key" size={18} color={Colors.brand[500]} />
            <Text style={s.cardTitle}>API Key Anthropic</Text>
          </View>
          <Text style={s.cardDesc}>
            Necessária para usar as funcionalidades de IA (Reflexão Clínica, Relatórios).
          </Text>
          <View style={s.inputRow}>
            <TextInput
              style={[s.input, { flex: 1 }]}
              value={apiKey}
              onChangeText={setApiKey}
              placeholder="sk-ant-..."
              placeholderTextColor={Colors.gray[400]}
              secureTextEntry={!showKey}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity onPress={() => setShowKey(!showKey)} style={s.eyeBtn}>
              <Ionicons name={showKey ? "eye-off" : "eye"} size={18} color={Colors.gray[400]} />
            </TouchableOpacity>
          </View>
          <View style={s.keyActions}>
            <TouchableOpacity
              style={[s.btn, keySaved && s.btnSuccess]}
              onPress={saveApiKey}
              activeOpacity={0.8}
            >
              <Ionicons name={keySaved ? "checkmark" : "save"} size={16} color="#fff" />
              <Text style={s.btnText}>{keySaved ? "Salvo!" : "Salvar"}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.btnDanger} onPress={removeApiKey} activeOpacity={0.8}>
              <Ionicons name="trash" size={16} color="#DC2626" />
              <Text style={s.btnDangerText}>Remover</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Formulários de Anamnese (admin) */}
        {isAdmin && (
          <View style={s.card}>
            <View style={s.cardHeader}>
              <Ionicons name="document-text" size={18} color={Colors.brand[500]} />
              <Text style={s.cardTitle}>Formulários de Anamnese</Text>
            </View>
            <Text style={s.cardDesc}>
              Cada abordagem terapêutica pode ter um formulário de anamnese específico. Toque em uma abordagem para editar.
            </Text>
            <View style={{ gap: 8 }}>
              {ALL_APPROACHES_SETTINGS.map(a => (
                <AnamneseApproachRow
                  key={a.value}
                  approach={a.value}
                  label={a.label}
                  hasTemplate={anamneseTemplates.includes(a.value)}
                  onSaved={approach => setAnamneseTemplates(prev => prev.includes(approach) ? prev : [...prev, approach])}
                />
              ))}
            </View>
          </View>
        )}

        {/* Links */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Informações</Text>
          {[
            { label: "Termos de Uso",           icon: "document-text-outline" as const },
            { label: "Política de Privacidade", icon: "shield-outline" as const },
            { label: "Conformidade CFP",        icon: "ribbon-outline" as const },
          ].map(item => (
            <TouchableOpacity key={item.label} style={s.linkRow} activeOpacity={0.7}>
              <Ionicons name={item.icon} size={18} color={Colors.gray[500]} />
              <Text style={s.linkText}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={16} color={Colors.gray[300]} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Versão */}
        <Text style={s.version}>Paideia v1.0.0 · Em conformidade com o CFP e a LGPD</Text>

        {/* Logout */}
        <TouchableOpacity style={s.logoutBtn} onPress={confirmLogout} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={18} color="#DC2626" />
          <Text style={s.logoutText}>Sair da conta</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:       { flex: 1, backgroundColor: Colors.gray[50] },
  scroll:     { padding: 20, paddingBottom: 60 },
  title:      { fontSize: 24, fontWeight: "700", color: Colors.ink, marginBottom: 20 },
  card:       { backgroundColor: Colors.white, borderRadius: 16, padding: 18, marginBottom: 14, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  profileRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  avatar:     { width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.brand[100], alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 24, fontWeight: "700", color: Colors.brand[600] },
  profileInfo: { flex: 1, gap: 2 },
  profileName: { fontSize: 17, fontWeight: "700", color: Colors.ink },
  profileEmail: { fontSize: 13, color: Colors.gray[500] },
  roleBadge:  { alignSelf: "flex-start", marginTop: 4, backgroundColor: Colors.gray[100], paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  adminBadge: { backgroundColor: Colors.brand[100] },
  roleText:   { fontSize: 11, fontWeight: "600", color: Colors.gray[600] },
  adminText:  { color: Colors.brand[700] },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
  cardTitle:  { fontSize: 15, fontWeight: "700", color: Colors.ink },
  cardDesc:   { fontSize: 13, color: Colors.gray[500], marginBottom: 12, lineHeight: 18 },
  inputRow:   { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: Colors.gray[200], borderRadius: 12, paddingHorizontal: 12, marginBottom: 10 },
  input:      { paddingVertical: 11, fontSize: 13, color: Colors.ink, fontFamily: "monospace" },
  eyeBtn:     { padding: 8 },
  keyActions: { flexDirection: "row", gap: 10 },
  btn:        { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: Colors.brand[500], borderRadius: 10, paddingVertical: 10 },
  btnDisabled: { backgroundColor: Colors.gray[300] },
  btnSuccess: { backgroundColor: "#16A34A" },
  btnText:    { color: Colors.white, fontWeight: "600", fontSize: 14 },
  btnDanger:  { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: "#FEF2F2", borderRadius: 10, paddingVertical: 10, borderWidth: 1, borderColor: "#FECACA" },
  btnDangerText: { color: "#DC2626", fontWeight: "600", fontSize: 14 },
  linkRow:    { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, borderTopWidth: 1, borderTopColor: Colors.gray[100] },
  linkText:   { flex: 1, fontSize: 14, color: Colors.gray[700] },
  version:    { textAlign: "center", fontSize: 11, color: Colors.gray[400], marginBottom: 16 },
  logoutBtn:  { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "#FEF2F2", borderRadius: 14, paddingVertical: 14, borderWidth: 1, borderColor: "#FECACA" },
  logoutText: { color: "#DC2626", fontSize: 15, fontWeight: "700" },
  anamneseRow: { borderWidth: 1, borderColor: Colors.gray[100], borderRadius: 12, overflow: "hidden" },
  anamneseHeader: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, paddingVertical: 12 },
  anamneseLabel: { flex: 1, fontSize: 13, fontWeight: "600", color: Colors.ink },
  anamneseBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  anamneseBadgeOk: { backgroundColor: "#DCFCE7" },
  anamneseBadgeMissing: { backgroundColor: Colors.gray[100] },
  anamneseBadgeText: { fontSize: 10, fontWeight: "700" },
  anamneseBody: { paddingHorizontal: 12, paddingBottom: 12, borderTopWidth: 1, borderTopColor: Colors.gray[100], paddingTop: 10, gap: 10 },
  anamneseTextarea: { borderWidth: 1, borderColor: Colors.gray[200], borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 12, color: Colors.ink, fontFamily: "monospace", minHeight: 160, textAlignVertical: "top" },
});
