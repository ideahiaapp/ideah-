import { useRef, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Modal, Animated, Easing, Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, usePathname } from "expo-router";
import { useAuthStore } from "@/store/auth.store";
import { Colors } from "@/constants/colors";
import { confirmAsync } from "@/lib/confirm";

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

const MENU_ITEMS: { label: string; icon: IoniconsName; href: string }[] = [
  { label: "Início",         icon: "home-outline",        href: "/(tabs)" },
  { label: "Clientes",       icon: "people-outline",      href: "/(tabs)/clients" },
  { label: "Agenda",         icon: "calendar-outline",    href: "/(tabs)/schedule" },
  { label: "Meu escritório", icon: "briefcase-outline",   href: "/(tabs)/reports" },
  { label: "Certificado",    icon: "ribbon-outline",      href: "/(tabs)/certificate" },
  { label: "Configurações",  icon: "settings-outline",    href: "/(tabs)/settings" },
];

const PANEL_WIDTH = Math.min(300, Dimensions.get("window").width * 0.8);

export function HamburgerMenu() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const [open, setOpen] = useState(false);
  const translateX = useRef(new Animated.Value(-PANEL_WIDTH)).current;

  function show() {
    setOpen(true);
    Animated.timing(translateX, { toValue: 0, duration: 220, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }
  function hide(after?: () => void) {
    Animated.timing(translateX, { toValue: -PANEL_WIDTH, duration: 180, easing: Easing.in(Easing.cubic), useNativeDriver: true }).start(() => {
      setOpen(false);
      after?.();
    });
  }

  function go(href: string) {
    hide(() => router.push(href as never));
  }

  async function confirmLogout() {
    const ok = await confirmAsync("Sair", "Deseja sair da sua conta?", "Sair");
    if (ok) hide(() => logout());
  }

  const firstName = user?.name?.split(" ")[0] ?? "Terapeuta";

  return (
    <>
      <TouchableOpacity onPress={show} style={s.trigger} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Ionicons name="menu" size={24} color={Colors.ink} />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="none" onRequestClose={() => hide()}>
        <View style={s.overlay}>
          <TouchableOpacity style={s.backdrop} activeOpacity={1} onPress={() => hide()} />
          <Animated.View style={[s.panel, { width: PANEL_WIDTH, transform: [{ translateX }] }]}>
            <View style={s.panelHeader}>
              <View style={s.avatar}>
                <Text style={s.avatarText}>{firstName[0]?.toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.userName} numberOfLines={1}>{user?.name}</Text>
                <Text style={s.userEmail} numberOfLines={1}>{user?.email}</Text>
              </View>
              <TouchableOpacity onPress={() => hide()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close" size={22} color={Colors.gray[400]} />
              </TouchableOpacity>
            </View>

            <View style={s.items}>
              {MENU_ITEMS.map(item => {
                const active = pathname === item.href || (item.href !== "/(tabs)" && pathname.startsWith(item.href));
                return (
                  <TouchableOpacity key={item.href} style={[s.item, active && s.itemActive]} onPress={() => go(item.href)} activeOpacity={0.7}>
                    <Ionicons name={item.icon} size={19} color={active ? Colors.brand[600] : Colors.gray[500]} />
                    <Text style={[s.itemText, active && s.itemTextActive]}>{item.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity style={s.logoutItem} onPress={confirmLogout} activeOpacity={0.7}>
              <Ionicons name="log-out-outline" size={19} color="#DC2626" />
              <Text style={s.logoutText}>Sair</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
    </>
  );
}

const s = StyleSheet.create({
  trigger:      { padding: 4 },
  overlay:      { flex: 1, flexDirection: "row" },
  backdrop:     { flex: 1, backgroundColor: "rgba(0,0,0,0.35)" },
  panel:        { backgroundColor: Colors.white, height: "100%", paddingTop: 56, paddingBottom: 24, paddingHorizontal: 16, gap: 4 },
  panelHeader:  { flexDirection: "row", alignItems: "center", gap: 10, paddingBottom: 18, marginBottom: 10, borderBottomWidth: 1, borderBottomColor: Colors.gray[100] },
  avatar:       { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.brand[100], alignItems: "center", justifyContent: "center" },
  avatarText:   { fontSize: 16, fontWeight: "700", color: Colors.brand[600] },
  userName:     { fontSize: 14, fontWeight: "700", color: Colors.ink },
  userEmail:    { fontSize: 12, color: Colors.gray[500] },
  items:        { gap: 2, flex: 1 },
  item:         { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, paddingHorizontal: 10, borderRadius: 10 },
  itemActive:   { backgroundColor: Colors.brand[50] },
  itemText:     { fontSize: 14, fontWeight: "500", color: Colors.gray[700] },
  itemTextActive: { color: Colors.brand[600], fontWeight: "700" },
  logoutItem:   { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, paddingHorizontal: 10, borderRadius: 10, borderTopWidth: 1, borderTopColor: Colors.gray[100], marginTop: 8 },
  logoutText:   { fontSize: 14, fontWeight: "600", color: "#DC2626" },
});
