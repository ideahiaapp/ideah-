import { useEffect } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import { Colors } from "@/constants/colors";

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    async function handle() {
      if (typeof window === "undefined") return;

      const hash   = window.location.hash.substring(1);
      const search = window.location.search.substring(1);
      const params = new URLSearchParams(hash || search);

      const accessToken  = params.get("access_token");
      const refreshToken = params.get("refresh_token");
      const errorDesc    = params.get("error_description");

      if (errorDesc) {
        router.replace(`/(auth)/login?error=${encodeURIComponent(errorDesc)}`);
        return;
      }

      if (accessToken && refreshToken) {
        await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });

        const { data: { user } } = await supabase.auth.getUser();
        if (user?.email) {
          try {
            const res = await fetch(
              `${process.env.EXPO_PUBLIC_WEB_URL}/api/auth/verify?email=${encodeURIComponent(user.email)}`
            );
            const { allowed } = await res.json();
            if (!allowed) {
              await supabase.auth.signOut();
              router.replace("/(auth)/login?error=not_registered");
              return;
            }
          } catch {
            // se a verificação falhar, bloqueia por segurança
            await supabase.auth.signOut();
            router.replace("/(auth)/login?error=not_registered");
            return;
          }
        }
        router.replace("/(tabs)/");
      } else {
        router.replace("/(auth)/login");
      }
    }

    handle();
  }, []);

  return (
    <View style={s.container}>
      <ActivityIndicator size="large" color={Colors.brand[500]} />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: Colors.brand[50] },
});
