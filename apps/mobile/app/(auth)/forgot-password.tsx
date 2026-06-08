import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "@/constants/colors";
import { api } from "@/lib/api";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail]     = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);

  async function handleSubmit() {
    if (!email) {
      Alert.alert("Atenção", "Informe seu e-mail.");
      return;
    }
    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email });
    } catch {
      // Sempre mostrar sucesso por segurança
    } finally {
      setLoading(false);
      setSent(true);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Botão voltar */}
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>← Voltar</Text>
          </TouchableOpacity>

          {/* Logo */}
          <View style={styles.logoContainer}>
            <Image
              source={require("@/assets/ideah-logo.png")}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          {!sent ? (
            <>
              <Text style={styles.title}>Recuperar senha</Text>
              <Text style={styles.subtitle}>
                Informe seu e-mail e enviaremos as instruções de recuperação.
              </Text>

              <View style={styles.field}>
                <Text style={styles.label}>E-mail</Text>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="seu@email.com"
                  placeholderTextColor={Colors.gray[400]}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <TouchableOpacity
                style={[styles.btn, loading && styles.btnDisabled]}
                onPress={handleSubmit}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.btnText}>Enviar instruções</Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.successContainer}>
              <Text style={styles.successIcon}>✅</Text>
              <Text style={styles.successTitle}>E-mail enviado!</Text>
              <Text style={styles.successText}>
                Se esse e-mail estiver cadastrado, você receberá as instruções em breve.
                Verifique também a caixa de spam.
              </Text>
              <TouchableOpacity
                style={styles.btn}
                onPress={() => router.replace("/(auth)/login")}
                activeOpacity={0.8}
              >
                <Text style={styles.btnText}>Ir para o login</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:       { flex: 1, backgroundColor: Colors.brand[50] },
  scroll:     { flexGrow: 1, paddingHorizontal: 24, paddingTop: 20, paddingBottom: 40 },
  backBtn:    { marginBottom: 16 },
  backText:   { color: Colors.brand[500], fontSize: 14, fontWeight: "500" },
  logoContainer: { alignItems: "center", marginBottom: 32 },
  logo:       { width: 160, height: 60 },
  title:      { fontSize: 22, fontWeight: "700", color: Colors.ink, marginBottom: 8 },
  subtitle:   { fontSize: 14, color: Colors.gray[500], lineHeight: 22, marginBottom: 28 },
  field:      { gap: 6, marginBottom: 20 },
  label:      { fontSize: 14, fontWeight: "500", color: Colors.gray[700] },
  input: {
    borderWidth: 1,
    borderColor: Colors.gray[200],
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 14,
    color: Colors.ink,
    backgroundColor: Colors.white,
  },
  btn: {
    backgroundColor: Colors.brand[500],
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  btnDisabled: { opacity: 0.5 },
  btnText:    { color: "#fff", fontSize: 15, fontWeight: "600" },
  successContainer: { alignItems: "center", gap: 12, marginTop: 16 },
  successIcon:  { fontSize: 56 },
  successTitle: { fontSize: 22, fontWeight: "700", color: Colors.ink },
  successText: {
    fontSize: 14,
    color: Colors.gray[500],
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 8,
  },
});
