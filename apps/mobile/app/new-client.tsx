import { useEffect, useState } from "react";
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
import { VoiceTextInput } from "@/components/VoiceTextInput";

const ALL_APPROACHES = [
  { value: "PSYCHOANALYSIS",       label: "Psicanálise Freudiana" },
  { value: "COGNITIVE_BEHAVIORAL", label: "TCC" },
  { value: "JUNGIAN",              label: "Junguiana" },
  { value: "SOMATIC",              label: "Somática / Corporal" },
  { value: "TANTRA",               label: "Sexualidade Humana e Tantra" },
  { value: "GESTALT",              label: "Gestalt-terapia" },
  { value: "PSYCHODRAMA",          label: "Psicodrama" },
  { value: "SYSTEMIC",             label: "Constelação Familiar" },
];

const FREQUENCIES = ["Semanal", "Quinzenal", "Mensal", "Sob demanda"].map(v => ({ value: v, label: v }));
const DURATIONS   = ["45", "50", "60", "90"].map(v => ({ value: v, label: `${v} min` }));

const PALETTE = ["#C2542F", "#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#14B8A6", "#F97316", "#06B6D4"];

function generateInitials(name: string): string {
  return name.trim().split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase() ?? "").join("");
}

function generateColor(name: string): string {
  let h = 0;
  for (const c of name) h = (h << 5) - h + c.charCodeAt(0);
  return PALETTE[Math.abs(h) % PALETTE.length];
}

function maskPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function PickerField({ label, value, options, onChange }: {
  label: string; value: string; options: { value: string; label: string }[]; onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selectedLabel = options.find(o => o.value === value)?.label;
  return (
    <View style={{ marginBottom: 10 }}>
      <TouchableOpacity style={s.selector} onPress={() => setOpen(!open)}>
        <Text style={selectedLabel ? s.selectorText : s.selectorPlaceholder} numberOfLines={1}>
          {selectedLabel ?? label}
        </Text>
        <Ionicons name={open ? "chevron-up" : "chevron-down"} size={16} color={Colors.gray[400]} />
      </TouchableOpacity>
      {open && (
        <View style={s.pickerList}>
          {options.map(o => (
            <TouchableOpacity
              key={o.value}
              style={[s.pickerItem, value === o.value && s.pickerItemActive]}
              onPress={() => { onChange(o.value); setOpen(false); }}
            >
              <Text style={[s.pickerItemText, value === o.value && { color: Colors.brand[600] }]} numberOfLines={1}>{o.label}</Text>
              {value === o.value && <Ionicons name="checkmark" size={16} color={Colors.brand[500]} />}
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

function FieldLabel({ children, required }: { children: string; required?: boolean }) {
  return <Text style={s.fieldLabel}>{children} {required && <Text style={{ color: "#EF4444" }}>*</Text>}</Text>;
}

function SectionCard({ icon, title, children }: { icon: React.ComponentProps<typeof Ionicons>["name"]; title: string; children: React.ReactNode }) {
  return (
    <View style={s.section}>
      <View style={s.sectionHeader}>
        <View style={s.sectionIcon}><Ionicons name={icon} size={16} color={Colors.brand[500]} /></View>
        <Text style={s.sectionTitle}>{title}</Text>
      </View>
      <View style={s.sectionBody}>{children}</View>
    </View>
  );
}

export default function NewClientScreen() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [form, setForm] = useState({
    name: "", email: "", phone: "", birthDate: "", occupation: "",
    approach: "", frequency: "Semanal", duration: "50",
    mainDemand: "", notes: "", emergencyContact: "",
    lgpdConsent: false,
  });

  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);
  const [error,  setError]  = useState<string | null>(null);

  const [acquiredApproaches, setAcquiredApproaches] = useState<string[]>([]);
  const [loadingApproaches,  setLoadingApproaches]  = useState(true);

  useEffect(() => {
    if (!user) return;
    fetch(`${process.env.EXPO_PUBLIC_WEB_URL}/api/therapist-approaches?therapistId=${user.id}`)
      .then(r => r.json())
      .then(d => setAcquiredApproaches(d.approaches ?? []))
      .catch(() => {})
      .finally(() => setLoadingApproaches(false));
  }, [user]);

  const APPROACHES = ALL_APPROACHES.filter(a => acquiredApproaches.includes(a.value));
  const selectedApproach = APPROACHES.find(a => a.value === form.approach);
  const canSave = form.name.trim() && form.approach && form.mainDemand.trim() && form.lgpdConsent;

  function set<K extends keyof typeof form>(field: K, value: (typeof form)[K]) {
    setForm(p => ({ ...p, [field]: value }));
  }

  async function handleSave() {
    if (!canSave || !user) return;
    setSaving(true); setError(null);
    try {
      const { error: insErr } = await supabase.from("clients").insert({
        therapist_id:      user.id,
        name:              form.name.trim(),
        email:             form.email || null,
        phone:             form.phone || null,
        birth_date:        form.birthDate || null,
        occupation:        form.occupation || null,
        approach:          selectedApproach?.value ?? null,
        approach_label:    selectedApproach?.label ?? null,
        status:            "ACTIVE",
        session_frequency: form.frequency,
        session_duration:  parseInt(form.duration, 10),
        main_demand:       form.mainDemand.trim() || null,
        notes:             form.notes.trim() || null,
        emergency_contact: form.emergencyContact.trim() || null,
        initials:          generateInitials(form.name),
        color:             generateColor(form.name),
        total_sessions:    0,
      });
      if (insErr) throw insErr;
      setSaved(true);
      setTimeout(() => (router.canGoBack() ? router.back() : router.replace("/(tabs)/clients")), 900);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao salvar cliente.");
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => (router.canGoBack() ? router.back() : router.replace("/(tabs)/clients"))} style={s.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.ink} />
        </TouchableOpacity>
        <View>
          <Text style={s.headerTitle}>Novo Cliente</Text>
          <Text style={s.headerSub}>Cadastro e configuração inicial</Text>
        </View>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
          <SectionCard icon="person" title="Dados pessoais">
            <FieldLabel required>Nome completo</FieldLabel>
            <VoiceTextInput value={form.name} onValueChange={v => set("name", v)} placeholder="Nome do cliente" style={s.input} />

            <FieldLabel>Data de nascimento</FieldLabel>
            <TextInput value={form.birthDate} onChangeText={v => set("birthDate", v)} placeholder="AAAA-MM-DD" placeholderTextColor={Colors.gray[400]} style={s.input} />

            <FieldLabel>E-mail</FieldLabel>
            <TextInput value={form.email} onChangeText={v => set("email", v)} placeholder="email@exemplo.com" placeholderTextColor={Colors.gray[400]} keyboardType="email-address" autoCapitalize="none" style={s.input} />

            <FieldLabel>Telefone / WhatsApp</FieldLabel>
            <TextInput value={form.phone} onChangeText={v => set("phone", maskPhone(v))} placeholder="(11) 99999-9999" placeholderTextColor={Colors.gray[400]} keyboardType="phone-pad" style={s.input} />

            <FieldLabel>Profissão / Ocupação</FieldLabel>
            <VoiceTextInput value={form.occupation} onValueChange={v => set("occupation", v)} placeholder="Ex: Designer, Engenheiro..." style={s.input} />
          </SectionCard>

          <SectionCard icon="heart" title="Configuração clínica">
            <FieldLabel required>Abordagem terapêutica</FieldLabel>
            {loadingApproaches ? (
              <View style={[s.input, { justifyContent: "center" }]}><ActivityIndicator size="small" color={Colors.brand[500]} /></View>
            ) : APPROACHES.length === 0 ? (
              <Text style={s.warnText}>Nenhuma base teórica adquirida. Acesse Configurações → Minhas Bases.</Text>
            ) : (
              <PickerField label="Selecionar..." value={form.approach} onChange={v => set("approach", v)} options={APPROACHES} />
            )}

            <FieldLabel>Frequência das sessões</FieldLabel>
            <PickerField label="Selecionar..." value={form.frequency} onChange={v => set("frequency", v)} options={FREQUENCIES} />

            <FieldLabel>Duração (minutos)</FieldLabel>
            <PickerField label="Selecionar..." value={form.duration} onChange={v => set("duration", v)} options={DURATIONS} />
          </SectionCard>

          <SectionCard icon="document-text" title="Prontuário inicial">
            <FieldLabel required>Demanda principal</FieldLabel>
            <VoiceTextInput value={form.mainDemand} onValueChange={v => set("mainDemand", v)} placeholder="Motivo da busca por terapia, queixas principais, contexto..." multiline numberOfLines={3} style={[s.input, s.textarea]} />

            <FieldLabel>Observações clínicas iniciais</FieldLabel>
            <VoiceTextInput value={form.notes} onValueChange={v => set("notes", v)} placeholder="Impressões da triagem, hipóteses iniciais..." multiline numberOfLines={3} style={[s.input, s.textarea]} />
          </SectionCard>

          <SectionCard icon="alert-circle" title="Contato de emergência">
            <VoiceTextInput value={form.emergencyContact} onValueChange={v => set("emergencyContact", v)} placeholder="Ex: João Silva (irmão) — (11) 99999-9999" style={s.input} />
            <Text style={s.hint}>Informação confidencial — utilizada apenas em situações de risco iminente.</Text>
          </SectionCard>

          <SectionCard icon="shield-checkmark" title="Sigilo, consentimento e LGPD">
            <TouchableOpacity style={s.checkboxRow} onPress={() => set("lgpdConsent", !form.lgpdConsent)} activeOpacity={0.8}>
              <View style={[s.checkbox, form.lgpdConsent && s.checkboxChecked]}>
                {form.lgpdConsent && <Ionicons name="checkmark" size={12} color="#fff" />}
              </View>
              <Text style={s.checkboxLabel}>
                <Text style={{ color: "#EF4444" }}>* </Text>
                Confirmo que obtive o Consentimento Livre e Esclarecido (TCLE) para armazenamento e uso dos dados, conforme a LGPD e a Res. CFP nº 21/2025.
              </Text>
            </TouchableOpacity>
            {!form.lgpdConsent && (
              <Text style={s.warnText}>O consentimento LGPD é obrigatório para salvar o cadastro.</Text>
            )}
          </SectionCard>

          {error && <Text style={s.errorText}>{error}</Text>}

          <TouchableOpacity
            style={[s.saveBtn, (!canSave || saving || saved) && s.saveBtnDisabled]}
            onPress={handleSave}
            disabled={!canSave || saving || saved}
            activeOpacity={0.85}
          >
            {saved ? (
              <><Ionicons name="checkmark-circle" size={18} color="#fff" /><Text style={s.saveBtnText}>  Salvo! Voltando...</Text></>
            ) : saving ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <><Ionicons name="save" size={16} color="#fff" /><Text style={s.saveBtnText}>  Salvar cliente</Text></>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:       { flex: 1, backgroundColor: Colors.gray[50] },
  header:     { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.gray[100] },
  backBtn:    { padding: 4 },
  headerTitle: { fontSize: 16, fontWeight: "700", color: Colors.ink },
  headerSub:  { fontSize: 12, color: Colors.gray[500] },
  scroll:     { padding: 16, paddingBottom: 40, gap: 14 },
  section:    { backgroundColor: Colors.white, borderRadius: 16, overflow: "hidden", shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.gray[50], backgroundColor: Colors.gray[50] },
  sectionIcon: { width: 26, height: 26, borderRadius: 8, backgroundColor: Colors.brand[50], alignItems: "center", justifyContent: "center" },
  sectionTitle: { fontSize: 13, fontWeight: "700", color: Colors.gray[700] },
  sectionBody: { padding: 16 },
  fieldLabel: { fontSize: 12, fontWeight: "600", color: Colors.gray[600], marginBottom: 6, marginTop: 10 },
  input:      { borderWidth: 1, borderColor: Colors.gray[200], borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, color: Colors.ink, backgroundColor: Colors.white },
  textarea:   { minHeight: 80, textAlignVertical: "top" },
  hint:       { fontSize: 11, color: Colors.gray[400], marginTop: 6 },
  warnText:   { fontSize: 12, color: "#D97706", backgroundColor: "#FEF3C7", borderWidth: 1, borderColor: "#FDE68A", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, marginTop: 4 },
  errorText:  { fontSize: 13, color: "#DC2626", backgroundColor: "#FEE2E2", borderWidth: 1, borderColor: "#FECACA", borderRadius: 12, padding: 12 },
  checkboxRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  checkbox:   { width: 20, height: 20, borderRadius: 6, borderWidth: 2, borderColor: Colors.gray[300], alignItems: "center", justifyContent: "center", marginTop: 1 },
  checkboxChecked: { backgroundColor: Colors.brand[500], borderColor: Colors.brand[500] },
  checkboxLabel: { flex: 1, fontSize: 13, color: Colors.gray[700], lineHeight: 19 },
  saveBtn:    { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: Colors.brand[500], borderRadius: 14, paddingVertical: 14 },
  saveBtnDisabled: { backgroundColor: Colors.gray[300] },
  saveBtnText: { fontSize: 14, fontWeight: "700", color: "#fff" },
  selector:   { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderWidth: 1, borderColor: Colors.gray[200], borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12 },
  selectorText: { fontSize: 14, color: Colors.ink, flex: 1 },
  selectorPlaceholder: { fontSize: 14, color: Colors.gray[400], flex: 1 },
  pickerList: { borderWidth: 1, borderColor: Colors.gray[200], borderRadius: 12, overflow: "hidden", marginTop: 8 },
  pickerItem: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.gray[100] },
  pickerItemActive: { backgroundColor: Colors.brand[50] },
  pickerItemText: { fontSize: 14, color: Colors.ink, flex: 1 },
});
