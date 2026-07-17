import { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as SecureStore from "expo-secure-store";
import { useAuthStore } from "@/store/auth.store";
import { Colors } from "@/constants/colors";
import { HamburgerMenu } from "@/components/HamburgerMenu";

const API_KEY_STORE = "ideah_anthropic_api_key";

export default function SettingsScreen() {
  const { user, logout } = useAuthStore();
  const [apiKey, setApiKey]     = useState("");
  const [showKey, setShowKey]   = useState(false);
  const [keySaved, setKeySaved] = useState(false);

  async function saveApiKey() {
    if (!apiKey.trim()) { Alert.alert("Atenção", "Digite uma API Key válida."); return; }
    await SecureStore.setItemAsync(API_KEY_STORE, apiKey.trim());
    setKeySaved(true);
    setTimeout(() => setKeySaved(false), 2000);
  }

  async function removeApiKey() {
    Alert.alert("Remover API Key", "Tem certeza?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Remover", style: "destructive", onPress: async () => {
        await SecureStore.deleteItemAsync(API_KEY_STORE);
        setApiKey("");
      }},
    ]);
  }

  function confirmLogout() {
    Alert.alert("Sair", "Deseja sair da sua conta?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Sair", style: "destructive", onPress: logout },
    ]);
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
            Necessária para usar as funcionalidades de IA (Supervisão, Relatórios).
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
  btnSuccess: { backgroundColor: "#16A34A" },
  btnText:    { color: Colors.white, fontWeight: "600", fontSize: 14 },
  btnDanger:  { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: "#FEF2F2", borderRadius: 10, paddingVertical: 10, borderWidth: 1, borderColor: "#FECACA" },
  btnDangerText: { color: "#DC2626", fontWeight: "600", fontSize: 14 },
  linkRow:    { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, borderTopWidth: 1, borderTopColor: Colors.gray[100] },
  linkText:   { flex: 1, fontSize: 14, color: Colors.gray[700] },
  version:    { textAlign: "center", fontSize: 11, color: Colors.gray[400], marginBottom: 16 },
  logoutBtn:  { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "#FEF2F2", borderRadius: 14, paddingVertical: 14, borderWidth: 1, borderColor: "#FECACA" },
  logoutText: { color: "#DC2626", fontSize: 15, fontWeight: "700" },
});
