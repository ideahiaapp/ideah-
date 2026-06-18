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
import { useRouter, Link } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuthStore } from "@/store/auth.store";
import { Colors } from "@/constants/colors";

export default function RegisterScreen() {
  const router = useRouter();
  const { register: signUp, isLoading } = useAuthStore();

  const [name, setName]         = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm]   = useState("");
  const [showPass, setShowPass] = useState(false);

  const passwordStrength = (() => {
    if (password.length === 0) return 0;
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
  })();

  const strengthColors = ["", "#EF4444", "#EAB308", "#3B82F6", "#22C55E"];
  const strengthLabels = ["", "Fraca", "Razoável", "Boa", "Forte"];

  async function handleRegister() {
    if (!name || !email || !password || !confirm) {
      Alert.alert("Atenção", "Preencha todos os campos.");
      return;
    }
    if (password !== confirm) {
      Alert.alert("Atenção", "As senhas não coincidem.");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Atenção", "A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    try {
      await signUp(name, email, password);
      router.replace("/(tabs)");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("User already registered"))
        Alert.alert("Erro", "Este e-mail já está cadastrado. Tente fazer login.");
      else
        Alert.alert("Erro", msg || "Não foi possível criar sua conta.");
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
          {/* Logo */}
          <View style={styles.logoContainer}>
            <Image
              source={require("@/assets/ideah-logo.png")}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          {/* Trial badge */}
          <View style={styles.trialBadge}>
            <Text style={styles.trialText}>✨ 7 dias grátis · Sem cartão de crédito</Text>
          </View>

          <Text style={styles.title}>Crie sua conta</Text>
          <Text style={styles.subtitle}>Comece agora sua supervisão clínica</Text>

          <View style={styles.form}>
            {/* Nome */}
            <View style={styles.field}>
              <Text style={styles.label}>Nome completo</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Seu nome"
                placeholderTextColor={Colors.gray[400]}
                autoCapitalize="words"
                autoComplete="name"
              />
            </View>

            {/* Email */}
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
                autoComplete="email"
              />
            </View>

            {/* Senha */}
            <View style={styles.field}>
              <Text style={styles.label}>Senha</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={[styles.input, { flex: 1, borderWidth: 0 }]}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Mínimo 6 caracteres"
                  placeholderTextColor={Colors.gray[400]}
                  secureTextEntry={!showPass}
                />
                <TouchableOpacity onPress={() => setShowPass(!showPass)} style={styles.eyeBtn}>
                  <Text style={styles.eyeIcon}>{showPass ? "🙈" : "👁"}</Text>
                </TouchableOpacity>
              </View>
              {/* Força da senha */}
              {password.length > 0 && (
                <View style={styles.strengthContainer}>
                  <View style={styles.strengthBars}>
                    {[1, 2, 3, 4].map((i) => (
                      <View
                        key={i}
                        style={[
                          styles.strengthBar,
                          {
                            backgroundColor:
                              i <= passwordStrength
                                ? strengthColors[passwordStrength]
                                : Colors.gray[200],
                          },
                        ]}
                      />
                    ))}
                  </View>
                  <Text style={[styles.strengthLabel, { color: strengthColors[passwordStrength] }]}>
                    {strengthLabels[passwordStrength]}
                  </Text>
                </View>
              )}
            </View>

            {/* Confirmar senha */}
            <View style={styles.field}>
              <Text style={styles.label}>Confirmar senha</Text>
              <TextInput
                style={[
                  styles.input,
                  confirm && confirm !== password && { borderColor: Colors.red },
                ]}
                value={confirm}
                onChangeText={setConfirm}
                placeholder="Repita a senha"
                placeholderTextColor={Colors.gray[400]}
                secureTextEntry={!showPass}
              />
              {confirm && confirm === password && (
                <Text style={styles.matchText}>✅ Senhas coincidem</Text>
              )}
            </View>

            {/* Botão */}
            <TouchableOpacity
              style={[styles.btn, isLoading && styles.btnDisabled]}
              onPress={handleRegister}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.btnText}>Criar conta grátis</Text>
              )}
            </TouchableOpacity>

            <Text style={styles.terms}>
              Ao criar sua conta, você concorda com os{" "}
              <Text style={styles.termsLink}>Termos de Uso</Text> e a{" "}
              <Text style={styles.termsLink}>Política de Privacidade</Text>.
            </Text>

            {/* Divisor */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>Já tem conta?</Text>
              <View style={styles.dividerLine} />
            </View>

            <Link href="/(auth)/login" asChild>
              <TouchableOpacity style={styles.btnOutline} activeOpacity={0.8}>
                <Text style={styles.btnOutlineText}>Fazer login</Text>
              </TouchableOpacity>
            </Link>
          </View>

          <Text style={styles.legal}>Em conformidade com o CFP e a LGPD</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:           { flex: 1, backgroundColor: Colors.brand[50] },
  scroll:         { flexGrow: 1, paddingHorizontal: 24, paddingTop: 28, paddingBottom: 32 },
  logoContainer:  { alignItems: "center", marginBottom: 20 },
  logo:           { width: 180, height: 68 },
  trialBadge: {
    alignSelf: "flex-start",
    backgroundColor: Colors.brand[100],
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginBottom: 16,
  },
  trialText:      { fontSize: 12, color: Colors.brand[600], fontWeight: "600" },
  title:          { fontSize: 22, fontWeight: "700", color: Colors.ink, marginBottom: 4 },
  subtitle:       { fontSize: 14, color: Colors.gray[500], marginBottom: 24 },
  form:           { gap: 14 },
  field:          { gap: 6 },
  label:          { fontSize: 14, fontWeight: "500", color: Colors.gray[700] },
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
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.gray[200],
    borderRadius: 12,
    backgroundColor: Colors.white,
    paddingHorizontal: 14,
  },
  eyeBtn:         { padding: 4 },
  eyeIcon:        { fontSize: 16 },
  strengthContainer: { marginTop: 6, gap: 4 },
  strengthBars:   { flexDirection: "row", gap: 4 },
  strengthBar:    { flex: 1, height: 3, borderRadius: 2 },
  strengthLabel:  { fontSize: 11 },
  matchText:      { fontSize: 12, color: Colors.green },
  btn: {
    backgroundColor: Colors.brand[500],
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 4,
  },
  btnDisabled:    { opacity: 0.5 },
  btnText:        { color: Colors.white, fontSize: 15, fontWeight: "600" },
  terms:          { fontSize: 11, color: Colors.gray[400], textAlign: "center", lineHeight: 17 },
  termsLink:      { color: Colors.brand[500] },
  divider:        { flexDirection: "row", alignItems: "center", gap: 10 },
  dividerLine:    { flex: 1, height: 1, backgroundColor: Colors.gray[200] },
  dividerText:    { fontSize: 12, color: Colors.gray[400] },
  btnOutline: {
    borderWidth: 1,
    borderColor: Colors.brand[300],
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  btnOutlineText: { color: Colors.brand[600], fontSize: 14, fontWeight: "600" },
  legal:          { textAlign: "center", fontSize: 11, color: Colors.gray[400], marginTop: 28 },
});
