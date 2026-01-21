// assets/components/ui/AppLogo.jsx
import React from "react";
import { Pressable, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import Logo from "../../images/svg/progress-logo.svg";

// Keep in sync with app/index.jsx
const ONBOARDING_KEY = "onboardingSeen_v2";

// Default route for a short tap (your plan screen)
const DEFAULT_PLAN_ROUTE = "/(screens)/plan"; // change if your path differs

export default function AppLogo({
  width = 160,
  height = 40,
  style,
  tapTo = DEFAULT_PLAN_ROUTE, // <- tap goes to Plan by default
  enableReset = true,         // dev helper: long-press to clear onboarding
}) {
  const router = useRouter();

  const handlePress = tapTo
    ? () => {
        try {
          router.push(tapTo);   // or router.replace(tapTo) if you prefer
        } catch {/* no-op */}
      }
    : undefined;

  const handleLongPress =
    __DEV__ && enableReset
      ? async () => {
          try {
            await AsyncStorage.removeItem(ONBOARDING_KEY);
            Alert.alert("Reset", "Onboarding was reset. Restart the app to see it again.");
          } catch {
            Alert.alert("Reset", "Could not reset onboarding.");
          }
        }
      : undefined;

  if (!handlePress && !handleLongPress) {
    return <Logo width={width} height={height} style={style} />;
  }

  return (
    <Pressable onPress={handlePress} onLongPress={handleLongPress} hitSlop={10} style={style}>
      <Logo width={width} height={height} />
    </Pressable>
  );
}
