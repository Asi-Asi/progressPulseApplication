// assets/components/navigation/BottomTabs.jsx
import React, { memo, useMemo } from "react";
import { View, Text, TouchableOpacity, Platform, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";

/**
 * Role-aware BottomTabs
 * Props:
 *  - role: number (10 admin, 20 trainee, 30 coach)
 *  - items?: override tabs completely (array of {label, icon, href, badge?})
 *  - currentHref?: explicitly mark active path (screens should pass it)
 */
function BottomTabs({ role = 20, items, currentHref = "", loading = false }) {
  const router = useRouter();

  const ROUTES = {
    PLAN: "/(screens)/plan",
    TRACK: "/(screens)/tracking",
    PROFILE: "/(screens)/profile",
    COACH_SUBS: "/(screens)/coach",
    ADMIN_USERS: "/(screens)/admin",
    ADMIN_EXERCISES: "/(screens)/admin/exercises",
  };

  const defaultItems = useMemo(() => {
    if (role === 30) {
      return [
        { label: "Subscribers", icon: "account-group", href: ROUTES.COACH_SUBS },
        { label: "Profile",     icon: "account",       href: ROUTES.PROFILE },
      ];
    } else if (role === 10) {
      return [
        { label: "Users",     icon: "account-cog-outline", href: ROUTES.ADMIN_USERS },
        { label: "Exercises", icon: "dumbbell",            href: ROUTES.ADMIN_EXERCISES },
        { label: "Profile",   icon: "account",             href: ROUTES.PROFILE },
      ];
    } else {
      return [
        { label: "Plan",    icon: "calendar-check", href: ROUTES.PLAN },
        { label: "Track",   icon: "dumbbell",       href: ROUTES.TRACK },
        { label: "Profile", icon: "account",        href: ROUTES.PROFILE },
      ];
    }
  }, [role]);

  const tabs = items?.length ? items : defaultItems;

  // --- Longest-prefix wins: pick ONE active tab ---
  const matches = tabs
    .map((t) => {
      const href = t.href || "";
      const isExact = currentHref === href;
      const isChild = href !== "/" && currentHref.startsWith(href + "/");
      const matched = isExact || isChild;
      return { tab: t, matched, score: matched ? href.length : -1 };
    })
    .filter((m) => m.matched);

  const best = matches.sort((a, b) => b.score - a.score)[0];
  const activeHref = best?.tab?.href ?? "";

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: Platform.OS === "web" ? "fixed" : "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 100,
        elevation: 10,
      }}
    >
      <View
        className="bg-card border-t border-border"
        style={{ paddingBottom: Platform.OS === "android" ? 11 : 15, paddingTop: 8 }}
      >


        {/* שכבת טעינה קטנה מעל הטאבים */}
        {loading && (
          <View className="absolute inset-0 items-center justify-center">
            <ActivityIndicator size="small" />
          </View>
        )}

          <View
            className="flex-row items-stretch justify-around"
            pointerEvents={loading ? "none" : "auto"}
            style={{ opacity: loading ? 0.6 : 1 }}
          >

          {tabs.map((it) => {
            const active = it.href === activeHref;
            return (
              <TouchableOpacity
                key={it.href}
                onPress={() => router.replace(it.href)}
                className="flex-1 items-center justify-center py-1.5"
                activeOpacity={0.85}
                disabled={loading}
              >
                <View className="items-center">
                  <View className="relative">
                    <MaterialCommunityIcons
                      name={it.icon}
                      size={22}
                      color={active ? "#007BFF" : "#2C2C2C"}
                    />
                    {typeof it.badge === "number" && it.badge > 0 && (
                      <View className="absolute -right-2 -top-1 min-w-[18px] h-[18px] px-1 rounded-full bg-primary items-center justify-center">
                        <Text className="text-[10px] text-onPrimary font-extrabold">
                          {it.badge > 99 ? "99+" : it.badge}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text className={`mt-1 text-[11px] ${active ? "text-text font-extrabold" : "text-muted"}`}>
                    {it.label}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
}

export default memo(BottomTabs);
