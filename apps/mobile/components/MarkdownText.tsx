import { View, Text, StyleSheet } from "react-native";
import { Colors } from "@/constants/colors";

/** Renderiza um markdown simples (gerado pela IA) usando componentes nativos, sem lib externa. */
export function MarkdownText({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <View style={s.wrap}>
      {lines.map((line, i) => {
        if (line.startsWith("# ")) return <Text key={i} style={s.h1}>{line.slice(2)}</Text>;
        if (line.startsWith("## ")) return <Text key={i} style={s.h2}>{line.slice(3)}</Text>;
        if (line.startsWith("### ")) return <Text key={i} style={s.h3}>{line.slice(4)}</Text>;
        if (line.startsWith("- ") || line.startsWith("• ")) {
          return (
            <View key={i} style={s.bulletRow}>
              <Text style={s.bulletDot}>•</Text>
              <Text style={s.bulletText}>{stripBold(line.slice(2))}</Text>
            </View>
          );
        }
        if (line.trim() === "") return <View key={i} style={{ height: 6 }} />;
        return <Text key={i} style={s.p}>{stripBold(line)}</Text>;
      })}
    </View>
  );
}

/** Remove marcação **negrito** (RN Text simples não interpreta markdown inline). */
function stripBold(line: string): string {
  return line.replace(/\*\*(.*?)\*\*/g, "$1");
}

const s = StyleSheet.create({
  wrap: { gap: 2 },
  h1: { fontSize: 18, fontWeight: "700", color: Colors.ink, marginTop: 6, marginBottom: 4 },
  h2: { fontSize: 15, fontWeight: "700", color: Colors.ink, marginTop: 10, marginBottom: 4 },
  h3: { fontSize: 14, fontWeight: "600", color: Colors.gray[700], marginTop: 6, marginBottom: 2 },
  p: { fontSize: 13, color: Colors.gray[700], lineHeight: 20 },
  bulletRow: { flexDirection: "row", gap: 6, paddingLeft: 4 },
  bulletDot: { fontSize: 13, color: Colors.brand[500] },
  bulletText: { flex: 1, fontSize: 13, color: Colors.gray[700], lineHeight: 20 },
});
