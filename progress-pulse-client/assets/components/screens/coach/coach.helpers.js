// assets/components/screens/coach/coach.helpers.js
import { Alert, Platform } from "react-native";

/** Format date as 'MMM D, YYYY' (en-US). */
export const formatDateEN = (iso) => {
  const d = new Date(iso);
  if (isNaN(d)) return "—";
  try {
    return new Intl.DateTimeFormat("en-US", { year: "numeric", month: "short", day: "numeric" }).format(d);
  } catch {
    const M = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    return `${M[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  }
};

export const confirmAction = async (title, message) => {
  if (Platform.OS === "web") return window.confirm(`${title}\n${message}`);
  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: "Cancel", style: "cancel", onPress: () => resolve(false) },
      { text: "OK", onPress: () => resolve(true) },
    ]);
  });
};

export async function copyToClipboard(text) {
  try {
    if (Platform.OS === "web") {
      // נסה קודם את ה-API המודרני (רק ב-HTTPS/localhost)
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(String(text));
        try { alert("Copied!"); } catch {}
        return true;
      }
      // פולבק: textarea נסתרת
      const el = document.createElement("textarea");
      el.value = String(text ?? "");
      el.setAttribute("readonly", "");
      el.style.position = "absolute";
      el.style.left = "-9999px";
      document.body.appendChild(el);
      el.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(el);
      if (!ok) throw new Error("execCommand(copy) failed");
      try { alert("Copied!"); } catch {}
      return true;
    } else {
      // Native: נסה expo-clipboard ואם לא קיים – @react-native-clipboard/clipboard
      try {
        const Clipboard = await import("expo-clipboard");
        if (Clipboard?.setStringAsync) {
          await Clipboard.setStringAsync(String(text));
          Alert.alert("Copied", "Coach code copied to clipboard.");
          return true;
        }
      } catch (_) {
        // לא מותקן expo-clipboard? ננסה את @react-native-clipboard/clipboard
      }
      try {
        const Clipboard = await import("@react-native-clipboard/clipboard");
        if (Clipboard?.default?.setString) {
          Clipboard.default.setString(String(text));
          Alert.alert("Copied", "Coach code copied to clipboard.");
          return true;
        } else if (Clipboard?.setString) {
          Clipboard.setString(String(text));
          Alert.alert("Copied", "Coach code copied to clipboard.");
          return true;
        }
      } catch (e2) {
        throw new Error("Clipboard module not available");
      }
    }
  } catch (e) {
    // אופציונלי: פידבק
    if (Platform.OS !== "web") {
      Alert.alert("Copy failed", e?.message || "Could not copy to clipboard.");
    } else {
      // ב-web אל תעשה Alert אם לא חייבים
      console.warn("copyToClipboard failed:", e);
    }
    return false;
  }
}
