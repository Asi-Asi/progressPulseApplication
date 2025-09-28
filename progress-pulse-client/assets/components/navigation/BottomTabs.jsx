// assets/components/navigation/BottomTabs.jsx
import React, { memo, useMemo } from "react";
import { View, Text, TouchableOpacity, Platform } from "react-native";
import { usePathname, useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

/**
 * Role-aware BottomTabs (no global store)
 *
 * Props:
 * - role: number (10 admin, 20 trainee, 30 coach)
 * - items?: override tabs completely (array of {label, icon, href, badge?})
 * - currentHref?: explicitly mark a tab as active (useful for nested screens)
 *
 * Default tabs by role:
 *   - Admin (10) / Trainee (20): Plan, Track, Profile
 *   - Coach (30): Subscribers, Profile
 */
function BottomTabs({ role = 20, items, currentHref }) {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  // --- ROUTES that match your repo structure ---
  const ROUTES = {
    PLAN: "/(screens)/plan",
    TRACK: "/(screens)/tracking",
    PROFILE: "/(screens)/profile",
    COACH_SUBS: "/(screens)/coach", // if you only have coach/index.jsx use "/(screens)/coach"
    ADMIN_CONTROLLER: "/(screens)/admin",
  };

  // Default tabs per role (edit labels/icons if needed)
  const defaultItems = useMemo(() => {

    if (role === 30) {
      // Coach
      return [
        { label: "Subscribers", icon: "account-group", href: ROUTES.COACH_SUBS },
        { label: "Profile",     icon: "account",       href: ROUTES.PROFILE },
      ];
    }
    // Admin (10) 
    else if (role === 10){
      return [
        { label: "controller",    icon: "account-cog-outline", href: ROUTES.ADMIN_CONTROLLER },
        { label: "Profile", icon: "account",        href: ROUTES.PROFILE },
      ];
    }

    //Trainee (20)
    else if (role === 20){
      return [
          { label: "Plan",    icon: "calendar-check", href: ROUTES.PLAN },
          { label: "Track",   icon: "dumbbell",       href: ROUTES.TRACK },
          { label: "Profile", icon: "account",        href: ROUTES.PROFILE },
        ];
    }
    return null;

  }, [role]);

  const tabs = items?.length ? items : defaultItems;

  // Which path to compare against for "active"?
  const activePath = currentHref || pathname || "";

  return (
    <View
      pointerEvents="box-none"
      // Full-bleed, stuck to bottom (no SafeAreaView)
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
        // Flush bar: no margins/radius; only top divider
        className="bg-card border-t border-border"
        style={{
          paddingBottom: Platform.OS === "android" ? 11 : 15,
          paddingTop: 8,
          
        }}
      >
        <View className="flex-row items-stretch justify-around">
          {tabs.map((it) => {
            // active if exact match OR current path is a nested child of href
            const active =
              activePath === it.href ||
              (it.href !== "/" && activePath.startsWith(it.href + "/"));

            return (
              <TouchableOpacity
                key={it.href}
                onPress={() => router.replace(it.href)}
                className="flex-1 items-center justify-center py-1.5"
                activeOpacity={0.85}
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

                  <Text
                    className={`mt-1 text-[11px] ${
                      active ? "text-text font-extrabold" : "text-muted"
                    }`}
                  >
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
