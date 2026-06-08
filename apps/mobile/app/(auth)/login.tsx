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

export default function LoginScreen() {
  const router = useRouter();
  const { login, isLoading } = useAuthStore();

  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);

  async function handleLogin() {
    if (!email || !password) {
      Alert.alert("Atenção", "Preencha e-mail e senha.");
      return;
    }
    try {
      await login(email, password);
      router.replace("/(tabs)");
    } catch {
      Alert.alert("Erro", "E-mail ou senha inválidos.");
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

          {/* Cabeçalho */}
          <Text style={styles.title}>Bem-vindo de volta</Text>
          <Text style={styles.subtitle}>Entre na sua conta para continuar</Text>

          {/* Formulário */}
          <View style={styles.form}>
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
              <View style={styles.labelRow}>
                <Text style={styles.label}>Senha</Text>
                <Link href="/(auth)/forgot-password" asChild>
                  <TouchableOpacity>
                    <Text style={styles.forgotLink}>Esqueci minha senha</Text>
                  </TouchableOpacity>
                </Link>
              </View>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={[styles.input, { flex: 1, borderWidth: 0 }]}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  placeholderTextColor={Colors.gray[400]}
                  secureTextEntry={!showPass}
                  autoComplete="password"
                />
                <TouchableOpacity
                  onPress={() => setShowPass(!showPass)}
                  style={styles.eyeBtn}
                >
                  <Text style={styles.eyeIcon}>{showPass ? "🙈" : "👁"}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Botão entrar */}
            <TouchableOpacity
              style={[styles.btn, isLoading && styles.btnDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.btnText}>Entrar</Text>
              )}
            </TouchableOpacity>

            {/* Divisor */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>Não tem conta?</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Criar conta */}
            <Link href="/(auth)/register" asChild>
              <TouchableOpacity style={styles.btnOutline} activeOpacity={0.8}>
                <Text style={styles.btnOutlineText}>
                  Criar conta grátis — 7 dias sem cobrança
                </Text>
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
  safe: {
    flex: 1,
    backgroundColor: Colors.brand[50],
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 32,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 36,
  },
  logo: {
    width: 200,
    height: 75,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.ink,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.gray[500],
    marginBottom: 32,
  },
  form: {
    gap: 16,
  },
  field: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.gray[700],
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  forgotLink: {
    fontSize: 12,
    color: Colors.brand[500],
    fontWeight: "500",
  },
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
  eyeBtn: {
    padding: 4,
  },
  eyeIcon: {
    fontSize: 16,
  },
  btn: {
    backgroundColor: Colors.brand[500],
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 4,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  btnText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: "600",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginVertical: 4,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.gray[200],
  },
  dividerText: {
    fontSize: 12,
    color: Colors.gray[400],
  },
  btnOutline: {
    borderWidth: 1,
    borderColor: Colors.brand[300],
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  btnOutlineText: {
    color: Colors.brand[600],
    fontSize: 13,
    fontWeight: "600",
  },
  legal: {
    textAlign: "center",
    fontSize: 11,
    color: Colors.gray[400],
    marginTop: 32,
  },
});
