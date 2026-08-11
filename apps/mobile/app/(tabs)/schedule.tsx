import { useEffect, useState, useCallback, useMemo } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, ActivityIndicator, Modal, ScrollView, Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useAuthStore } from "@/store/auth.store";
import { supabase } from "@/lib/supabase";
import { Colors } from "@/constants/colors";
import { HamburgerMenu } from "@/components/HamburgerMenu";

type SessionStatus = "confirmed" | "pending" | "cancelled" | "done";

type Session = {
  id: string; client_id: string; date: string; start_time: string; duration: number;
  status: SessionStatus; notes: string | null; price: number | null;
  clients: { name: string; initials: string | null; color: string | null } | null;
};

type Client = { id: string; name: string };

const STATUS_MAP: Record<SessionStatus, { label: string; color: string; bg: string }> = {
  confirmed: { label: "Confirmada", color: "#16A34A", bg: "#DCFCE7" },
  pending:   { label: "Pendente",   color: "#D97706", bg: "#FEF3C7" },
  cancelled: { label: "Cancelada",  color: "#DC2626", bg: "#FEE2E2" },
  done:      { label: "Realizada",  color: "#6B7280", bg: "#F3F4F6" },
};

const WEEKDAY_LABELS = ["D", "S", "T", "Q", "Q", "S", "S"];
const DURATIONS = [30, 45, 50, 60, 90];

function toDateStr(d: Date) {
  return d.toISOString().slice(0, 10);
}

