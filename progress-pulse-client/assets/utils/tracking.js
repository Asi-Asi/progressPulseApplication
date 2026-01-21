// app/(screens)/tracking/utils.js
import { Alert, Platform } from "react-native";

export const getLastMaxFromLog = (arr = []) =>
  Math.max(0, ...(arr.map((s) => Number(s?.weight) || 0)));

export const safeAlert = (title, msg = "") => {
  if (Platform.OS === "web") {
    if (typeof window !== "undefined") window.alert(`${title}\n${msg}`);
    else console.log("ALERT:", title, msg);
  } else {
    Alert.alert(title, msg);
  }
};
