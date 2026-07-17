import { Alert, Platform } from "react-native";

/**
 * Confirmação cross-platform: Alert.alert não funciona no Expo Web
 * (react-native-web não implementa diálogos nativos), então usamos
 * window.confirm nesse caso.
 */
export function confirmAsync(title: string, message: string, confirmLabel = "Confirmar"): Promise<boolean> {
  if (Platform.OS === "web") {
    return Promise.resolve(window.confirm(`${title}\n\n${message}`));
  }
  return new Promise(resolve => {
    Alert.alert(title, message, [
      { text: "Cancelar", style: "cancel", onPress: () => resolve(false) },
      { text: confirmLabel, style: "destructive", onPress: () => resolve(true) },
    ], { cancelable: true, onDismiss: () => resolve(false) });
  });
}
