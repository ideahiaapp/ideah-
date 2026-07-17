import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

/**
 * expo-secure-store não tem suporte real no Expo Web — usar localStorage nesse caso.
 * No nativo (iOS/Android) usa o Keychain/Keystore via SecureStore normalmente.
 */
export const secureStorage = {
  getItem: (key: string): Promise<string | null> =>
    Platform.OS === "web"
      ? Promise.resolve(localStorage.getItem(key))
      : SecureStore.getItemAsync(key),
  setItem: (key: string, value: string): Promise<void> => {
    if (Platform.OS === "web") {
      localStorage.setItem(key, value);
      return Promise.resolve();
    }
    return SecureStore.setItemAsync(key, value);
  },
  removeItem: (key: string): Promise<void> => {
    if (Platform.OS === "web") {
      localStorage.removeItem(key);
      return Promise.resolve();
    }
    return SecureStore.deleteItemAsync(key);
  },
};
