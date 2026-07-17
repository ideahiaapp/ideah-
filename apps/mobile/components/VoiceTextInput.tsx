import { View, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import type { TextInputProps } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useVoiceInput } from "@/hooks/useVoiceInput";
import { Colors } from "@/constants/colors";

interface VoiceTextInputProps extends Omit<TextInputProps, "value" | "onChangeText"> {
  value: string;
  onValueChange: (value: string) => void;
}

/** Substituto direto para <TextInput>, com botão de microfone embutido (ditado por voz). */
export function VoiceTextInput({ value, onValueChange, style, ...rest }: VoiceTextInputProps) {
  const { state, interimText, toggle } = useVoiceInput({
    onFinal: (text) => onValueChange(value ? `${value.trimEnd()} ${text}` : text),
  });

  const isRecording = state === "recording";
  const displayValue = isRecording && interimText ? `${value} ${interimText}` : value;

  return (
    <View style={s.wrap}>
      <TextInput
        {...rest}
        value={displayValue}
        onChangeText={v => !isRecording && onValueChange(v)}
        editable={rest.editable !== false && !isRecording}
        style={[style, isRecording && s.recording, { paddingRight: 40 }]}
      />
      {state !== "unsupported" && (
        <TouchableOpacity
          onPress={toggle}
          style={[s.micBtn, isRecording && s.micBtnActive]}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          <Ionicons name={isRecording ? "mic-off" : "mic"} size={15} color={isRecording ? "#fff" : Colors.gray[400]} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  wrap:         { position: "relative", justifyContent: "center" },
  recording:    { fontStyle: "italic", color: Colors.gray[500] },
  micBtn:       { position: "absolute", right: 8, top: 8, width: 26, height: 26, borderRadius: 13, alignItems: "center", justifyContent: "center", backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.gray[200] },
  micBtnActive: { backgroundColor: "#EF4444", borderColor: "#EF4444" },
});
