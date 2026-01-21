// app/index.jsx
import React, { useRef, useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StatusBar,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Stack, useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import AppLogo from "../assets/components/ui/AppLogo";

const ONBOARDING_KEY = "onboardingSeen_v2";

const SLIDES = [
  { key: "plan",     title: "Build your plan",        subtitle: "Pick training days, add exercises, and lock when ready.", icon: "calendar-check" },
  { key: "track",    title: "Track every set",        subtitle: "Log reps & weights fast—with smart defaults pulled from your plan.", icon: "dumbbell" },
  { key: "progress", title: "See progress & history", subtitle: "Review personal records and previous sessions over time.", icon: "chart-line" },
];

export default function OnboardingIndex() {
  const router = useRouter();
  const listRef = useRef(null);
  const [index, setIndex] = useState(0);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const seen = await AsyncStorage.getItem(ONBOARDING_KEY);
        if (seen === "1") {
          router.replace("/(screens)/auth");
          return;
        }
      } finally {
        setChecking(false);
      }
    })();
  }, [router]);

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems?.length > 0) setIndex(viewableItems[0].index ?? 0);
  }).current;

  const viewabilityConfig = useRef({
    viewAreaCoveragePercentThreshold: 50,
  }).current;

  const finish = useCallback(async () => {
    try { await AsyncStorage.setItem(ONBOARDING_KEY, "1"); } catch {}
    router.replace("/(screens)/auth");
  }, [router]);

  const goNext = () => {
    if (index < SLIDES.length - 1) {
      listRef.current?.scrollToIndex({ index: index + 1, animated: true });
    } else {
      finish();
    }
  };

  // loading placeholder (keeps your light header color)
  if (checking) return <View className="flex-1 bg-[#FDFBFA]" />;

  return (
    <View className="flex-1 bg-bg">
      <StatusBar barStyle="dark-content" />
      <Stack.Screen
        options={{
          headerTitle: () => <AppLogo />,
          headerStyle: { backgroundColor: "#FDFBFA" }, // Stack options can’t use className
          headerTitleAlign: "left",
          headerShadowVisible: false,
        }}
      />

      {/* Skip (top-right) */}
      <View className="absolute right-4 top-3 z-10">
        <TouchableOpacity
          onPress={finish}
          className="px-4 py-2 rounded-full bg-field border border-fieldBorder"
        >
          <Text className="text-text font-bold">Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Slides */}
      <View className="flex-1">
        <FlatList
          ref={listRef}
          data={SLIDES}
          keyExtractor={(item) => item.key}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          renderItem={({ item }) => (
            <View className="w-screen flex-1 items-center justify-center px-6">
              {/* Icon bubble */}
              <View className="items-center justify-center">
                <View className="w-28 h-28 rounded-3xl bg-primary/10 items-center justify-center">
                  {/* Icons don’t read NativeWind colors; keep the explicit color */}
                  <MaterialCommunityIcons name={item.icon} size={54} color="#007BFF" />
                </View>
              </View>

              {/* Title + subtitle */}
              <View className="mt-8 items-center">
                <Text className="text-text text-3xl font-extrabold text-center">
                  {item.title}
                </Text>
                <Text className="text-muted mt-2 text-center leading-6">
                  {item.subtitle}
                </Text>
              </View>
            </View>
          )}
        />
      </View>

      {/* Dots + CTA */}
      <View className="px-6 pb-6">
        <View className="flex-row items-center justify-center gap-2 mb-4">
          {SLIDES.map((_, i) => {
            const active = i === index;
            return (
              <View
                key={i}
                className={`h-2 rounded-full ${active ? "bg-primary" : "bg-field"}`}
                style={{ width: active ? 28 : 8 }} // dynamic width kept for active state
              />
            );
          })}
        </View>

        <TouchableOpacity
          onPress={goNext}
          className="h-12 rounded-xl bg-primary items-center justify-center"
        >
          <Text className="text-onPrimary font-extrabold">
            {index < SLIDES.length - 1 ? "Next" : "Get Started"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
