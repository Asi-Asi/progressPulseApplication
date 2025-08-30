import React from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";

export default function ProfileCard({ user }) {
  const name = user?.fullName || user?.name || "User";
  const initials = name
    .split(" ")
    .map((n) => n[0]?.toUpperCase())
    .join("")
    .slice(0, 2);

  return (
    <View style={styles.card}>
      {/* Header row: avatar + names + chip */}
      <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
        <View style={styles.avatar}>
          {user?.profileImage ? (
            <Image source={{ uri: user.profileImage }} style={styles.avatarImg} />
          ) : (
            <Text style={styles.avatarInitials}>{initials || "U"}</Text>
          )}
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.email}>{user?.email || "-"}</Text>
          <View style={styles.roleChip}>
            <Text style={styles.roleText}>{user?.role || "user"}</Text>
          </View>
        </View>
      </View>

      {/* Details grid */}
      <View style={styles.details}>
        <Detail label="Phone" value={user?.phone || "—"} />
        <Detail label="Birthday" value={user?.birthDate || "—"} />
        <Detail label="Location" value={user?.location || "—"} />
        <Detail label="User ID" value={(user?._id || "").toString()} />
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={() => router.push("/EditProfile")}>
          <Text style={styles.btnPrimaryText}>Edit Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btn, styles.btnDanger]}
          onPress={async () => {
            await AsyncStorage.removeItem("token");
            router.replace("/Login");
          }}
        >
          <Text style={styles.btnDangerText}>Log out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function Detail({ label, value }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#333533",
    borderRadius: 16,
    padding: 16,
    gap: 16,
    // shadow
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#1E1E1E",
    borderWidth: 3,
    borderColor: "#FFD100",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImg: { width: "100%", height: "100%", borderRadius: 36 },
  avatarInitials: { color: "#FFD100", fontSize: 24, fontWeight: "800" },
  name: { color: "#FFD100", fontSize: 20, fontWeight: "800" },
  email: { color: "#CFCFCF", marginTop: 2 },
  roleChip: {
    alignSelf: "flex-start",
    backgroundColor: "#00A896",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    marginTop: 6,
  },
  roleText: { color: "#0B0F12", fontWeight: "700", fontSize: 12 },
  details: {
    backgroundColor: "#2B2B2B",
    borderRadius: 12,
    padding: 12,
    gap: 10,
  },
  detailRow: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  detailLabel: { color: "#9AA0A6", fontWeight: "600" },
  detailValue: { color: "#F4F4F4", flex: 1, textAlign: "right" },
  actions: { flexDirection: "row", gap: 12 },
  btn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  btnPrimary: { backgroundColor: "#3B82F6" },
  btnPrimaryText: { color: "#fff", fontWeight: "800" },
  btnDanger: { backgroundColor: "#FF5A2C" },
  btnDangerText: { color: "#fff", fontWeight: "800" },
});