function monthLabel(d: Date) {
  const raw = d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

/** Grade de 6 semanas (42 células) começando no domingo antes do dia 1 do mês. */
function buildMonthGrid(monthDate: Date): Date[] {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const start = new Date(firstOfMonth);
  start.setDate(start.getDate() - start.getDay());
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
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

function NewSessionModal({ visible, date, clients, therapistId, onClose, onSaved }: {
  visible: boolean; date: string; clients: Client[]; therapistId: string;
  onClose: () => void; onSaved: () => void;
}) {
  const [clientId, setClientId]   = useState("");
  const [time, setTime]           = useState("09:00");
  const [duration, setDuration]   = useState("50");
  const [status, setStatus]       = useState<SessionStatus>("confirmed");
  const [price, setPrice]         = useState("");
  const [notes, setNotes]         = useState("");
  const [saving, setSaving]       = useState(false);

  const canSave = !!clientId && !!time;

  async function handleSave() {
    if (!canSave) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("sessions").insert({
        therapist_id: therapistId,
        client_id:    clientId,
        date,
        start_time:   time.length === 5 ? `${time}:00` : time,
        duration:     parseInt(duration, 10),
        status,
        notes:        notes.trim() || null,
        price:        price ? Number(price) : null,
      });
      if (error) throw error;
      setClientId(""); setTime("09:00"); setDuration("50"); setStatus("confirmed"); setPrice(""); setNotes("");
      onSaved();
      onClose();
    } catch (e) {
      Alert.alert("Erro", e instanceof Error ? e.message : "Erro ao salvar sessão.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={s.safe}>
        <View style={s.modalHeader}>
          <TouchableOpacity onPress={onClose}><Ionicons name="close" size={24} color={Colors.gray[700]} /></TouchableOpacity>
          <Text style={s.modalTitle}>Nova Sessão</Text>
          <View style={{ width: 24 }} />
        </View>
        <ScrollView contentContainerStyle={s.modalScroll} keyboardShouldPersistTaps="handled">
          <Text style={s.fieldLabel}>Data</Text>
          <View style={[s.input, { justifyContent: "center" }]}>
            <Text style={{ color: Colors.ink, fontSize: 14 }}>{new Date(date + "T00:00:00").toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}</Text>
          </View>

          <Text style={s.fieldLabel}>Cliente *</Text>
          <PickerField label="Selecionar cliente..." value={clientId} onChange={setClientId} options={clients.map(c => ({ value: c.id, label: c.name }))} />

          <Text style={s.fieldLabel}>Horário *</Text>
          <TextInput value={time} onChangeText={setTime} placeholder="09:00" placeholderTextColor={Colors.gray[400]} style={s.input} />

          <Text style={s.fieldLabel}>Duração (minutos)</Text>
          <PickerField label="Selecionar..." value={duration} onChange={setDuration} options={DURATIONS.map(d => ({ value: String(d), label: `${d} min` }))} />

          <Text style={s.fieldLabel}>Status</Text>
          <PickerField label="Selecionar..." value={status} onChange={v => setStatus(v as SessionStatus)}
            options={(["confirmed", "pending", "cancelled", "done"] as SessionStatus[]).map(st => ({ value: st, label: STATUS_MAP[st].label }))} />

          <Text style={s.fieldLabel}>Valor (R$)</Text>
          <TextInput value={price} onChangeText={setPrice} placeholder="180" placeholderTextColor={Colors.gray[400]} keyboardType="numeric" style={s.input} />

          <Text style={s.fieldLabel}>Observações</Text>
          <TextInput value={notes} onChangeText={setNotes} placeholder="Opcional..." placeholderTextColor={Colors.gray[400]} multiline numberOfLines={3} style={[s.input, { minHeight: 70, textAlignVertical: "top" }]} />

          <TouchableOpacity style={[s.saveBtn, (!canSave || saving) && s.saveBtnDisabled]} onPress={handleSave} disabled={!canSave || saving} activeOpacity={0.85}>
            {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.saveBtnText}>Salvar sessão</Text>}
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

export default function ScheduleScreen() {
  const { user } = useAuthStore();
  const [month, setMonth]       = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() => toDateStr(new Date()));
  const [sessions, setSessions] = useState<Session[]>([]);
  const [clients,  setClients]  = useState<Client[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [showNew,  setShowNew]  = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const gridStart = buildMonthGrid(month)[0];
    const gridEnd   = buildMonthGrid(month)[41];
    const [sessionsRes, clientsRes] = await Promise.all([
      supabase
        .from("sessions")
        .select("id, client_id, date, start_time, duration, status, notes, price, clients(name, initials, color)")
        .eq("therapist_id", user.id)
        .gte("date", toDateStr(gridStart))
        .lte("date", toDateStr(gridEnd))
        .order("start_time", { ascending: true }),
      supabase.from("clients").select("id, name").eq("therapist_id", user.id).order("name"),
    ]);
    setSessions((sessionsRes.data ?? []) as unknown as Session[]);
    setClients((clientsRes.data ?? []) as Client[]);
    setLoading(false);
  }, [user, month]);

  useEffect(() => { load(); }, [load]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const sessionsByDate = useMemo(() => {
    const map = new Map<string, Session[]>();
    for (const sess of sessions) {
      const arr = map.get(sess.date) ?? [];
      arr.push(sess);
      map.set(sess.date, arr);
    }
    return map;
  }, [sessions]);

  const grid = useMemo(() => buildMonthGrid(month), [month]);
  const todayStr = toDateStr(new Date());
  const daySessions = sessionsByDate.get(selectedDate) ?? [];

  function changeMonth(delta: number) {
    setMonth(m => new Date(m.getFullYear(), m.getMonth() + delta, 1));
  }

  const renderSession = ({ item }: { item: Session }) => {
    const st = STATUS_MAP[item.status] ?? STATUS_MAP.confirmed;
    return (
      <View style={s.card}>
        <View style={[s.cardLeft, { backgroundColor: st.color }]} />
        <View style={s.cardBody}>
          <View style={s.cardTop}>
            <Text style={s.clientName} numberOfLines={1}>{item.clients?.name ?? "Cliente"}</Text>
            <View style={[s.badge, { backgroundColor: st.bg }]}>
              <Text style={[s.badgeText, { color: st.color }]}>{st.label}</Text>
            </View>
          </View>
          <View style={s.cardMeta}>
            <Ionicons name="time-outline" size={13} color={Colors.gray[400]} />
            <Text style={s.metaText}>{item.start_time?.slice(0, 5)} · {item.duration}min</Text>
          </View>
          {item.price != null && <Text style={s.price}>R$ {item.price.toFixed(2).replace(".", ",")}</Text>}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <HamburgerMenu />
          <Text style={s.title}>Agenda</Text>
        </View>
        <TouchableOpacity onPress={() => setShowNew(true)} style={s.addBtn}>
          <Ionicons name="add" size={18} color="#fff" />
          <Text style={s.addBtnText}>Nova sessão</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Calendário */}
        <View style={s.calendarCard}>
          <View style={s.calendarHeader}>
            <TouchableOpacity onPress={() => changeMonth(-1)} style={s.navBtn}><Ionicons name="chevron-back" size={18} color={Colors.gray[600]} /></TouchableOpacity>
            <Text style={s.monthLabel}>{monthLabel(month)}</Text>
            <TouchableOpacity onPress={() => changeMonth(1)} style={s.navBtn}><Ionicons name="chevron-forward" size={18} color={Colors.gray[600]} /></TouchableOpacity>
          </View>

          <View style={s.weekdayRow}>
            {WEEKDAY_LABELS.map((w, i) => <Text key={i} style={s.weekdayText}>{w}</Text>)}
          </View>

          <View style={s.grid}>
            {grid.map((d, i) => {
              const dStr = toDateStr(d);
              const inMonth = d.getMonth() === month.getMonth();
              const isToday = dStr === todayStr;
              const isSelected = dStr === selectedDate;
              const count = sessionsByDate.get(dStr)?.length ?? 0;
              return (
                <TouchableOpacity
                  key={i}
                  style={[s.dayCell, isSelected && s.dayCellSelected]}
                  onPress={() => setSelectedDate(dStr)}
                >
                  <Text style={[
                    s.dayText,
                    !inMonth && s.dayTextMuted,
                    isToday && !isSelected && s.dayTextToday,
                    isSelected && s.dayTextSelected,
                  ]}>
                    {d.getDate()}
                  </Text>
                  {count > 0 && <View style={[s.dayDot, isSelected && { backgroundColor: "#fff" }]} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Lista do dia selecionado */}
        <View style={s.dayListHeader}>
          <Text style={s.dayListTitle}>
            {new Date(selectedDate + "T00:00:00").toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}
          </Text>
          <Text style={s.dayListCount}>{daySessions.length} sessão(ões)</Text>
        </View>

        {loading ? (
          <ActivityIndicator color={Colors.brand[500]} style={{ marginTop: 30 }} />
        ) : (
          <FlatList
            data={daySessions}
            keyExtractor={item => item.id}
            renderItem={renderSession}
            scrollEnabled={false}
            contentContainerStyle={s.list}
            ListEmptyComponent={
              <View style={s.empty}>
                <Ionicons name="calendar-outline" size={40} color={Colors.gray[300]} />
                <Text style={s.emptyText}>Nenhuma sessão neste dia.</Text>
              </View>
            }
          />
        )}
      </ScrollView>

      {user && (
        <NewSessionModal
          visible={showNew}
          date={selectedDate}
          clients={clients}
          therapistId={user.id}
          onClose={() => setShowNew(false)}
          onSaved={load}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:       { flex: 1, backgroundColor: Colors.gray[50] },
  header:     { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 },
  title:      { fontSize: 24, fontWeight: "700", color: Colors.ink },
  addBtn:     { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: Colors.brand[500], paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  addBtnText: { color: "#fff", fontSize: 12, fontWeight: "700" },

  calendarCard: { backgroundColor: Colors.white, marginHorizontal: 20, borderRadius: 16, padding: 14, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  calendarHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  navBtn:     { width: 30, height: 30, borderRadius: 8, backgroundColor: Colors.gray[50], alignItems: "center", justifyContent: "center" },
  monthLabel: { fontSize: 15, fontWeight: "700", color: Colors.ink },
  weekdayRow: { flexDirection: "row", marginBottom: 4 },
  weekdayText: { flex: 1, textAlign: "center", fontSize: 11, fontWeight: "700", color: Colors.gray[400] },
  grid:       { flexDirection: "row", flexWrap: "wrap" },
  dayCell:    { width: "14.28%", aspectRatio: 1, alignItems: "center", justifyContent: "center", gap: 2 },
  dayCellSelected: { position: "relative" },
  dayText:    { fontSize: 13, color: Colors.ink, width: 28, height: 28, textAlign: "center", textAlignVertical: "center", lineHeight: 28, borderRadius: 14 },
  dayTextMuted: { color: Colors.gray[300] },
  dayTextToday: { fontWeight: "700", color: Colors.brand[600] },
  dayTextSelected: { backgroundColor: Colors.brand[500], color: "#fff", fontWeight: "700", overflow: "hidden" },
  dayDot:     { width: 4, height: 4, borderRadius: 2, backgroundColor: Colors.brand[400] },

  dayListHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, marginTop: 18, marginBottom: 10 },
  dayListTitle: { fontSize: 14, fontWeight: "700", color: Colors.ink, textTransform: "capitalize", flex: 1, marginRight: 8 },
  dayListCount: { fontSize: 12, color: Colors.gray[500] },

  list:       { paddingHorizontal: 20, paddingBottom: 40, gap: 10 },
  card:       { flexDirection: "row", backgroundColor: Colors.white, borderRadius: 14, overflow: "hidden", shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  cardLeft:   { width: 4 },
  cardBody:   { flex: 1, padding: 14, gap: 6 },
  cardTop:    { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  clientName: { flex: 1, fontSize: 15, fontWeight: "600", color: Colors.ink, marginRight: 8 },
  badge:      { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  badgeText:  { fontSize: 11, fontWeight: "600" },
  cardMeta:   { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText:   { fontSize: 12, color: Colors.gray[500] },
  price:      { fontSize: 13, fontWeight: "600", color: Colors.green },
  empty:      { alignItems: "center", marginTop: 20, marginBottom: 20, gap: 10 },
  emptyText:  { fontSize: 13, color: Colors.gray[400] },

  // Modal nova sessão
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, borderBottomWidth: 1, borderBottomColor: Colors.gray[100] },
  modalTitle: { flex: 1, fontSize: 17, fontWeight: "700", color: Colors.ink, textAlign: "center", marginHorizontal: 8 },
  modalScroll: { padding: 20, paddingBottom: 40 },
  fieldLabel: { fontSize: 12, fontWeight: "600", color: Colors.gray[600], marginBottom: 6, marginTop: 12 },
  input:      { borderWidth: 1, borderColor: Colors.gray[200], borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, color: Colors.ink, backgroundColor: Colors.white },
  saveBtn:    { marginTop: 20, backgroundColor: Colors.brand[500], borderRadius: 14, paddingVertical: 14, alignItems: "center", justifyContent: "center" },
  saveBtnDisabled: { backgroundColor: Colors.gray[300] },
  saveBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  selector:   { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderWidth: 1, borderColor: Colors.gray[200], borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12 },
  selectorText: { fontSize: 14, color: Colors.ink, flex: 1 },
  selectorPlaceholder: { fontSize: 14, color: Colors.gray[400], flex: 1 },
  pickerList: { borderWidth: 1, borderColor: Colors.gray[200], borderRadius: 12, overflow: "hidden", marginTop: 8 },
  pickerItem: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.gray[100] },
  pickerItemActive: { backgroundColor: Colors.brand[50] },
  pickerItemText: { fontSize: 14, color: Colors.ink, flex: 1 },
});
