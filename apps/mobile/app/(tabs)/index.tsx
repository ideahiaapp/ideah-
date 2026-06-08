import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function DashboardScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Olá, terapeuta 👋</Text>
      <Text style={styles.subtitle}>Seus casos estão aqui.</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB", padding: 20 },
  title: { fontSize: 24, fontWeight: "700", color: "#1F2937" },
  subtitle: { fontSize: 16, color: "#6B7280", marginTop: 4 },
});
